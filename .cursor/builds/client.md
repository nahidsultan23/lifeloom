# Lifeloom client brief

**Status:** First build done under `client/` (Expo SDK 54). Gaps, config the owner must supply, and what was and was not verified are in `client/docs/handoff.md`.  
**Build order:** Build the client after the server. Do not open `.cursor/builds/server.md` for client work. Use the server's Swagger and DTOs as the API contract.  
**Stack:** React Native, TypeScript, pnpm, Android and iOS from one codebase. Expo is preferred if the native integrations this brief needs are supported. Verify that before committing to Expo.

Search this file for the feature you are changing. Read that section. Do not load the server brief.

## Now, not later

These are in the first client build, once the server exposes them:

- Future-self letters with scheduled delivery and optional email or in-app notification
- Photo and audio attachments for letters and memories
- What-if timelines, alternative life paths, and retrospective time travel

Still later: goal chapters, nested goals, richer timeline browsing, optional AI planning, paid ad-free subscription.

If the server does not expose one of these yet, do not fake a working screen. A coming-later state needs an explicit owner request.

## Product

Lifeloom helps people plan and reflect without shame. Philosophy: "Look ahead. Live in the present. Look back."

Missed, postponed, abandoned, or changed goals are normal. Do not use punitive red states, guilt, streak pressure, or failure copy. Prefer "Reschedule", "Let go", and "Fulfilled differently". A lifespan countdown is optional and must be framed gently. Never imply the app predicts death.

The owner will not supply a logo or design files. Create the visual identity in the repo and wire the real files into the app.

## Working method

1. Read `.cursor/maps/client.md`, then the section of this file the task needs.
2. Inspect Swagger before wiring a feature. Do not invent endpoints, fields, enums, error codes, or envelopes.
3. If Swagger is not up yet, use isolated labeled types and replace them before calling the feature integrated.
4. Add tests with each feature. Report only checks you actually ran.
5. Do not invent production URLs, OAuth client ids, package ids, store ids, support contacts, or legal text.
6. iOS is not a later port. Keep feature parity unless a platform limit is documented.

## Config

No `.env` and no `.env.example` in the client. Public settings live in a checked-in config module, for example `src/config.ts`, with separate development, staging, and production values.

That file may hold the API base URL, Google OAuth client ids, Android package id, iOS bundle id, AdMob app and test ad-unit ids, store URLs, and notification flags. Treat every value in the app as visible to the user.

Do not put AWS credentials, SMTP credentials, JWT secrets, or private API keys in the client. Secrets stay on the server.

Document which config object a build uses. Release builds must not ship debug menus, verbose sensitive logs, or development endpoints. Use test ad units in development. Do not point a production build at staging data.

## Structure

Use atomic design where a screen is made of reusable pieces:

- `src/components/atoms`
- `src/components/molecules`
- `src/components/organisms`
- `src/components/templates`
- `src/screens`

Leave a one-off layout whole when atomic folders would only add empty layers. Keep API mapping out of presentational components. Share design tokens. Do not restyle the same button screen by screen.

Suggested other folders, adapted if the app already has a layout: `src/theme`, `src/api`, `assets/branding`, `assets/icons`, `assets/illustrations`, `docs/design-system.md`.

## Brand

Name: Lifeloom. Feel: thoughtful, warm, calm, trustworthy. A woven thread, journey, or horizon is optional and must stay simple at small sizes.

Starting palette direction: warm ivory or cream, deep navy, restrained gold or amber. Document the final accessible palette. Do not claim the name is trademarked. Do not copy another brand or use unlicensed fonts or art.

Create the assets the real app needs: logo and symbol, light and dark variants where used, Android adaptive icon, iOS icon, splash screens, a consistent interface icon set, and empty-state art only where it helps. Store and web graphics only if those surfaces are in the deliverable.

`docs/design-system.md` records palette, type, logo usage, icons, spacing, and component rules. Check contrast. Do not use color alone for state.

## Screens

Cover these flows. Do not add screens that the product does not need.

- Welcome, Google sign-in, required consent. No full-screen ad on onboarding or sign-in.
- Profile: required editable birth date, optional removable expected lifespan, time zone, notification preferences, email as the server reports it, privacy, export, deletion, ad consent, version.
- Home: calm overview and an empty state. Lifespan only if the user set it.
- Goals: list, create, edit, detail. Title, optional notes and why-it-matters, deadline type, optional preparation and milestones if the API supports them. Actions: reschedule, leave overdue, complete late, let go, archive, delete, fulfilled differently. Confirm destructive actions. Keep typed input after a recoverable error.
- Life ledger: chronological events, historical snapshots from the API, edit and delete only where the API allows. Editing a goal must not rewrite history.
- What-if paths: create and view an alternative path the user writes. No AI. Stay within the photo cap from the API.
- Retrospective time travel: show the stored snapshot for a past point. Do not reconstruct it from the current goal.
- Letters: compose, preview, attach allowed photo or audio, pick a date or future age, email toggle, delivery status, edit or cancel only through the API.
- Notifications: explain the ask, allow changes, handle denied and revoked permission, and do not trap the user in prompts.
- App update: optional and required, as below.

## API

- Typed models and one API client. Base URL comes from the config module.
- Timeouts, cancellation, and safe retries. Do not retry a non-idempotent write unless the API documents idempotency.
- Refresh and logout in one place. No refresh loop.
- Map `fieldErrors` paths, including `milestones.0.title`, onto the matching control. Show the server's human message under that field. Do not echo camelCase field names.
- Handle 401, 403, 404, 409, 422, 429, 500, and 503 on purpose.
- Never show stack traces, database errors, or server internals.
- Preserve form values on failure. Clear stale errors when the field is fixed or the submit succeeds.
- Pagination, date-only values, and UTC instants follow Swagger.

Error shape to expect, unless Swagger differs:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": {
      "deadline": [{ "code": "INVALID_DATE", "message": "Enter a valid date." }]
    },
    "requestId": "optional-correlation-id"
  }
}
```

## Input limits

Enforce these in the UI so people get immediate feedback. The server still rejects anything past the limit. Do not raise these on the client.

| Input | Max |
| --- | --- |
| Display name | 80 characters |
| Goal or what-if title | 120 characters |
| Milestone title | 120 characters |
| Notes, why-it-matters, timeline note, what-if description | 2,000 characters |
| Letter body | 10,000 characters |
| Search query | 100 characters |

| Feature | Photos | Audio |
| --- | --- | --- |
| Avatar | 1 | 0 |
| Letter | 5 | 3 |
| Memory or timeline record | 5 | 3 |
| What-if path | 3 | 0 |

Images may be JPEG, PNG, or WebP. Audio may be MPEG, MP4, or WebM, up to 15 MB. Required frame: avatar `1:1`, letter, memory, and what-if photos `4:3`.

Before the upload is sent, show the framed photo and the required ratio, for example "Required ratio 4:3". Fit the whole photo inside that frame without cropping or changing its ratio. Scale uniformly to the edge that fits, width or height. Fill the leftover space with `#F6F1E7`, split equally on both sides. The user can cancel and choose another photo. Cancel sends nothing.

The server stores that same framing and compresses the file. The client preview does not replace that. Show upload progress, retry, and the server's rejection when a cap is hit. Do not keep a local temporary file after the upload attempt finishes.

## Auth

Official Google Sign-In for the chosen React Native setup. Separate Android and iOS client ids in the config module. Send the Google ID token to the server. Do not treat client claims as proof. Never ask for the Google password. Store Lifeloom session tokens in platform secure storage, not plain AsyncStorage. Test success, cancel, invalid token, network failure, expired session, and logout on both platforms.

## Time and notifications

Show times in the app's local timezone. Send that IANA zone to the server so a later device still has it. Date-only deadlines display as calendar dates and must not shift a day. Age and leap-day math follows the API. Use one tested date helper.

Goals and to-dos show a default frequency that matches the server:

| Time until deadline | Default |
| --- | --- |
| No deadline | No automatic reminder |
| More than 365 days | Monthly |
| 90 to 365 days | Every 14 days |
| 30 to 89 days | Weekly |
| 7 to 29 days | Every 2 days |
| Fewer than 7 days | Daily |

The user can change or disable this at any time. The saved value comes from the server, so a device change does not reset it. Do not promise that the operating system will deliver at the exact minute. Notification text stays discreet. Do not put letter text or private notes on the lock screen. Support Android channels and iOS permission, and recheck permission when the app resumes.

## Letters and memories

Email and in-app notification default on when the feature is available. The user can turn email off. There is no recipient field. Email goes to the verified account email. Say that delivery is best effort. Default email content is a secure link until the owner decides otherwise. Keep letter text out of ads, analytics, crash logs, and URLs.

## Ads

Use the official AdMob integration if it works on both platforms in this toolchain. Banners or native ads only in calm, non-sensitive places. Interstitials only at natural transitions. Never on onboarding, sign-in, goal edit, letter compose or view, notification open, or beside personal content. Never over a form, confirmation, error, or essential control. Never pass goals, letters, timeline text, birth date, or lifespan into the ad SDK. Missing consent is not consent. Ad failure must not block the app. Do not build a paywall.

## Updates

Check the public update endpoint on startup, before sign-in, and again when the app resumes from the store. Optional updates offer Update and Not now, and must not appear on every screen. Required updates explain that the version is unsupported, offer Update, and block normal navigation. There is no dismiss or back bypass. A failed check does not lock the app when no mandatory policy is already known. A known unsupported version stays blocked if the next check fails. Handle `APP_UPDATE_REQUIRED` from protected APIs. Keep maintenance mode separate. Use store ids from config and the server policy. Do not invent them. Opening the store does not prove the update was installed.

## Privacy

Link owner-supplied legal pages when they exist. Do not write fake policy text. Export and deletion need progress, consequences, and confirmation. Sign-out is not deletion. Do not say data is erased before the server says the job finished. Do not log private content.

## UX baseline

Loading, empty, offline, error, and retry states. Confirmation for destructive actions. Accessible names, contrast, dynamic type, safe areas, and reduced motion where practical. Centralize strings. Do not use sample data as if it belonged to the user. Avoid optimistic UI for hard-to-reverse actions unless rollback is reliable.

## Testing

Jest and React Native Testing Library. Maestro or Detox for a small set of device flows. Mock the API in UI tests, and check contracts against OpenAPI.

Cover date display, field errors, update screens, form limits, notification settings, ad placement rules, and the absence of personal content in ad props. Device flows: sign-in and sign-out, profile, create and edit a goal, deadline-free goal, overdue reschedule, late completion, let go, archive or delete, fulfilled differently, timeline matches the server, what-if create, letter compose within the attachment caps, reminder change, optional update skip, required update block, export and deletion confirmation, and a retry after a dropped network.

Use test accounts. Do not use production data. A test file is not a passing test. Report the commands you ran. iOS builds need macOS/Xcode or a cloud builder. Say so if that was not available.

## Done

A feature is done when it works on Android and iOS or names a real platform limit, uses the live contract, handles loading and failure, meets the privacy and accessibility rules, tests were run, and the config and design-system notes are current.

Handoff lists screens, Android and iOS status, endpoints and the Swagger that was checked, config values the owner must supply, commands and results, and anything still unfinished. Do not call the app store-ready until release builds, consent, legal pages, and the server integration were actually verified.
