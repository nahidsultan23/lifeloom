# Server

NestJS REST backend under `server/`, with MongoDB persistence, private S3
media, durable jobs, and SMTP/FCM delivery.

Brief: `.cursor/builds/server.md`

Open that brief for server work. Do not open the client brief.

## Slices

| Slice | Purpose | Entry point |
| --- | --- | --- |
| foundation | Startup, validated configuration, API envelopes, health, Swagger, and database schemas. | `server/src/app.module.ts` |
| identity | Google exchange, rotating sessions, profile, timezone, and preferences. | `server/src/auth/auth.module.ts` |
| planning | Goals, reminder defaults, ledger snapshots, memories, and what-if paths. | `server/src/planning/planning.module.ts` |
| uploads | Type detection, photo framing, private S3 access, attachment caps, and cleanup. | `server/src/uploads/uploads.module.ts` |
| delivery | MongoDB job leasing, reminders, letters, SMTP, FCM, retries, and devices. | `server/src/delivery/delivery.module.ts` |
| privacy | ZIP export, account deletion, update checks, and protected-route enforcement. | `server/src/privacy/privacy.module.ts` |
