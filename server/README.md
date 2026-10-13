# Lifeloom server

NestJS REST API for Lifeloom. It provides Google-backed Lifeloom sessions,
profiles, goals, historical timeline records, what-if paths, private media,
durable reminders and future-self letters, app-update enforcement, data export,
and account deletion.

## Local setup

Requirements: Node.js 24, pnpm, MongoDB, and an S3 bucket or S3-compatible
service.

```bash
pnpm install
docker compose up -d
copy .env.example .env
pnpm start:dev
```

Create the private `AWS_S3_BUCKET` in MinIO before uploading files. Never reuse
the example credentials outside local development.

The API base path is `/api/v1`. Swagger UI is at `/docs` and its OpenAPI JSON is
at `/docs-json` in development and staging. Both are absent in production.
Liveness is `/health/live`; readiness is `/health/ready`.

## Authentication

1. `POST /api/v1/auth/google` accepts a Google ID token. The server verifies its
   signature, issuer, expiry, and configured audience.
2. The response contains a short-lived Lifeloom access token and rotating
   refresh token.
3. Send `Authorization: Bearer <accessToken>` on protected endpoints.
4. `POST /api/v1/auth/refresh` rotates the refresh token. Reuse revokes the token
   family.
5. `POST /api/v1/auth/logout` revokes the current session.

Protected mobile requests also send `x-app-platform`, `x-app-version`,
`x-app-build`, and `x-app-identifier`. A persisted mandatory app policy can
return `APP_UPDATE_REQUIRED`.

## API conventions

Success:

```json
{ "success": true, "data": {} }
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "fieldErrors": {},
    "requestId": "..."
  }
}
```

Dates such as birthdays and goal deadlines use `YYYY-MM-DD` and do not shift
zones. Instants use UTC ISO-8601. User scheduling uses the persisted IANA time
zone. A Feb 29 age-based delivery occurs on Feb 28 in a non-leap target year.

## Upload flow

1. Upload one multipart `file` to `POST /api/v1/uploads?purpose=...`.
2. The server detects the real type, frames photos, writes a private temporary
   object, and returns upload metadata.
3. Create the parent letter, memory, or what-if path.
4. Attach with
   `POST /api/v1/uploads/:id/attach/:parentType/:parentId`.
5. Obtain a short-lived owner-authorized URL at
   `GET /api/v1/uploads/:id/access`.

Temporary uploads expire after 24 hours by default. Replaced avatars, deleted
attachments, account data, and expired temporary/export objects are removed
from S3 by server-side cleanup.

## Jobs and delivery

Jobs are persisted in MongoDB and atomically leased by workers. Restarted
workers recover expired leases. Delivery attempts are bounded and use
at-most-once channel markers to prevent a retry from sending the same message
twice. Set `BACKGROUND_JOBS_ENABLED=true` to run workers.

SMTP and FCM adapters are disabled by default. Development never emails a real
recipient unless email is explicitly enabled and `EMAIL_DELIVERY_MODE=smtp`.
Future-letter email contains an authenticated API link, never the letter body.

App-update policies are persisted in MongoDB and intentionally have no public
mutation route. Operators provision them through trusted deployment tooling.

## Privacy

`GET /api/v1/privacy/export` streams a private ZIP containing `data.json` and
the user's stored attachments, returns a 15-minute URL, and schedules deletion.
`DELETE /api/v1/privacy/account` requires the exact confirmation
`DELETE MY ACCOUNT` and removes records, sessions, jobs, and current S3 objects.
Encrypted backups may retain data until the operator's configured retention
period ends.

## Verification

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm audit
```

Tests create a fresh in-memory MongoDB and destroy it after the run. Google,
S3, SMTP, and FCM are external boundaries and must use test doubles in tests.

## Deployment

The multi-stage image runs as a non-root user and handles Nest shutdown hooks.
Production should use EC2 IAM roles instead of static AWS keys, TLS, strict
CORS, private MongoDB/S3 networking, and secret injection outside git. Use
separate databases, buckets, email behavior, and policies for development,
staging, and production.

All supported settings and safe placeholders are documented in `.env.example`.
Real OAuth IDs, store IDs, URLs, credentials, support contacts, and retention
periods remain operator-supplied.
