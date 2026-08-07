-- Migration 1: purely additive. Creates the new enum types (unused by any
-- column yet), the Payment table, lat/lng, updatedAt columns, and new
-- indexes. Zero risk: nothing existing changes shape.

-- New enum types (not wired to any column in this migration)
CREATE TYPE "UserRole" AS ENUM ('customer', 'business', 'admin');
CREATE TYPE "BusinessStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE "BookingStatus" AS ENUM ('pending_payment', 'booked', 'cancelled', 'completed', 'overdue', 'expired');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'canceled');
CREATE TYPE "PaymentProvider" AS ENUM ('stripe');
CREATE TYPE "SlotStatus" AS ENUM ('available', 'held', 'occupied', 'maintenance');

-- Business: lat/lng + updatedAt
ALTER TABLE "businesses" ADD COLUMN "lat" DECIMAL(9,6);
ALTER TABLE "businesses" ADD COLUMN "lng" DECIMAL(9,6);
ALTER TABLE "businesses" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now();
CREATE INDEX "businesses_lat_lng_idx" ON "businesses"("lat", "lng");

-- Slot: updatedAt
ALTER TABLE "slots" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now();

-- Booking: updatedAt + new indexes
ALTER TABLE "bookings" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now();
CREATE INDEX "bookings_status_end_time_idx" ON "bookings"("status", "end_time");
CREATE INDEX "bookings_slot_id_status_idx" ON "bookings"("slot_id", "status");
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");
CREATE INDEX "bookings_business_id_idx" ON "bookings"("business_id");

-- Session: index for the cleanup scheduler's sweep query
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- New Payment table
CREATE TABLE "payments" (
    "id" SERIAL PRIMARY KEY,
    "booking_id" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'stripe',
    "provider_payment_intent_id" TEXT NOT NULL,
    "provider_charge_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "refunded_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "failure_reason" TEXT,
    "raw_webhook_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "payments_provider_payment_intent_id_key" ON "payments"("provider_payment_intent_id");
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
