// Plain node test, no framework: `node talleres/vibecoding/web/shared/salida.test.mjs`
// Exit form (formulario de salida): payload, row, validation, and what the
// panel derives from the rows (distribution, mesas for class 2, CSV).

import assert from 'node:assert/strict';
import {
  WORKSHOP, FORM, DEFAULT_SESSION, PAYLOAD_KEYS, cleanSession, normalizeUrl, validateSalida,
  buildPayload, buildRow, readSubmission, aggregate, groupForClase2, toCSV,
} from './salida.js';

let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${err.message.split('\n').join('\n       ')}`);
  }
};

const FORM_OK = {
  nombre: '  Ana María  ',
  url_app: 'ana-tablero.lovable.app',
  url_repo: 'github.com/ana/tablero',
  duda: '¿Cómo agrego un filtro por estado?',
  punto_control: '5',
  consent: true,
};

console.log('\nPayload');

test('payload has exactly the five contract keys', () => {
  const p = buildPayload(FORM_OK);
  assert.deepEqual(Object.keys(p), ['nombre', 'url_app', 'url_repo', 'duda', 'punto_control']);
  assert.deepEqual(PAYLOAD_KEYS, Object.keys(p));
});

test('punto_control becomes an integer 1–5', () => {
  for (const v of ['1', 2, '3', 4, ' 5 ']) {
    const p = buildPayload({ ...FORM_OK, punto_control: v });
    assert.ok(Number.isInteger(p.punto_control), `from ${JSON.stringify(v)}`);
    assert.ok(p.punto_control >= 1 && p.punto_control <= 5);
  }
  assert.equal(buildPayload({ ...FORM_OK, punto_control: '3' }).punto_control, 3);
});

test('punto_control outside 1–5 or not an integer is refused', () => {
  for (const v of [0, 6, '2.5', 'abc', '', null, undefined]) {
    assert.throws(() => buildPayload({ ...FORM_OK, punto_control: v }), RangeError, `accepted ${JSON.stringify(v)}`);
  }
});

test('text is trimmed and links get https:// when typed without it', () => {
  const p = buildPayload(FORM_OK);
  assert.equal(p.nombre, 'Ana María');
  assert.equal(p.url_app, 'https://ana-tablero.lovable.app');
  assert.equal(p.url_repo, 'https://github.com/ana/tablero');
});

test('empty links are null, extra fields never leak into the payload', () => {
  const p = buildPayload({ ...FORM_OK, url_app: ' ', url_repo: '', consent: true, email: 'x@y.co', punto_control: 2 });
  assert.equal(p.url_app, null);
  assert.equal(p.url_repo, null);
  assert.equal(Object.keys(p).length, 5);
});

test('long text is capped so the row stays under the table size check', () => {
  const p = buildPayload({ ...FORM_OK, nombre: 'a'.repeat(500), duda: 'b'.repeat(5000) });
  assert.ok(p.nombre.length <= 80);
  assert.ok(p.duda.length <= 1000);
  assert.ok(JSON.stringify(p).length < 8000);
});

test('row = workshop vibecoding, form salida, session, payload and consent_at', () => {
  const row = buildRow(FORM_OK, { session: 'qa-agent-a', consentAt: '2026-10-19T20:00:00.000Z' });
  assert.deepEqual(Object.keys(row).sort(), ['consent_at', 'form', 'payload', 'session', 'workshop']);
  assert.equal(row.workshop, 'vibecoding');
  assert.equal(row.form, 'salida');
  assert.equal(WORKSHOP, 'vibecoding');
  assert.equal(FORM, 'salida');
  assert.equal(row.session, 'qa-agent-a');
  assert.equal(row.consent_at, '2026-10-19T20:00:00.000Z');
  assert.deepEqual(row.payload, buildPayload(FORM_OK));
});

test('row without consent is refused', () => {
  assert.throws(() => buildRow({ ...FORM_OK, consent: false }, { session: 'clase-1' }));
});

test('row consent_at defaults to now as ISO', () => {
  const row = buildRow(FORM_OK, {});
  assert.ok(!Number.isNaN(Date.parse(row.consent_at)));
  assert.equal(row.session, DEFAULT_SESSION);
});

console.log('\nSession');

test('session: slug [a-z0-9-] up to 40, default clase-1', () => {
  assert.equal(DEFAULT_SESSION, 'clase-1');
  assert.equal(cleanSession(null), 'clase-1');
  assert.equal(cleanSession(''), 'clase-1');
  assert.equal(cleanSession('qa-agent-a'), 'qa-agent-a');
  assert.equal(cleanSession('Grupo-B'), 'grupo-b');
  assert.equal(cleanSession('no válida!'), 'clase-1');
  assert.equal(cleanSession('a'.repeat(41)), 'clase-1');
  assert.equal(cleanSession('-x'), 'clase-1');
});

console.log('\nLinks and validation');

test('accepts lovable and github links with or without https', () => {
  for (const u of [
    'https://ana-tablero.lovable.app',
    'ana-tablero.lovable.app',
    'https://lovable.dev/projects/0b1c2d3e-aaaa-bbbb-cccc-1234567890ab',
    'preview--tablero.lovable.app/solicitudes',
    'https://github.com/ana/tablero',
    'github.com/ana/tablero',
    'http://localhost.example.com:8080/x',
  ]) {
    assert.ok(normalizeUrl(u), `rejected ${u}`);
  }
});

test('refuses things that are not web links', () => {
  for (const u of ['javascript:alert(1)', 'hola mundo', 'ftp://x.com/a', 'lovable', 'https://', 'data:text/html,x', 'mailto:a@b.co']) {
    assert.equal(normalizeUrl(u), null, `accepted ${u}`);
  }
});

test('valid form has no errors', () => {
  assert.deepEqual(validateSalida(FORM_OK).errors, {});
});

test('requires nombre, duda, punto de control and consent', () => {
  const { errors } = validateSalida({ nombre: ' ', url_app: '', url_repo: '', duda: '', punto_control: '', consent: false });
  assert.deepEqual(Object.keys(errors).sort(), ['consent', 'duda', 'nombre', 'punto_control']);
});

test('links are optional before publishing, required once published (4) or connected (5)', () => {
  const base = { ...FORM_OK, url_app: '', url_repo: '' };
  assert.deepEqual(validateSalida({ ...base, punto_control: '2' }).errors, {});
  assert.deepEqual(Object.keys(validateSalida({ ...base, punto_control: '4' }).errors), ['url_app']);
  assert.deepEqual(Object.keys(validateSalida({ ...base, punto_control: '5' }).errors).sort(), ['url_app', 'url_repo']);
});

test('a typed link that is not a link is an error even when optional', () => {
  const { errors } = validateSalida({ ...FORM_OK, punto_control: '1', url_app: 'mi app', url_repo: '' });
  assert.ok(errors.url_app);
});

test('a repository outside github.com is a soft warning, not an error', () => {
  const r = validateSalida({ ...FORM_OK, url_repo: 'https://gitlab.com/ana/tablero' });
  assert.deepEqual(r.errors, {});
  assert.ok(r.warnings.url_repo);
});

console.log('\nPanel');

const rows = [
  { id: 'a', created_at: '2026-10-19T20:00:00Z', session: 'clase-1', payload: { nombre: 'Ana', url_app: 'https://a.lovable.app', url_repo: 'https://github.com/a/a', duda: 'd1', punto_control: 5 } },
  { id: 'b', created_at: '2026-10-19T20:01:00Z', session: 'clase-1', payload: { nombre: 'Beto', url_app: null, url_repo: null, duda: 'd2', punto_control: 1 } },
  { id: 'c', created_at: '2026-10-19T20:02:00Z', session: 'clase-1', payload: { nombre: 'Caro', url_app: 'https://c.lovable.app', url_repo: null, duda: 'd3', punto_control: 4 } },
  { id: 'd', created_at: '2026-10-19T20:03:00Z', session: 'clase-1', payload: { nombre: 'Dani', url_app: 'https://d.lovable.app', url_repo: null, duda: 'd4', punto_control: 5 } },
  { id: 'e', created_at: '2026-10-19T20:04:00Z', session: 'clase-1', payload: { nombre: 'Eli', url_app: null, url_repo: null, duda: 'd5', punto_control: '2' } },
];

test('readSubmission never lets an unsafe link through', () => {
  const r = readSubmission({ id: 'x', created_at: 'now', payload: { nombre: '<b>x</b>', url_app: 'javascript:alert(1)', url_repo: 'https://github.com/a/b', duda: 7, punto_control: '9' } });
  assert.equal(r.url_app, null);
  assert.equal(r.url_repo, 'https://github.com/a/b');
  assert.equal(r.duda, '7');
  assert.equal(r.punto, null);
  assert.equal(r.nombre, '<b>x</b>', 'escaping is the renderer job; the value stays as typed');
  assert.equal(readSubmission({ payload: null }).nombre, '');
});

test('aggregate counts total and the distribution by punto de control', () => {
  const agg = aggregate(rows.map(readSubmission));
  assert.equal(agg.total, 5);
  assert.deepEqual(agg.byPunto, { 1: 1, 2: 1, 3: 0, 4: 1, 5: 2 });
});

test('mesas: 1–2 no funciona, 3–4 quiero agregar, 5 with repo abrir la caja', () => {
  const g = groupForClase2(rows.map(readSubmission));
  assert.deepEqual(g['no-funciona'].map((r) => r.nombre), ['Beto', 'Eli']);
  assert.deepEqual(g['quiero-agregar'].map((r) => r.nombre), ['Caro', 'Dani']);
  assert.deepEqual(g['abrir-caja'].map((r) => r.nombre), ['Ana']);
  const dani = g['quiero-agregar'].find((r) => r.nombre === 'Dani');
  assert.equal(dani.note, 'Marcó 5 sin enlace del repositorio');
});

test('CSV neutralises spreadsheet formulas and quotes separators', () => {
  const evil = readSubmission({
    id: 'z', created_at: '2026-10-19T20:00:00Z', session: 'clase-1', consent_at: '2026-10-19T20:00:00Z',
    payload: { nombre: '=HYPERLINK("http://x","clic")', url_app: null, url_repo: null, duda: '+1, "y" @sum', punto_control: 3 },
  });
  const csv = toCSV([evil]);
  assert.ok(csv.startsWith('﻿'));
  const [header, line] = csv.slice(1).trim().split('\r\n');
  assert.equal(header, 'fecha,sesion,nombre,url_app,url_repo,duda,punto_control,punto_nombre,mesa_sugerida,consentimiento');
  assert.ok(line.includes(`"'=HYPERLINK(""http://x"",""clic"")"`), line);
  assert.ok(line.includes(`"'+1, ""y"" @sum"`), line);
  assert.ok(line.includes(',3,Guarda datos,Quiero agregar,'), line);
});

console.log(failures ? `\n${failures} failing\n` : '\nall passing\n');
process.exitCode = failures ? 1 : 0;
