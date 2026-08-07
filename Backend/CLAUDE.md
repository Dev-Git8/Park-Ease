# Production-Grade Parking Backend: Security, Payments & Domain Overhaul

This is the working roadmap for taking this backend to production. It was produced from a three-way audit (structure, domain logic, security) plus two design passes (payment/domain, security/infra), with the key product decisions already locked in below. Work through the phases in order — each is scoped to ship and verify independently. When a phase is completed, mark it done in this file so future sessions know where to pick up.

## Context

The backend (Node/Express 5, Prisma 7, PostgreSQL, Redis, Socket.IO) has a solid foundation: booking creation already uses `SELECT ... FOR UPDATE` inside a Prisma transaction, which genuinely prevents double-booking at the DB level. But the audit found it is not production-ready:

- **A live privilege-escalation bug**: `POST /api/auth/register` takes `role` verbatim from the client — anyone can register as `admin`.
- **Client-controlled money**: `totalPrice` is taken from the request body with zero server-side recalculation — a customer can book any duration for any price.
- **No payment gateway at all** — bookings go straight to `booked` with no payment step.
- **A PII leak**: any business-role user can view any *other* business's bookings (customer names/emails) by guessing an ID.
- **No rate limiting, no helmet/hpp, hardcoded CORS origin, no input validation library.**
- **A stuck-slot bug**: overdue bookings never free their slot automatically — a no-show can lock a spot forever.
- **The slot model can't support real advance booking** — a slot is claimed by one booking from creation to end, so it can't hold multiple future non-overlapping reservations.
- No tests, no CI, no Dockerfile for the API, incomplete `.env.example`.

**Decisions locked in:**
1. Registration self-selects `customer` or `business` only (never `admin`); `business` still requires the existing `Business.status` admin-approval gate, so this grants no real power on its own.
2. The very first admin is created via a one-time CLI seed script (unavoidable bootstrap — nothing can gate-check "is there an admin yet" via HTTP safely). Every subsequent admin account is created via a new **HTTP admin-invite endpoint**, gated to existing admins only, per explicit request.
3. Server-side price recalculation is the top-priority fix — client-supplied `totalPrice` is rejected outright (schema-level `.strict()`, not just ignored).
4. **True time-range overlap booking**: a slot holds many non-overlapping future reservations, not just one active claim. This is a real complexity increase but is the correct model for a product where people book ahead.
5. **Refund policy**: full refund if cancelled before `startTime`, no refund after `startTime` has passed.

Everything else (numeric thresholds, minor architecture calls) uses the sensible defaults documented inline below, each exposed as an env var so they're trivial to retune without a code change.

---

## Phase 0 — Critical Security Fixes (do first; small, independent, high-impact)

**1. Fix role escalation** — `src/modules/auth/auth.controller.js`, `src/modules/auth/auth.service.js`
- Controller: whitelist `role` to `['customer', 'business']`; anything else (including `admin`) silently defaults to `customer` and logs a `console.warn` (probe detection).
- Service `createUser`: add a second defensive whitelist covering all three real DB values (`customer`/`business`/`admin`) so future callers (like the new admin-invite endpoint) can legitimately pass `admin` — the controller is the actual public-facing gate, the service is defense-in-depth.
- Same function: `createUser` currently returns the full Prisma row — **the bcrypt hash is being sent back to the client in the register response.** Fix with an explicit `select` (`id, name, email, role, createdAt`).

**2. Fix bookings-by-business ownership leak** — `src/modules/bookings/bookings.service.js`, `.controller.js`, `.routes.js`
- `getBookingsByBusiness(businessId, ownerId)`: look up the business first, throw `'Business not found'` (404) or `'Unauthorized'` (403) before returning any booking/customer data. Mirror the ownership-check pattern already used in `cancelBookingTransaction`/`terminateBookingTransaction` (`booking.userId !== userId`).
- Controller passes `req.user.id` through and maps the two new error cases to 404/403.

**3. Defensive `roleMiddleware`** — `src/middlewares/auth.middleware.js`: guard `req.user` existing before `.role` access (currently throws a raw 500 if ever mounted without `authMiddleware` first).

**4. Error message sanitization** — `src/middlewares/error.middleware.js`: only pass `err.message` through to the client when `err.statusCode` was explicitly set by application code (i.e., a deliberate, known-safe error). Anything else (Prisma exceptions, bugs) returns a fixed generic message — currently *any* internal error message reaches the client in every environment.

**5. CORS made env-driven** — `src/index.js`: replace the hardcoded `origin: 'http://localhost:5173'` with a comma-separated allowlist from `CORS_ORIGINS`, validated via a callback function. Note `src/config/socket.js` *already* reads `FRONTEND_URL`/env correctly for Socket.IO's CORS — only the Express CORS setup is hardcoded.

**6. Security middleware** — `src/index.js`: add `helmet()` (with `contentSecurityPolicy: false` — this is a pure JSON API, no HTML is ever served) and `hpp()`. New deps: `helmet`, `hpp`.
- **CSRF: not needed.** Reasoned explicitly: Bearer access tokens aren't auto-sent by browsers (immune to CSRF by construction), and the refresh/logout cookie is `httpOnly` + `SameSite=Strict`, which already blocks cross-site attachment. Revisit only if a future cookie-only-authenticated mutation endpoint is added.

**7. Rate limiting** — new `src/middlewares/rateLimit.middleware.js` using `express-rate-limit` + `rate-limit-redis` (Redis is already a dependency, so this is free infra — and correctly shares limits across multiple app instances, unlike an in-memory store).
   - `loginLimiter`: 10 attempts / 15 min · `registerLimiter`: 5 / hour · `refreshLimiter`: 30 / 15 min · `bookingCreateLimiter`: 10 / min · `globalLimiter` (app-wide defense-in-depth): 300 / 15 min.
   - Applied in `auth.routes.js`, `bookings.routes.js`, and globally in `src/index.js`. Thresholds are placeholders — tune against real traffic before launch, but ship with something rather than nothing.

**8. Refresh token rotation** — `src/modules/auth/auth.service.js` (new `rotateSession` helper: delete old session row + create new one in one transaction), `auth.controller.js`'s `refresh` handler issues and stores a brand-new refresh token on every call instead of reusing the same one for its full 7-day life. Limits the blast radius of a stolen refresh token to one use.
   - Note: `verifyRefreshToken` is currently imported but never called (session validity is checked purely by DB lookup + `expiresAt`) — remove the dead import for clarity; DB-presence-only validation is intentional and fine (session deletion is the actual revocation mechanism).

**9. File upload content verification** — `src/middlewares/upload.middleware.js`: add a `verifyImageContent` step (new dep: `file-type`, sniffs magic bytes) chained after Multer's `fileFilter`, since Multer only sees the client-supplied (spoofable) `Content-Type` header. Wire into `business.routes.js`'s two upload routes.

**10. Session cleanup** — add `@@index([expiresAt])` to `Session` in `prisma/schema.prisma`; new `src/services/sessionCleanupScheduler.js` (same `setInterval` pattern as the existing `bookingScheduler.js`, hourly), purging expired rows. Started alongside the existing scheduler in `src/index.js`.

---

## Phase 1 — Schema Overhaul (Prisma migrations, sequenced carefully)

File: `prisma/schema.prisma`. This phase is pure data-model — no business logic changes yet, so it can be deployed independently and verified before Phase 2/3 build on top of it.

**New enums** (replacing plain `String` columns — existing string values already match planned member names, e.g. `"booked"` → `booked`, so the cutover is a straightforward type change, not a data rewrite):
```
UserRole: customer | business | admin
BusinessStatus: pending | approved | rejected | suspended
BookingStatus: pending_payment | booked | cancelled | completed | overdue | expired
PaymentStatus: pending | succeeded | failed | refunded | partially_refunded | canceled
PaymentProvider: stripe
SlotStatus: available | held | occupied | maintenance
```

**Slot**: replace `isAvailable Boolean` with `status SlotStatus @default(available)`. Add `createdAt`/`updatedAt`.

**New `Payment` model**: `id, bookingId (FK→Booking, onDelete: Restrict), provider, providerPaymentIntentId (unique), providerChargeId, amount, currency, status, refundedAmount, failureReason, rawWebhookPayload (Json), createdAt, updatedAt`. **`bookingId` is NOT unique** — one booking can have multiple Payment rows over time (a failed card attempt followed by a retry is a normal flow; the app treats the most recent non-`failed` row as authoritative).

**`Business`**: add nullable `lat`/`lng` (`Decimal @db.Decimal(9,6)`) — not explicitly requested, but "find nearby parking" is core to a real parking product and `address` is currently free-text with zero coordinates. Add `@@index([lat, lng])` as a cheap bounding-box prefilter (true radius search via PostGIS is a bigger infra decision — out of scope now, but this doesn't block adding it later). Add `updatedAt`.

**`Booking`**: `status` → `BookingStatus`, default changes from `booked` to `pending_payment` (bookings are no longer pre-confirmed — see Phase 3). Add `updatedAt`. Add indexes: `@@index([status, endTime])` (the scheduler's core query), `@@index([slotId, status])` (overlap-conflict query in Phase 2), `@@index([userId])`, `@@index([businessId])`.

**`onDelete` changes** — switch `Business.owner→User`, `Booking.user→User`, `Booking.business→Business`, `Booking.slot→Slot` from `Cascade` to **`Restrict`** (financial/audit records must survive account deletion; nothing today hard-deletes a user/business anyway, so this closes a latent landmine rather than breaking a real flow). Keep `Business.slots→Business` as `Cascade` (slots have no independent value once the business is gone). *Known follow-up, not required now*: a real "delete my account" feature will eventually need a soft-delete/anonymization column (`deletedAt`) rather than a hard delete, given the new `Restrict` constraints — flagging so it's not silently forgotten, not building it now since no delete-account endpoint exists yet.

**Migration sequencing** (do not run as one giant diff):
1. **Migration 1** (purely additive, zero risk): `Payment` table, `lat`/`lng`, all `updatedAt` columns, new indexes, new enum *types* (unused yet).
2. **Migration 2** (`Slot.isAvailable`→`status`): generate with `prisma migrate dev --create-only` and hand-edit the SQL — this isn't a plain cast. Use `CASE WHEN is_available THEN 'available' ELSE 'occupied' END` to backfill, biasing existing `false` rows to `occupied` (the safe wrong answer if any ambiguity — a wrongly-`occupied` slot needs a one-time manual admin fix; a wrongly-`available` one risks a real double-booking).
3. **Migration 3** (enum cutover for `Booking.status`, `Business.status`, `User.role`): hand-verify the generated `ALTER COLUMN ... USING (column::text::"Enum")` SQL; schedule for a low-traffic window (brief table lock). Deploy in the same release as any app code doing raw string comparisons against these columns (confirmed present in `admin.controller.js` and `bookings.service.js`).
4. **Migration 4** (`Booking.status` default → `pending_payment`): only ship this in the **same release** as the Phase 3 payment-first flow — if deployed early, old code would create bookings stuck in `pending_payment` forever.

---

## Phase 2 — Booking Domain Correctness

**1. Centralize money math** — new `src/utils/pricing.utils.js`: `computeBookingPrice(pricePerHour, startTime, endTime)`, `toStripeCents(amount)`, `computeOverduePenalty(pricePerHour, endTime, now)` (extracted from the existing logic in `bookings.service.js`'s `terminateBookingTransaction`, lines ~160-166). One auditable place for every dollar figure in the app — used by booking creation, PaymentIntent amount, and the new auto-terminate scheduler, so the manual-terminate and auto-terminate paths can never compute penalty differently.

**2. Kill client-controlled pricing** — `bookings.controller.js` stops destructuring `totalPrice` from the body entirely. `bookings.service.js`'s booking-creation function (renamed `createBookingHold` per Phase 3) computes price server-side from `business.pricePerHour × duration` **inside the same transaction** as the slot lock (so it can't be bypassed by a race on `pricePerHour` changing mid-request). The Zod schema (Phase 4) additionally uses `.strict()` so any client-supplied `totalPrice` field is a hard 400, not silently dropped.

**3. Real time-range overlap booking** (per locked decision #4) — inside `createBookingHold`'s transaction, after the slot's `FOR UPDATE` lock, also lock and check any other bookings on the same `slotId` with `status IN ('pending_payment','booked','overdue')` whose interval overlaps the requested one (`existing.start < newEnd AND existing.end > newStart`), rejecting with 409 on conflict. `Slot.status` (`available/held/occupied/maintenance`) remains the cheap "is it physically occupied right now" signal for the live map/socket payload; the overlap check is the actual correctness guarantee for future-dated bookings. Performant via the new `@@index([slotId, status])`.

**4. Booking validation** (defense-in-depth in the service, not just the Zod layer): `endTime > startTime`; `startTime` not in the past (small clock-skew grace); duration within `MIN_BOOKING_DURATION_MINUTES` (default `30`) / `MAX_BOOKING_DURATION_MINUTES` (default `1440`, i.e. 24h) — both env vars, easy to retune.

**5. Fix the stuck-slot bug** — extend `src/services/bookingScheduler.js` with a second sweep (same 30s tick, one poller): `autoTerminateOverdueBookings()` — bookings `status='overdue'` for longer than `AUTO_TERMINATE_GRACE_MINUTES` (default `60`, env var) get force-completed using the shared `computeOverduePenalty` helper, and their slot is freed (`status='available'`). Today's `expireBookings` only ever marks `overdue` and never releases the slot — this closes that gap.

**6. De-duplicate realtime helpers** — `invalidateSlotsCache`/`emitSlotsUpdated` are currently copy-pasted verbatim across `bookings.service.js`, `slots.service.js`, and `bookingScheduler.js`. Extract to `src/utils/realtime.utils.js` while touching all three files anyway.

---

## Phase 3 — Real Payments (Stripe)

**1. New module** — `src/modules/payments/{payments.routes,controller,service}.js`, `src/config/stripe.js` (mirrors the existing `cloudinary.js`/`redis.js` config pattern). New dep: `stripe`. New env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`.

**2. Booking creation becomes hold creation** — `createBookingHold`: DB transaction (slot lock + overlap check + price calc + `Booking` row created as `pending_payment`, `Slot.status='held'`) commits first; **outside** the transaction (never hold a Postgres lock across a network call), create a Stripe PaymentIntent for the frozen price and a `Payment` row (`status='pending'`). Response includes `clientSecret` for the frontend to confirm payment — **this changes the `POST /api/bookings` response contract**, coordinate with whoever owns the frontend booking flow.

**3. Webhook + the raw-body gotcha** — `src/index.js` currently applies `bodyParser.json()` globally *before* routes are mounted. Stripe signature verification needs the raw, unparsed body. Fix: register `app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))` **before** the global `bodyParser.json()` call — middleware order in `index.js` is what matters, not where the route is declared. `payments.controller.js`'s webhook handler verifies `stripe-signature`, then handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`. **No auth middleware on this route** — the signature check is the auth.

**4. Idempotent confirmation** — Stripe redelivers webhooks on retry, so `confirmBookingPayment` must no-op if the booking is already past `pending_payment` or the payment already `succeeded` (checked inside a locked transaction). On success: `Payment.status='succeeded'`, `Booking.status='booked'`, `Slot.status='occupied'`.

**5. Hold-expiry scheduler** — third sweep on `bookingScheduler.js`'s existing tick: `pending_payment` bookings older than `HOLD_EXPIRY_MINUTES` (default `15`, env var) get their Stripe PaymentIntent cancelled first (avoids a race with a payment completing right at expiry), then `Booking.status='expired'`, `Slot.status='available'`.

**6. Refunds** (per locked decision #5 — full refund before `startTime`, none after): `refundBookingPayment(bookingId)` in `payments.service.js`, called from `cancelBookingTransaction` *after* the existing DB transaction commits (never call Stripe while holding the lock). Also fixes an existing gap: `cancelBookingTransaction` today only blocks re-cancelling an already-`cancelled` booking — it must also reject `completed`/`overdue`/`expired`. Cancelling an `overdue` booking is allowed but its refund is reduced by the accrued penalty (consistent with "no refund after start time," since overdue is by definition past start time — so in practice this path yields zero refund, matching the policy cleanly). An out-of-band Stripe Dashboard refund (`charge.refunded` webhook) also auto-cancels the booking and frees the slot, for consistency between in-app and dashboard-initiated refunds.

---

## Phase 4 — Input Validation Layer

**Zod** (over Joi — smaller, no glue library needed for a plain Express middleware). New `src/middlewares/validate.middleware.js` (generic `validate(schema, source)` factory). New schema files: `bookings.schemas.js` (`.strict()` — this is the concrete mechanism enforcing "no client `totalPrice`" from Phase 2), `business.schemas.js`, `slots.schemas.js`, and an auth schema covering the register role whitelist from Phase 0 formally (clearer audit trail than the silent-default alone). Wired into the corresponding routes files as a middleware step before the controller.

---

## Phase 5 — Admin Provisioning

**1. Bootstrap script** — new `scripts/create-admin.js`, a one-time CLI (`node scripts/create-admin.js --email=... --name=...`), the *only* way to create the very first admin account (unavoidable chicken-and-egg — nothing can be HTTP-gated by "is there an admin yet" safely). Documented in a new `docs/OPERATIONS.md`.

**2. HTTP admin-invite endpoint** — new `POST /api/admin/users` in `admin.routes.js`, gated by the existing `router.use(authMiddleware, roleMiddleware(['admin']))` blanket protection already on that router. Accepts `{ name, email, password, role }` where `role` may legitimately be `admin`/`business`/`customer` (this is the one legitimate caller of the service-layer `createUser` with `role='admin'` from Phase 0's whitelist design) — the calling admin sets/communicates the password out-of-band since there's no email infra in this stack. A "must change password on first login" flow is a reasonable fast-follow, not required to ship this.

---

## Phase 6 — Ops & Deployment Readiness

- **Dockerfile** (new, multi-stage: `deps` → `builder` (runs `prisma generate`) → `runner`), `.dockerignore` (new). `docker-compose.yml` gains an `api` service alongside the existing `db`/`redis`, using `env_file: .env`.
- **`.env.example`** rewritten with every var introduced across all phases, grouped by concern (server, DB, auth, Redis, CORS, Cloudinary, Stripe, booking-policy env vars).
- **Real secrets before launch**: `.env`'s placeholder `JWT_SECRET`/`REFRESH_TOKEN_SECRET` must be regenerated (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`, run twice, values must differ) — an operational step, documented in `docs/OPERATIONS.md`, not a code change.
- **Testing**: Jest + Supertest (plain CommonJS Node app — no reason to prefer Vitest here since there's no shared Vite pipeline with the frontend). Priority order: (1) register-role-escalation regression test, (2) bookings-by-business ownership regression test, (3) an integration test against a real test Postgres verifying the `FOR UPDATE` locking genuinely prevents concurrent double-booking (`Promise.all` of two simultaneous booking attempts on one slot — the single highest-value test in the suite, currently completely uncovered), (4) the server-side price-recalculation fix. `package.json` test script becomes `jest --runInBand`.
- **CI**: new `.github/workflows/ci.yml` — Postgres + Redis service containers, `npm ci` → `prisma migrate deploy` → `npm run lint` → `npm test` on every PR to main.
- **Lint/format**: `.eslintrc.json`, `.prettierrc` (new), matching the code style already visible in the codebase.

---

## Summary of New Files
`scripts/create-admin.js` · `src/middlewares/{rateLimit,validate}.middleware.js` · `src/services/sessionCleanupScheduler.js` · `src/utils/{pricing,realtime}.utils.js` · `src/modules/payments/*` · `src/config/stripe.js` · `src/modules/{bookings,business,slots}/*.schemas.js` · `Dockerfile`, `.dockerignore` · `jest.config.js`, `tests/**` · `.eslintrc.json`, `.prettierrc` · `.github/workflows/ci.yml` · `docs/OPERATIONS.md`

## Verification Plan
1. **Phase 0** ships independently: manually verify `POST /api/auth/register {"role":"admin"}` now creates a `customer`; verify a business-role JWT can no longer fetch another business's bookings (403); run existing manual smoke tests against login/refresh/logout with rotation in place.
2. **Phase 1** migrations: run each migration against a copy of a realistic dataset locally, inspect row counts/values before and after each step, confirm the app still boots and existing reads work between migrations (the sequencing is designed so each step is independently safe to deploy).
3. **Phase 2**: write the concurrency test *first* (two simultaneous booking requests on one slot, assert exactly one 201 and one 409/400) before touching the transaction code, per standard TDD — this is the one test that actually exercises the DB-level guarantee. Manually test overlap booking (two non-overlapping future bookings on one slot both succeed; two overlapping ones conflict).
4. **Phase 3**: use Stripe's test-mode keys and CLI (`stripe listen --forward-to localhost:5000/api/payments/webhook`) to drive the full hold → pay → webhook → `booked` flow locally, plus a forced-expiry test (create a hold, wait past `HOLD_EXPIRY_MINUTES`, confirm slot releases and PaymentIntent is cancelled) and a refund test.
5. **Phase 6**: `docker compose up` brings up db+redis+api cleanly from a fresh clone with only `.env` filled in; CI pipeline green on a throwaway PR before merging to main.

## Progress Log
- [x] Phase 0 — Critical Security Fixes
- [x] Phase 1 — Schema Overhaul
- [x] Phase 2 — Booking Domain Correctness
- [x] Phase 3 — Real Payments (Stripe)
- [x] Phase 4 — Input Validation Layer
- [x] Phase 5 — Admin Provisioning
- [x] Phase 6 — Ops & Deployment Readiness

### Session notes (2026-08-07)

All six phases implemented and smoke-tested end-to-end against the real dev
Postgres/Redis instances (server boots, migrations applied, `npm test`
green — 13/13 tests across role-escalation, ownership-leak, concurrency
double-booking, and pricing regressions).

**Structural decisions made along the way (not explicitly spelled out above,
recorded here so a future session doesn't re-litigate them):**
- Split `src/index.js` into `src/app.js` (pure Express app/routes, no side
  effects) + `src/index.js` (bootstrap: DB/Redis connect, schedulers,
  `server.listen`). Needed so Supertest can import the app without starting
  real schedulers/sockets. `src/app.js` is now the thing tests import.
- `bookings.service.js`'s `createBookingTransaction` was renamed
  `createBookingHold` per the Phase 3 spec; controller/route call sites
  updated. The booking-creation response contract changed to
  `{ booking, clientSecret }` — **the frontend booking flow needs updating
  to match** (it currently expects the old immediate-`booked` response).
- `Slot.status` only flips to `held` for bookings starting within 5 minutes
  of "now" (`IMMEDIATE_BOOKING_WINDOW_MS` in `bookings.service.js`). A
  future-dated booking's slot transition at its own start time isn't
  automated — flagged in `docs/OPERATIONS.md` as a known follow-up. The
  overlap check on `Booking.status` is the real correctness guarantee in
  the meantime, per the original design note.
- `.env` was updated with real dev values for the new env vars (`CORS_ORIGINS`,
  `HOLD_EXPIRY_MINUTES`, etc.) but `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`
  are still placeholders — **payments will not work until real Stripe
  test-mode keys are filled in** (verified: PaymentIntent creation fails
  cleanly with an auth error against the placeholder key; the booking row is
  left `pending_payment` and gets cleaned up by the hold-expiry scheduler,
  so this fails safe).
- Jest tests hit the real dev Postgres directly (no separate test DB was
  provisioned) and clean up their own fixtures in `afterAll`. CI (`ci.yml`)
  uses a throwaway `parking_test` Postgres service container instead.
- Found and fixed a bug during test-writing: Migration 1 added
  `slots.updated_at` but forgot `slots.created_at`, which the schema also
  declares — fixed in migration `20260807010105_slots_created_at`.

**Not done / explicitly out of scope this session:**
- Real Stripe keys, real regenerated `JWT_SECRET`/`REFRESH_TOKEN_SECRET` for
  any non-local environment — operational steps documented in
  `docs/OPERATIONS.md`, not code.
- Frontend changes to consume the new `clientSecret` booking response or
  Stripe Elements/Payment Element integration on the client side.
- The "delete my account" soft-delete follow-up (flagged, not requested).

### Session notes (2026-08-08)

Stripe is unavailable in India, so the entire payment gateway was replaced
with **Razorpay** end-to-end, per
`docs/superpowers/specs/2026-08-08-razorpay-migration-and-visual-overhaul-design.md`
and its accompanying plan
(`docs/superpowers/plans/2026-08-08-razorpay-backend-migration.md`). All 10
plan tasks completed; full backend test suite green (5 suites, 18 tests).

**What changed:**
- `Payment` model: `providerPaymentIntentId`/`providerChargeId` renamed to
  `providerOrderId`/`providerPaymentId` (Razorpay Order/Payment ids);
  `PaymentProvider.stripe` renamed to `razorpay`; new `Payment.purpose`
  column (`booking_hold` | `overstay_penalty`) lets one booking have two
  independent payments over its lifetime. Two migrations
  (`20260808010101_add_penalty_payment_status`,
  `20260808010102_stripe_to_razorpay`) - split apart because `ALTER TYPE
  ... ADD VALUE` can't safely share a transaction with anything using the
  new value.
- **The overstay-penalty checkout is now a real second Razorpay payment**
  (per locked product decision), closing what was previously a 100% fake
  `setTimeout` on the frontend with no backend endpoint at all. A new
  `pending_penalty_payment` booking status holds a checked-out booking
  until that payment resolves; on-time checkouts (no penalty) still go
  straight to `completed` with no payment step. New scheduler sweep
  (`expirePenaltyHolds`, `PENALTY_PAYMENT_GRACE_MINUTES` env var, default
  30) auto-resolves an abandoned penalty payment to `completed` anyway -
  the slot is already free by then, so there's nothing left to protect.
- New endpoints: `POST /api/payments/verify` (frontend's fast-path
  confirmation after Razorpay Checkout succeeds, HMAC-verified plus an
  ownership check) and `GET /api/payments/config` (returns the public
  `keyId` for resuming a payment without a fresh order-creation response).
  The webhook stays at `POST /api/payments/webhook`, now verifying
  `x-razorpay-signature` and handling `payment.captured`/`payment.failed`/
  `refund.processed`.
- `POST /api/bookings` response contract changed again:
  `{ booking, clientSecret }` → `{ booking, order }` where `order = {
  orderId, amount, currency, keyId }`. `PUT /api/bookings/:id/terminate`
  now returns `{ booking, order }` too (`order` is `null` when there's no
  penalty).
- `GET /api/bookings/my` now includes each booking's latest *pending*
  `Payment` (`providerOrderId`, `amount`, `purpose`), so the frontend can
  offer a "complete payment" action on an abandoned `pending_payment` or
  `pending_penalty_payment` booking without a dedicated resume endpoint.

**Two latent bugs found and fixed while smoke-testing the new flow (not
Razorpay-specific - both were pre-existing, just never exercised until
now):**
- `bookings.controller.js`'s `createBooking` catch block crashed with a
  secondary `TypeError` on any thrown error without a `.message` string
  (third-party SDK errors, including Razorpay's, don't always set one).
  Fixed by defaulting to an empty string before the `.includes()` checks.
- `error.middleware.js` treated *any* error with a numeric `.statusCode`
  as an application-marked "safe to expose" error - but nothing in this
  codebase actually sets `.statusCode` on purpose (controllers match
  specific error messages by string instead), while the Razorpay SDK's
  own errors *do* carry a numeric `.statusCode` mirroring the upstream
  HTTP status. That let an upstream auth failure leak its raw status code
  (and a missing message) straight to the client instead of a generic
  500. Fixed by requiring both `err.statusCode` **and** a new
  `err.isOperational === true` flag before trusting `err.message` -
  closes the leak for every future third-party integration, not just this
  one, since nothing currently sets either flag.

**Verified fails-safe against the placeholder Razorpay key** (same posture
as the Stripe keys before): booking-hold creation commits the DB
transaction and only then calls Razorpay; when that call fails (invalid
placeholder credentials), the booking row survives as `pending_payment`
and the client gets a clean generic 500 - no crash, no leaked internals,
picked up by the existing hold-expiry scheduler sweep exactly as before.

**Not done / explicitly out of scope this session:**
- Real Razorpay keys (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/
  `RAZORPAY_WEBHOOK_SECRET` are still placeholders) - same fails-safe
  posture as the Stripe keys were, documented in `docs/OPERATIONS.md`.
- Frontend sync to the new `{ booking, order }` contract and a real
  Razorpay Checkout.js integration - next plan in the sequence.
- The sitewide "Midnight Garage" visual overhaul - third plan in the
  sequence, after frontend sync.
- A collections/follow-up flow for penalties left unpaid past
  `PENALTY_PAYMENT_GRACE_MINUTES` (flagged, not built).
