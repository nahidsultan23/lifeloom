import { dark, light, type Palette } from '../src/theme/tokens';

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [keyof Palette, keyof Palette][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['accentText', 'background'],
  ['accentText', 'surface'],
  ['onPrimary', 'primary'],
  ['onNotice', 'notice'],
  ['text', 'surfaceAlt'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s palette', (_name, palette) => {
  it.each(PAIRS)('%s on %s has at least 4.5:1 contrast', (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps form borders visible (3:1) against the surface', () => {
    expect(contrast(palette.border, palette.surface)).toBeGreaterThanOrEqual(3);
  });
});

it('uses the server framing color for the photo frame', () => {
  expect(light.frame).toBe('#F6F1E7');
  expect(dark.frame).toBe('#F6F1E7');
});

it('has no red anywhere in the palette', () => {
  for (const palette of [light, dark]) {
    for (const value of Object.values(palette)) {
      const n = parseInt(value.slice(1), 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      expect(r > 150 && g < 90 && b < 90).toBe(false);
    }
  }
});
