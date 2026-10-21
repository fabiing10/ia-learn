// node --test src/gate/gate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { COOKIE, MAX_FAILS, token, readCookie, gateResponse, page, lockState, noteFailure, clearFailures } from './gate.js';

const URL_ = 'https://www.x10.expert/cerebro/presentacion/';
const SECRET = '1.234.567.890';
const PEPPER = 'b7d2c0e9f4a1c3e5d8f6a2b4c6e8d0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3';
const gate = (req, secret = SECRET, pepper = PEPPER) => gateResponse(req, secret, pepper);
const get = (cookie = '') => new Request(URL_, { headers: cookie ? { cookie } : {} });
const post = (clave, ip = '203.0.113.9') => new Request(URL_, { method: 'POST', body: new URLSearchParams({ clave }), headers: { 'x-forwarded-for': ip } });

test('the token is a stable hmac that ignores dots, dashes and spaces in the key, and changes with the secret', async () => {
  const a = await token(SECRET, PEPPER);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await token('1234567890', PEPPER));
  assert.notEqual(a, await token('1234567891', PEPPER));
  assert.notEqual(a, await token(SECRET, 'another-secret-of-at-least-thirty-two-chars'));
});

test('without a cookie secret, or a short one, the deck is closed', async () => {
  assert.equal((await gateResponse(get(), SECRET, '')).status, 503);
  assert.equal((await gateResponse(get(), SECRET, 'short')).status, 503);
  assert.match(await (await gateResponse(get(), SECRET, undefined)).text(), /DECK_COOKIE_SECRET/);
});

test('readCookie finds one cookie among several', () => {
  assert.equal(readCookie('a=1; cj_deck=abc=def; b=2', COOKIE), 'abc=def');
  assert.equal(readCookie('', COOKIE), '');
  assert.equal(readCookie(undefined, COOKIE), '');
});

test('without a configured key the deck is open (presenter decision, 21 Oct 2026); a key locks it', async () => {
  assert.equal(await gate(get(), ''), null);
  assert.equal(await gateResponse(get(), undefined, PEPPER), null);
  assert.equal((await gate(get(), SECRET)).status, 401);
});

test('a request without the cookie gets the lock screen, never the page', async () => {
  const res = await gate(get());
  assert.equal(res.status, 401);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const html = await res.text();
  assert.match(html, /Presentación de uso interno/);
  assert.match(html, /name="clave"/);
  assert.doesNotMatch(html, /1234567890/);
});

test('a request with the right cookie continues; a wrong cookie does not', async () => {
  assert.equal(await gate(get(`${COOKIE}=${await token(SECRET, PEPPER)}`)), null);
  const res = await gate(get(`${COOKIE}=deadbeef`));
  assert.equal(res.status, 401);
});

test('posting the right key sets the cookie and redirects back; a wrong key is refused', async () => {
  const ok = await gate(post('1234567890'));
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), '/cerebro/presentacion/');
  const cookie = ok.headers.get('set-cookie');
  assert.match(cookie, new RegExp(`^${COOKIE}=${await token(SECRET, PEPPER)}; Path=/cerebro/presentacion;`));
  assert.match(cookie, /HttpOnly; Secure; SameSite=Lax/);
  const bad = await gate(post('0000000000'));
  assert.equal(bad.status, 401);
  assert.match(await bad.text(), /Clave incorrecta/);
  const empty = await gate(post(''));
  assert.equal(empty.status, 401);
});

test('the lock page escapes what it echoes', () => {
  assert.doesNotMatch(page({ error: '<script>', action: '/x"' }), /<script>|action="\/x"/);
});

test('after too many wrong keys, further wrong keys get 429; the right key still enters (a shared venue IP cannot lock the presenter out)', async () => {
  clearFailures();
  const ip = '198.51.100.7';
  for (let i = 0; i < MAX_FAILS - 1; i++) assert.equal((await gate(post('0000000000', ip))).status, 401);
  const locked = await gate(post('0000000001', ip));
  assert.equal(locked.status, 429);
  assert.ok(Number(locked.headers.get('retry-after')) > 0);
  assert.match(await locked.text(), /Demasiados intentos/);
  assert.equal((await gate(post('0000000002', ip))).status, 429, 'stays locked for wrong keys');
  assert.equal((await gate(post('1234567890', ip))).status, 303, 'the right key always enters');
  // another client is unaffected
  assert.equal((await gate(post('0000000000', '198.51.100.8'))).status, 401);
  // the lock is forgotten once its time passes
  for (let i = 0; i < MAX_FAILS; i++) noteFailure(ip);
  assert.equal(lockState(ip, Date.now() + 16 * 60 * 1000).blocked, false);
  clearFailures();
});

test('a right key clears the failure count', async () => {
  clearFailures();
  const ip = '198.51.100.9';
  noteFailure(ip); noteFailure(ip);
  assert.equal((await gate(post('1234567890', ip))).status, 303);
  assert.equal(lockState(ip).blocked, false);
  for (let i = 0; i < MAX_FAILS - 1; i++) noteFailure(ip);
  assert.equal(lockState(ip).blocked, false, 'count restarted after success');
  clearFailures();
});
