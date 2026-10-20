// Smoke test for the whole platform: serves dist/ and opens every route of every
// workshop in Chrome. Fails on HTTP errors, page errors, console errors (other
// than media the presenter still has to drop in) or a missing key element.
// Usage: npm run build && npm run smoke
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT) || 8099;
const BASE = `http://localhost:${PORT}`;

// Each check: route + what must be true once it has loaded.
const CHECKS = [
  // x10 (unchanged URLs)
  { path: '/', expect: { selector: 'main, body', text: 'Multiplica tus talentos' } },
  { path: '/presentacion/', expect: { count: ['.reveal .slides section[id]', 47], text: '×10' } },
  { path: '/test/', expect: { selector: '#email' } },
  { path: '/panel/', expect: { text: 'Panel en vivo' } },
  { path: '/playbook/', expect: { selector: '#rctf' } },
  // platform hub
  { path: '/talleres/', expect: { selector: 'a[href="/cerebro/"]' } },
  // Vibe Coding
  { path: '/vibecoding/', expect: { selector: '#salida form' } },
  { path: '/vibecoding/presentacion/', expect: { min: ['.reveal .slides section[id]', 30], text: '›vibe coding', count: ['.hud__bar .segbar__seg', 7] } },
  { path: '/vibecoding/playbook/', expect: { selector: '#ruta-a' } },
  { path: '/vibecoding/panel/', expect: { text: 'Panel' } },
  // Cerebro Jurídico
  { path: '/cerebro/', expect: { selector: '#construir' } },
  { path: '/cerebro/offline/', expect: { selector: '#construir' } },
  { path: '/cerebro/presentacion/', expect: { min: ['.reveal .slides section[id]', 24], text: '§cerebro jurídico', count: ['.hud__bar .segbar__seg', 6] } },
  { path: '/cerebro/playbook/', expect: { selector: '#verificar' } },
];

const IGNORED = /404|Failed to load resource/; // pending presenter media

function startServer() {
  const child = spawn(process.execPath, [resolve(root, 'scripts/serve.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return new Promise((ok, fail) => {
    child.stdout.on('data', (d) => d.toString().includes('lista') && ok(child));
    child.on('exit', (code) => fail(new Error(`server exited ${code}`)));
  });
}

async function check(page, { path, expect }) {
  const errors = [];
  const onError = (e) => errors.push(String(e));
  const onConsole = (m) => m.type() === 'error' && !IGNORED.test(m.text()) && errors.push(m.text());
  page.on('pageerror', onError);
  page.on('console', onConsole);
  const res = await page.goto(BASE + path, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const problems = [];
  if (!res || res.status() >= 400) problems.push(`HTTP ${res?.status()}`);
  if (expect.selector && !(await page.$(expect.selector))) problems.push(`missing ${expect.selector}`);
  if (expect.text && !(await page.textContent('body'))?.includes(expect.text)) problems.push(`missing text "${expect.text}"`);
  if (expect.count) {
    const n = await page.$$eval(expect.count[0], (els) => els.length);
    if (n !== expect.count[1]) problems.push(`${expect.count[0]}: ${n} (expected ${expect.count[1]})`);
  }
  if (expect.min) {
    const n = await page.$$eval(expect.min[0], (els) => els.length);
    if (n < expect.min[1]) problems.push(`${expect.min[0]}: ${n} (expected ≥ ${expect.min[1]})`);
  }
  problems.push(...errors);
  page.off('pageerror', onError);
  page.off('console', onConsole);
  return problems;
}

const server = await startServer();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let failed = 0;
try {
  for (const c of CHECKS) {
    const problems = await check(page, c);
    if (problems.length) failed++;
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${c.path}${problems.length ? '\n       ' + problems.join('\n       ') : ''}`);
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(failed ? `\n${failed} failing` : '\nall routes passing');
process.exit(failed ? 1 : 0);
