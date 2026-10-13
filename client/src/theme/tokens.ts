// Design tokens. Documented in docs/design-system.md.
// No punitive red anywhere: attention states use amber and navy.

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  /** Required photo frame fill. Matches the server framing color. */
  frame: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  /** Gold used for text and small icons. Passes 4.5:1 on background. */
  accentText: string;
  /** Gold used for fills, borders and large shapes only. */
  accent: string;
  notice: string;
  onNotice: string;
}

export const light: Palette = {
  background: '#F6F1E7',
  surface: '#FFFDF8',
  surfaceAlt: '#ECE4D3',
  frame: '#F6F1E7',
  text: '#1B2A49',
  textMuted: '#4F586B',
  border: '#8A7F69',
  primary: '#1B2A49',
  onPrimary: '#F6F1E7',
  accentText: '#7A4F00',
  accent: '#C08A2B',
  notice: '#F3E2B8',
  onNotice: '#3A2800',
};

export const dark: Palette = {
  background: '#111A2E',
  surface: '#1B2A49',
  surfaceAlt: '#24365C',
  frame: '#F6F1E7',
  text: '#F6F1E7',
  textMuted: '#C2C9D6',
  border: '#7C8DB3',
  primary: '#E7BE6B',
  onPrimary: '#111A2E',
  accentText: '#E7BE6B',
  accent: '#E7BE6B',
  notice: '#4A3A14',
  onNotice: '#FBEFD0',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const type = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
};

/** Minimum touch target, in dp. */
export const touchTarget = 48;
