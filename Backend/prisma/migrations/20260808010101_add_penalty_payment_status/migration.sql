-- A checked-out booking with an unpaid overstay penalty parks here instead
-- of jumping straight to 'completed'. Kept in its own migration because
-- ALTER TYPE ... ADD VALUE must not share a transaction with anything that
-- could use the new value.
ALTER TYPE "BookingStatus" ADD VALUE 'pending_penalty_payment';
