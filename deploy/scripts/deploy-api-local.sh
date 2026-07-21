#!/usr/bin/env bash
# Deploy the API from the production server itself.
# Intended for the GitHub self-hosted runner on Lightsail.
set -euo pipefail

APP_DIR="${LIGHTSAIL_APP_DIR:-/opt/hopehub}"
API_DIR="$APP_DIR/apps/api"

cd "$APP_DIR"
git remote set-url origin https://github.com/Shyamuday/Hopehub.git
git fetch origin main
git checkout main
git reset --hard origin/main
git update-index --skip-worktree apps/api/.env || true

cd "$API_DIR"
if [ ! -f /etc/hopehub-db-pass ] || [ ! -f /etc/hopehub-jwt-secret ]; then
  echo "Missing /etc/hopehub-db-pass or /etc/hopehub-jwt-secret on server"
  exit 1
fi

DB_PASS="$(sudo cat /etc/hopehub-db-pass)"
JWT_SECRET="$(sudo cat /etc/hopehub-jwt-secret)"

cat > .env <<ENV
DATABASE_URL="postgresql://hopehub_app:${DB_PASS}@localhost:5432/hopehub_clinic?schema=public"
JWT_SECRET="${JWT_SECRET}"
NODE_ENV="production"
PORT=4000
API_PUBLIC_URL="https://api.hopehub.in"
API_URL="https://api.hopehub.in"
WEB_ORIGIN="https://hopehub.in"
ADMIN_ORIGIN="https://admin.hopehub.in"
DOCTOR_ORIGIN="https://doctor.hopehub.in"
OPERATIONS_ORIGIN="https://ops.hopehub.in"
DEV_OTP=""
DISABLE_DEV_DEMO="true"
SMTP_FROM="noreply@hopehub.in"
DOSE_OVERDUE_SWEEP_ENABLED="true"
DOSE_OVERDUE_SWEEP_INTERVAL_MS="300000"
DOSE_REMINDER_SWEEP_ENABLED="true"
DOSE_REMINDER_WINDOW_MINUTES="30"
NOTIFICATION_CHANNELS="IN_APP,EMAIL"
OOREP_BASE_URL="https://www.oorep.com"
OOREP_TIMEOUT_MS="15000"
ENV
chmod 600 .env

npm install --no-audit --no-fund
npm run prisma:generate
npm run prisma:deploy
NODE_OPTIONS=--max-old-space-size=1536 npm run build
pm2 restart hopehub-api --update-env
pm2 save
curl -fsS http://127.0.0.1:4000/health
