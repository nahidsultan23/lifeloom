// Builds every branding image from one simple symbol: a sun over two woven
// threads (a horizon and a loom). Run with `pnpm assets`.
// Palette matches docs/design-system.md.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'branding');

const NAVY = '#1B2A49';
const CREAM = '#F6F1E7';
const GOLD = '#E0B25C';

const symbol = `
  <circle cx="512" cy="372" r="118" fill="${GOLD}"/>
  <path d="M168 640 C 320 500, 440 500, 512 640 S 704 780, 856 640" stroke="${CREAM}" stroke-width="58" fill="none" stroke-linecap="round"/>
  <path d="M168 640 C 320 780, 440 780, 512 640 S 704 500, 856 640" stroke="${GOLD}" stroke-width="58" fill="none" stroke-linecap="round"/>
`;

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${body}</svg>`;

const tile = (radius) =>
  svg(`<rect width="1024" height="1024" rx="${radius}" fill="${NAVY}"/>${symbol}`);

// Android adaptive icons keep important art inside the middle 66%.
const adaptive = svg(`<g transform="translate(512 512) scale(0.64) translate(-512 -512)">${symbol}</g>`);

const outputs = [
  { file: 'icon.png', svg: tile(0), size: 1024 },
  { file: 'adaptive-icon.png', svg: adaptive, size: 1024 },
  { file: 'splash-icon.png', svg: tile(224), size: 512 },
  { file: 'logo-symbol.png', svg: tile(224), size: 512 },
];

await mkdir(root, { recursive: true });
await writeFile(join(root, 'logo-symbol.svg'), tile(224));
for (const out of outputs) {
  await sharp(Buffer.from(out.svg)).resize(out.size, out.size).png().toFile(join(root, out.file));
  console.log('wrote', out.file);
}
