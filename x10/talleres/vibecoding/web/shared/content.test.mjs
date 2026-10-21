// Plain node test, no framework: `node talleres/vibecoding/web/shared/content.test.mjs`
// content.js carries the plan's student-facing material. These checks parse
// plan-clase-1.md and assert the page data says exactly what the plan says.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  PIECES, MENU, REGLAS, PROTOCOLO, SEGURIDAD, CHECKPOINTS, MESAS, PLAYBOOK_ANCHORS,
  LANDING_ANCHORS, CONTACT, TAREA, FRASE_DATOS, TESIS, CLASE_2,
} from './content.js';

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

const plan = readFileSync(new URL('../../plan-clase-1.md', import.meta.url), 'utf8');
const contract = readFileSync(new URL('../../CONTRACT.md', import.meta.url), 'utf8');

/** Text of a "### Title" section of the plan up to the next heading. */
const section = (title) => {
  const start = plan.indexOf(title);
  assert.ok(start >= 0, `section not found: ${title}`);
  const rest = plan.slice(start + title.length);
  const end = rest.search(/\n#{2,3} /);
  return end < 0 ? rest : rest.slice(0, end);
};
const numbered = (text) => [...text.matchAll(/^\d+\. (.+)$/gm)].map((m) => m[1].trim());
const bullets = (text) => [...text.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim());
const tableRows = (text) =>
  text
    .split('\n')
    .filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l))
    .slice(1)
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
const unescape = (s) => s.replace(/\\_/g, '_').replace(/\\\[/g, '[').replace(/\\\]/g, ']');

console.log('\nPlan fidelity');

test('five pieces = the plan map, with the domicilios example per piece', () => {
  const rows = tableRows(section('### 2.2 El mapa de 5 piezas'));
  assert.equal(rows.length, 5);
  assert.deepEqual(
    PIECES.map((p) => [p.name, p.clase, p.domicilios, p.pregunta]),
    rows.map((r) => r.slice(0, 4)),
  );
  assert.deepEqual(PIECES.filter((p) => p.lahace).map((p) => p.id), ['dominio', 'repositorio']);
});

test('menu = the eight public-sector projects of the plan, column by column', () => {
  const rows = tableRows(section('### Menú de proyectos'));
  assert.equal(rows.length, 8);
  assert.deepEqual(
    MENU.map((m) => [m.proyecto, m.paraQuien, m.acciones.join('; '), m.guarda]),
    rows,
  );
});

test('reglas de mesa, protocolo de error and qué no hacer are verbatim', () => {
  assert.deepEqual(REGLAS, numbered(section('### Reglas de mesa')));
  assert.deepEqual(PROTOCOLO, numbered(section('### Protocolo de error')));
  assert.deepEqual(SEGURIDAD, bullets(section('### Qué no hacer')));
  assert.equal(REGLAS.length, 5);
  assert.equal(PROTOCOLO.length, 4);
  assert.equal(SEGURIDAD.length, 4);
});

test('puntos de control = the five checkpoints of bloque 5, with how to test and what if it fails', () => {
  const rows = tableRows(section('## Bloque 5')).filter((r) => /^\d\. /.test(r[1]));
  assert.equal(rows.length, 5);
  assert.deepEqual(
    CHECKPOINTS.map((c) => [`${c.n}. ${c.name}`, c.prueba, c.falla]),
    rows.map((r) => [r[1], r[2], r[3]]),
  );
});

test('the three mesas of class 2 come from the plan', () => {
  const text = section('## Propuesta de formato para la clase 2');
  for (const m of MESAS) assert.ok(text.includes(`"${m.name.toLowerCase()}" (${m.desc})`), m.name);
  assert.deepEqual(MESAS.map((m) => m.range), [[1, 2], [3, 4], [5, 5]]);
});

test('tarea para la clase 2, the tesis and the data sentence are verbatim', () => {
  const tarea = section('## Bloque 6').split('**Tarea para la clase 2 (3 min):**')[1].split('**Cómo funciona')[0];
  assert.deepEqual(TAREA, numbered(tarea));
  assert.equal(TAREA.length, 4);
  assert.ok(plan.includes(`"${TESIS}`), 'tesis not found in the plan');
  assert.ok(plan.includes(`"${FRASE_DATOS}"`), 'data sentence not found in the plan');
  assert.ok(plan.includes(CLASE_2), 'clase 2 description not found in the plan');
});

console.log('\nContract');

test('playbook anchors = exactly the list in CONTRACT.md', () => {
  const line = contract.split('## Playbook anchors')[1].split('\n## ')[0];
  const listed = [...line.matchAll(/`#([a-z0-9-]+)`/g)].map((m) => m[1]);
  assert.deepEqual([...PLAYBOOK_ANCHORS].sort(), [...listed].sort());
});

test('landing anchors = exactly the list in CONTRACT.md', () => {
  const line = contract.split('## Landing anchors')[1].split('\n## ')[0];
  const listed = [...line.matchAll(/`#([a-z0-9-]+)`/g)].map((m) => m[1]);
  assert.deepEqual(LANDING_ANCHORS, listed);
});

// The presenter shows only his name: no phone, email or social profile anywhere in
// Vibe Coding, and the deck is internal (no public page links to it).
const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const slides = readdirSync(new URL('../../presentacion/slides/', import.meta.url))
  .filter((f) => f.endsWith('.html'))
  .map((f) => [`slides/${f}`, read(`../../presentacion/slides/${f}`)]);
const publicPages = [
  ['web/index.html', read('../index.html')],
  ['web/playbook/index.html', read('../playbook/index.html')],
  ['web/encuesta/index.html', read('../encuesta/index.html')],
];
const everything = [
  ...publicPages,
  ...slides,
  ['presentacion/config.json', read('../../presentacion/config.json')],
  ['web/shared/content.js', read('./content.js')],
  ['web/landing/main.js', read('../landing/main.js')],
  ['web/landing/salida.js', read('../landing/salida.js')],
];

test('the presenter is named, with no contact data', () => {
  assert.deepEqual(CONTACT, { expositor: 'Fabian Zapata' });
  const config = JSON.parse(read('../../presentacion/config.json'));
  assert.equal(config.expositor, 'Fabian Zapata');
  assert.ok(!('contacto' in config) && !('whatsapp' in config), 'config.json has contact keys');
});

test('no phone, email, WhatsApp or social profile in pages, deck or scripts', () => {
  const personal = /wa\.me|whatsapp\s*\d|3143666151|314 366|mailto:|fabiing10|instagram\.com|linkedin\.com|data-qr="whatsapp"|data-config="contacto"|escr[ií]bele a fabian/i;
  const hits = everything.filter(([, text]) => personal.test(text)).map(([name]) => name);
  assert.deepEqual(hits, []);
});

test('no public page links to the deck (it is for the presenter)', () => {
  const hits = publicPages.filter(([, text]) => /href="\/vibecoding\/presentacion/.test(text)).map(([name]) => name);
  assert.deepEqual(hits, []);
});

console.log(failures ? `\n${failures} failing\n` : '\nall passing\n');
process.exitCode = failures ? 1 : 0;
