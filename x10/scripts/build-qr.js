// Generates the QR codes used in the slides from config.json.
// Runs automatically before `npm run dev` and `npm run build`.
// A value that is still a {{PLACEHOLDER}} produces a visible "pending" tile
// instead of a QR, so nobody scans a code that points nowhere.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(resolve(root, 'config.json'), 'utf8'));
const outDir = resolve(root, 'src/assets/qr');
await mkdir(outDir, { recursive: true });

const targets = {
  playbook: config.urlPlaybook,
  landing: config.urlLanding,
  demo: config.urlDemoApp,
};

const isPlaceholder = (v) => !v || /^\s*\{\{.*\}\}\s*$/.test(v);

function placeholderSvg(token) {
  const label = token.replace(/[{}]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="qr qr--pending" role="img" aria-label="QR pendiente: ${label}">
  <rect x="2" y="2" width="96" height="96" rx="6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3"/>
  <path d="M38 38 L62 62 M62 38 L38 62" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <text x="50" y="80" text-anchor="middle" font-size="6.2" font-family="Space Grotesk, sans-serif" fill="currentColor">{{${label}}}</text>
  <text x="50" y="22" text-anchor="middle" font-size="6" font-family="Space Grotesk, sans-serif" fill="currentColor">QR pendiente</text>
</svg>
`;
}

for (const [name, value] of Object.entries(targets)) {
  let svg;
  if (isPlaceholder(value)) {
    svg = placeholderSvg(value || `{{URL_${name.toUpperCase()}}}`);
  } else {
    svg = await QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      color: { dark: '#0B0F1A', light: '#FFFFFF' },
    });
    svg = svg.replace('<svg ', '<svg class="qr" role="img" aria-label="Código QR" ');
  }
  await writeFile(resolve(outDir, `${name}.svg`), svg);
  console.log(`qr: ${name}.svg ${isPlaceholder(value) ? '(pendiente)' : '→ ' + value}`);
}
