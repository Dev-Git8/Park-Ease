<div align="center">
  <img src="https://img.shields.io/badge/status-production--ready-success?style=for-the-badge" alt="Production-Ready" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
  <h1>🅿️ Park-Ease</h1>
  <p><strong>A Modern, High-Performance Real-Time Parking Management System</strong></p>
</div>

---

**Park-Ease** is a scalable and Best real-time parking management platform built with modern web technologies. It features robust, database-backed session management, live slot synchronization via WebSockets, role-based access control, and a type-safe data layer using Prisma ORM, Redis for caching the mostly used pages to make the system more efficient and fast.

## 🚀 Key Features

- **Live Slot Status**: Real-time updates of parking slot availability across all active users using WebSockets.
- **Advanced Session Management**: Database-backed sessions supporting up to 5 simultaneous active devices per user, complete with automated eviction of the oldest sessions and secure session revocation.
- **Role-Based Access Control (RBAC)**: Distinct workflows for **Customers** (booking slots), **Business Owners** (managing parking areas and slots), and **System Admins**.
- **Secure Authentication Flow**: Defends against XSS and CSRF using strictly in-memory access tokens and HttpOnly, Secure refresh cookies, coupled with automatic session restoration.
- **Micro-Reservations & Automation**: Support for precise, minute-based booking durations with an automated scheduler for immediate slot release upon booking expiration.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS & Vanilla CSS (with premium Micro-animations via Framer Motion)
- **Icons**: Lucide React
- **Communication**: Axios, Socket.io-client

### Backend
- **Runtime**: Node.js (Express.js 5)
- **ORM**: Prisma (Type-safe queries)
- **Database**: PostgreSQL (Dockerized)
- **Caching & Real-time**: Redis (Dockerized), Socket.io
- **Authentication**: JWT & Database-Backed Sessions
- **Cloud Media**: Cloudinary (Image Uploads)

---

## 🏗️ Infrastructure: Docker Containerization

Park-Ease relies on **Docker** to provide a consistent, isolated, and production-ready development environment. The entire infrastructure stack (PostgreSQL + Redis) is orchestrated via a single `docker-compose.yml` file.

- **Portability**: Start the database and cache layer without manual installations.
- **Persistence**: Volumes are configured to ensure data survives container restarts.

---

## 🛡️ Security & Authentication Architecture

Park-Ease employs a hybrid, multi-layered authentication strategy:

1. **Database-Backed Sessions**: Replaced stateless JWTs with stateful DB sessions, enforcing device limits (max 5) and 7-day lifespans.
2. **In-Memory Access Tokens**: Access tokens are kept strictly in JavaScript memory (never in `localStorage`) to defeat XSS.
3. **HttpOnly Cookies**: Refresh tokens reside in `Secure`, `HttpOnly` cookies, shielding them from client-side scripts.
4. **Concurrency-Aware Interceptors**: Custom Axios interceptors automatically queue and process token refreshes if multiple concurrent requests encounter an expired token.

---

## 📋 API Reference Summary

### 🔐 Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login to receive an access token and HttpOnly refresh cookie
- `POST /refresh` - Renew the access token
- `POST /logout` - Revoke the current session
- `POST /logout-all` - Revoke all active sessions for the user

### 🏢 Business Management (`/api/business`)
- `POST /register` - Register a new parking business
- `GET /mine` - Retrieve the current user's business profile

### 🅿️ Slots (`/api/slots`)
- `GET /` - List all available parking slots (Public)
- `POST /` - Create a new parking slot (Business Owner)

---

## ⚙️ Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:root@localhost:5432/ParkingDB?schema=public"
JWT_SECRET="your_jwt_secret"
REFRESH_TOKEN_SECRET="your_refresh_secret"
REDIS_URL="redis://localhost:6379"
CLOUDINARY_URL="your_cloudinary_url"
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL & Redis)

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Dev-Git8/Park-Ease.git
   cd Park-Ease
   ```

2. **Launch the Infrastructure**
   ```bash
   cd Backend
   docker-compose up -d
   ```

3. **Initialize the Database & Backend**
   ```bash
   npm install
   
   # Push the Prisma schema to the database
   npx prisma db push
   
   # Start the development server
   npm run dev
   ```

4. **Start the Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🚧 Roadmap

- [ ] **Payment Integration**: Stripe processing for seamless automated payments.
- [ ] **Geospatial Features**: Google Maps API integration for localized slot discovery.
- [ ] **Mobile Application**: Porting the frontend to React Native for iOS/Android native experiences.
- [ ] **Dynamic Pricing Engine**: AI-based pricing adjustments during peak demand hours.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed & Maintained by [Dev-Git8](https://github.com/Dev-Git8)*