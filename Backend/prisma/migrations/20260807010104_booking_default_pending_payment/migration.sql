-- Migration 4: Booking.status default -> pending_payment.
-- Must ship in the SAME release as the Phase 3 payment-first booking flow;
-- deployed early, old code would create bookings stuck in pending_payment.

ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending_payment';
