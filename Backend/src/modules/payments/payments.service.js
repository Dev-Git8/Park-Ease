const crypto = require('crypto');
const prisma = require('../../config/prisma');
const razorpay = require('../../config/razorpay');
const { toPaise } = require('../../utils/pricing.utils');
const { emitSlotsUpdated, invalidateSlotsCache } = require('../../utils/realtime.utils');

const createOrder = async (booking, amount, purpose) => {
    const order = await razorpay.orders.create({
        amount: toPaise(amount),
        currency: 'INR',
        receipt: `${purpose}_${booking.id}_${Date.now()}`,
        notes: { bookingId: String(booking.id), purpose },
    });

    await prisma.payment.create({
        data: {
            bookingId: booking.id,
            purpose,
            providerOrderId: order.id,
            amount,
            status: 'pending',
        },
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID };
};

const createOrderForBooking = (booking) => createOrder(booking, booking.totalPrice, 'booking_hold');

const createOrderForPenalty = (booking) => createOrder(booking, booking.penaltyAmount, 'overstay_penalty');

// Shared by both the /verify endpoint and the webhook, so the two paths can
// never disagree about what "paid" means. Idempotent: redelivered webhooks
// and a /verify call that races the webhook both no-op safely.
const confirmPayment = async (orderId, paymentId) => {
    const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { providerOrderId: orderId } });
        if (!payment) return null;
        if (payment.status === 'succeeded') return null; // already processed

        const bookingRows = await tx.$queryRaw`
            SELECT id, business_id as "businessId", slot_id as "slotId", status
            FROM bookings
            WHERE id = ${payment.bookingId}
            FOR UPDATE
        `;
        const booking = bookingRows[0];
        if (!booking) return null;

        if (payment.purpose === 'booking_hold' && booking.status !== 'pending_payment') return null;
        if (payment.purpose === 'overstay_penalty' && booking.status !== 'pending_penalty_payment') return null;

        await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'succeeded', providerPaymentId: paymentId },
        });

        if (payment.purpose === 'booking_hold') {
            await tx.booking.update({ where: { id: booking.id }, data: { status: 'booked' } });
            await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'occupied' } });
        } else {
            await tx.booking.update({ where: { id: booking.id }, data: { status: 'completed' } });
            // The slot was already freed at checkout time - nothing to do here.
        }

        return { businessId: booking.businessId };
    });

    if (result) {
        await invalidateSlotsCache(result.businessId);
        emitSlotsUpdated(result.businessId);
    }
};

const failPayment = async (orderId, failureReason) => {
    const payment = await prisma.payment.findUnique({ where: { providerOrderId: orderId } });
    if (!payment || payment.status === 'succeeded') return;

    await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed', failureReason },
    });
    // The booking stays in its pending state - the customer can retry with
    // the same order, and the relevant scheduler sweep releases things if
    // they never do.
};

// HMAC-SHA256 of "orderId|paymentId" keyed with the Razorpay key secret -
// exactly what Razorpay's own checkout success callback must be verified
// against.
const verifySignature = (orderId, paymentId, signature) => {
    if (!orderId || !paymentId || !signature) return false;

    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    let signatureBuf;
    try {
        signatureBuf = Buffer.from(signature, 'hex');
    } catch {
        return false;
    }
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
};

// Razorpay webhooks are signed over the exact raw request body with a
// separate webhook secret (not the key secret used for the client-side
// checkout signature above).
const verifyWebhookSignature = (rawBody, signature) => {
    if (!signature) return false;

    const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(rawBody)
        .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    let signatureBuf;
    try {
        signatureBuf = Buffer.from(signature, 'hex');
    } catch {
        return false;
    }
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
};

// Defense in depth for the /verify endpoint, beyond the signature check:
// confirms the caller actually owns the booking behind this order.
const userOwnsOrder = async (orderId, userId) => {
    const payment = await prisma.payment.findUnique({
        where: { providerOrderId: orderId },
        include: { booking: { select: { userId: true } } },
    });
    return !!payment && payment.booking.userId === parseInt(userId);
};

const findLatestSucceededBookingPayment = async (bookingId) => {
    return await prisma.payment.findFirst({
        where: { bookingId: parseInt(bookingId), status: 'succeeded', purpose: 'booking_hold' },
        orderBy: { createdAt: 'desc' },
    });
};

// Full refund before startTime, none after (locked product decision). A
// penalty payment is never refunded - it only ever exists because the
// booking is already past its end time - so this only ever looks at the
// original booking_hold payment.
const refundBookingPayment = async (booking) => {
    const now = new Date();
    if (now >= new Date(booking.startTime)) {
        return; // past startTime - no refund, matches the overdue-cancel case too
    }

    const payment = await findLatestSucceededBookingPayment(booking.id);
    if (!payment || !payment.providerPaymentId) return; // never actually paid

    await razorpay.payments.refund(payment.providerPaymentId, {
        amount: toPaise(payment.amount),
    });

    await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'refunded', refundedAmount: payment.amount },
    });
};

// Used by the hold-expiry scheduler sweep: Razorpay has no "cancel an
// order" API (unlike Stripe's PaymentIntent), so this is purely local
// bookkeeping - there's nothing remote to release.
const expirePendingOrder = async (bookingId) => {
    const payment = await prisma.payment.findFirst({
        where: { bookingId: parseInt(bookingId), status: 'pending' },
        orderBy: { createdAt: 'desc' },
    });
    if (!payment) return;

    await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'canceled' },
    });
};

// An out-of-band Razorpay Dashboard refund also auto-cancels the booking
// and frees the slot, keeping in-app and dashboard-initiated refunds
// consistent.
const handleRefundProcessed = async (refund) => {
    const payment = await prisma.payment.findFirst({
        where: { providerPaymentId: refund.payment_id },
    });
    if (!payment) return;

    const result = await prisma.$transaction(async (tx) => {
        const bookingRows = await tx.$queryRaw`
            SELECT id, business_id as "businessId", slot_id as "slotId", status
            FROM bookings
            WHERE id = ${payment.bookingId}
            FOR UPDATE
        `;
        const booking = bookingRows[0];
        if (!booking || ['cancelled', 'completed', 'expired'].includes(booking.status)) {
            return null;
        }

        const refundedAmount = refund.amount / 100;
        const fullyRefunded = refundedAmount >= parseFloat(payment.amount);

        await tx.payment.update({
            where: { id: payment.id },
            data: {
                status: fullyRefunded ? 'refunded' : 'partially_refunded',
                refundedAmount,
            },
        });

        await tx.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
        await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'available' } });

        return { businessId: booking.businessId };
    });

    if (result) {
        await invalidateSlotsCache(result.businessId);
        emitSlotsUpdated(result.businessId);
    }
};

module.exports = {
    createOrderForBooking,
    createOrderForPenalty,
    confirmPayment,
    failPayment,
    verifySignature,
    verifyWebhookSignature,
    userOwnsOrder,
    refundBookingPayment,
    expirePendingOrder,
    handleRefundProcessed,
};
