-- Migration 2: Slot.isAvailable (Boolean) -> Slot.status (SlotStatus).
-- Not a plain cast: backfill biases ambiguous/false rows to 'occupied' since
-- a wrongly-occupied slot just needs a manual admin fix, whereas a
-- wrongly-available slot risks a real double-booking.

ALTER TABLE "slots" ADD COLUMN "status" "SlotStatus" NOT NULL DEFAULT 'available';

UPDATE "slots" SET "status" = CASE WHEN "is_available" THEN 'available' ELSE 'occupied' END::"SlotStatus";

ALTER TABLE "slots" DROP COLUMN "is_available";
