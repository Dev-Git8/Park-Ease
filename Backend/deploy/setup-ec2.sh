#!/usr/bin/env bash
# One-time EC2 bootstrap for the parking API.
# Run as: ./deploy/setup-ec2.sh (from inside the cloned Backend/ directory, on the EC2 box)
#
# What this does NOT do for you:
#   - Fill in .env with real secrets (you must do this before step 3 below runs anything real)
#   - Point a domain's DNS A record at this box's Elastic IP (needed before the certbot step)
#   - Open ports 80/443 in the EC2 security group (needed before the certbot step)
set -euo pipefail

echo "==> Installing Docker + Nginx + Certbot"
sudo apt update
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo usermod -aG docker "$USER"

if [ ! -f .env ]; then
  echo "==> No .env found - copying .env.example. EDIT IT with real secrets before continuing." >&2
  cp .env.example .env
  echo "Edit .env now, then re-run this script." >&2
  exit 1
fi

echo "==> Building and starting containers (db/redis are bound to localhost only, not public)"
sudo docker compose up -d --build

echo "==> Waiting for the api container to be ready"
sleep 5

echo "==> Running Prisma migrations"
sudo docker compose exec api npx prisma migrate deploy

echo "==> Installing Nginx site config"
sudo cp deploy/nginx.parking-api.conf /etc/nginx/sites-available/parking-api
sudo ln -sf /etc/nginx/sites-available/parking-api /etc/nginx/sites-enabled/parking-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo
echo "==> Done. Remaining manual steps:"
echo "  1. Edit /etc/nginx/sites-available/parking-api - replace api.yourdomain.com with your real domain."
echo "  2. Point that domain's DNS A record at this instance's Elastic IP."
echo "  3. sudo nginx -t && sudo systemctl reload nginx"
echo "  4. sudo certbot --nginx -d api.yourdomain.com   (issues + auto-configures TLS)"
echo "  5. Create the first admin: sudo docker compose exec api node scripts/create-admin.js --email=... --name=... --password=..."
echo "  6. Update the Razorpay webhook URL to https://api.yourdomain.com/api/payments/webhook"
echo "  7. Update the frontend's API base URL and CORS_ORIGINS in .env to match."
