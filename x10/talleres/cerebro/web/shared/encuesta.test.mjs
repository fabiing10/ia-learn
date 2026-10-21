// The intro survey: screens, validation, the row sent to Supabase, and the
// aggregation that the survey page (demo mode) and the deck slide read.
// Run: node --test talleres/cerebro/web/shared/encuesta.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREGUNTAS, CONTACTO, WORKSHOP, FORM, SESSION_DEFAULT, pregunta, opcionesDe, pasos, elegir,
  validar, validarContacto, buildRow, summarize, kpis, label, cleanSession,
} from './encuesta.js';

const full = {
  nombre: '  Laura   Gómez ',
  email: 'Laura@Despacho.co',
  rol: 'litigante',
  herramientas: ['chatgpt', 'claude'],
  favorita: 'claude',
  plan: 'pago',
  frecuencia: 'diario',
  usos: ['contratos', 'jurisprudencia'],
  proyectos: 'conozco',
  skill: 'no',
  entrena: 'nose',
  alucino: 'si',
};

test('asks what the workshop needs: role, tools, favourite, plan, frequency, uses, projects, skill, training, hallucination', () => {
  assert.deepEqual(PREGUNTAS.map((p) => p.id), [
    'rol', 'herramientas', 'favorita', 'plan', 'frecuencia', 'usos', 'proyectos', 'skill', 'entrena', 'alucino',
  ]);
  assert.equal(CONTACTO.campos.map((c) => c.id).join(','), 'nombre,email');
});

test('every option id is unique within its question and short enough for the summary', () => {
  for (const p of PREGUNTAS.filter((q) => q.opciones)) {
    const ids = p.opciones.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, p.id);
    assert.ok(ids.every((id) => /^[a-z0-9-]{1,40}$/.test(id)), p.id);
  }
  for (const p of PREGUNTAS.filter((q) => q.tipo === 'varias')) {
    assert.ok(p.exclusivo && p.opciones.some((o) => o.id === p.exclusivo), p.id);
  }
});

test('the contact screen comes first and the favourite is skipped with one tool or none', () => {
  assert.equal(pasos({})[0], 'contacto');
  assert.equal(pasos({}).length, 11);
  assert.ok(pasos(full).includes('favorita'));
  assert.ok(!pasos({ ...full, herramientas: ['claude'] }).includes('favorita'));
  assert.ok(!pasos({ ...full, herramientas: ['ninguna'] }).includes('favorita'));
  assert.deepEqual(opcionesDe('favorita', full).map((o) => o.id), ['chatgpt', 'claude']);
});

test('choosing "none" clears the others, and any other option clears "none"', () => {
  assert.deepEqual(elegir('herramientas', ['chatgpt', 'gemini'], 'ninguna'), ['ninguna']);
  assert.deepEqual(elegir('herramientas', ['ninguna'], 'claude'), ['claude']);
  assert.deepEqual(elegir('usos', ['contratos', 'nada'], 'contratos'), ['nada']);
});

test('contact: name and email are required, cleaned and normalised', () => {
  const ok = validarContacto(full);
  assert.deepEqual(ok.errores, {});
  assert.equal(ok.nombre, 'Laura Gómez');
  assert.equal(ok.email, 'laura@despacho.co');
  const bad = validarContacto({ nombre: 'L', email: 'laura@' });
  assert.deepEqual(Object.keys(bad.errores).sort(), ['email', 'nombre']);
});

test('a complete answer is valid; a missing or unknown answer is an error for that screen', () => {
  assert.deepEqual(validar(full).errores, {});
  const { errores } = validar({ ...full, rol: '', plan: 'oro', email: 'x' });
  assert.deepEqual(Object.keys(errores).sort(), ['contacto', 'email', 'plan', 'rol']);
});

test('the clean payload carries the contact, derives the favourite and drops unknown options', () => {
  const { payload } = validar({ ...full, herramientas: ['claude'], favorita: '', usos: ['contratos', 'contratos', 'hackear'] });
  assert.equal(payload.nombre, 'Laura Gómez');
  assert.equal(payload.email, 'laura@despacho.co');
  assert.equal(payload.favorita, 'claude');
  assert.deepEqual(payload.usos, ['contratos']);
  assert.equal(validar({ ...full, herramientas: ['ninguna'], favorita: 'x' }).payload.favorita, '');
});

test('the row: workshop, form, session, payload and the consent timestamp', () => {
  const row = buildRow(validar(full).payload, 'javeriana-2026-10-21', new Date('2026-10-21T20:30:00Z'));
  assert.deepEqual(Object.keys(row).sort(), ['consent_at', 'form', 'payload', 'session', 'workshop']);
  assert.equal(row.workshop, WORKSHOP);
  assert.equal(row.form, FORM);
  assert.equal(row.consent_at, '2026-10-21T20:30:00.000Z');
  assert.equal(cleanSession('?'), SESSION_DEFAULT);
  assert.equal(cleanSession(' Javeriana-2 '), 'javeriana-2');
});

const rows = [
  validar(full).payload,
  validar({ ...full, nombre: 'Andrés Ruiz', email: 'a@b.co', rol: 'inhouse', herramientas: ['chatgpt'], favorita: '', frecuencia: 'semanal', proyectos: 'uso', skill: 'si', entrena: 'apagado', alucino: 'no', plan: 'empresa' }).payload,
  validar({ ...full, nombre: 'Marcela Díaz', email: 'm@d.co', rol: 'publico', herramientas: ['ninguna'], favorita: '', frecuencia: 'casi-nunca', usos: ['nada'], proyectos: 'no', skill: 'nose', entrena: 'activo', alucino: 'noverifique', plan: 'gratis' }).payload,
];

test('the summary counts answers only: never the name or the email', () => {
  const s = summarize(rows);
  assert.equal(s.total, 3);
  assert.ok(!('nombre' in s.counts) && !('email' in s.counts));
  assert.deepEqual(s.counts.rol, { litigante: 1, inhouse: 1, publico: 1 });
  assert.deepEqual(s.counts.herramientas, { chatgpt: 2, claude: 1, ninguna: 1 });
  assert.deepEqual(s.counts.favorita, { claude: 1, chatgpt: 1 });
  assert.ok(!JSON.stringify(s).includes('Laura'));
});

test('kpis: what the slide shows', () => {
  const k = kpis(summarize(rows));
  assert.equal(k.total, 3);
  assert.equal(k.activosPct, 67);
  assert.equal(k.proyectosPct, 33);
  assert.equal(k.skillPct, 33);
  assert.equal(k.entrenaRiesgoPct, 67);
  assert.equal(k.personalesPct, 67);
  assert.equal(k.alucinoPct, 33);
  assert.equal(k.noVerificaPct, 33);
  assert.equal(k.top('rol', 3).length, 3);
  assert.equal(label('herramientas', 'juridica'), 'Una IA jurídica');
  const empty = kpis({ total: 0, counts: {} });
  assert.equal(empty.favorita, null);
  assert.equal(empty.activosPct, 0);
});
