# Operations

## First-time setup

1. Copy `.env.example` to `.env` and fill in real values.
2. Generate real secrets before ever deploying to a real environment - the
   placeholder values in `.env.example` are not safe to use anywhere but a
   throwaway local dev box:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Run it twice - `JWT_SECRET` and `REFRESH_TOKEN_SECRET` must be two
   different values.
3. `npm install`
4. `npx prisma migrate deploy`
5. Create the first admin account (the only way to bootstrap one - every
   subsequent admin is created via the `POST /api/admin/users` endpoint,
   which requires an existing admin):
   ```bash
   node scripts/create-admin.js --email=admin@example.com --name="Your Name" --password=SomeStrongPassword123
   ```
6. `npm run dev` (or `npm start` for production)

## Running with Docker

```bash
docker compose up --build
```

Brings up Postgres, Redis, and the API together. Note that `DATABASE_URL`
and `REDIS_URL` inside the container must point at the Docker service names
(`db`, `redis`), not `localhost` - use a container-specific `.env` for this,
or override those two vars in `docker-compose.yml` directly.

## Deploying to EC2

`docker-compose.yml` already binds `api`/`db`/`redis` to `127.0.0.1` only
(not publicly reachable - only Nginx, running on the same box, talks to
them) and every service has `restart: always`. Files in `deploy/` build on
top of that:

- `deploy/nginx.parking-api.conf` - reverse-proxy config (handles the
  Socket.IO WebSocket upgrade) that terminates TLS in front of the API
  container.
- `deploy/setup-ec2.sh` - bootstraps a fresh Ubuntu EC2 box: installs
  Docker/Nginx/Certbot, brings up the containers, runs `prisma migrate
  deploy`, and installs the Nginx site.

Steps:

1. Launch an Ubuntu 22.04 EC2 instance (t3.small or larger - Postgres +
   Redis + Node together need more headroom than t2.micro), open ports
   `22` (restricted to your IP), `80`, `443` in its security group. Do
   **not** open `5432`/`6379`/`5000` publicly. Allocate an Elastic IP.
2. `git clone` this repo onto the instance, `cd Backend`.
3. `cp .env.example .env` and fill in real values - fresh `JWT_SECRET`/
   `REFRESH_TOKEN_SECRET` (see "First-time setup" above), real
   `RAZORPAY_*`/`CLOUDINARY_URL`/`SMTP_*`, and `CORS_ORIGINS`/
   `FRONTEND_URL` set to your deployed frontend's real origin. Also change
   `DATABASE_URL`'s host from `localhost` to `db` and `REDIS_URL`'s host
   from `localhost` to `redis` (Docker service names).
4. `chmod +x deploy/setup-ec2.sh && ./deploy/setup-ec2.sh`
5. Point your domain's DNS A record at the instance's Elastic IP, edit
   `/etc/nginx/sites-available/parking-api` to replace
   `api.yourdomain.com` with the real domain, `sudo nginx -t &&
   sudo systemctl reload nginx`, then `sudo certbot --nginx -d
   api.yourdomain.com` for TLS.
6. Create the first admin (see "Admin provisioning" below), update the
   Razorpay dashboard's webhook URL to
   `https://api.yourdomain.com/api/payments/webhook`, and point the
   frontend's API base URL at the same domain.

To redeploy after a code change: `git pull && sudo docker compose up -d
--build && sudo docker compose exec api npx prisma migrate deploy`.

## Razorpay webhooks locally

Razorpay doesn't have an official local-forwarding CLI. Expose the local
server with a tunnel (e.g. `ngrok http 5000`) and register the resulting
HTTPS URL + `/api/payments/webhook` as a webhook endpoint in the Razorpay
Dashboard (Test Mode), subscribed to `payment.captured`, `payment.failed`,
and `refund.processed`. Copy the webhook secret it gives you into
`RAZORPAY_WEBHOOK_SECRET` in `.env`. Use Razorpay's test-mode keys for
`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.

## Admin provisioning

- **First admin ever**: `scripts/create-admin.js` (CLI, one-time bootstrap).
- **Every admin after that**: an existing admin calls
  `POST /api/admin/users` with `{ name, email, password, role }`. The
  calling admin communicates the password out-of-band - there's no email
  infra in this stack.

## Booking policy tuning

These are all env vars (see `.env.example`) - no code change needed to retune:

| Var | Default | Meaning |
|---|---|---|
| `MIN_BOOKING_DURATION_MINUTES` | 30 | Shortest allowed booking |
| `MAX_BOOKING_DURATION_MINUTES` | 1440 | Longest allowed booking (24h) |
| `AUTO_TERMINATE_GRACE_MINUTES` | 60 | How long an overdue booking sits before being force-completed and its slot released |
| `HOLD_EXPIRY_MINUTES` | 15 | How long an unpaid booking hold survives before its slot is released |
| `OVERDUE_PENALTY_MULTIPLIER` | 1.5 | Penalty rate multiplier applied to `pricePerHour` for overdue time |
| `PENALTY_PAYMENT_GRACE_MINUTES` | 30 | How long a checked-out booking with an unpaid overstay penalty sits before auto-resolving to `completed` anyway |

## Known follow-ups (flagged, not yet built)

- No "delete my account" endpoint exists. When one is added, it needs a
  soft-delete (`deletedAt`) column rather than a hard delete, since
  `Business`/`Booking` foreign keys to `User` are `onDelete: Restrict`.
- A future-dated booking's `Slot.status` transition (`available` -> `held`/
  `occupied`) at its own start time isn't automated yet - only bookings
  starting within a few minutes flip the slot immediately. The overlap
  check on `Booking.status` is the real correctness guarantee in the
  meantime; `Slot.status` is just a cheap "is it physically occupied right
  now" signal for the live map.
