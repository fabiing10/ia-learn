// Generates the QR codes a deck shows, from its config.json.
// Targets: config.qr = { name: url }, plus legacy x10 keys and config.whatsapp.
// A value that is still a {{PLACEHOLDER}} produces a visible "pending" tile
// instead of a QR, so nobody scans a code that points nowhere.
// CLI: node scripts/build-qr.js [taller]   (default: every workshop)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import QRCode from 'qrcode';
import { TALLERES, tallerBySlug } from '../talleres.config.js';

const ROOT = resolve(import.meta.dirname, '..');

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

function targetsOf(config) {
  const wa = config.whatsapp;
  const legacy = {
    playbook: config.urlPlaybook,
    test: config.urlTest,
    site: config.urlSite,
  };
  const targets = Object.fromEntries(Object.entries(legacy).filter(([, v]) => v !== undefined));
  Object.assign(targets, config.qr || {});
  // WhatsApp chat with the presenter, pre-filled so the message says who wrote
  if (wa?.numero) targets.whatsapp = `https://wa.me/${wa.numero}?text=${encodeURIComponent(wa.mensaje || '')}`;
  return targets;
}

export async function buildQr(t) {
  const config = JSON.parse(await readFile(resolve(ROOT, t.deck.config), 'utf8'));
  const outDir = resolve(ROOT, t.deck.qr);
  await mkdir(outDir, { recursive: true });
  for (const [name, value] of Object.entries(targetsOf(config))) {
    let svg;
    if (isPlaceholder(value)) {
      svg = placeholderSvg(value || `{{URL_${name.toUpperCase()}}}`);
    } else {
      svg = await QRCode.toString(value, {
        type: 'svg',
        // Long links (WhatsApp) need fewer modules to scan from the back row
        errorCorrectionLevel: value.length > 80 ? 'L' : 'M',
        margin: 2,
        color: { dark: '#0B0F1A', light: '#FFFFFF' },
      });
      svg = svg.replace('<svg ', '<svg class="qr" role="img" aria-label="Código QR" ');
    }
    await writeFile(resolve(outDir, `${name}.svg`), svg);
    console.log(`qr ${t.slug}: ${name}.svg ${isPlaceholder(value) ? '(pendiente)' : '→ ' + value}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slug = process.argv[2];
  const list = slug ? [tallerBySlug(slug)] : TALLERES.filter((t) => t.deck);
  for (const t of list) await buildQr(t);
}
