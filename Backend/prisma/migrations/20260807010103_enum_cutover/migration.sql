-- Migration 3: enum cutover for Booking.status, Business.status, User.role.
-- Existing string values already match the enum member names, so this is a
-- straightforward USING cast, not a data rewrite. Schedule for a low-traffic
-- window: ALTER COLUMN ... TYPE briefly locks each table.
-- Deploy in the same release as app code that no longer does raw string
-- comparisons against these columns (bookings.service.js, admin.controller.js).

-- Business.status: nullable string -> non-null enum, default 'pending'
UPDATE "businesses" SET "status" = 'pending' WHERE "status" IS NULL;
ALTER TABLE "businesses" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "businesses" ALTER COLUMN "status" TYPE "BusinessStatus" USING ("status"::"BusinessStatus");
ALTER TABLE "businesses" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'pending';

-- Booking.status: nullable string -> non-null enum. Default stays 'booked'
-- here; it only becomes 'pending_payment' in Migration 4, alongside the
-- payment-first application code.
UPDATE "bookings" SET "status" = 'booked' WHERE "status" IS NULL;
ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus" USING ("status"::"BookingStatus");
ALTER TABLE "bookings" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'booked';

-- User.role: non-null string -> non-null enum
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';
