// Password gate for presenter-only pages (the Cerebro deck). Pure functions on
// the web Request/Response API so middleware.js stays a two-liner and this file
// can be tested in Node. The key is the DECK_PASSWORD environment variable; the
// cookie carries an HMAC of it under DECK_COOKIE_SECRET (a long random value),
// so a leaked cookie cannot be brute-forced back into the ten-digit key and
// rotating the secret logs every browser out.

export const COOKIE = 'cj_deck';
const MAX_AGE = 60 * 60 * 14; // 14 hours: the day of the workshop
const HTML = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' };

// A ten-digit key is guessable without a brake. Failed attempts are counted per
// client in this instance's memory (best effort: Vercel may run several) and
// the client is locked out for a while after too many. Pair it with a rate-limit
// rule in the Vercel firewall for a global limit.
export const MAX_FAILS = 8;
export const LOCK_MS = 15 * 60 * 1000;
const fails = new Map();

export function clientId(request) {
  const h = request.headers;
  return (h.get('x-real-ip') || h.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

/** Lock state for a client: { blocked, retryAfterS }. Expired locks are forgotten. */
export function lockState(id, now = Date.now()) {
  const f = fails.get(id);
  if (!f) return { blocked: false, retryAfterS: 0 };
  if (f.until && f.until <= now) {
    fails.delete(id);
    return { blocked: false, retryAfterS: 0 };
  }
  return { blocked: Boolean(f.until), retryAfterS: f.until ? Math.ceil((f.until - now) / 1000) : 0 };
}

export function noteFailure(id, now = Date.now()) {
  const f = fails.get(id) ?? { count: 0, until: 0 };
  f.count += 1;
  if (f.count >= MAX_FAILS) f.until = now + LOCK_MS;
  fails.set(id, f);
  if (fails.size > 5000) fails.delete(fails.keys().next().value);
  return f;
}

export const clearFailures = (id) => (id == null ? fails.clear() : fails.delete(id));

const normalize = (s) => String(s ?? '').replace(/[\s.\-]/g, '');

/** Hex HMAC-SHA256 of the key under the cookie secret; the cookie value. */
export async function token(secret, cookieSecret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(String(cookieSecret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`cerebro-deck:${normalize(secret)}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function readCookie(header, name) {
  for (const part of String(header ?? '').split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return '';
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** The lock screen: one field, Spanish, no branding beyond the mark. */
export function page({ error = '', action = '' } = {}) {
  return `<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Uso interno · Cerebro Jurídico</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0B0F1A; color: #E8E6F0; font: 500 17px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width: min(420px, calc(100vw - 32px)); padding: 32px 28px; border: 1px solid #2A2F45; border-radius: 20px; background: #121729; }
  .mark { font-size: 15px; letter-spacing: .02em; color: #9D86FF; margin: 0 0 14px; }
  h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: -.01em; }
  p { margin: 0 0 20px; color: #A6A9BC; }
  label { display: block; font-size: 14px; color: #A6A9BC; margin-bottom: 8px; }
  input { width: 100%; box-sizing: border-box; padding: 14px 16px; font: inherit; font-size: 18px; letter-spacing: .08em; color: #fff; background: #0B0F1A; border: 1.5px solid #3A4060; border-radius: 12px; outline: none; }
  input:focus { border-color: #9D86FF; box-shadow: 0 0 0 4px rgba(157,134,255,.25); }
  button { margin-top: 16px; width: 100%; padding: 14px; font: inherit; font-weight: 600; color: #0B0F1A; background: #9D86FF; border: 0; border-radius: 12px; cursor: pointer; }
  .err { margin: 12px 0 0; color: #FF8A80; font-size: 14px; }
</style>
</head>
<body>
<main>
  <p class="mark">§ cerebro jurídico</p>
  <h1>Presentación de uso interno</h1>
  <p>Esta página es solo para el expositor.</p>
  <form method="post" action="${esc(action)}" autocomplete="off">
    <label for="clave">Clave</label>
    <input id="clave" name="clave" type="password" inputmode="numeric" autocomplete="off" autofocus required />
    <button type="submit">Entrar</button>
    ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ''}
  </form>
</main>
</body>
</html>
`;
}

/**
 * Decides what to do with a request to a protected path. Returns null when the
 * request may continue to the page, or the Response to send instead.
 */
export async function gateResponse(request, secret, cookieSecret) {
  const url = new URL(request.url);
  const action = url.pathname + url.search;
  // No key configured: the deck is open. Decided by the presenter on 21 Oct 2026
  // (no terminal at hand to set DECK_PASSWORD); setting the variable and
  // redeploying locks it without a code change.
  if (!normalize(secret)) return null;
  if (String(cookieSecret ?? '').length < 32) {
    return new Response(page({ error: 'Secreto de sesión no configurado: define DECK_COOKIE_SECRET en Vercel.', action }), { status: 503, headers: HTML });
  }
  const expected = await token(secret, cookieSecret);
  if (request.method === 'POST') {
    const id = clientId(request);
    const lock = lockState(id);
    if (lock.blocked) {
      return new Response(page({ error: `Demasiados intentos. Vuelve a intentarlo en ${Math.ceil(lock.retryAfterS / 60)} minutos.`, action }), {
        status: 429,
        headers: { ...HTML, 'Retry-After': String(lock.retryAfterS) },
      });
    }
    let clave = '';
    try {
      const form = await request.formData();
      clave = normalize(form.get('clave'));
    } catch {
      clave = '';
    }
    if (clave && safeEqual(clave, normalize(secret))) {
      clearFailures(id);
      return new Response(null, {
        status: 303,
        headers: {
          Location: action,
          'Set-Cookie': `${COOKIE}=${expected}; Path=/cerebro/presentacion; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    noteFailure(id);
    await new Promise((r) => setTimeout(r, 800)); // slow every wrong guess down
    return new Response(page({ error: 'Clave incorrecta.', action }), { status: 401, headers: HTML });
  }
  if (readCookie(request.headers.get('cookie'), COOKIE) === expected) return null;
  return new Response(page({ action }), { status: 401, headers: HTML });
}
