#!/bin/sh
set -e

if [ "${AUTO_MIGRATE_ON_STARTUP:-true}" = "true" ]; then
  echo "[startup] Running DB migration..."
  python -m app.migrate_event_registration_status
fi

if [ "${AUTO_SEED_ON_STARTUP:-true}" = "true" ]; then
  echo "[startup] Running idempotent seed..."
  python -m app.seed
fi

echo "[startup] Starting API server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
