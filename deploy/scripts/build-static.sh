#!/usr/bin/env bash
# Build Angular production bundles and stage them for nginx.
# Run from repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATIC="$ROOT/deploy/static"

echo "==> Building frontends..."
cd "$ROOT"
npm run build:all

echo "==> Staging static assets..."
rm -rf "$STATIC"
mkdir -p "$STATIC/patient" "$STATIC/doctor" "$STATIC/operations"

# user-web and doctor-web use default dist/<app>/browser; operations-web uses dist/operations-web
cp -r "$ROOT/apps/user-web/dist/user-web/browser/"* "$STATIC/patient/"
cp -r "$ROOT/apps/doctor-web/dist/doctor-web/browser/"* "$STATIC/doctor/"

if [ -d "$ROOT/apps/operations-web/dist/operations-web/browser" ]; then
  cp -r "$ROOT/apps/operations-web/dist/operations-web/browser/"* "$STATIC/operations/"
else
  cp -r "$ROOT/apps/operations-web/dist/operations-web/"* "$STATIC/operations/"
fi

echo "==> Static files ready in deploy/static/"
