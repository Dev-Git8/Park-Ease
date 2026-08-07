-- Swap the payment provider from Stripe to Razorpay, and let a booking
-- have two independent payments over its lifetime (the original hold, and
-- - new - a real overstay-penalty charge instead of the old fake checkout).

-- Provider enum: rename the only value; new rows default to 'razorpay'.
ALTER TYPE "PaymentProvider" RENAME VALUE 'stripe' TO 'razorpay';
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'razorpay';

-- Razorpay's Order id replaces Stripe's PaymentIntent id; Razorpay's
-- Payment id (needed for refunds, which are keyed by payment id not order
-- id) replaces Stripe's Charge id.
ALTER TABLE "payments" RENAME COLUMN "provider_payment_intent_id" TO "provider_order_id";
ALTER TABLE "payments" RENAME COLUMN "provider_charge_id" TO "provider_payment_id";
ALTER INDEX "payments_provider_payment_intent_id_key" RENAME TO "payments_provider_order_id_key";

-- A booking can now have two independent payments (the original hold, and
-- a real overstay-penalty charge) distinguished by purpose.
CREATE TYPE "PaymentPurpose" AS ENUM ('booking_hold', 'overstay_penalty');
ALTER TABLE "payments" ADD COLUMN "purpose" "PaymentPurpose" NOT NULL DEFAULT 'booking_hold';

-- INR going forward; existing dev rows keep 'usd', not worth a data
-- rewrite for pre-launch dev data.
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'INR';
