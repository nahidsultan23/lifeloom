# Lifeloom design system

Feel: thoughtful, warm, calm, trustworthy. No punitive red anywhere. Attention uses amber on cream and navy. All values live in `src/theme/tokens.ts` and are checked by `__tests__/theme.test.ts`.

## Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| background | `#F6F1E7` | `#111A2E` | Screen background |
| surface | `#FFFDF8` | `#1B2A49` | Cards, inputs |
| surfaceAlt | `#ECE4D3` | `#24365C` | Pills |
| text | `#1B2A49` | `#F6F1E7` | Body text |
| textMuted | `#4F586B` | `#C2C9D6` | Secondary text |
| primary / onPrimary | `#1B2A49` / `#F6F1E7` | `#E7BE6B` / `#111A2E` | Main button |
| accentText | `#7A4F00` | `#E7BE6B` | Gold used for text and small icons |
| accent | `#C08A2B` | `#E7BE6B` | Gold for fills, switches, large shapes only |
| notice / onNotice | `#F3E2B8` / `#3A2800` | `#4A3A14` / `#FBEFD0` | Calm inline messages, "Past its date" |
| border | `#8A7F69` | `#7C8DB3` | Control outlines (3:1 or better) |
| frame | `#F6F1E7` | `#F6F1E7` | Photo frame fill. Matches the server's framing color. |

Contrast: every text pair above is tested at 4.5:1 or better in both palettes, and borders at 3:1. The test fails if a token changes and drops below that.

## Type

System font, so no font licence is involved. Scale: display 30, title 22, heading 18, body 16, label 14 (semibold), caption 13. Text uses `maxFontSizeMultiplier` 1.6, so dynamic type scales but layouts stay intact.

## Spacing and shape

Spacing 4, 8, 12, 16, 24, 32. Radius 8, 14, 22. Minimum touch target 48 dp.

## Logo and icons

- One symbol: a gold sun over two woven threads (a horizon and a loom) on navy. Source: `assets/branding/logo-symbol.svg`. Everything is generated from it with `pnpm assets` (`scripts/generate-assets.mjs`).
- The symbol is its own navy tile, so one version works on light and dark backgrounds. There is no separate dark variant.
- Files: `icon.png` (iOS and Android legacy), `adaptive-icon.png` (Android foreground, art kept inside the middle 66%, navy `#1B2A49` background set in `app.config.ts`), `splash-icon.png` (on `#F6F1E7`), `logo-symbol.png` (in-app).
- Name is "Lifeloom". Do not call it a trademark.
- Interface icons are one family: Feather (`@expo/vector-icons`). Icons are decorative and hidden from screen readers. The button or text beside them carries the meaning.
- Empty states use an icon and words. No illustration set was needed.

## Component rules

- Atoms: `AppText`, `Button`, `Icon`, `Card`, `Pill`. Molecules: `TextField`, `DateField`, `ChoiceRow`, `ToggleRow`, `ConfirmDialog`, `Notice`, `StateViews`, `PhotoFramePreview`. Organisms: `AttachmentSection`, `GoalCard`, `TimelineItem`, `ReminderPicker`, `AdBanner`. Templates: `ScreenTemplate`, `FormTemplate`.
- One button style with three variants (primary, secondary, quiet). Destructive actions use the same look and always sit behind `ConfirmDialog`.
- State is never shown by color alone. Selected options show a check icon and a thicker border. Pills carry an icon and a word. Field errors use a thicker border and text.
- Wording: "Reschedule", "Let go", "Past its date", "Bring it back". Never "failed", "overdue" as a warning, or streak language.
- Forms keep their values on failure. Errors sit under the control they belong to and clear when the field is edited.
- Ads: only on About, through `AdBanner placement="About"`. See `src/lib/ads.ts`.
