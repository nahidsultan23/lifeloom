# Client

Expo (React Native, TypeScript) app under `client/`, Android and iOS from one codebase.

Brief: `.cursor/builds/client.md`. Handoff, gaps, and config the owner must supply: `client/docs/handoff.md`.

Open that brief for client work. Do not open the server brief.

## Slices

| Slice | Purpose | Entry point |
| --- | --- | --- |
| config | Dev, staging, production objects and the app config that picks one. | `client/src/config/environments.ts` |
| api | Typed client with refresh, retries, error mapping; endpoint list and models. | `client/src/api/client.ts` |
| session | Secure token store, Google sign-in, session events. | `client/src/session/tokenStore.ts` |
| state | Auth and update providers, resource and paging hooks. | `client/src/state/AuthContext.tsx` |
| lib | Date helper, limits and photo framing, ads rules, notifications, field errors. | `client/src/lib/dates.ts` |
| theme | Tokens and palette. Rules in `client/docs/design-system.md`. | `client/src/theme/tokens.ts` |
| components | Atomic folders: atoms, molecules, organisms, templates. | `client/src/components/` |
| screens | One file per flow; navigation in `client/src/navigation/`. | `client/src/App.tsx` |
| tests | Jest and Testing Library suites. | `client/__tests__/` |
