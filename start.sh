#!/bin/sh
set -e

echo "Starting Sahayak CPGRAMS API (${APP_ENV:-development})"
python utils/wait_for_db.py
alembic upgrade head
python scripts/seed.py

if [ "${APP_ENV}" = "production" ]; then
  exec gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 app.main:app
else
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --timeout-graceful-shutdown 4
fi
