const prisma = require('../config/prisma');
const { emitSlotsUpdated, invalidateSlotsCache } = require('../utils/realtime.utils');
const { computeOverduePenalty } = require('../utils/pricing.utils');
const paymentsService = require('../modules/payments/payments.service');

const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const AUTO_TERMINATE_GRACE_MINUTES = parseInt(process.env.AUTO_TERMINATE_GRACE_MINUTES || '60', 10);
const HOLD_EXPIRY_MINUTES = parseInt(process.env.HOLD_EXPIRY_MINUTES || '15', 10);
const PENALTY_PAYMENT_GRACE_MINUTES = parseInt(process.env.PENALTY_PAYMENT_GRACE_MINUTES || '30', 10);

let intervalId = null;

const notify = async (businessIds) => {
    for (const businessId of businessIds) {
        await invalidateSlotsCache(businessId);
        emitSlotsUpdated(businessId);
    }
};

// Sweep 1: bookings still 'booked' past their endTime become 'overdue'.
// This alone doesn't free the slot - a no-show shouldn't silently open the
// spot back up before staff/the customer has actually dealt with it.
const expireBookings = async () => {
    try {
        const affectedBusinessIds = await prisma.$transaction(async (tx) => {
            const overdueBookings = await tx.$queryRaw`
                SELECT id, business_id as "businessId"
                FROM bookings
                WHERE status = 'booked'
                  AND end_time <= NOW()
                FOR UPDATE
            `;

            if (overdueBookings.length === 0) return [];

            console.log(`[Scheduler] Found ${overdueBookings.length} overdue booking(s). Marking as overdue...`);

            const businessIds = new Set();
            for (const booking of overdueBookings) {
                await tx.booking.update({ where: { id: booking.id }, data: { status: 'overdue' } });
                businessIds.add(booking.businessId);
            }
            return Array.from(businessIds);
        });

        await notify(affectedBusinessIds);
    } catch (error) {
        console.error('[Scheduler] Error expiring bookings:', error.message);
    }
};

// Sweep 2: closes the stuck-slot bug. An 'overdue' booking left unattended
// for AUTO_TERMINATE_GRACE_MINUTES gets force-completed with the accrued
// penalty and its slot is finally released.
const autoTerminateOverdueBookings = async () => {
    try {
        const affectedBusinessIds = await prisma.$transaction(async (tx) => {
            const staleBookings = await tx.$queryRaw`
                SELECT id, slot_id as "slotId", business_id as "businessId", end_time as "endTime"
                FROM bookings
                WHERE status = 'overdue'
                  AND end_time <= NOW() - (${AUTO_TERMINATE_GRACE_MINUTES} * INTERVAL '1 minute')
                FOR UPDATE
            `;

            if (staleBookings.length === 0) return [];

            console.log(`[Scheduler] Auto-terminating ${staleBookings.length} stale overdue booking(s)...`);

            const businessIds = new Set();
            const now = new Date();
            for (const booking of staleBookings) {
                const business = await tx.business.findUnique({ where: { id: booking.businessId } });
                const penaltyAmount = computeOverduePenalty(business.pricePerHour, booking.endTime, now);

                await tx.booking.update({
                    where: { id: booking.id },
                    data: { status: 'completed', actualEndTime: now, penaltyAmount },
                });
                await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'available' } });
                businessIds.add(booking.businessId);
            }
            return Array.from(businessIds);
        });

        await notify(affectedBusinessIds);
    } catch (error) {
        console.error('[Scheduler] Error auto-terminating overdue bookings:', error.message);
    }
};

// Sweep 3: a checked-out booking left sitting in 'pending_penalty_payment'
// for too long resolves to 'completed' anyway - the slot is already free,
// so there's nothing left to protect by holding the booking open forever.
// The unpaid penalty stays visible on the (pending/failed) Payment row as
// a collections follow-up, which is out of scope here.
const expirePenaltyHolds = async () => {
    try {
        const affectedBookingIds = await prisma.$transaction(async (tx) => {
            const staleBookings = await tx.$queryRaw`
                SELECT id
                FROM bookings
                WHERE status = 'pending_penalty_payment'
                  AND updated_at <= NOW() - (${PENALTY_PAYMENT_GRACE_MINUTES} * INTERVAL '1 minute')
                FOR UPDATE
            `;

            if (staleBookings.length === 0) return [];

            console.log(`[Scheduler] Auto-resolving ${staleBookings.length} unpaid penalty checkout(s)...`);

            const ids = [];
            for (const booking of staleBookings) {
                await tx.booking.update({ where: { id: booking.id }, data: { status: 'completed' } });
                await tx.payment.updateMany({
                    where: { bookingId: booking.id, purpose: 'overstay_penalty', status: 'pending' },
                    data: { status: 'failed', failureReason: 'Penalty payment window expired' },
                });
                ids.push(booking.id);
            }
            return ids;
        });

        if (affectedBookingIds.length > 0) {
            console.log(`[Scheduler] Resolved booking ids: ${affectedBookingIds.join(', ')}`);
        }
    } catch (error) {
        console.error('[Scheduler] Error expiring penalty payment holds:', error.message);
    }
};

// Sweep 4: a 'pending_payment' hold that's never paid within
// HOLD_EXPIRY_MINUTES releases its slot. Razorpay has no remote order to
// cancel (unlike Stripe's PaymentIntent), so this is purely local
// bookkeeping before the booking itself is marked expired.
const expirePaymentHolds = async () => {
    try {
        const staleHolds = await prisma.$queryRaw`
            SELECT id
            FROM bookings
            WHERE status = 'pending_payment'
              AND created_at <= NOW() - (${HOLD_EXPIRY_MINUTES} * INTERVAL '1 minute')
        `;

        if (staleHolds.length === 0) return;

        console.log(`[Scheduler] Expiring ${staleHolds.length} unpaid booking hold(s)...`);

        const affectedBusinessIds = new Set();
        for (const hold of staleHolds) {
            await paymentsService.expirePendingOrder(hold.id);

            const businessId = await prisma.$transaction(async (tx) => {
                const rows = await tx.$queryRaw`
                    SELECT id, slot_id as "slotId", business_id as "businessId", status
                    FROM bookings WHERE id = ${hold.id} FOR UPDATE
                `;
                const booking = rows[0];
                if (!booking || booking.status !== 'pending_payment') return null;

                await tx.booking.update({ where: { id: booking.id }, data: { status: 'expired' } });
                await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'available' } });
                return booking.businessId;
            });

            if (businessId) affectedBusinessIds.add(businessId);
        }

        await notify(Array.from(affectedBusinessIds));
    } catch (error) {
        console.error('[Scheduler] Error expiring payment holds:', error.message);
    }
};

const runAllSweeps = async () => {
    await expireBookings();
    await autoTerminateOverdueBookings();
    await expirePenaltyHolds();
    await expirePaymentHolds();
};

const startBookingScheduler = () => {
    console.log(`[Scheduler] Booking scheduler started (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
    runAllSweeps();
    intervalId = setInterval(runAllSweeps, CHECK_INTERVAL_MS);
};

const stopBookingScheduler = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[Scheduler] Booking scheduler stopped.');
    }
};

module.exports = {
    startBookingScheduler,
    stopBookingScheduler
};
