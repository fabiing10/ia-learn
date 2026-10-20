// Builds the whole platform into dist/: for every workshop in talleres.config.js,
// its QR codes, its deck (single file) and its web pages.
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'vite';
import { TALLERES } from '../talleres.config.js';
import { ROOT, deckConfig, webConfig, offlineConfig } from './vite-deck.js';
import { buildQr } from './build-qr.js';

// `node scripts/build.mjs vibecoding` builds one workshop without wiping the rest.
const only = process.argv[2];
if (!only) rmSync(resolve(ROOT, 'dist'), { recursive: true, force: true });

for (const t of TALLERES.filter((x) => !only || x.slug === only)) {
  console.log(`\n── ${t.slug} ──`);
  if (t.deck) {
    await buildQr(t);
    await build({ ...deckConfig(t.slug), configFile: false, logLevel: 'warn' });
    console.log(`deck  → ${t.deck.out}`);
  }
  if (t.web) {
    await build({ ...webConfig(t.slug), configFile: false, logLevel: 'warn' });
    console.log(`web   → ${t.web.out}`);
    for (const page of t.web.offline || []) {
      await build({ ...offlineConfig(t.slug, page), configFile: false, logLevel: 'warn' });
      console.log(`file  → ${t.web.out}/offline/${page}`);
    }
  }
}
