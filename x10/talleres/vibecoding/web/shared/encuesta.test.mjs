// Plain node test, no framework: `node talleres/vibecoding/web/shared/encuesta.test.mjs`
// The intro survey: questions, flow, validation, the row sent to Supabase, and the
// aggregation that the survey page (demo mode) and the deck slide read.

import assert from 'node:assert/strict';
import {
  PREGUNTAS, WORKSHOP, FORM, pregunta, opcionesDe, pasos, elegir, validar, buildRow,
  summarize, kpis, label,
} from './encuesta.js';

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

const full = {
  entidad: 'territorial',
  sector: 'salud',
  rol: 'profesional',
  nivel: 2,
  frecuencia: 'diario',
  herramientas: ['chatgpt', 'gemini'],
  favorita: 'gemini',
  construido: ['textos', 'analisis'],
  creadores: ['lovable'],
};

console.log('\nPreguntas');

test('asks about entity, sector, role, knowledge, frequency, tools, favourite, what they built and app builders', () => {
  assert.deepEqual(PREGUNTAS.map((p) => p.id), [
    'entidad', 'sector', 'rol', 'nivel', 'frecuencia', 'herramientas', 'favorita', 'construido', 'creadores',
  ]);
});

test('every option id is unique within its question and short enough for the summary', () => {
  for (const p of PREGUNTAS.filter((q) => q.opciones)) {
    const ids = p.opciones.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, p.id);
    assert.ok(ids.every((id) => /^[a-z0-9-]{1,40}$/.test(id)), p.id);
  }
});

test('app builders include Lovable and Base44, and every multi-select has a "none" option', () => {
  const ids = pregunta('creadores').opciones.map((o) => o.id);
  assert.ok(ids.includes('lovable') && ids.includes('base44'));
  for (const p of PREGUNTAS.filter((q) => q.tipo === 'varias')) {
    assert.ok(p.exclusivo && p.opciones.some((o) => o.id === p.exclusivo), p.id);
  }
});

console.log('\nFlujo');

test('the favourite question offers only the tools the person marked', () => {
  assert.deepEqual(opcionesDe('favorita', full).map((o) => o.id), ['chatgpt', 'gemini']);
});

test('the favourite question is skipped with one tool (it is that one) or none', () => {
  assert.ok(pasos(full).includes('favorita'));
  assert.ok(!pasos({ ...full, herramientas: ['claude'] }).includes('favorita'));
  assert.ok(!pasos({ ...full, herramientas: ['ninguna'] }).includes('favorita'));
});

test('before the tools are answered the favourite still counts, so the total never grows', () => {
  assert.equal(pasos({}).length, 9);
  assert.equal(pasos({ herramientas: [] }).length, 9);
});

test('choosing the "none" option clears the others, and any other option clears "none"', () => {
  assert.deepEqual(elegir('herramientas', ['chatgpt', 'gemini'], 'ninguna'), ['ninguna']);
  assert.deepEqual(elegir('herramientas', ['ninguna'], 'claude'), ['claude']);
  assert.deepEqual(elegir('herramientas', ['chatgpt', 'claude'], 'chatgpt'), ['claude']);
});

console.log('\nValidación y fila');

test('a complete answer is valid', () => {
  assert.deepEqual(validar(full).errores, {});
});

test('a missing or unknown answer is an error for that question', () => {
  const { errores } = validar({ ...full, rol: '', sector: 'astronautas', nivel: 9 });
  assert.deepEqual(Object.keys(errores).sort(), ['nivel', 'rol', 'sector']);
});

test('the favourite must be one of the marked tools', () => {
  assert.ok(validar({ ...full, favorita: 'claude' }).errores.favorita);
});

test('the clean payload derives the favourite when there is one tool or none', () => {
  assert.equal(validar({ ...full, herramientas: ['claude'], favorita: '' }).payload.favorita, 'claude');
  assert.equal(validar({ ...full, herramientas: ['ninguna'], favorita: 'x' }).payload.favorita, '');
});

test('the clean payload drops duplicates and unknown options from lists', () => {
  const { payload } = validar({ ...full, construido: ['textos', 'textos', 'hackear', 'apps'] });
  assert.deepEqual(payload.construido, ['textos', 'apps']);
});

test('the row is anonymous: workshop, form, session and the payload, nothing else', () => {
  const row = buildRow(validar(full).payload, 'clase-1');
  assert.deepEqual(Object.keys(row).sort(), ['form', 'payload', 'session', 'workshop']);
  assert.equal(row.workshop, WORKSHOP);
  assert.equal(row.form, FORM);
  assert.equal(FORM, 'intro');
  assert.equal(row.session, 'clase-1');
  assert.equal(row.payload.nivel, 2);
});

console.log('\nResumen');

const rows = [
  full,
  { ...full, entidad: 'judicial', nivel: 1, frecuencia: 'semanal', herramientas: ['chatgpt'], favorita: 'chatgpt', creadores: ['ninguna'] },
  { ...full, rol: 'directivo', nivel: 0, frecuencia: 'nunca', herramientas: ['ninguna'], favorita: '', construido: ['nada'], creadores: ['ninguna'] },
  { ...full, nivel: 3, frecuencia: 'mensual', herramientas: ['chatgpt', 'claude'], favorita: 'chatgpt', creadores: ['lovable', 'base44'] },
];

test('summarize counts every answer the way the SQL function does', () => {
  const s = summarize(rows);
  assert.equal(s.total, 4);
  assert.deepEqual(s.counts.entidad, { territorial: 3, judicial: 1 });
  assert.deepEqual(s.counts.nivel, { 2: 1, 1: 1, 0: 1, 3: 1 });
  assert.deepEqual(s.counts.herramientas, { chatgpt: 3, gemini: 1, ninguna: 1, claude: 1 });
  assert.deepEqual(s.counts.favorita, { gemini: 1, chatgpt: 2 });
  assert.deepEqual(s.counts.creadores, { lovable: 2, ninguna: 2, base44: 1 });
});

test('kpis: active users, top favourite, who tried an app builder, average level', () => {
  const k = kpis(summarize(rows));
  assert.equal(k.total, 4);
  assert.equal(k.activos, 2); // diario + semanal
  assert.equal(k.activosPct, 50);
  assert.deepEqual(k.favorita, { id: 'chatgpt', label: 'ChatGPT', n: 2, pct: 50 });
  assert.equal(k.creadoresPct, 50); // everyone but "ninguna"
  assert.equal(k.nivelProm, 1.5);
  assert.deepEqual(k.nivel.map((x) => x.n), [1, 1, 1, 1, 0]);
  assert.equal(k.top('creadores', 2)[0].id, 'lovable');
  assert.ok(k.top('creadores').every((x) => x.id !== 'ninguna'), '"none" is not a tool');
});

test('kpis of an empty room are zeros, never NaN', () => {
  const k = kpis({ total: 0, counts: {} });
  assert.equal(k.activosPct, 0);
  assert.equal(k.creadoresPct, 0);
  assert.equal(k.nivelProm, null);
  assert.equal(k.favorita, null);
});

test('kpis ignore values that are not options (a forged row cannot inject labels)', () => {
  const k = kpis({ total: 1, counts: { entidad: { '<img src=x>': 1, judicial: 1 } } });
  assert.deepEqual(k.top('entidad').map((x) => x.id), ['judicial']);
});

test('labels read the option text', () => {
  assert.equal(label('creadores', 'base44'), 'Base44');
  assert.equal(label('favorita', 'copilot'), 'Microsoft Copilot');
  assert.equal(label('entidad', 'nope'), '');
});

console.log(failures ? `\n${failures} failing\n` : '\nall passing\n');
process.exitCode = failures ? 1 : 0;
