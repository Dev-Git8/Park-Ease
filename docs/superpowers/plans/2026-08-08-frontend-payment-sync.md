# Frontend Payment Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the frontend's booking/payment/checkout flow in sync with the backend's Razorpay contracts (from the just-completed backend migration plan) — real Razorpay Checkout.js integration for booking creation, a real overstay-penalty payment, and correct handling of every booking/slot status the backend now emits.

**Architecture:** A single shared payment hook (`usePayment`) wraps Razorpay's Checkout.js modal + the `/payments/verify` call, reused by all three payment call sites (new booking, resumed booking payment, overstay penalty). Razorpay's hosted modal replaces the need for any custom card-entry UI. This pass keeps the *current* navy/ink visual language everywhere — the "Midnight Garage" visual overhaul is a separate, later plan, and there's no point restyling markup this plan is about to touch functionally.

**Tech Stack:** React 19, react-router-dom 7, framer-motion, axios. Razorpay's Checkout.js is loaded via a plain `<script>` tag at runtime — no npm package needed on the frontend (the `razorpay` npm SDK from the backend plan is server-side only).

## Global Constraints

- `POST /api/bookings` response: `{ booking, order }` where `order = { orderId, amount, currency, keyId }`.
- `PUT /api/bookings/:id/terminate` response: `{ booking, order }` — `order` is `null` when there's no penalty owed.
- Slot objects use `status: 'available' | 'held' | 'occupied' | 'maintenance'` — **not** `isAvailable` (a pre-existing sync gap, not something the backend plan introduced).
- `GET /api/bookings/my` rows include `payments: [{ providerOrderId, amount, purpose }]` — 0 or 1 items, the latest still-pending payment (if any) for that booking.
- `GET /api/payments/config` returns `{ keyId }` — used to reconstruct an order client-side when resuming a payment without a fresh order-creation response.
- Razorpay's checkout modal `theme.color` stays the current navy (`#2563c9`) in this plan — the visual-overhaul plan will change this one line to the new accent color later.
- No new npm dependencies for the frontend.

---

### Task 1: Backend — include business/slot on the terminate response

**Files:**
- Modify: `Backend/src/modules/bookings/bookings.service.js`

**Interfaces:**
- Produces: `terminateBookingTransaction`'s returned `booking` now includes `business: { name }` and `slot: { slotNumber }`, matching the shape `getBookingsByUser` already returns elsewhere in the app.

This is a one-line addition, not a new backend plan — without it, the checkout receipt screen has no business name to show for a *freshly* terminated booking (it already has it when reached via Profile's "Pay penalty" resume path, since that booking came from the already-enriched `getBookingsByUser` query).

- [ ] **Step 1: Add the include**

In `Backend/src/modules/bookings/bookings.service.js`, inside `terminateBookingTransaction`, replace:

```js
        const updatedBooking = await tx.booking.update({
            where: { id: parseInt(bookingId) },
            data: {
                status: penalty > 0 ? 'pending_penalty_payment' : 'completed',
                actualEndTime: now,
                penaltyAmount: penalty,
            },
        });
```

with:

```js
        const updatedBooking = await tx.booking.update({
            where: { id: parseInt(bookingId) },
            data: {
                status: penalty > 0 ? 'pending_penalty_payment' : 'completed',
                actualEndTime: now,
                penaltyAmount: penalty,
            },
            include: {
                business: { select: { name: true } },
                slot: { select: { slotNumber: true } },
            },
        });
```

- [ ] **Step 2: Verify the existing booking tests still pass**

Run: `cd Backend && npx jest tests/bookings.ownership.test.js tests/bookings.concurrency.test.js`
Expected: PASS (this change only adds fields to a response shape; it doesn't touch the ownership or concurrency logic those tests cover).

- [ ] **Step 3: Commit**

```bash
git add src/modules/bookings/bookings.service.js
git commit -m "feat: include business name and slot number on the terminate response"
```

---

### Task 2: Razorpay Checkout.js loader

**Files:**
- Create: `frontend/src/utils/razorpay.js`

**Interfaces:**
- Produces: `openRazorpayCheckout({ order, description, prefill, theme }): Promise<{orderId, paymentId, signature}>` — rejects if the script fails to load or the user dismisses the modal. `order` is the `{orderId, amount, currency, keyId}` shape from the backend.

- [ ] **Step 1: Create the file**

Create `frontend/src/utils/razorpay.js`:

```js
let scriptPromise = null;

const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error('Failed to load the Razorpay checkout script'));
        };
        document.body.appendChild(script);
    });

    return scriptPromise;
};

// Opens Razorpay's own hosted payment modal - there is no custom card form
// to build or maintain here. Resolves with the three values Razorpay hands
// back on success, which the caller must send to POST /payments/verify.
export const openRazorpayCheckout = async ({ order, description, prefill, theme }) => {
    await loadRazorpayScript();

    return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: 'ParkEase',
            description,
            prefill,
            theme,
            handler: (response) => {
                resolve({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                });
            },
            modal: {
                ondismiss: () => reject(new Error('Payment cancelled')),
            },
        });
        rzp.open();
    });
};
```

- [ ] **Step 2: Sanity-check it parses**

Run: `cd frontend && npx eslint src/utils/razorpay.js`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/razorpay.js
git commit -m "feat: add Razorpay Checkout.js loader utility"
```

---

### Task 3: Shared `usePayment` hook

**Files:**
- Create: `frontend/src/hooks/usePayment.js`

**Interfaces:**
- Consumes: `openRazorpayCheckout` from Task 2; the app's `api` client (`frontend/src/api/api.js`).
- Produces: `usePayment(): { pay(order, {description, prefill}): Promise<boolean>, isProcessing: boolean, error: string, setError: (s: string) => void }` — `pay` resolves `true` on a verified payment, `false` on failure/cancellation (with `error` set), and never throws. Consumed by Tasks 4, 6, and 7.

- [ ] **Step 1: Create the file**

Create `frontend/src/hooks/usePayment.js`:

```js
import { useState } from 'react';
import api from '../api/api';
import { openRazorpayCheckout } from '../utils/razorpay';

// Shared by every payment call site (new booking, resuming an abandoned
// booking payment, paying an overstay penalty) so the checkout-then-verify
// sequence and its error handling only exist in one place.
const usePayment = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const pay = async (order, { description, prefill } = {}) => {
        setError('');
        setIsProcessing(true);
        try {
            const { orderId, paymentId, signature } = await openRazorpayCheckout({
                order,
                description,
                prefill,
                theme: { color: '#2563c9' },
            });

            await api.post('/payments/verify', { orderId, paymentId, signature });
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Payment failed');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    return { pay, isProcessing, error, setError };
};

export default usePayment;
```

- [ ] **Step 2: Sanity-check it parses**

Run: `npx eslint src/hooks/usePayment.js` (from `frontend/`)
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePayment.js
git commit -m "feat: add shared usePayment hook wrapping Razorpay checkout + verify"
```

---

### Task 4: `BusinessDetails.jsx` — real booking creation + payment

**Files:**
- Modify: `frontend/src/pages/Home/BusinessDetails.jsx`

**Interfaces:**
- Consumes: `usePayment` from Task 3; `useAuth` from `frontend/src/context/AuthContext.jsx` (for `user.name`/`user.email` prefill).
- Produces: on successful payment, navigates to `/booking-success` with `{ booking }` in route state (consumed by Task 5).

- [ ] **Step 1: Fix the slot-availability field**

Replace:

```js
            setSelectedSlot(prev => {
                const refreshed = slotsRes.data.data.find(s => s.id === prev?.id);
                return refreshed?.isAvailable ? refreshed : null;
            });
```

with:

```js
            setSelectedSlot(prev => {
                const refreshed = slotsRes.data.data.find(s => s.id === prev?.id);
                return refreshed?.status === 'available' ? refreshed : null;
            });
```

Replace the slot grid's `disabled={!slot.isAvailable}` and the ternaries built on it:

```js
                                {slots.map((slot) => (
                                    <button
                                        key={slot.id}
                                        disabled={!slot.isAvailable}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
                                            slot.isAvailable
                                                ? selectedSlot?.id === slot.id
                                                    ? 'bg-navy text-white'
                                                    : 'border border-hairline bg-surface text-ink-soft hover:border-navy'
                                                : 'cursor-not-allowed bg-ghost/40 text-ink-soft/50'
                                        }`}
                                    >
                                        <Car size={22} aria-hidden="true" />
                                        <span className="font-outfit text-sm font-medium uppercase">{slot.slotNumber}</span>
                                        {!slot.isAvailable && <XCircle size={12} className="absolute right-2 top-2" aria-hidden="true" />}
                                    </button>
                                ))}
```

with:

```js
                                {slots.map((slot) => {
                                    const isAvailable = slot.status === 'available';
                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl transition-colors ${
                                                isAvailable
                                                    ? selectedSlot?.id === slot.id
                                                        ? 'bg-navy text-white'
                                                        : 'border border-hairline bg-surface text-ink-soft hover:border-navy'
                                                    : 'cursor-not-allowed bg-ghost/40 text-ink-soft/50'
                                            }`}
                                        >
                                            <Car size={22} aria-hidden="true" />
                                            <span className="font-outfit text-sm font-medium uppercase">{slot.slotNumber}</span>
                                            {!isAvailable && <XCircle size={12} className="absolute right-2 top-2" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
```

- [ ] **Step 2: Add the imports**

Replace:

```js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useSocket } from '../../context/SocketContext';
import { MapPin, Clock, ShieldCheck, Car, ArrowLeft, CheckCircle2, Info, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
```

with:

```js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import usePayment from '../../hooks/usePayment';
import { MapPin, Clock, ShieldCheck, Car, ArrowLeft, CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
```

- [ ] **Step 3: Add payment state and rewrite `handleBooking`**

Replace:

```js
    const [duration, setDuration] = useState(60);
    const [arrivalTime, setArrivalTime] = useState('');
```

with:

```js
    const [duration, setDuration] = useState(60);
    const [arrivalTime, setArrivalTime] = useState('');
    const [pendingPayment, setPendingPayment] = useState(null); // { booking, order } while awaiting payment
    const { user } = useAuth();
    const { pay, isProcessing, error: paymentError } = usePayment();
```

Replace the entire `handleBooking` function:

```js
    const handleBooking = async () => {
        if (!selectedSlot || !arrivalTime) return alert('Please choose an arrival time and a slot.');
        setBookingLoading(true);
        try {
            const startStr = new Date(arrivalTime);
            const startTime = startStr.toISOString();

            const endStr = new Date(startStr);
            endStr.setMinutes(endStr.getMinutes() + parseInt(duration));
            const endTime = endStr.toISOString();

            const totalPrice = (business.pricePerHour / 60) * parseInt(duration);

            await api.post('/bookings', {
                businessId: business.id,
                slotId: selectedSlot.id,
                startTime,
                endTime,
                totalPrice: parseFloat(totalPrice.toFixed(2))
            });
            navigate('/profile');
        } catch (error) {
            alert(error.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };
```

with:

```js
    const attemptPayment = async (booking, order) => {
        const ok = await pay(order, {
            description: `Parking at ${business.name}`,
            prefill: { name: user?.name, email: user?.email },
        });

        if (ok) {
            setPendingPayment(null);
            navigate('/booking-success', {
                state: { booking: { ...booking, business: { name: business.name }, slot: { slotNumber: selectedSlot?.slotNumber } } },
            });
        } else {
            setPendingPayment({ booking, order });
        }
    };

    const handleBooking = async () => {
        if (!selectedSlot || !arrivalTime) return alert('Please choose an arrival time and a slot.');
        setBookingLoading(true);
        try {
            const startStr = new Date(arrivalTime);
            const startTime = startStr.toISOString();

            const endStr = new Date(startStr);
            endStr.setMinutes(endStr.getMinutes() + parseInt(duration));
            const endTime = endStr.toISOString();

            const { data } = await api.post('/bookings', {
                businessId: business.id,
                slotId: selectedSlot.id,
                startTime,
                endTime,
            });

            setBookingLoading(false);
            await attemptPayment(data.data.booking, data.data.order);
        } catch (error) {
            setBookingLoading(false);
            alert(error.response?.data?.message || 'Booking failed');
        }
    };

    const handleRetryPayment = () => {
        if (!pendingPayment) return;
        attemptPayment(pendingPayment.booking, pendingPayment.order);
    };
```

- [ ] **Step 4: Show the payment error / retry state and update the CTA button**

Replace:

```js
                                <Button
                                    onClick={handleBooking}
                                    disabled={!selectedSlot || bookingLoading}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    {bookingLoading ? (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                                    ) : (
                                        <>
                                            Confirm booking
                                            <CheckCircle2 size={18} className="ml-3" aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </div>
```

with:

```js
                                {paymentError && (
                                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden="true" />
                                        <p className="text-xs text-red-200">{paymentError}</p>
                                    </div>
                                )}

                                <Button
                                    onClick={pendingPayment ? handleRetryPayment : handleBooking}
                                    disabled={!selectedSlot || bookingLoading || isProcessing}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    {bookingLoading || isProcessing ? (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                                    ) : pendingPayment ? (
                                        <>
                                            Retry payment
                                            <CheckCircle2 size={18} className="ml-3" aria-hidden="true" />
                                        </>
                                    ) : (
                                        <>
                                            Confirm booking
                                            <CheckCircle2 size={18} className="ml-3" aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </div>
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home/BusinessDetails.jsx
git commit -m "feat: wire real Razorpay booking payment into BusinessDetails"
```

---

### Task 5: `BookingSuccess.jsx` — wire real booking data

**Files:**
- Modify: `frontend/src/pages/BookingSuccess/BookingSuccess.jsx`

**Interfaces:**
- Consumes: `{ booking }` route state from Task 4 (booking may have `business.name`, `slot.slotNumber`, `startTime`, `endTime`).

- [ ] **Step 1: Read the route state and personalize**

Replace:

```js
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

const BookingSuccess = () => {
    return (
```

with:

```js
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';

const BookingSuccess = () => {
    const { state } = useLocation();
    const booking = state?.booking;

    return (
```

Replace:

```js
                        <div className="rounded-card border border-hairline bg-surface p-6">
                            <p className="text-sm text-ink-soft">
                                Your spot is reserved and ready. You can review the details any time from your account.
                            </p>
                        </div>
```

with:

```js
                        <div className="rounded-card border border-hairline bg-surface p-6">
                            {booking ? (
                                <div className="space-y-1">
                                    <p className="text-sm text-ink-soft">
                                        Booking #{booking.id}{booking.business?.name ? ` · ${booking.business.name}` : ''}
                                        {booking.slot?.slotNumber ? ` · Slot ${booking.slot.slotNumber}` : ''}
                                    </p>
                                    <p className="text-sm text-ink-soft">
                                        {new Date(booking.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        {' – '}
                                        {new Date(booking.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-ink-soft">
                                    Your spot is reserved and ready. You can review the details any time from your account.
                                </p>
                            )}
                        </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/BookingSuccess/BookingSuccess.jsx
git commit -m "feat: show real booking details on the booking-success page"
```

---

### Task 6: `Profile.jsx` — resume payments, new statuses

**Files:**
- Modify: `frontend/src/pages/Profile/Profile.jsx`

**Interfaces:**
- Consumes: `usePayment` from Task 3; each booking's `payments[0]` (`{providerOrderId, amount, purpose}`) from the backend's enriched `GET /bookings/my`; `GET /payments/config` for `keyId`.

- [ ] **Step 1: Add imports and payment state**

Replace:

```js
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, Car, Trash2, LogOut, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
```

with:

```js
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import usePayment from '../../hooks/usePayment';
import { Calendar, MapPin, Car, Trash2, LogOut, CheckCircle2, CreditCard, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { pay, isProcessing } = usePayment();
```

- [ ] **Step 2: Update `handleCheckout` and add the two resume handlers**

Replace:

```js
    const handleCheckout = async (bookingId) => {
        try {
            const { data } = await api.put(`/bookings/${bookingId}/terminate`);
            navigate('/checkout-summary', { state: { booking: data.data } });
        } catch (error) {
            console.error('Termination failed', error);
            alert(error.response?.data?.message || 'Checkout failed');
        }
    };
```

with:

```js
    const handleCheckout = async (bookingId) => {
        try {
            const { data } = await api.put(`/bookings/${bookingId}/terminate`);
            navigate('/checkout-summary', { state: { booking: data.data.booking, order: data.data.order } });
        } catch (error) {
            console.error('Termination failed', error);
            alert(error.response?.data?.message || 'Checkout failed');
        }
    };

    const buildResumeOrder = (payment, keyId) => ({
        orderId: payment.providerOrderId,
        amount: Math.round(parseFloat(payment.amount) * 100),
        currency: 'INR',
        keyId,
    });

    // Resumes an abandoned initial booking payment - pays inline, right
    // here on Profile, since there's nothing else to show beyond "pay to
    // confirm this booking".
    const handleResumeBookingPayment = async (booking) => {
        const payment = booking.payments?.[0];
        if (!payment) return;
        try {
            const { data } = await api.get('/payments/config');
            const order = buildResumeOrder(payment, data.data.keyId);
            const ok = await pay(order, {
                description: `Parking at ${booking.business?.name || 'ParkEase'}`,
                prefill: { name: user?.name, email: user?.email },
            });
            if (ok) {
                setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'booked' } : b));
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Could not resume payment');
        }
    };

    // Resumes an abandoned overstay-penalty payment - routes through the
    // checkout-summary receipt screen, same as a fresh checkout would.
    const handleResumePenaltyPayment = async (booking) => {
        const payment = booking.payments?.[0];
        try {
            const { data } = await api.get('/payments/config');
            const order = payment ? buildResumeOrder(payment, data.data.keyId) : null;
            navigate('/checkout-summary', { state: { booking, order } });
        } catch (error) {
            alert(error.response?.data?.message || 'Could not resume payment');
        }
    };
```

- [ ] **Step 3: Handle the new booking statuses in `getStatusBadge`**

Replace:

```js
    const getStatusBadge = (status) => {
        switch (status) {
            case 'booked': return <Badge variant="success">Active booking</Badge>;
            case 'overdue': return <Badge variant="danger" className="animate-pulse">Overstay</Badge>;
            case 'completed': return <Badge variant="success">Completed</Badge>;
            case 'cancelled': return <Badge variant="slate">Cancelled</Badge>;
            default: return <Badge variant="slate">{status}</Badge>;
        }
    };
```

with:

```js
    const getStatusBadge = (status) => {
        switch (status) {
            case 'booked': return <Badge variant="success">Active booking</Badge>;
            case 'overdue': return <Badge variant="danger" className="animate-pulse">Overstay</Badge>;
            case 'completed': return <Badge variant="success">Completed</Badge>;
            case 'cancelled': return <Badge variant="slate">Cancelled</Badge>;
            case 'pending_payment': return <Badge variant="warning" className="animate-pulse">Awaiting payment</Badge>;
            case 'pending_penalty_payment': return <Badge variant="danger" className="animate-pulse">Payment due</Badge>;
            case 'expired': return <Badge variant="slate">Payment expired</Badge>;
            default: return <Badge variant="slate">{status}</Badge>;
        }
    };
```

- [ ] **Step 4: Add the resume-payment action buttons**

Replace:

```js
                                            {(booking.status === 'booked' || booking.status === 'overdue') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCheckout(booking.id)}
                                                        className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep"
                                                    >
                                                        <LogOut size={14} aria-hidden="true" /> Check out
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        className="rounded-pill bg-surface p-2 text-ink-soft hover:bg-red-500 hover:text-white"
                                                        aria-label="Cancel booking"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                            {booking.status === 'completed' && (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} aria-hidden="true" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Settled</span>
                                                </div>
                                            )}
```

with:

```js
                                            {(booking.status === 'booked' || booking.status === 'overdue') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCheckout(booking.id)}
                                                        className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep"
                                                    >
                                                        <LogOut size={14} aria-hidden="true" /> Check out
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        className="rounded-pill bg-surface p-2 text-ink-soft hover:bg-red-500 hover:text-white"
                                                        aria-label="Cancel booking"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                            {booking.status === 'pending_payment' && (
                                                <button
                                                    onClick={() => handleResumeBookingPayment(booking)}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-2 rounded-pill bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-navy-deep disabled:opacity-50"
                                                >
                                                    <CreditCard size={14} aria-hidden="true" /> Complete payment
                                                </button>
                                            )}
                                            {booking.status === 'pending_penalty_payment' && (
                                                <button
                                                    onClick={() => handleResumePenaltyPayment(booking)}
                                                    className="flex items-center gap-2 rounded-pill bg-red-500 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white hover:bg-red-600"
                                                >
                                                    <AlertCircle size={14} aria-hidden="true" /> Pay penalty
                                                </button>
                                            )}
                                            {booking.status === 'completed' && (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} aria-hidden="true" />
                                                    <span className="text-xs font-medium uppercase tracking-wide">Settled</span>
                                                </div>
                                            )}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Profile/Profile.jsx
git commit -m "feat: resume abandoned Razorpay payments from Profile, handle new booking statuses"
```

---

### Task 7: `CheckoutSummary.jsx` — real overstay-penalty payment

**Files:**
- Modify: `frontend/src/pages/CheckoutSummary.jsx`

**Interfaces:**
- Consumes: `{ booking, order }` route state (from Task 6's `handleCheckout`/`handleResumePenaltyPayment`); `usePayment` from Task 3.

- [ ] **Step 1: Replace the whole file**

Replace the full contents of `frontend/src/pages/CheckoutSummary.jsx` with:

```jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, AlertTriangle, CheckCircle, ArrowRight, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import usePayment from '../hooks/usePayment';

const CheckoutSummary = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { pay, isProcessing, error: paymentError } = usePayment();
    const { booking, order } = location.state || {};
    const [settled, setSettled] = useState(!order);

    if (!booking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface">
                <div className="text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" aria-hidden="true" />
                    <h2 className="font-outfit text-2xl font-medium text-ink">No booking data found</h2>
                    <Button onClick={() => navigate('/profile')} className="mt-6">Return to profile</Button>
                </div>
            </div>
        );
    }

    const {
        id,
        startTime,
        endTime,
        actualEndTime,
        totalPrice,
        penaltyAmount,
        business
    } = booking;

    const basePrice = parseFloat(totalPrice);
    const penalty = parseFloat(penaltyAmount || 0);
    const finalTotal = basePrice + penalty;

    const scheduledEnd = new Date(endTime);
    const actualEnd = new Date(actualEndTime || new Date());
    const isOverdue = actualEnd > scheduledEnd;

    const handlePay = async () => {
        const ok = await pay(order, {
            description: `Overstay penalty at ${business?.name || 'ParkEase'}`,
            prefill: { name: user?.name, email: user?.email },
        });
        if (ok) setSettled(true);
    };

    return (
        <div className="min-h-screen bg-surface px-6 py-20">
            <div className="mx-auto max-w-3xl">
                <AnimatePresence mode="wait">
                    {!settled ? (
                        <motion.div
                            key="billing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="overflow-hidden rounded-card-lg border border-hairline bg-white"
                        >
                            <div className="relative bg-navy-deep p-8 text-white">
                                <Receipt className="absolute right-8 top-8 h-16 w-16 text-white/10" aria-hidden="true" />
                                <Badge variant="navy" className="mb-4">Parking receipt</Badge>
                                <h1 className="font-outfit text-3xl font-medium tracking-tight sm:text-4xl">Booking summary</h1>
                                <p className="mt-2 text-sm text-white/60">Booking #{id} · {business?.name}</p>
                            </div>

                            <div className="space-y-10 p-8 sm:p-12">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Entry time</p>
                                            <p className="mt-1 font-outfit text-lg text-ink">
                                                {new Date(startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Scheduled exit</p>
                                            <p className="mt-1 font-outfit text-lg text-ink">
                                                {new Date(endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Actual exit</p>
                                            <p className="mt-1 font-outfit text-lg text-emerald-600">
                                                {new Date(actualEndTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        {isOverdue && (
                                            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                                                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                                                <div>
                                                    <p className="text-sm font-medium text-red-600">Overstay detected</p>
                                                    <p className="text-xs text-red-500/80">A penalty has been applied to this booking.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-dashed border-hairline pt-8">
                                    <div className="flex items-center justify-between text-sm text-ink-soft">
                                        <span>Base parking fee</span>
                                        <span className="font-outfit text-lg text-ink">${basePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-red-500">Overstay penalty</span>
                                        <span className="font-outfit text-lg text-red-500">${penalty.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-6 flex items-end justify-between rounded-card bg-surface p-6">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-ink-soft">Total due</p>
                                            <p className="font-outfit text-3xl text-ink">${finalTotal.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {paymentError && (
                                        <p className="mb-4 text-center text-sm text-red-500">{paymentError}</p>
                                    )}
                                    <Button className="w-full" size="lg" onClick={handlePay} disabled={isProcessing || !order}>
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-3">
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                Processing payment…
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Pay penalty <ArrowRight size={18} aria-hidden="true" />
                                            </span>
                                        )}
                                    </Button>
                                    <p className="mt-4 text-center text-xs text-ink-soft">Secure transaction managed by Razorpay</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-card-lg border border-hairline bg-white p-16 text-center"
                        >
                            <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-card bg-emerald-500">
                                <CheckCircle size={40} className="text-white" aria-hidden="true" />
                            </div>
                            <Badge variant="success" className="mb-6">{order ? 'Payment received' : 'Nothing owed'}</Badge>
                            <h2 className="font-outfit text-4xl font-medium tracking-tight text-ink">Thank you</h2>
                            <p className="mx-auto mt-4 max-w-sm text-sm text-ink-soft">
                                {order
                                    ? 'Your overstay penalty has been paid. The parking spot has been released for the next driver.'
                                    : "You're all settled - no charges were owed for this booking."}
                            </p>

                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Button variant="secondary" onClick={() => navigate('/')} className="w-full sm:w-auto">
                                    <Home className="mr-2" size={18} aria-hidden="true" /> Back to home
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CheckoutSummary;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/CheckoutSummary.jsx
git commit -m "feat: make the overstay-penalty checkout screen a real Razorpay payment"
```

---

### Task 8: End-to-end manual verification

**Files:** None — verification only.

**Note on scope:** none of the touched pages (`BusinessDetails`, `Profile`, `CheckoutSummary`, `BookingSuccess`) had any existing automated test coverage before this plan, and building a new test harness around a live third-party checkout modal (`window.Razorpay`) is a bigger investment than this sync pass calls for. Verification here is manual, matching how the backend plan verified its Razorpay integration - the placeholder `RAZORPAY_KEY_ID` means the actual payment can't complete either way, so the goal is confirming every flow degrades gracefully up to that point, not a full happy path.

- [ ] **Step 1: Boot both servers**

Run: `cd Backend && npm run dev` (background), then `cd frontend && npm run dev` (background). Confirm both come up without errors (check `http://localhost:5000/health` and that Vite prints a local URL).

- [ ] **Step 2: Walk the booking flow in a browser**

Open the frontend URL, log in as a customer, open a business with available slots, pick a slot and a time, click "Confirm booking". Expected: the booking POST succeeds (check Network tab: `201` with `data.order.orderId` present), then either Razorpay's checkout modal opens (if it loads far enough with the placeholder key before rejecting) or the page shows the inline red error banner with a "Retry payment" button - either way, **no unhandled exception, no blank page, no crash**. Open the browser console and confirm there's no uncaught error.

- [ ] **Step 3: Check the slot grid reflects `status`, not `isAvailable`**

Still on the business details page: confirm slots marked `occupied`/`held`/`maintenance` in the DB render as disabled/greyed out, and `available` ones are clickable. (If no such data exists locally, verify by temporarily setting one slot's `status` to `maintenance` via `psql`/Prisma Studio, confirm it renders disabled, then revert.)

- [ ] **Step 4: Walk the Profile page**

Log in as a customer with at least one booking in each of `booked`, `pending_payment`, and `pending_penalty_payment` (create these manually via the API/DB if no real data has reached these states yet). Expected: correct badge text per status (`Awaiting payment`, `Payment due`, etc.), the right action button appears per status, and clicking "Complete payment" / "Pay penalty" doesn't crash the page (same placeholder-key caveat as Step 2).

- [ ] **Step 5: Walk the checkout-summary receipt**

From Profile, click "Check out" on a `booked` booking whose `endTime` is in the past (so it accrues a penalty). Expected: navigates to `/checkout-summary` showing the real receipt (entry/exit times, base price, penalty, total) with a live "Pay penalty" button. Repeat with a booking checked out *before* its `endTime` (no penalty): expected the page shows the "Nothing owed" success state immediately, no payment button ever shown.

- [ ] **Step 6: Stop both dev servers**

Kill both background processes once verification is complete.

---

### Task 9: Progress log

**Files:**
- Modify: `Backend/CLAUDE.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Append a note to the 2026-08-08 session log**

In `Backend/CLAUDE.md`'s "Session notes (2026-08-08)" section (added by the backend migration plan), add a short paragraph noting: the frontend is now synced to the `{booking, order}` contract end-to-end (new booking payment, resumed abandoned payments, real overstay-penalty payment replacing the old fake checkout); the pre-existing `slot.isAvailable` vs. `slot.status` frontend/backend mismatch was also fixed as part of this pass; and that the sitewide "Midnight Garage" visual overhaul is the next and final plan in the sequence.

- [ ] **Step 2: Commit**

```bash
cd Backend
git add CLAUDE.md
git commit -m "docs: note frontend payment sync completion in the roadmap"
```
