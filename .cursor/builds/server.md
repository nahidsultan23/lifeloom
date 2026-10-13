# Lifeloom server brief

**Status:** Implemented under `server/`; verification commands and operational
requirements are documented in `server/README.md`.  
**Build order:** Build the server from this file before the client. Do not open `.cursor/builds/client.md` for server work.  
**Stack:** NestJS, TypeScript, MongoDB, pnpm. Package installs and scripts use pnpm.

Search this file for the feature you are changing. Read that section. Do not load the client brief.

## Now, not later

These are in the first build, not a later phase:

- Future-self letters with scheduled delivery and optional email or in-app notification
- Photo and audio attachments for letters and memories
- What-if timelines, alternative life paths, and retrospective time travel

Still later: goal chapters, nested goals, richer timeline browsing, optional AI planning, paid ad-free subscription, end-to-end encrypted sync.

## Product

Lifeloom is a personal life-planning and reflection app. Philosophy: "Look ahead. Live in the present. Look back." Missed, changed, or abandoned goals are valid. Do not shame users or predict death. Expected lifespan is optional and user-provided.

- Auth: Google Sign-In, verified on the server, then Lifeloom sessions
- Files: private AWS S3
- Deploy: Docker on AWS EC2
- API: REST `/api/v1`, Swagger/OpenAPI
- Clients: React Native for Android and iOS. Ads live in the client. Do not send private content to ad services.
- Environments: development, staging, production
- Jobs: scheduled letters and reminders must survive restart. Do not use one in-memory timer. Add Redis/BullMQ only if a simpler durable approach cannot meet this, and document the choice.

Use the product name Lifeloom in service metadata and email. Do not hardcode logo URLs, legal identity, or support details. A hosted logo URL, if an email needs one, is configuration.

## Working method

1. Read `.cursor/maps/server.md`, then the section of this file the task needs.
2. Implement in small increments. Add tests with each feature.
3. Run the relevant format, lint, type-check, unit, integration, e2e, and build commands. Report only commands you actually ran.
4. Update README, `.env.example`, and Swagger as behavior changes.
5. If a requirement is ambiguous, use the defaults here. For privacy, cost, or irreversible deletion, pick a conservative configurable default and record the open question.
6. Do not invent secrets, store ids, legal text, or credentials.
7. A scaffold, mock, or doc is not a finished feature.

Labels: **MUST** required, **SHOULD** unless a documented reason blocks it, **LATER** design a clean path but do not pretend it exists, **OPEN** the owner must decide.

## Modules

`AuthModule`, `UsersModule` / `ProfileModule`, `GoalsModule`, `TimelineModule` / `LifeLedgerModule`, `WhatIfModule`, `RemindersModule`, `LettersModule`, `UploadsModule`, `AppUpdatesModule`, `PrivacyModule`, `HealthModule`, `ConfigModule`.

DTOs validate input. Business logic stays in services. Auth and ownership checks are central. Index queries and uniqueness. Do not return raw MongoDB documents as the API contract.

## Configuration

- Validate config at startup with Joi, Zod, or an equivalent. Fail fast. Never print secrets.
- If email is disabled, email failure must not break goal APIs.
- Do not scatter `process.env` through business logic.
- Do not bake `.env` or credentials into an image or commit them.
- `.env.example` documents every supported setting with placeholders. The client does not use `.env`. Secrets stay here.
- `APP_ENV` is `development`, `staging`, or `production`. Do not use `NODE_ENV` alone to decide Swagger visibility. Staging often runs with `NODE_ENV=production`.

## Authentication and isolation

- The app sends a Google ID token. Verify signature, issuer, expiration, and audience with a trusted library.
- Never accept a client user id or email as identity. Never handle the Google password.
- Development, staging, and test may offer `POST /auth/preview`. It takes an empty body, signs in the fixed account `test@gmail.com`, and seeds sample records once. Production returns 404. The route is omitted from the API document.
- Issue Lifeloom access and refresh sessions. Support logout, revocation, and refresh rotation or equivalent replay protection.
- Do not merge accounts because an unverified email string matches.
- Future-self email goes only to the verified account email.
- Every user-owned query and mutation is scoped to the authenticated user. Check ownership of goals, timeline records, what-if paths, letters, files, exports, and deletions.
- A guessed id must not grant access. Not-found behavior must not leak another user's data.
- Rate-limit auth and other abuse-prone routes.
- Do not log tokens, letters, notes, presigned URLs, or sensitive payloads.

## Input validation

The server does not trust the client. Validate every input before use.

- Allowlist fields and reject unexpected properties.
- Enforce the max lengths below. Use the same numbers on the client as input limits, but the server is the boundary.
- Cap JSON bodies at 1 MB (`REQUEST_BODY_LIMIT_MB=1`). Uploads use the file limits, not the JSON limit.
- Reject oversize input instead of buffering it without a cap.
- Stable error code `VALIDATION_ERROR`, with field paths such as `milestones.0.title`.

| Input | Max |
| --- | --- |
| Display name | 80 characters |
| Goal or what-if title | 120 characters |
| Milestone title | 120 characters |
| Notes, why-it-matters, timeline note, what-if description | 2,000 characters |
| Letter body | 10,000 characters |
| Search query | 100 characters |
| One release-note line | 300 characters |
| Client-supplied URL that is actually accepted | 500 characters, and only where a URL is a real field |

Do not accept client-supplied object keys, MIME types, ownership, platform store URLs, or identity.

## Shared field limits for files

| Feature | Photos | Audio |
| --- | --- | --- |
| Avatar | 1 | 0 |
| Letter | 5 | 3 |
| Memory or timeline record | 5 | 3 |
| What-if path | 3 | 0 |

- Images: `image/jpeg`, `image/png`, `image/webp`. Detect type from the file, not the extension or client MIME alone.
- Audio: `audio/mpeg`, `audio/mp4`, `audio/webm`. Max 15 MB each.
- Required frame, longest edge at most 1,920 px: avatar `1:1`, letter, memory, and what-if photos `4:3`.
- Fit the whole photo inside that frame. Do not crop it, and do not change its own ratio. Scale uniformly to the edge that fits, width or height, including scaling up when the photo is smaller. Center it. Fill the leftover space on the other edge with `#F6F1E7`, split equally on both sides.
- Encode the framed image as WebP at quality 80. Re-encode when the ratio does not match even if the file is already small. Skip another lossy pass only when the photo already matches the frame and is within the size limit.
- Compression must stay suitable for a phone screen. Do not keep original multi-megabyte camera files in S3.
- A replaced, deleted, unattached, or no-longer-referenced object is deleted from S3. Temporary upload files are deleted when the operation ends, including on failure. Unattached uploads expire after 24 hours.
- Account or parent-record deletion deletes the related objects, sessions, and queued jobs, within the documented backup-retention limit.

## Data model

Conceptual fields, not a demand for these exact collection names.

### User

Stable id. Unique indexed Google subject. Verified email and verification status. Display name. Optional avatar. Required editable birth date. Optional editable expected lifespan or death age/year, stored as user-provided, never predicted. IANA time zone. Locale if supported. Notification preferences. Privacy and consent settings. Timestamps. Account and deletion state.

Minimize personal data.

### Goal

Owner. Required title. Optional notes and why-it-matters. Deadline type: calendar date, age-based, both only if intentionally supported, or none. Deadline date and/or target age. Optional preparation lead time. Status timestamps. Optional milestones if implemented. Reminder settings, including the stored frequency. Soft delete only where recovery needs it.

Overdue goals are valid. Users can reschedule, complete late, leave overdue, abandon, archive, delete, or mark fulfilled differently.

### Notification settings

Persist in MongoDB on the user and on each goal or to-do. A device change must not drop them.

Default frequency from the deadline distance, unless the user has set an override:

| Time until deadline | Default |
| --- | --- |
| No deadline | No automatic reminder |
| More than 365 days | Monthly |
| 90 to 365 days | Every 14 days |
| 30 to 89 days | Weekly |
| 7 to 29 days | Every 2 days |
| Fewer than 7 days | Daily |

The user can change or disable this at any time. Store the override. Do not default a far-away goal to daily reminders. Frequency may also account for preparation time. Rules must be explicit and testable.

### Timeline and memories

Owner. Related goal id when applicable. Event type and timestamp. Snapshot of the relevant state at that time. User-editable fields where the product allows them. Attachment references within the caps above. Deletion semantics documented.

Do not store unbounded copies or secrets in history. Editing the current goal is not the same as editing a historical record. Retrospective time travel reads these snapshots. It does not rebuild the past from the current goal.

### What-if path

Owner. Title and description within the limits above. Optional photo attachments within the cap. An alternative life path is user-authored. Do not call AI for this. Optional AI planning stays later. A path is private to the owner.

### Reminder and delivery job

Owner and related goal or letter id. Scheduled UTC instant plus the user's IANA time zone. Job type, status, attempts, next attempt, idempotency key. Channel and result metadata without sensitive content. Cancel and reschedule support.

### Future-self letter

Owner. Letter text. Attachment references. Delivery target: a calendar date or a future age/birthday, with a documented deterministic age rule. Recipient email is the verified account email only. Email and in-app notification default on. The user can turn email off. Status and attempts. Delivery is best effort, not guaranteed. Attachments in private S3. Metadata in MongoDB.

### Upload metadata

Owner, server-generated object key, detected content type, byte size, checksum if useful, timestamps, parent resource, temporary flag.

### App update policy

Platform policy for Android and iOS. Latest version, minimum supported version, optional minimum build, policy version, store URL, release notes, enabled flag, timestamps. Policies may differ by environment and platform. Prefer persisted policy over a redeploy for every store release. No public admin mutation route.

## Time

- Store instants as UTC.
- Show and schedule local times with the user's IANA time zone. The app reports the device zone. Persist it on the user so scheduling still works after a device change. Update it when the device zone changes.
- Date-only deadlines must not shift to another calendar day.
- Document age-based and birthday rules, including leap days. Test them.

## API

- REST `/api/v1`, plural resources, correct status codes, pagination and documented filter limits.
- UTC ISO-8601 for instants. Document date-only fields separately.
- Success envelope: `{ "success": true, "data": {} }`. List pagination metadata stays in one documented place.
- Error envelope: `success: false`, `error.code`, human `message`, `fieldErrors` (always present, `{}` when none), optional `requestId`.
- Field messages must not repeat the internal field name.
- Status codes: 400 malformed, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation or business rule, 429 rate limited, 500 unexpected, 503 dependency down.
- One global exception filter. Do not leak stack traces, database errors, paths, secrets, or raw validator text.
- Stable codes include `APP_UPDATE_REQUIRED`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`.

## Swagger

A separate developer must use the API from Swagger plus this brief.

- Enabled in development and staging, including the raw JSON.
- Disabled in production. Hiding the UI while leaving the JSON public is not enough.
- Decide this from `APP_ENV`, not `NODE_ENV`.
- Suggested paths: `/docs` and `/docs-json`. Test that both exist outside production and return a non-document response such as 404 in production.
- Every endpoint documents summary, tags, auth, parameters, body, success and error responses, field types, nullability, enums, limits, examples, pagination, time semantics, ownership, and idempotency where retries matter.
- Generate Swagger from real DTOs and controllers. Do not document routes that do not exist.

## Goals and ledger behavior

- Birth date is required for age math and is editable.
- Expected lifespan is optional, editable, and removable.
- Past deadlines stay valid.
- Keep history of meaningful transitions and honor documented edit and delete controls.
- Never label a user a failure or discard an overdue goal.
- If recurrence or nested milestones are not built, do not expose half-built routes. Nested goals are later.

## Reminders and letters

- Durable, idempotent jobs. Bounded retry. Cancel and reschedule. No duplicate sends on retry.
- Respect time zones and daylight-saving changes.
- Push is best effort and depends on platform permission. Choose a provider that can target Android and iOS.
- Email is configurable. Development defaults to log-only with redaction. Never email real people by accident.
- Letters are scheduled on the server. Do not depend on the app staying open.
- If the account email changes, use the new address only after verified email change.
- **OPEN:** full letter in the email, or a secure link. Default: authenticated link, not the letter body. Links require auth, expire or revoke, and never put letter text in the URL, analytics, or logs.

## S3

- Private objects. Block public access.
- Production uses an EC2 IAM role. No long-lived keys in `.env` when the default AWS chain works.
- Server-generated keys. Authorize the owner before a short-lived presigned URL.
- Encrypt in transit and at rest.
- Do not log presigned URLs or private keys.
- Document the local S3 mock or compatible service.

## Export and deletion

- Users can export personal data and delete the account.
- Document the export format and included records and files.
- Exports are temporary, private, short-lived, then deleted.
- Deletion covers MongoDB records, S3 objects, jobs, and refresh sessions.
- Do not promise instant erasure from backups. Do not claim a law is met without evidence.
- Irreversible deletion waits for the required confirmation.

## App updates

`GET /api/v1/app-updates/check` works before sign-in. Inputs: platform `android` or `ios`, SemVer version, build number, app identifier when relevant. Environment comes from trusted build config, not a client field treated as authority.

- Latest version and minimum supported version are different.
- Compare SemVer and build numbers, never alphabetically.
- Optional updates can be dismissed by the client. Required updates block supported use and return `APP_UPDATE_REQUIRED` on protected routes too.
- Store URLs come from trusted config. No arbitrary client redirects.
- A failed check must not lock everyone out when no mandatory policy is already known. A client that already knows it is unsupported must not bypass that.
- Keep maintenance mode separate from update enforcement.
- Use placeholder store ids until the owner supplies real ones.

## Ads

Do not send goal titles, notes, letters, timeline details, or other personal content to AdMob or any ad target. Do not invent consent. Missing consent is not consent. Do not assume a paid ad-free plan exists.

## Deployment

Repository artifacts when the server is built: multi-stage `Dockerfile`, `.dockerignore`, `.gitignore`, `.env.example`, `compose.yaml` if useful, README, health endpoints, graceful shutdown.

Starting env inventory. Keep only keys the implementation uses. Label unused keys as reserved or omit them.

```dotenv
APP_NAME=Lifeloom
APP_ENV=development
NODE_ENV=development
APP_VERSION=0.1.0
PORT=3000
HOST=0.0.0.0
API_PREFIX=api/v1
LOG_LEVEL=debug
PUBLIC_API_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:19006,http://localhost:8081

GOOGLE_CLIENT_ID=replace-with-google-oauth-client-id
GOOGLE_ALLOWED_AUDIENCES=replace-with-allowed-google-client-id

ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_SECRET=replace-with-another-long-random-secret
REFRESH_TOKEN_TTL=30d

MONGODB_URI=mongodb://lifeloom_user:URL_ENCODED_PASSWORD@localhost:27017/lifeloom?authSource=admin
MONGODB_DB_NAME=lifeloom
MONGODB_MAX_POOL_SIZE=20
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000

AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=replace-with-your-bucket-name
AWS_S3_PREFIX=development/
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
S3_ENDPOINT_URL=
S3_FORCE_PATH_STYLE=false
S3_PRESIGNED_URL_TTL_SECONDS=300
S3_MAX_IMAGE_EDGE_PX=1920
S3_IMAGE_QUALITY=80
S3_COMPRESS_IMAGE_OVER_BYTES=1572864
UPLOAD_TEMP_TTL_HOURS=24
S3_ALLOWED_CONTENT_TYPES=image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4,audio/webm

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=replace-with-smtp-username
SMTP_PASSWORD=replace-with-smtp-password
SMTP_FROM_NAME=Lifeloom
SMTP_FROM_EMAIL=no-reply@example.com
SMTP_REPLY_TO=support@example.com
EMAIL_ENABLED=false
EMAIL_DELIVERY_MODE=log
EMAIL_VERIFICATION_REQUIRED=true
FUTURE_LETTER_EMAIL_ENABLED=false
FUTURE_LETTER_EMAIL_FORMAT=secure_link

REDIS_URL=redis://localhost:6379
QUEUE_PREFIX=lifeloom-development
BACKGROUND_JOBS_ENABLED=false
SCHEDULER_ENABLED=false
PUSH_NOTIFICATIONS_ENABLED=false

TRUST_PROXY=false
RATE_LIMIT_TTL_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_BODY_LIMIT_MB=1
SHUTDOWN_TIMEOUT_MS=10000

APP_UPDATE_CHECK_ENABLED=true
APP_UPDATE_POLICY_CACHE_TTL_SECONDS=60
ANDROID_PACKAGE_ID=replace-with-real-package-id
ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=replace-with-real-package-id
IOS_APP_STORE_ID=replace-with-real-app-store-id
IOS_STORE_URL=https://apps.apple.com/app/idreplace-with-real-app-store-id
```

- Separate database, bucket, queue, and email behavior by environment. Staging must not email real users or use production data.
- Production: TLS, strict CORS, private data services, least privilege, sanitized logs, secret delivery outside git.
- Container runs as non-root and handles SIGTERM.
- `/health/live` is process liveness. `/health/ready` checks dependencies without leaking secrets.
- SMTP 465 is implicit TLS. Port 587 is STARTTLS. Do not disable certificate checks.
- Blank static AWS key fields must allow the SDK default credential chain.

## Testing

Tests use a temporary in-memory MongoDB created when the run starts and destroyed when the run ends, including on failure. Do not point tests at the development, staging, or production database.

- Jest for unit tests. Supertest plus Jest for API e2e.
- Contract checks for the success and error envelopes and for Swagger.
- Cover date and age rules, state transitions, reminder defaults and overrides, SemVer, validation limits, cross-user denial, bad Google tokens, overdue goals, late completion, letter recipient lock, photo caps, compression of a large image, equal padding when a photo ratio does not match, deletion of temporary and replaced objects, job retry without duplicate sends, update enforcement, Swagger hidden in production, and config failing closed on missing secrets.
- Coverage guidance is about 70–80% on meaningful branches, not a vanity percentage.
- Do not claim tests passed unless they were run.

## Security baseline

TLS. CORS allowlist. Rate limits. Body and upload limits. DTO allowlists. Secure refresh. No verbose production errors. Least-privilege IAM. Dependency audit in CI when CI exists. No secrets in source, fixtures, or logs. No Swagger in production.

## Open decisions

Implemented decisions: durable jobs use atomically leased MongoDB records
instead of Redis/BullMQ. Push delivery uses FCM for Android and iOS. Personal
exports are private ZIP files with a 15-minute URL and scheduled object cleanup.

Do not invent the operator's legal name, address, support email, jurisdiction, store ids, OAuth client ids, AWS or SMTP credentials, production URLs, retention periods, compliance claims, or trademark clearance. Letter email format defaults to a secure link until the owner says otherwise. Paid ad-free subscription is not in this build.

Legal pages are a separate owner work item and must match real behavior.

## Done

A feature is done when behavior and ownership checks exist, DTOs and Swagger match, tests were run and passed, errors use the envelope, logs are clean, `.env.example` and README are updated, and any gap or open decision is listed.

When the server is ready for the client, hand off the API base URL, Swagger location, auth and refresh flow, error schema, upload flow, date rules, update-policy behavior, and the commands that were run. Swagger and DTOs are the API source of truth. Do not ask the client to guess endpoints.
