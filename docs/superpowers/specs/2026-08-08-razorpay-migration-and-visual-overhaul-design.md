# Razorpay Migration, Frontend Sync & "Midnight Garage" Visual Overhaul

## Context

The backend's Phase 0-6 production roadmap (`Backend/CLAUDE.md`) was implemented and smoke-tested against **Stripe**. Stripe is not usable in India, so the payment gateway must be swapped to **Razorpay** before anything else. Separately, the booking-creation response contract already changed shape (`{ booking, clientSecret }`) as part of that work, and the frontend was never updated to match — `BusinessDetails.jsx` still posts a client-computed `totalPrice` (now rejected by the strict Zod schema) and expects an immediate `booked` result. The "pay overstay penalty" screen (`CheckoutSummary.jsx`) is separately and completely fake: no backend endpoint exists for it at all, just a 3-second `setTimeout`.

This spec covers three sequenced pieces of work:
1. Replace Stripe with Razorpay end-to-end on the backend, including making the overstay-penalty checkout a **real** second payment (closing the fake-checkout gap), per product decision.
2. Update the frontend to match the current (and new) backend contracts — booking creation, cancellation, checkout/penalty payment, and booking-status display.
3. A bigger visual overhaul ("Midnight Garage" — car-themed, dark/energetic) applied across the whole site, including pages already rebuilt onto the older navy/ink language.

## Payment Architecture (Razorpay)

**Flow shape**, mirroring the existing Stripe design but idiomatic to Razorpay (hosted checkout, not a custom card form):

1. Backend creates a **Razorpay Order** (analogous to a PaymentIntent) inside the existing pattern: the DB transaction (slot lock, overlap check, price freeze) commits first; the Order is created **after** commit, never while holding a Postgres lock.
2. Backend returns `{ orderId, amount, currency, keyId }` to the frontend (`keyId` = `RAZORPAY_KEY_ID`, safe to expose — it's the publishable key). No client secret concept exists in Razorpay.
3. Frontend opens Razorpay's own **Checkout.js modal** (loaded via a single `<script>` tag, not an npm package) with those order details. This replaces the need for a Stripe-Elements-style custom card form entirely — Razorpay hosts the payment UI itself.
4. On success, Razorpay's browser callback returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`. The frontend posts these to a new authenticated `POST /api/payments/verify` endpoint, which HMAC-verifies the signature (`sha256(order_id|payment_id)` keyed with `RAZORPAY_KEY_SECRET`) and then runs the same idempotent confirmation used by the webhook.
5. The Razorpay **webhook** (`payment.captured`, `payment.failed`, `refund.processed`) remains the durable source of truth in case the browser never calls `/verify` (tab closed, network drop). Both paths call one shared `confirmPayment(orderId, paymentId)` function, so they can never diverge.
6. Webhook signature verification needs the raw body, exactly like the Stripe setup — `index.js`'s existing `express.raw()` mount ahead of the global JSON parser is kept, just re-pointed at Razorpay's header (`x-razorpay-signature`) and secret (`RAZORPAY_WEBHOOK_SECRET`).

**Why Checkout.js over building custom fields**: Razorpay's hosted modal is the standard, PCI-scope-minimizing integration and removes an entire custom UI surface (card number/expiry/CVV fields, validation, 3-D Secure handling) that would otherwise have to be built and maintained — strictly less frontend work than the Stripe Elements path this was heading toward, and a better fit for "production grade" than rolling our own.

### Two payment purposes, one `Payment` model

Today `Payment` only ever represents the initial booking hold. Making the overstay penalty a real charge means a booking can now have **two independent payments** over its lifecime. Add `Payment.purpose: PaymentPurpose { booking_hold | overstay_penalty }` (default `booking_hold`) so `confirmPayment`, refund lookups, and the scheduler can all tell them apart without new tables.

**Schema changes** (new migration, hand-edited like the existing enum-cutover migrations):
- `PaymentProvider`: rename enum value `stripe` → `razorpay`.
- `Payment.providerPaymentIntentId` → `providerOrderId` (Razorpay Order id, still unique).
- `Payment.providerChargeId` → `providerPaymentId` (Razorpay Payment id — required for refunds, which are keyed by payment id, not order id; not unique, since a retried/failed attempt could theoretically produce a distinct id before the real success).
- New `PaymentPurpose` enum + `Payment.purpose` column, default `booking_hold`.
- `Payment.currency` default `'usd'` → `'INR'`.
- `BookingStatus`: add `pending_penalty_payment`.

### Overstay checkout becomes a real payment

`terminateBookingTransaction` currently frees the slot and marks the booking `completed` with a recorded (but never collected) `penaltyAmount` in one step. New behavior:

- The slot **always** frees immediately on checkout, regardless of penalty — that's a physical fact (the car has left), not something payment collection should block.
- If `penaltyAmount === 0` (on-time checkout): unchanged, booking goes straight to `completed`.
- If `penaltyAmount > 0`: booking transitions to `pending_penalty_payment` instead of `completed`. After the transaction commits, a Razorpay Order is created for the penalty (same `createOrder`-then-`Payment`-row pattern as booking creation, `purpose: overstay_penalty`). The booking only reaches `completed` once that payment is confirmed (via `/verify` or the webhook), using the same shared `confirmPayment` function branching on `payment.purpose`.
- New scheduler sweep (`bookingScheduler.js`, same 30s tick): `pending_penalty_payment` bookings left unpaid past `PENALTY_PAYMENT_GRACE_MINUTES` (default 30, env var) auto-resolve to `completed` anyway — the slot is already free, so there's nothing left to protect by holding the booking open forever; the unpaid penalty stays visible on the (failed/pending) `Payment` row as a collections follow-up, which is out of scope here. This mirrors the existing "fails safe" pattern used for the hold-expiry sweep.
- Refund lookups (`refundBookingPayment`) filter to `purpose: 'booking_hold'` — a penalty payment is never refundable by definition (it only exists because the booking is already past its end time).

### Endpoints

- `POST /api/bookings` — response body changes from `{ booking, clientSecret }` to `{ booking, order }` where `order` is `{ orderId, amount, currency, keyId }`.
- `PUT /api/bookings/:id/terminate` — response body changes from `{ booking }` to `{ booking, order }`, where `order` is `null` when there's no penalty to collect.
- `POST /api/payments/verify` (new, authenticated, rate-limited) — body `{ orderId, paymentId, signature }`; verifies the requesting user owns the underlying booking before confirming (defense in depth beyond the signature check).
- `GET /api/payments/config` (new, authenticated) — returns `{ keyId }` so the frontend can open Checkout.js when resuming a payment without a fresh order-creation response (e.g. an abandoned initial-payment booking revisited from Profile).
- `POST /api/payments/webhook` — unchanged path, Razorpay events instead of Stripe events.
- `GET /api/bookings/my` and `GET /api/bookings/business/:businessId` — additionally include the latest pending `Payment` (`providerOrderId`, `amount`, `purpose`) per booking, so Profile/BusinessDashboard can offer a "complete payment" action on `pending_payment` / `pending_penalty_payment` rows without a new endpoint.

## Frontend Sync

- **`frontend/src/utils/razorpay.js`** (new): loads the Checkout.js script once (cached promise) and wraps `new window.Razorpay(options).open()`.
- **A shared payment hook** (new, e.g. `usePayment()`): given an `order` + prefill info, opens Checkout.js, posts to `/payments/verify` on success, and resolves/rejects with a plain outcome — used by all three payment call sites below instead of duplicating the verify/error-handling logic three times.
- **`BusinessDetails.jsx`**: stop sending `totalPrice` in the booking POST (rejected by the strict schema anyway). On the `{ booking, order }` response, open Checkout.js **inline on the same page** (Razorpay's modal makes a dedicated "enter payment" page unnecessary) with a processing state; on success, navigate to `/booking-success` (currently dead code — nothing links to it today) with the booking; on dismiss/failure, show an inline retry (the same Order can be reused for a retry attempt since it's unpaid).
- **`Profile.jsx`**: handle the two new booking statuses — `pending_payment` gets a "Complete payment" action (uses the enriched pending-payment info + `/payments/config`, pays inline via the shared hook); `pending_penalty_payment` gets a "Pay penalty" action that navigates to `/checkout-summary` with the reconstructed booking/order. `handleCheckout` (terminate) now navigates to `/checkout-summary` with `{ booking, order }` always — `order` may be `null`.
- **`CheckoutSummary.jsx`** rebuilt to be real: same receipt breakdown as today, but the "Pay now" button becomes a real Checkout.js payment against `order` (when present) via the shared hook, with a genuine success state on confirmation; when `order` is `null` (no penalty owed), it shows a "you're all settled, nothing owed" state instead of ever faking a charge.
- **`BookingSuccess.jsx`**: finally gets wired up (see above); light personalization using the passed booking, otherwise mostly a restyle.
- Slot/booking status handling: `BusinessDetails.jsx`'s slot grid already needs `slot.status`-aware rendering (backend already moved off `isAvailable` a while ago — this is a pre-existing sync gap, not a new one) as part of this pass.

## Visual Overhaul — "Midnight Garage"

Car-themed, dark and energetic, chosen so the accent colors double as functional UI signals rather than being purely decorative:

| Token | Value | Role |
|---|---|---|
| `asphalt-deep` | `#0b0c10` | Hero/nav dark surfaces |
| `asphalt` | `#15171c` | Primary dark surface |
| `asphalt-soft` | `#1f2229` | Dark-context cards |
| `ignition` | `#FF6A2B` | Primary CTA / accent (tachometer-redline energy) |
| `ignition-dark` | `#E5501A` | Hover/active |
| `ignition-light` | `#FF8A5B` | Tints/backgrounds |
| `pulse` | `#22D3EE` | "Live"/available real-time signal (socket updates, available slots) |
| `pulse-dark` | `#0BA5C7` | Pulse hover/active |
| `chrome` | `#9AA3AF` | Borders, secondary text (brushed-metal feel) |
| `ink` / `ink-soft` | `#0d0d0f` / `#6b7280` | Body text (warmed slightly to sit with asphalt) |
| `surface` | `#f5f4f2` | Light content background |

Red (errors, overdue, penalties) and emerald (settled/completed) are **left alone** — deliberately not folded into the new palette, so "danger" and "done" keep meaning what they already mean everywhere in the app; only the accent/action/live colors change. This also resolves the earlier concern with a straight racing-red palette (option B, rejected) colliding with existing error semantics.

Motion/detail language carrying the rest of the "vibe": a cyan glow-pulse on slot cells when they flip to available via the socket; tabular-nums with a small ignition-orange tick accent on stat cards; a directional slide+fade (not a plain fade) on route transitions; primary buttons get a soft ignition-hued glow on hover instead of a flat color swap.

Applies sitewide, including pages already rebuilt onto the older navy/ink language (Login, Register, Profile, About, both dashboards, CheckoutSummary) — this supersedes that language, not just extends it.

## Sequencing

1. **Backend**: schema/migration, config, `payments.service.js`/`controller.js`/`routes.js`, `bookings.service.js`/`controller.js`, `bookingScheduler.js`, `pricing.utils.js`, env vars, existing Jest payment/booking tests updated to Razorpay mocks.
2. **Frontend sync**: booking creation, terminate/checkout, profile status handling, the shared payment hook — functional correctness against the new backend, using the *current* visual language (no point restyling code about to be replaced by step 3's markup changes).
3. **Visual overhaul**: Tailwind tokens, then a pass over every page/component for the new palette, motion, and remaining rough spots (slot picker, payment UI just built in step 2, Home sections).

## Out of scope

- Real Razorpay API keys / webhook secret — left as env var placeholders, same fails-safe posture as the Stripe keys were.
- A collections/follow-up flow for penalties left unpaid past the grace period (flagged, not built).
- Location/coordinate-based "nearby parking" search (unrelated to this work).
