# Razorpay Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Stripe payment integration with Razorpay throughout the backend, and make the overstay-penalty checkout a real second Razorpay payment instead of the currently-fake `setTimeout`.

**Architecture:** Mirrors the existing Stripe design (DB transaction commits first, payment-gateway call happens after, one idempotent confirm function shared between a client-verify endpoint and a webhook) but swapped to Razorpay's Order + Checkout.js + HMAC-signature model. A new `Payment.purpose` column (`booking_hold` | `overstay_penalty`) lets one booking have two independent payments over its lifetime, and a new `pending_penalty_payment` booking status holds a checked-out-but-unpaid booking until that second payment resolves.

**Tech Stack:** Node/Express 5, Prisma 7, PostgreSQL, `razorpay` npm SDK (server-side only — no frontend SDK, Checkout.js is a plain script tag), Jest + Supertest.

## Global Constraints

- Currency is INR, amounts to Razorpay are in paise (`amount * 100`, integer).
- `POST /api/bookings` response shape: `{ booking, order }` where `order = { orderId, amount, currency, keyId }` (was `{ booking, clientSecret }`).
- `PUT /api/bookings/:id/terminate` response shape: `{ booking, order }` where `order` is `null` when there's no penalty owed (was just `{ booking }`).
- The slot always frees immediately on checkout regardless of penalty — payment collection never blocks releasing a physical parking spot.
- A penalty payment is never refunded (refund logic only ever touches `purpose: 'booking_hold'` payments).
- Webhook route stays mounted at `/api/payments/webhook` with the raw-body `express.raw()` middleware already in `app.js` — only the signature header/secret change (Stripe → Razorpay).
- Env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` replace `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/`STRIPE_WEBHOOK_SECRET`. New `PENALTY_PAYMENT_GRACE_MINUTES` (default `30`).

---

### Task 1: Prisma schema — Razorpay fields + penalty-payment status

**Files:**
- Modify: `Backend/prisma/schema.prisma`
- Create: `Backend/prisma/migrations/<timestamp>_add_penalty_payment_status/migration.sql`
- Create: `Backend/prisma/migrations/<timestamp>_stripe_to_razorpay/migration.sql`

**Interfaces:**
- Produces: `BookingStatus` enum gains `pending_penalty_payment`. `Payment` model: `provider` now defaults to `razorpay` (enum value renamed from `stripe`); `providerPaymentIntentId` renamed to `providerOrderId` (`@unique @map("provider_order_id")`); `providerChargeId` renamed to `providerPaymentId` (`@map("provider_payment_id")`, nullable, no longer unique); new `purpose PaymentPurpose @default(booking_hold)` column backed by a new `PaymentPurpose` enum (`booking_hold`, `overstay_penalty`); `currency` default changes from `'usd'` to `'INR'`.

This is two separate migration files rather than one because `ALTER TYPE ... ADD VALUE` cannot safely share a transaction with anything that might use the new value — splitting it into its own migration sidesteps the issue entirely rather than relying on how any particular Postgres/Prisma version happens to batch statements.

- [ ] **Step 1: Edit `schema.prisma`**

In the `BookingStatus` enum, add the new value:

```prisma
enum BookingStatus {
  pending_payment
  booked
  cancelled
  completed
  overdue
  expired
  pending_penalty_payment
}
```

Add a new enum right after `PaymentProvider`:

```prisma
enum PaymentPurpose {
  booking_hold
  overstay_penalty
}
```

Change `PaymentProvider` and the `Payment` model to:

```prisma
enum PaymentProvider {
  razorpay
}
```

```prisma
model Payment {
  id                Int             @id @default(autoincrement())
  bookingId         Int             @map("booking_id")
  provider          PaymentProvider @default(razorpay)
  purpose           PaymentPurpose  @default(booking_hold)
  providerOrderId   String          @unique @map("provider_order_id")
  providerPaymentId String?         @map("provider_payment_id")
  amount            Decimal         @db.Decimal(10, 2)
  currency          String          @default("INR") @db.VarChar(10)
  status            PaymentStatus   @default(pending)
  refundedAmount    Decimal         @default(0) @map("refunded_amount") @db.Decimal(10, 2)
  failureReason     String?         @map("failure_reason") @db.Text
  rawWebhookPayload Json?           @map("raw_webhook_payload")
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)

  booking           Booking         @relation(fields: [bookingId], references: [id], onDelete: Restrict)

  @@index([bookingId])
  @@map("payments")
}
```

- [ ] **Step 2: Generate the first migration (create-only, don't apply yet)**

Run: `cd Backend && npx prisma migrate dev --create-only --name add_penalty_payment_status`

- [ ] **Step 3: Hand-write that migration's SQL**

Replace the generated file's contents with exactly:

```sql
-- A checked-out booking with an unpaid overstay penalty parks here instead
-- of jumping straight to 'completed'. Kept in its own migration because
-- ALTER TYPE ... ADD VALUE must not share a transaction with anything that
-- could use the new value.
ALTER TYPE "BookingStatus" ADD VALUE 'pending_penalty_payment';
```

- [ ] **Step 4: Generate the second migration (create-only, don't apply yet)**

Run: `npx prisma migrate dev --create-only --name stripe_to_razorpay`

- [ ] **Step 5: Hand-write that migration's SQL**

Replace the generated file's contents with exactly:

```sql
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
```

- [ ] **Step 6: Apply both migrations and regenerate the Prisma client**

Run: `npx prisma migrate dev`

Expected: both migrations apply cleanly, ends with "Already in sync" / a generated client, no errors. If `ALTER TYPE "BookingStatus" ADD VALUE` errors with "cannot run inside a transaction block", that means this Postgres/Prisma combination batches every migration file in one transaction regardless of file boundaries — in that case, re-run `npx prisma migrate dev --create-only --name add_penalty_payment_status_fix`, put nothing but a comment in it, and instead apply the single `ALTER TYPE` line by hand directly against the dev DB with `psql` (or `npx prisma db execute --file <path> --schema prisma/schema.prisma`) before continuing.

- [ ] **Step 7: Verify the shape landed correctly**

Run: `npx prisma studio` is optional; simpler is: `node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.payment.findMany({take:1}).then(r=>{console.log(JSON.stringify(r)); return p.$disconnect();})"`

Expected: no error (table has `purpose`, `provider_order_id`, `provider_payment_id` columns now — an empty array `[]` is fine if there are no rows).

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: swap Payment model from Stripe to Razorpay, add penalty-payment booking status"
```

---

### Task 2: Rename `toStripeCents` to `toPaise`

**Files:**
- Modify: `Backend/src/utils/pricing.utils.js`
- Modify: `Backend/tests/pricing.test.js`

**Interfaces:**
- Produces: `toPaise(amount): number` — replaces `toStripeCents`. `computeBookingPrice` and `computeOverduePenalty` are unchanged (still used by later tasks exactly as today).

- [ ] **Step 1: Update the failing test first**

In `Backend/tests/pricing.test.js`, change line 1 and the `toStripeCents` describe block:

```js
const { computeBookingPrice, toPaise, computeOverduePenalty } = require('../src/utils/pricing.utils');
```

```js
describe('toPaise', () => {
    it('converts a rupee amount to integer paise', () => {
        expect(toPaise(25.5)).toBe(2550);
    });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx jest tests/pricing.test.js -t "toPaise"`
Expected: FAIL — `toPaise is not a function` (it doesn't exist yet).

- [ ] **Step 3: Rename the implementation**

In `Backend/src/utils/pricing.utils.js`, replace:

```js
const toStripeCents = (amount) => Math.round(parseFloat(amount) * 100);
```

with:

```js
const toPaise = (amount) => Math.round(parseFloat(amount) * 100);
```

And update the header comment and exports:

```js
// Single source of truth for every dollar figure in the app: booking
// price, the Razorpay order amount, and the overdue penalty. Keeping this
// in one file means the manual-terminate and auto-terminate paths can
// never compute a penalty differently.
```

```js
module.exports = {
    computeBookingPrice,
    toPaise,
    computeOverduePenalty,
};
```

- [ ] **Step 4: Run the full pricing test file to confirm it passes**

Run: `npx jest tests/pricing.test.js`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/pricing.utils.js tests/pricing.test.js
git commit -m "refactor: rename toStripeCents to toPaise for Razorpay"
```

---

### Task 3: Swap the Stripe SDK/config for Razorpay

**Files:**
- Modify: `Backend/package.json` (via npm, not hand-edited)
- Create: `Backend/src/config/razorpay.js`
- Delete: `Backend/src/config/stripe.js`
- Modify: `Backend/.env.example`

**Interfaces:**
- Produces: `Backend/src/config/razorpay.js` exports a configured Razorpay client instance (same shape as the old `stripe.js` export — a ready-to-use SDK object), read via `require('../../config/razorpay')` by Task 4.

- [ ] **Step 1: Swap the dependency**

Run: `cd Backend && npm uninstall stripe && npm install razorpay`

- [ ] **Step 2: Create the Razorpay config**

Create `Backend/src/config/razorpay.js`:

```js
const Razorpay = require('razorpay');
require('dotenv').config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET is missing from environment variables');
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

module.exports = razorpay;
```

- [ ] **Step 3: Delete the old Stripe config**

Run: `rm src/config/stripe.js` (or delete the file directly)

- [ ] **Step 4: Update `.env.example`**

Replace the `# --- Stripe ---` block:

```
# --- Stripe ---
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

with:

```
# --- Razorpay ---
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=changeme_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=changeme_razorpay_webhook_secret
```

And add one new line to the booking-policy block at the bottom:

```
PENALTY_PAYMENT_GRACE_MINUTES=30
```

- [ ] **Step 5: Verify nothing still references the old config**

Run: `grep -rn "config/stripe\|require('stripe')" src`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/config/razorpay.js src/config/stripe.js .env.example
git commit -m "feat: replace Stripe SDK/config with Razorpay"
```

(`git add` on the now-deleted `src/config/stripe.js` path stages its removal - no separate `git rm` needed.)

---

### Task 4: Rewrite `payments.service.js` for Razorpay

**Files:**
- Modify: `Backend/src/modules/payments/payments.service.js`

**Interfaces:**
- Consumes: `razorpay` client from Task 3 (`orders.create`, `payments.refund`); `toPaise` from Task 2.
- Produces (used by Task 5's controller and Task 6/7's bookings service):
  - `createOrderForBooking(booking): Promise<{orderId, amount, currency, keyId}>`
  - `createOrderForPenalty(booking): Promise<{orderId, amount, currency, keyId}>`
  - `confirmPayment(orderId, paymentId): Promise<void>` — idempotent, branches on `Payment.purpose`.
  - `failPayment(orderId, failureReason): Promise<void>`
  - `verifySignature(orderId, paymentId, signature): boolean`
  - `verifyWebhookSignature(rawBody, signature): boolean`
  - `userOwnsOrder(orderId, userId): Promise<boolean>`
  - `refundBookingPayment(booking): Promise<void>` — unchanged call signature from the Stripe version.
  - `expirePendingOrder(bookingId): Promise<void>` — replaces `cancelPaymentIntentForBooking`.
  - `handleRefundProcessed(refund): Promise<void>` — replaces `handleChargeRefunded`.

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `Backend/src/modules/payments/payments.service.js` with:

```js
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
```

- [ ] **Step 2: Sanity-check it loads**

Run: `node -e "require('./src/modules/payments/payments.service.js'); console.log('ok')"` (from `Backend/`)
Expected: prints `ok` with no throw (Razorpay's constructor and Prisma's client don't touch the network just by being constructed).

- [ ] **Step 3: Commit**

```bash
git add src/modules/payments/payments.service.js
git commit -m "feat: rewrite payments.service.js for Razorpay orders/refunds and purpose-aware confirmation"
```

---

### Task 5: Razorpay webhook + verify + config endpoints

**Files:**
- Create: `Backend/src/modules/payments/payments.schemas.js`
- Modify: `Backend/src/modules/payments/payments.controller.js`
- Modify: `Backend/src/modules/payments/payments.routes.js`
- Modify: `Backend/src/middlewares/rateLimit.middleware.js`
- Modify: `Backend/src/app.js`

**Interfaces:**
- Consumes: `payments.service.js` exports from Task 4.
- Produces: `POST /api/payments/webhook` (public, signature-authenticated), `POST /api/payments/verify` (private, body `{orderId, paymentId, signature}`), `GET /api/payments/config` (private, returns `{keyId}`) — all consumed by the frontend plan.

- [ ] **Step 1: Add the verify-payment schema**

Create `Backend/src/modules/payments/payments.schemas.js`:

```js
const { z } = require('zod');

const verifyPaymentSchema = z.object({
    orderId: z.string().min(1),
    paymentId: z.string().min(1),
    signature: z.string().min(1),
}).strict();

module.exports = { verifyPaymentSchema };
```

- [ ] **Step 2: Add a rate limiter for the verify endpoint**

In `Backend/src/middlewares/rateLimit.middleware.js`, add after `bookingCreateLimiter`:

```js
const paymentVerifyLimiter = buildLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many payment verification attempts. Please slow down.',
});
```

Add `paymentVerifyLimiter` to the `module.exports` object alongside the existing limiters.

- [ ] **Step 3: Rewrite the payments controller**

Replace the full contents of `Backend/src/modules/payments/payments.controller.js` with:

```js
const paymentsService = require('./payments.service');

// No auth middleware on this route - the Razorpay signature check IS the auth.
const handleWebhook = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];

    if (!paymentsService.verifyWebhookSignature(req.body, signature)) {
        console.error('[Payments] Webhook signature verification failed');
        return res.status(400).json({ received: false });
    }

    let event;
    try {
        event = JSON.parse(req.body.toString('utf8'));
    } catch (err) {
        return res.status(400).json({ received: false });
    }

    try {
        switch (event.event) {
            case 'payment.captured': {
                const payment = event.payload.payment.entity;
                await paymentsService.confirmPayment(payment.order_id, payment.id);
                break;
            }
            case 'payment.failed': {
                const payment = event.payload.payment.entity;
                await paymentsService.failPayment(payment.order_id, payment.error_description || 'Payment failed');
                break;
            }
            case 'refund.processed': {
                await paymentsService.handleRefundProcessed(event.payload.refund.entity);
                break;
            }
            default:
                break;
        }
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('[Payments] Webhook handler error:', err.message);
        res.status(500).json({ received: false });
    }
};

// Fast-path confirmation called by the frontend right after Razorpay's
// checkout succeeds. The webhook above is the durable fallback if this
// never fires (closed tab, dropped network).
const verifyPayment = async (req, res, next) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!paymentsService.verifySignature(orderId, paymentId, signature)) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const owns = await paymentsService.userOwnsOrder(orderId, req.user.id);
        if (!owns) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await paymentsService.confirmPayment(orderId, paymentId);
        res.status(200).json({ success: true, message: 'Payment verified' });
    } catch (err) {
        next(err);
    }
};

// Lets the frontend open Razorpay Checkout when resuming a payment without
// a fresh order-creation response to read the key off of.
const getConfig = (req, res) => {
    res.status(200).json({ success: true, data: { keyId: process.env.RAZORPAY_KEY_ID } });
};

module.exports = { handleWebhook, verifyPayment, getConfig };
```

- [ ] **Step 4: Rewrite the payments routes**

Replace the full contents of `Backend/src/modules/payments/payments.routes.js` with:

```js
const express = require('express');
const router = express.Router();
const paymentsController = require('./payments.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { paymentVerifyLimiter } = require('../../middlewares/rateLimit.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { verifyPaymentSchema } = require('./payments.schemas');

// @route   POST api/payments/webhook
// @desc    Razorpay webhook (payment.captured/failed, refund.processed)
// @access  Public - authenticated via Razorpay signature, not a session
router.post('/webhook', paymentsController.handleWebhook);

// @route   POST api/payments/verify
// @desc    Fast-path payment confirmation from the frontend's checkout success callback
// @access  Private (ownership of the underlying booking is checked against the order)
router.post('/verify', authMiddleware, paymentVerifyLimiter, validate(verifyPaymentSchema), paymentsController.verifyPayment);

// @route   GET api/payments/config
// @desc    Public Razorpay key id, for resuming a payment without a fresh order response
// @access  Private
router.get('/config', authMiddleware, paymentsController.getConfig);

module.exports = router;
```

- [ ] **Step 5: Update the raw-body webhook comment in `app.js`**

In `Backend/src/app.js`, replace:

```js
// Stripe signature verification needs the raw, unparsed body. This MUST be
// registered before the global bodyParser.json() below - middleware order
// is what matters here, not where the route is declared.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
```

with:

```js
// Razorpay signature verification needs the raw, unparsed body. This MUST
// be registered before the global bodyParser.json() below - middleware
// order is what matters here, not where the route is declared.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
```

(Route/middleware behavior is unchanged - only the comment's wording.)

- [ ] **Step 6: Boot the server and hit the config endpoint manually**

Run: `npm run dev` (from `Backend/`, in one terminal), then in another: log in as any test user to get an access token, and `curl -H "Authorization: Bearer <token>" http://localhost:5000/api/payments/config`
Expected: `{"success":true,"data":{"keyId":"<whatever RAZORPAY_KEY_ID is in .env>"}}`. Stop the dev server after confirming.

- [ ] **Step 7: Commit**

```bash
git add src/modules/payments/payments.schemas.js src/modules/payments/payments.controller.js src/modules/payments/payments.routes.js src/middlewares/rateLimit.middleware.js src/app.js
git commit -m "feat: add Razorpay webhook, /payments/verify, and /payments/config endpoints"
```

---

### Task 6: Real penalty payment in `bookings.service.js`

**Files:**
- Modify: `Backend/src/modules/bookings/bookings.service.js`

**Interfaces:**
- Consumes: `paymentsService.createOrderForBooking`, `paymentsService.createOrderForPenalty` from Task 4.
- Produces: `createBookingHold(...): Promise<{booking, order}>` (was `{booking, clientSecret}`); `terminateBookingTransaction(bookingId, userId): Promise<{booking, order}>` (was returning the booking row directly) — `order` is `null` when there's no penalty; `getBookingsByUser(userId)` now includes each booking's latest pending `Payment` (`providerOrderId`, `amount`, `purpose`) so the frontend can resume an abandoned payment. `cancelBookingTransaction` is unchanged (its call to `paymentsService.refundBookingPayment` has the same signature as before).

- [ ] **Step 1: Update `createBookingHold`'s payment call**

Replace:

```js
    const { clientSecret } = await paymentsService.createPaymentIntentForBooking(booking);

    return { booking, clientSecret };
};
```

with:

```js
    const order = await paymentsService.createOrderForBooking(booking);

    return { booking, order };
};
```

Also update the header comment above `createBookingHold` (currently says "The Stripe PaymentIntent is created AFTER..."): change "Stripe PaymentIntent" to "Razorpay Order" in that comment.

- [ ] **Step 2: Rewrite `terminateBookingTransaction`**

Replace the entire function with:

```js
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
```

- [ ] **Step 3: Enrich `getBookingsByUser` with the latest pending payment**

Replace:

```js
const getBookingsByUser = async (userId) => {
    return await prisma.booking.findMany({
        where: { userId: parseInt(userId) },
        include: {
            slot: { select: { slotNumber: true } },
            business: { select: { name: true, address: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};
```

with:

```js
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
```

`getBookingsByBusiness` is unchanged - business owners don't pay, so there's nothing to resume there.

- [ ] **Step 4: Run the existing booking tests (Task 8 will finish updating their mocks - this run is expected to fail here)**

Run: `npx jest tests/bookings.concurrency.test.js tests/bookings.ownership.test.js`
Expected: `bookings.ownership.test.js` PASSes (untouched by this change). `bookings.concurrency.test.js` FAILs because its mock still exports `createPaymentIntentForBooking`, not `createOrderForBooking` - this is expected and gets fixed in Task 8. Do not fix it here; the point of running it now is to confirm *that specific* failure, not some other regression.

- [ ] **Step 5: Commit**

```bash
git add src/modules/bookings/bookings.service.js
git commit -m "feat: make overstay-penalty checkout a real Razorpay payment"
```

---

### Task 7: `bookings.controller.js` response shapes

**Files:**
- Modify: `Backend/src/modules/bookings/bookings.controller.js`

**Interfaces:**
- Consumes: `{booking, order}` return shapes from Task 6.
- Produces: `POST /api/bookings` and `PUT /api/bookings/:id/terminate` response bodies matching the Global Constraints section above.

- [ ] **Step 1: Update `createBooking`**

Replace:

```js
        const { booking, clientSecret } = await bookingsService.createBookingHold(
            userId,
            businessId,
            slotId,
            startTime,
            endTime
        );

        res.status(201).json({
            success: true,
            message: 'Booking hold created - complete payment to confirm',
            data: { booking, clientSecret }
        });
```

with:

```js
        const { booking, order } = await bookingsService.createBookingHold(
            userId,
            businessId,
            slotId,
            startTime,
            endTime
        );

        res.status(201).json({
            success: true,
            message: 'Booking hold created - complete payment to confirm',
            data: { booking, order }
        });
```

- [ ] **Step 2: Update `terminateBooking`**

Replace:

```js
const terminateBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await bookingsService.terminateBookingTransaction(id, userId);

        res.status(200).json({
            success: true,
            message: 'Booking terminated successfully',
            data: booking
        });
    } catch (error) {
```

with:

```js
const terminateBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { booking, order } = await bookingsService.terminateBookingTransaction(id, userId);

        res.status(200).json({
            success: true,
            message: order ? 'Checked out - complete the overstay penalty payment to finish' : 'Booking terminated successfully',
            data: { booking, order }
        });
    } catch (error) {
```

- [ ] **Step 3: Boot the server and manually exercise both endpoints**

Run: `npm run dev`, log in as a customer with an approved business/slot available, `POST /api/bookings` with a valid body.
Expected: `201` with `data: { booking: {...status: "pending_payment"...}, order: { orderId, amount, currency, keyId } }`.

- [ ] **Step 4: Commit**

```bash
git add src/modules/bookings/bookings.controller.js
git commit -m "feat: return Razorpay order (not clientSecret) from booking creation and terminate"
```

---

### Task 8: Scheduler — rename + new penalty-hold expiry sweep

**Files:**
- Modify: `Backend/src/services/bookingScheduler.js`
- Modify: `Backend/tests/bookings.concurrency.test.js`

**Interfaces:**
- Consumes: `paymentsService.expirePendingOrder` from Task 4.
- Produces: `expirePenaltyHolds()` — new 4th sweep, wired into `runAllSweeps()`.

- [ ] **Step 1: Add the new env var constant and rename the Stripe-era call**

At the top of `Backend/src/services/bookingScheduler.js`, add alongside the other constants:

```js
const PENALTY_PAYMENT_GRACE_MINUTES = parseInt(process.env.PENALTY_PAYMENT_GRACE_MINUTES || '30', 10);
```

In `expirePaymentHolds`, replace:

```js
            await paymentsService.cancelPaymentIntentForBooking(hold.id);
```

with:

```js
            await paymentsService.expirePendingOrder(hold.id);
```

Also update that function's header comment (currently says "The Stripe PaymentIntent is cancelled first..."): change it to:

```js
// Sweep 3: a 'pending_payment' hold that's never paid within
// HOLD_EXPIRY_MINUTES releases its slot. Razorpay has no remote order to
// cancel (unlike Stripe's PaymentIntent), so this is purely local
// bookkeeping before the booking itself is marked expired.
```

- [ ] **Step 2: Add the new sweep**

Add this new function right after `autoTerminateOverdueBookings` (before `expirePaymentHolds`):

```js
// Sweep: a checked-out booking left sitting in 'pending_penalty_payment'
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
```

- [ ] **Step 3: Wire it into `runAllSweeps`**

Replace:

```js
const runAllSweeps = async () => {
    await expireBookings();
    await autoTerminateOverdueBookings();
    await expirePaymentHolds();
};
```

with:

```js
const runAllSweeps = async () => {
    await expireBookings();
    await autoTerminateOverdueBookings();
    await expirePenaltyHolds();
    await expirePaymentHolds();
};
```

- [ ] **Step 4: Fix the concurrency test's payments mock**

In `Backend/tests/bookings.concurrency.test.js`, replace:

```js
// Mock the payments module so this test exercises the DB-level FOR UPDATE
// locking + overlap check without depending on a real Stripe network call.
jest.mock('../src/modules/payments/payments.service', () => ({
    createPaymentIntentForBooking: jest.fn().mockResolvedValue({ clientSecret: 'test_secret' }),
}));
```

with:

```js
// Mock the payments module so this test exercises the DB-level FOR UPDATE
// locking + overlap check without depending on a real Razorpay network call.
jest.mock('../src/modules/payments/payments.service', () => ({
    createOrderForBooking: jest.fn().mockResolvedValue({
        orderId: 'order_test',
        amount: 1000,
        currency: 'INR',
        keyId: 'rzp_test_key',
    }),
}));
```

- [ ] **Step 5: Run the concurrency test to confirm it passes now**

Run: `npx jest tests/bookings.concurrency.test.js`
Expected: PASS, both tests green.

- [ ] **Step 6: Commit**

```bash
git add src/services/bookingScheduler.js tests/bookings.concurrency.test.js
git commit -m "feat: add penalty-hold expiry sweep, rename Stripe-era scheduler call to Razorpay"
```

---

### Task 9: Signature-verification unit tests

**Files:**
- Create: `Backend/tests/payments.service.test.js`

**Interfaces:**
- Consumes: `verifySignature`, `verifyWebhookSignature` from Task 4's `payments.service.js`.

- [ ] **Step 1: Write the test file**

Create `Backend/tests/payments.service.test.js`:

```js
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

const crypto = require('crypto');
const prisma = require('../src/config/prisma');
const paymentsService = require('../src/modules/payments/payments.service');

afterAll(async () => {
    await prisma.$disconnect();
});

describe('verifySignature - Razorpay checkout callback verification', () => {
    it('accepts a signature computed the same way Razorpay computes it', () => {
        const orderId = 'order_abc123';
        const paymentId = 'pay_xyz789';
        const signature = crypto
            .createHmac('sha256', 'test_key_secret')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        expect(paymentsService.verifySignature(orderId, paymentId, signature)).toBe(true);
    });

    it('rejects a signature computed with the wrong secret', () => {
        const orderId = 'order_abc123';
        const paymentId = 'pay_xyz789';
        const signature = crypto
            .createHmac('sha256', 'wrong_secret')
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        expect(paymentsService.verifySignature(orderId, paymentId, signature)).toBe(false);
    });

    it('rejects a missing signature without throwing', () => {
        expect(paymentsService.verifySignature('order_abc123', 'pay_xyz789', undefined)).toBe(false);
    });
});

describe('verifyWebhookSignature - Razorpay webhook verification', () => {
    it('accepts a signature computed over the exact raw body', () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const signature = crypto
            .createHmac('sha256', 'test_webhook_secret')
            .update(rawBody)
            .digest('hex');

        expect(paymentsService.verifyWebhookSignature(rawBody, signature)).toBe(true);
    });

    it('rejects a body that does not match the signature', () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const tamperedBody = Buffer.from(JSON.stringify({ event: 'payment.failed' }));
        const signature = crypto
            .createHmac('sha256', 'test_webhook_secret')
            .update(rawBody)
            .digest('hex');

        expect(paymentsService.verifyWebhookSignature(tamperedBody, signature)).toBe(false);
    });
});
```

- [ ] **Step 2: Run it**

Run: `npx jest tests/payments.service.test.js`
Expected: PASS, 5 tests green.

- [ ] **Step 3: Commit**

```bash
git add tests/payments.service.test.js
git commit -m "test: add Razorpay signature verification unit tests"
```

---

### Task 10: Docs + full test suite + progress log

**Files:**
- Modify: `Backend/docs/OPERATIONS.md`
- Modify: `Backend/CLAUDE.md`

**Interfaces:** None — documentation and final verification only.

- [ ] **Step 1: Update the webhook-forwarding section in OPERATIONS.md**

Replace:

```
## Stripe webhooks locally

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET` in `.env`.
Use Stripe's test-mode keys for `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY`.
```

with:

```
## Razorpay webhooks locally

Razorpay doesn't have an official local-forwarding CLI. Expose the local
server with a tunnel (e.g. `ngrok http 5000`) and register the resulting
HTTPS URL + `/api/payments/webhook` as a webhook endpoint in the Razorpay
Dashboard (Test Mode), subscribed to `payment.captured`, `payment.failed`,
and `refund.processed`. Copy the webhook secret it gives you into
`RAZORPAY_WEBHOOK_SECRET` in `.env`. Use Razorpay's test-mode keys for
`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
```

Also add a row to the "Booking policy tuning" table:

```
| `PENALTY_PAYMENT_GRACE_MINUTES` | 30 | How long a checked-out booking with an unpaid overstay penalty sits before auto-resolving to `completed` anyway |
```

- [ ] **Step 2: Run the full backend test suite**

Run: `npm test` (from `Backend/`)
Expected: all suites PASS (`auth.roleEscalation`, `bookings.concurrency`, `bookings.ownership`, `pricing`, `payments.service`).

- [ ] **Step 3: Boot the server once more for a final smoke check**

Run: `npm run dev`, confirm the startup log shows no Razorpay/Stripe key warnings breaking the boot, and that `GET /health` returns `200`.

- [ ] **Step 4: Append a session note to `Backend/CLAUDE.md`**

Add a new dated entry under "Session notes" (after the existing 2026-08-07 entry) summarizing: Stripe replaced with Razorpay end-to-end (Orders + Checkout.js + HMAC verify + webhook, mirroring the original PaymentIntent design); the overstay-penalty checkout is now a real second Razorpay payment via a new `pending_penalty_payment` booking status and `Payment.purpose`; new `PENALTY_PAYMENT_GRACE_MINUTES` scheduler sweep; `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET` are still placeholders pending real test-mode keys, same fails-safe posture as the Stripe keys were.

- [ ] **Step 5: Commit**

```bash
git add docs/OPERATIONS.md CLAUDE.md
git commit -m "docs: update operations guide and roadmap for the Razorpay migration"
```
