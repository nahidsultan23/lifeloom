# Client handoff

Expo (SDK 54) + React Native + TypeScript, one codebase for Android and iOS. It uses a development build, not Expo Go, because Google Sign-In, AdMob, and secure storage are native modules. Expo was checked and supports every native integration the brief needs (Google Sign-In and AdMob through config plugins).

## Config

`src/config/environments.ts` holds the development, staging, and production objects. `app.config.ts` picks one with the `APP_VARIANT` environment variable at build time (`development` by default), and the app reads it back through `src/config/index.ts`. There is no `.env` file.

Values the owner must supply (empty today, never guessed):

| Value | Where |
| --- | --- |
| `apiBaseUrl` for staging and production, including `/api/v1` | `environments.ts` |
| `googleWebClientId` (the audience the server accepts), `googleIosClientId`, `googleIosUrlScheme` | `environments.ts` |
| `androidPackageId`, `iosBundleId`, `iosAppIdentifier` (must equal the server's `ANDROID_PACKAGE_ID` and `IOS_APP_STORE_ID`) | `environments.ts` |
| Production AdMob app ids and banner unit ids | `environments.ts` (development and staging use Google's public test ids) |
| `privacyPolicyUrl`, `termsUrl`, `supportUrl` | `environments.ts` (links hide until set; no policy text is written in the app) |

The development API address is `http://localhost:3000/api/v1`. On an Android emulator run `adb reverse tcp:3000 tcp:3000`. Cleartext HTTP is enabled for development builds only.

A build with an empty `apiBaseUrl` shows a "no server address" screen instead of running against a guess.

## Screens

Welcome with required consent and Google sign-in (no ad), Home (overview, empty state, optional lifespan, optional update notice), Goals (list, filter, search, create, edit, detail), Life ledger, Snapshot ("As it was", the stored record), Memories, What-if paths (list, create, edit, detail), Letters (compose, preview, schedule, detail, cancel), Profile (avatar, name, birth date, lifespan, time zone, email), Notifications, Privacy and data (export, deletion, policy links), About (version, ad choices, the only ad), and the Required update screen.

## Endpoints used

All paths are under `/api/v1` and were read from the server's controllers and DTOs in `server/src` (Swagger runs only in development and staging, so it was not served during this build). Types are in `src/api/types.ts`.

`POST /auth/google`, `/auth/refresh`, `/auth/logout`. `GET` and `PATCH /profile`. `GET /goals`, `POST /goals`, `GET`, `PATCH`, `DELETE /goals/:id`, `POST /goals/:id/status`. `GET /timeline`, `POST /timeline/memories`, `DELETE /timeline/memories/:id`. `GET`, `POST /what-if-paths`, `PATCH`, `DELETE /what-if-paths/:id`. `GET`, `POST /letters`, `GET`, `PATCH`, `DELETE /letters/:id`. `POST /uploads?purpose=`, `GET /uploads/:id/access`, `POST /uploads/:id/attach/:type/:parentId`, `DELETE /uploads/:id`. `POST /devices`, `DELETE /devices/:token`. `GET /privacy/export`, `DELETE /privacy/account`. `GET /app-updates/check`.

Where the server differs from the client brief, the client follows the server:

- `fieldErrors` is `{ path: "message" }`, not a list of `{ code, message }`.
- Mongo documents arrive with `_id`.
- Goal and letter `PATCH` take the whole input, so edit forms send every field.
- Protected requests carry `x-app-platform`, `x-app-version`, `x-app-build`, and `x-app-identifier`, which the server's update guard requires.

## Gaps against the brief (server does not expose these yet)

- **Fulfilled differently** has no server status (`active`, `completed`, `abandoned`, `archived` only), so there is no such action. Not faked.
- **Milestones** are accepted by the server as untyped objects with no documented shape, so there is no milestone UI.
- **Notification preferences** beyond per-goal reminders: the profile stores a free-form object but the server does not read it, so no global toggle is shown. Reminder frequency per goal is real.
- **Memory, what-if, and letter "get one"** routes do not exist. The client finds a single record by walking the list.
- **iOS push**: the server sends through FCM. Android's device token is an FCM token and is registered. iOS gives an APNs token, which the server cannot use without Firebase on iOS, so nothing is registered there and the screen says so.
- **Interstitial ads** are not built. Only one banner on About.
- A letter's attachments can only be added after it is saved, because the attach route needs the letter id.

## Checks that were run

- `pnpm typecheck` passes.
- `pnpm test` passes: 9 suites, 128 tests (dates and time zones, limits and photo framing, API client including refresh, retry and error mapping, field errors, palette contrast, ad placement and ad props, form behavior, update screens and provider, notification settings).
- `expo export` produced an Android and an iOS JavaScript bundle.

## Not verified

- No Android or iOS device or emulator run, so sign-in, uploads, audio, notifications, ads, and the update flow were not exercised on a device. No Maestro or Detox flows were written.
- No iOS build: that needs macOS and Xcode or a cloud builder.
- The app was not run against a live server. Contract mapping comes from reading the server source.
- Not store-ready: release builds, consent, owner legal pages, and server integration are unverified.

## Commands

```
pnpm install
pnpm start             # opens the app in a browser at http://localhost:8081
pnpm typecheck
pnpm test
pnpm assets            # regenerate branding images
APP_VARIANT=staging pnpm exec expo prebuild
pnpm android           # development build, needs Android SDK
pnpm ios               # needs macOS
```
