# USV Events Installation Guide

## 1. Prerequisites

- Docker Desktop 4.x or newer
- Git
- Optional for local development without Docker:
  - Python 3.12+
  - Node.js 20+
  - npm 10+

## 2. Quick Start With Docker

1. Clone or open the repository.
2. Create a root `.env` file if you want to override the default values from `docker-compose.yml`.
3. Start the stack:

```bash
docker compose up --build
```

4. Open the services:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/api/v1/docs
- PostgreSQL: localhost:5432

## 3. Environment Variables

The backend reads configuration from environment variables. The most important ones are:

- `DATABASE_URL`
- `SECRET_KEY`
- `APP_ENV`
- `FORCE_HTTPS_REDIRECT`
- `ALLOWED_HOSTS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`
- `FRONTEND_RESET_PASSWORD_PATH`
- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `ENABLE_EMAIL`

A ready-to-use example is available in `backend/.env.example`.

## 4. Database Initialization

The backend can run database setup automatically on startup:

- migrations for registration status
- idempotent demo seed data

You can control this behavior with:

```env
AUTO_MIGRATE_ON_STARTUP=true
AUTO_SEED_ON_STARTUP=true
```

If you already have a running stack and need to apply the registration status migration once, run:

```bash
docker exec usv_events_backend python -m app.migrate_event_registration_status
```

## 5. Email Configuration

Email notifications are disabled by default.

To enable them:

1. Configure your SMTP provider.
2. Set `ENABLE_EMAIL=true`.
3. Provide `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and sender details.

Common providers work with the same settings model:

- Gmail SMTP
- Microsoft 365 / Outlook
- SendGrid SMTP
- Mailgun SMTP

For provider examples and troubleshooting, see `backend/docs/EMAIL_CONFIGURATION.md`.

## 6. Production Hardening

Before deploying to a production environment:

1. Set `APP_ENV=production`.
2. Replace the default `SECRET_KEY` with a long random value.
3. Keep `FORCE_HTTPS_REDIRECT=true` if you want the backend to enforce HTTPS.
4. Restrict `ALLOWED_HOSTS` to your real domain names.

When `APP_ENV=production`, the backend fails fast if it still uses the placeholder secret key.

## 7. Google OAuth Setup

If you want Google login for students:

1. Create OAuth credentials in Google Cloud Console.
2. Set the authorized redirect URI to:

```text
http://localhost:5173/auth/callback
```

3. Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment.

If the Google settings are missing, the Google login flow will return a configuration error.

## 8. Local Development Without Docker

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 9. PDF Guide Generation

This repository includes a small generator that builds the PDF version of this guide from the markdown source.

Run it from the repository root:

```bash
npm run docs:pdf
```

The generated file is written to:

```text
docs/installation-guide.pdf
```

## 10. Stopping The Stack

```bash
docker compose down
```

To remove volumes and reset the database too:

```bash
docker compose down -v
```

## 11. Troubleshooting

- If port 5432 is already in use, stop the local PostgreSQL service or change the mapped port in `docker-compose.yml`.
- If login fails, verify `SECRET_KEY`, Google OAuth settings, and the database connection string.
- If email sending fails, keep `ENABLE_EMAIL=false` in development until the SMTP settings are valid.
- If Docker rebuilds slowly, make sure the volumes are healthy and the backend image has been rebuilt after dependency changes.

## 12. Recommended First Run Checklist

- [ ] Copy or create `.env`
- [ ] Confirm Docker Desktop is running
- [ ] Start the stack with `docker compose up --build`
- [ ] Open the frontend in the browser
- [ ] Verify the backend health endpoint
- [ ] Configure Google OAuth if student login is needed
- [ ] Configure SMTP if email notifications are needed
