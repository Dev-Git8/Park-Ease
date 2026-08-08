<div align="center">
  <img src="https://img.shields.io/badge/status-production--ready-success?style=for-the-badge" alt="Production-Ready" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
  <h1>🅿️ Park-Ease</h1>
  <p><strong>A Real-Time Parking Marketplace with Live Availability and Integrated Payments</strong></p>
</div>

---

## 🎥 Demo

<!--
  VIDEO WALKTHROUGH GOES HERE.
  Recommended: upload to YouTube (unlisted or public) and embed a thumbnail like this:

  [![Park-Ease Walkthrough](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

  Or, if hosting the file directly in the repo / a release asset:

  https://github.com/Dev-Git8/Park-Ease/assets/PLACEHOLDER/demo.mp4
-->



---

**Park-Ease** is a full-stack, real-time parking marketplace. Customers search for parking businesses, watch live slot availability update over WebSockets, book a slot, and pay for it through a real Razorpay integration — including a genuine overstay-penalty charge if a booking runs past its end time. Business owners manage their own lots and slots; admins approve or reject new businesses. The booking lifecycle (holds, expiry, overdue penalties) is fully automated by a background scheduler.

## 🚀 Key Features

- **Live Slot Status** — Real-time availability updates across all active users via Socket.IO; no polling.
- **Concurrency-Safe Booking** — Row-level locking (`SELECT ... FOR UPDATE`) inside a database transaction guarantees two users can never book the same slot at the same time.
- **Real Payments (Razorpay)** — Server-created orders, Razorpay Checkout, and HMAC-SHA256 signature verification on both the client-return path and the webhook path. Refunds and failure handling included.
- **Real Overstay Penalties** — If a customer ends a booking after its scheduled time, a second real Razorpay charge is created for the penalty amount — not just a UI warning.
- **Automated Booking Lifecycle** — A background scheduler expires unpaid holds, flags overdue bookings, and expires unpaid penalty charges after a configurable grace period.
- **Role-Based Access Control (RBAC)** — Distinct workflows for **Customers**, **Business Owners**, and **Admins**.
- **Secure Authentication** — JWT access tokens kept in memory, HttpOnly/Secure refresh cookies, database-backed sessions with rotation and revocation.
- **Input Validation & Rate Limiting** — Zod schemas at every mutating endpoint, Redis-backed rate limiting on sensitive routes (auth, payment verification).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS, with motion via Framer Motion
- **Icons**: Lucide React
- **Communication**: Axios, Socket.io-client
- **Payments**: Razorpay Checkout.js

### Backend
- **Runtime**: Node.js (Express 5)
- **ORM**: Prisma 7 (`@prisma/adapter-pg` driver adapter)
- **Database**: PostgreSQL (Dockerized)
- **Caching & Real-time**: Redis (Dockerized), Socket.io
- **Authentication**: JWT + database-backed sessions
- **Payments**: Razorpay (Orders API, webhooks, signature verification)
- **Cloud Media**: Cloudinary (business image uploads)
- **Validation**: Zod

---

## 🏗️ Infrastructure: Docker Containerization

Park-Ease relies on **Docker** to provide a consistent, isolated development environment. The infrastructure stack (PostgreSQL + Redis) is orchestrated via `Backend/docker-compose.yml`.

- **Portability** — start the database and cache layer without manual installation.
- **Persistence** — named volumes ensure data survives container restarts.
- **CI** — GitHub Actions runs migrations, lint, and the test suite against real Postgres/Redis service containers on every pull request.

---

## 🛡️ Security & Authentication Architecture

1. **Database-Backed Sessions** — stateful sessions (not bare stateless JWTs), enforcing device limits and revocation.
2. **In-Memory Access Tokens** — access tokens are kept strictly in JavaScript memory (never `localStorage`) to defend against XSS.
3. **HttpOnly Cookies** — refresh tokens live in `Secure`, `HttpOnly` cookies, invisible to client-side scripts.
4. **Refresh Rotation** — every refresh call issues a new refresh token and invalidates the old one, limiting the blast radius of a stolen token.
5. **Payment Signature Verification** — every payment confirmation (client callback and webhook) is verified with HMAC-SHA256 against Razorpay's secret before any booking state changes.
6. **Rate Limiting** — Redis-backed limits on auth and payment-verification endpoints to blunt brute-force and abuse.

---

## 📋 API Reference Summary

### 🔐 Authentication (`/api/auth`)
- `POST /register` — Register a new user
- `POST /login` — Login, receive an access token and HttpOnly refresh cookie
- `POST /refresh` — Rotate and renew the access token
- `POST /logout` — Revoke the current session
- `POST /logout-all` — Revoke all active sessions for the user

### 🏢 Business Management (`/api/business`)
- `POST /register` — Register a new parking business (pending admin approval)
- `GET /mine` — Retrieve the current user's business profile

### 🅿️ Slots (`/api/slots`)
- `GET /` — List parking slots with live status (Public)
- `POST /` — Create a new parking slot (Business Owner)

### 📅 Bookings (`/api/bookings`)
- `POST /` — Create a booking hold + Razorpay order for a slot
- `GET /` — List the current user's bookings, including resumable pending payments
- `PATCH /:id/terminate` — End a booking; computes and charges an overstay penalty if applicable

### 💳 Payments (`/api/payments`)
- `POST /verify` — Verify a client-side payment signature and confirm a booking/penalty
- `POST /webhook` — Razorpay webhook receiver (payment captured/failed, refund processed)
- `GET /config` — Public Razorpay key for the frontend checkout widget

---

## ⚙️ Environment Variables

Create a `.env` file in `Backend/` (see `Backend/.env.example` for the authoritative list):

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/parking_db

JWT_SECRET=changeme_generate_a_real_secret
REFRESH_TOKEN_SECRET=changeme_generate_a_different_real_secret

REDIS_URL=redis://localhost:6379

CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173

CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=changeme_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=changeme_razorpay_webhook_secret

MIN_BOOKING_DURATION_MINUTES=30
MAX_BOOKING_DURATION_MINUTES=1440
AUTO_TERMINATE_GRACE_MINUTES=60
HOLD_EXPIRY_MINUTES=15
OVERDUE_PENALTY_MULTIPLIER=1.5
PENALTY_PAYMENT_GRACE_MINUTES=30
```

> Razorpay offers free Test Mode keys with no business verification required — see the Getting Started section below.

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL & Redis)
- A free [Razorpay](https://dashboard.razorpay.com/) account (Test Mode)
- A free [Cloudinary](https://cloudinary.com/) account

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Dev-Git8/Park-Ease.git
   cd Park-Ease
   ```

2. **Launch the Infrastructure**
   ```bash
   cd Backend
   docker compose up -d db redis
   ```

3. **Configure and Migrate the Backend**
   ```bash
   npm install
   cp .env.example .env
   # fill in .env — see Environment Variables above

   npx prisma migrate deploy
   npx prisma generate

   npm run dev
   ```

4. **Start the Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

5. **Run the Test Suite**
   ```bash
   cd Backend && npm test
   cd ../frontend && npm test
   ```

---

## 🚧 Roadmap

- [ ] **Live Deployment** — managed Postgres + hosted backend/frontend with a public demo URL
- [ ] **Error Monitoring** — Sentry-style tracking for production error visibility
- [ ] **Geospatial Search** — map-based slot discovery
- [ ] **Mobile Application** — React Native port for iOS/Android
- [ ] **Dynamic Pricing Engine** — demand-based pricing adjustments during peak hours

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed & Maintained by [Dev-Git8](https://github.com/Dev-Git8)*
