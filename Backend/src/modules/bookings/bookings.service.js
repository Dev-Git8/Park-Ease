const prisma = require('../../config/prisma');
const { emitSlotsUpdated, invalidateSlotsCache } = require('../../utils/realtime.utils');
const { computeBookingPrice, computeOverduePenalty } = require('../../utils/pricing.utils');
const paymentsService = require('../payments/payments.service');

const MIN_BOOKING_DURATION_MINUTES = parseInt(process.env.MIN_BOOKING_DURATION_MINUTES || '30', 10);
const MAX_BOOKING_DURATION_MINUTES = parseInt(process.env.MAX_BOOKING_DURATION_MINUTES || '1440', 10);
const CLOCK_SKEW_GRACE_MS = 60 * 1000; // 1 minute grace for "startTime not in the past"
const IMMEDIATE_BOOKING_WINDOW_MS = 5 * 60 * 1000; // bookings starting within 5 min are treated as "now"

const validateBookingWindow = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid start or end time');
    }
    if (end <= start) {
        throw new Error('endTime must be after startTime');
    }
    if (start.getTime() < Date.now() - CLOCK_SKEW_GRACE_MS) {
        throw new Error('startTime cannot be in the past');
    }

    const durationMinutes = (end - start) / (1000 * 60);
    if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) {
        throw new Error(`Booking duration must be at least ${MIN_BOOKING_DURATION_MINUTES} minutes`);
    }
    if (durationMinutes > MAX_BOOKING_DURATION_MINUTES) {
        throw new Error(`Booking duration cannot exceed ${MAX_BOOKING_DURATION_MINUTES} minutes`);
    }
};

// Creates a booking as a payment hold: locks the slot and business rows,
// checks for a real time-range overlap against every other non-terminal
// booking on this slot, freezes the server-computed price, then commits.
// The Razorpay Order is created AFTER the transaction commits -
// a Postgres lock must never be held across a network call.
const createBookingHold = async (userId, businessId, slotId, startTime, endTime) => {
    validateBookingWindow(startTime, endTime);
    const start = new Date(startTime);
    const end = new Date(endTime);

    const booking = await prisma.$transaction(async (tx) => {
        // Lock the business row too: pricePerHour must not change mid-request.
        const businessRows = await tx.$queryRaw`
            SELECT id, price_per_hour as "pricePerHour", status
            FROM businesses
            WHERE id = ${parseInt(businessId)}
            FOR UPDATE
        `;
        if (businessRows.length === 0) {
            throw new Error('Business not found');
        }
        const business = businessRows[0];
        if (business.status !== 'approved') {
            throw new Error('Business is not accepting bookings');
        }

        const slotRows = await tx.$queryRaw`
            SELECT id, business_id as "businessId", status
            FROM slots
            WHERE id = ${parseInt(slotId)}
            FOR UPDATE
        `;
        if (slotRows.length === 0) {
            throw new Error('Slot not found');
        }
        const slot = slotRows[0];
        if (slot.businessId !== business.id) {
            throw new Error('Slot does not belong to this business');
        }
        if (slot.status === 'maintenance') {
            throw new Error('Slot is under maintenance');
        }

        // Real time-range overlap check: a slot can hold many non-overlapping
        // future reservations, not just one active claim.
        const overlapping = await tx.$queryRaw`
            SELECT id FROM bookings
            WHERE slot_id = ${parseInt(slotId)}
              AND status IN ('pending_payment', 'booked', 'overdue')
              AND start_time < ${end}
              AND end_time > ${start}
            FOR UPDATE
        `;
        if (overlapping.length > 0) {
            throw new Error('Slot is already booked for an overlapping time range');
        }

        const totalPrice = computeBookingPrice(business.pricePerHour, start, end);

        const createdBooking = await tx.booking.create({
            data: {
                userId: parseInt(userId),
                businessId: business.id,
                slotId: slot.id,
                startTime: start,
                endTime: end,
                totalPrice,
                status: 'pending_payment',
            },
        });

        // Slot.status is only a cheap "is it physically occupied right now"
        // signal for the live map - only flip it for bookings starting now.
        // A future-dated booking's slot transition at its own start time is
        // a known follow-up, not required for the overlap-correctness model.
        if (start.getTime() - Date.now() <= IMMEDIATE_BOOKING_WINDOW_MS) {
            await tx.slot.update({
                where: { id: slot.id },
                data: { status: 'held' },
            });
        }

        return createdBooking;
    });

    await invalidateSlotsCache(businessId);
    emitSlotsUpdated(businessId);

    const order = await paymentsService.createOrderForBooking(booking);

    return { booking, order };
};

// Full refund if cancelled before startTime, no refund after. Razorpay is
// called AFTER the DB transaction commits, never while holding the lock.
const cancelBookingTransaction = async (bookingId, userId) => {
    const cancelledBooking = await prisma.$transaction(async (tx) => {
        const bookingRows = await tx.$queryRaw`
            SELECT id, user_id as "userId", business_id as "businessId", slot_id as "slotId", status
            FROM bookings
            WHERE id = ${parseInt(bookingId)}
            FOR UPDATE
        `;

        if (bookingRows.length === 0) {
            throw new Error('Booking not found');
        }

        const booking = bookingRows[0];

        if (booking.userId !== parseInt(userId)) {
            throw new Error('Unauthorized');
        }

        if (['cancelled', 'completed', 'expired'].includes(booking.status)) {
            throw new Error('Booking cannot be cancelled in its current state');
        }

        const updatedBooking = await tx.booking.update({
            where: { id: parseInt(bookingId) },
            data: { status: 'cancelled' },
        });

        await tx.slot.update({
            where: { id: booking.slotId },
            data: { status: 'available' },
        });

        return updatedBooking;
    });

    await invalidateSlotsCache(cancelledBooking.businessId);
    emitSlotsUpdated(cancelledBooking.businessId);

    await paymentsService.refundBookingPayment(cancelledBooking);

    return cancelledBooking;
};

const getBookingsByUser = async (userId) => {
    return await prisma.booking.findMany({
        where: { userId: parseInt(userId) },
        include: {
            slot: { select: { slotNumber: true } },
            business: { select: { name: true, address: true } },
            payments: {
                where: { status: 'pending' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { providerOrderId: true, amount: true, purpose: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};

const getBookingsByBusiness = async (businessId, ownerId) => {
    const business = await prisma.business.findUnique({
        where: { id: parseInt(businessId) },
    });

    if (!business) {
        throw new Error('Business not found');
    }

    if (business.ownerId !== parseInt(ownerId)) {
        throw new Error('Unauthorized');
    }

    return await prisma.booking.findMany({
        where: { businessId: parseInt(businessId) },
        include: {
            slot: { select: { slotNumber: true } },
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};

// Manual checkout by the customer. Overdue penalty uses the same helper as
// the scheduler's auto-terminate sweep, so the two paths can never
// diverge. The slot always frees immediately - the car has physically
// left, regardless of whether a penalty still needs collecting. If there
// is a penalty, the booking parks in 'pending_penalty_payment' until that
// second Razorpay order is paid; on-time checkouts go straight to
// 'completed' with no payment step at all.
const terminateBookingTransaction = async (bookingId, userId) => {
    const { booking: terminatedBooking, penaltyAmount } = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: { business: true },
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.userId !== parseInt(userId)) {
            throw new Error('Unauthorized');
        }

        if (!['booked', 'overdue'].includes(booking.status)) {
            throw new Error('Booking cannot be terminated in its current state');
        }

        const now = new Date();
        const penalty = computeOverduePenalty(booking.business.pricePerHour, booking.endTime, now);

        await tx.slot.update({
            where: { id: booking.slotId },
            data: { status: 'available' },
        });

        const updatedBooking = await tx.booking.update({
            where: { id: parseInt(bookingId) },
            data: {
                status: penalty > 0 ? 'pending_penalty_payment' : 'completed',
                actualEndTime: now,
                penaltyAmount: penalty,
            },
            include: {
                business: { select: { name: true } },
                slot: { select: { slotNumber: true } },
            },
        });

        return { booking: updatedBooking, penaltyAmount: penalty };
    });

    await invalidateSlotsCache(terminatedBooking.businessId);
    emitSlotsUpdated(terminatedBooking.businessId);

    const order = penaltyAmount > 0
        ? await paymentsService.createOrderForPenalty(terminatedBooking)
        : null;

    return { booking: terminatedBooking, order };
};

module.exports = {
    createBookingHold,
    cancelBookingTransaction,
    getBookingsByUser,
    getBookingsByBusiness,
    terminateBookingTransaction,
};
