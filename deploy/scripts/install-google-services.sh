#!/usr/bin/env bash
# Install Firebase google-services.json for a Capacitor Android app from CI secrets.
# Usage (from repo root):
#   APP=user-web GOOGLE_SERVICES_JSON_USER_WEB=<base64> bash deploy/scripts/install-google-services.sh
set -euo pipefail

APP="${APP:-}"
if [ -z "$APP" ]; then
  echo "Set APP to one of: user-web, doctor-web, operations-web"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="$ROOT/apps/$APP/android/app/google-services.json"

case "$APP" in
  user-web)
    B64="${GOOGLE_SERVICES_JSON_USER_WEB:-}"
    ;;
  doctor-web)
    B64="${GOOGLE_SERVICES_JSON_DOCTOR_WEB:-}"
    ;;
  operations-web)
    B64="${GOOGLE_SERVICES_JSON_OPERATIONS_WEB:-}"
    ;;
  *)
    echo "Unknown APP: $APP"
    exit 1
    ;;
esac

if [ -z "$B64" ]; then
  echo "No Firebase secret for $APP — skipping google-services.json (push disabled)."
  exit 0
fi

mkdir -p "$(dirname "$TARGET")"
echo "$B64" | base64 -d > "$TARGET"
echo "Installed google-services.json → apps/$APP/android/app/"
