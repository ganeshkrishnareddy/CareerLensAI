#!/bin/sh
set -e

# Initialize / migrate the database on first boot (SQLite volume or fresh Postgres).
if [ -x ./node_modules/.bin/prisma ]; then
  echo "[CareerLens] Applying database schema…"
  npx prisma db push --skip-generate 2>/dev/null \
    || npx prisma db push --skip-generate --accept-data-loss
fi

exec node server.js
