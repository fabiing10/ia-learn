// Renders the mock apps in this folder to the deck's media files (slides v02, v03).
// Run from x10/: node talleres/vibecoding/presentacion/media-src/shoot.mjs [name…]
// The x10.expert home is shot from a local server: BASE=http://localhost:8080 (default).
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stat } from 'node:fs/promises';

const HERE = import.meta.dirname;
const OUT = resolve(HERE, '../public/media');
const BASE = process.env.BASE || 'http://localhost:8080';

const SHOTS = {
  'tablero-lovable': { page: 'tablero-lovable.html', width: 960, height: 618, dpr: 2 },
  'tablero-desde-spec': { page: 'tablero-desde-spec.html', width: 960, height: 426, dpr: 2 },
  'resultado-perezoso': { page: 'resultado-perezoso.html', width: 960, height: 426, dpr: 2 },
  // The x10.expert home (built with Claude Code): wait for the brain and the first quote.
  'proyecto-claude-code': { url: `${BASE}/`, width: 1280, height: 824, dpr: 1.25, ready: '.q__who.is-on', wait: 900 },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [name, s] of Object.entries(SHOTS)) {
    if (only.length && !only.includes(name)) continue;
    const page = await browser.newPage({
      viewport: { width: s.width, height: s.height },
      deviceScaleFactor: s.dpr,
      colorScheme: s.url ? 'dark' : 'light',
    });
    await page.goto(s.url ?? pathToFileURL(resolve(HERE, s.page)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    if (s.ready) await page.waitForSelector(s.ready, { timeout: 20000 });
    await page.waitForTimeout(s.wait ?? 200);
    const file = resolve(OUT, `${name}.png`);
    await page.screenshot({ path: file });
    console.log(`${name}.png ${Math.round((await stat(file)).size / 1024)} KB`);
    await page.close();
  }
} finally {
  await browser.close();
}
