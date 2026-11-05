// The intro survey: screens, validation, the row sent to Supabase, and the
// aggregation that the survey page (demo mode) and the deck slide read.
// Run: node --test talleres/cerebro/web/shared/encuesta.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PREGUNTAS, CONTACTO, WORKSHOP, FORM, SESSION_DEFAULT, pregunta, opcionesDe, pasos, elegir,
  validar, validarContacto, buildRow, summarize, kpis, label, cleanSession,
} from './encuesta.js';

const full = {
  nombre: '  Sofía   Ruiz ',
  email: 'Sofia@Correo.co',
  rol: 'independiente',
  herramientas: ['chatgpt', 'claude'],
  favorita: 'claude',
  plan: 'pago',
  frecuencia: 'diario',
  usos: ['escribir', 'buscar'],
  proyectos: 'conozco',
  skill: 'no',
  entrena: 'nose',
  alucino: 'si',
};

const ids = (id) => pregunta(id).opciones.map((o) => o.id);

test('asks what the class needs: role, tools, favourite, plan, frequency, uses, projects, skill, training, hallucination', () => {
  assert.deepEqual(PREGUNTAS.map((p) => p.id), [
    'rol', 'herramientas', 'favorita', 'plan', 'frecuencia', 'usos', 'proyectos', 'skill', 'entrena', 'alucino',
  ]);
  assert.equal(CONTACTO.campos.map((c) => c.id).join(','), 'nombre,email');
});

test('the general options: any profession, any tool, any use (no legal vocabulary left)', () => {
  assert.equal(SESSION_DEFAULT, 'cerebro-skills');
  assert.equal(pregunta('rol').titulo, '¿Qué haces hoy?');
  assert.deepEqual(ids('rol'), ['estudiante', 'emprendedor', 'empresa', 'independiente', 'docente', 'publico', 'otro']);
  assert.deepEqual(ids('herramientas'), ['chatgpt', 'claude', 'gemini', 'copilot', 'perplexity', 'notebooklm', 'otra', 'ninguna']);
  assert.deepEqual(ids('usos'), ['escribir', 'resumir', 'construir', 'datos', 'buscar', 'imagenes', 'ideas', 'nada']);
  assert.deepEqual(ids('alucino'), ['si', 'no', 'noverifique']);
  assert.equal(pregunta('usos').titulo, '¿Para qué la usas?');
  assert.equal(pregunta('alucino').titulo, '¿La IA te ha dado un dato, una cita o una fuente que no existía?');
  assert.equal(pregunta('proyectos').titulo, '¿Usas Proyectos (ChatGPT, Claude) o Gems (Gemini)?');
  assert.equal(pregunta('skill').titulo, '¿Has creado una skill, un GPT personalizado o una Gem?');
  assert.equal(CONTACTO.campos[0].placeholder, 'Sofía Ruiz');
  assert.equal(CONTACTO.campos[1].placeholder, 'sofia@correo.co');

  const legal = /abogad|jur[ií]dic|sentencia|despacho|litigan|jurisprudencia|contratos|PQRS|expediente|juzgado|firma\b/i;
  const text = [
    CONTACTO.titulo, CONTACTO.ayuda, ...CONTACTO.campos.map((c) => `${c.label} ${c.placeholder}`),
    ...PREGUNTAS.flatMap((p) => [p.titulo, p.ayuda ?? '', ...(p.opciones ?? []).flatMap((x) => [x.text, x.hint])]),
  ].join('\n');
  assert.doesNotMatch(text, legal);
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

test('the question ids and kinds match the SQL function that feeds the deck', () => {
  const dir = fileURLToPath(new URL('../../../../supabase/migrations/', import.meta.url));
  const latest = readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && readFileSync(dir + f, 'utf8').includes('cj_intro_summary'))
    .sort()
    .at(-1);
  const sql = readFileSync(dir + latest, 'utf8');
  const list = (name) => [...sql.match(new RegExp(`${name} as \\([\\s\\S]*?unnest\\(array\\[([^\\]]+)\\]`))[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(list('single'), PREGUNTAS.filter((p) => p.tipo !== 'varias').map((p) => p.id));
  assert.deepEqual(list('multi'), PREGUNTAS.filter((p) => p.tipo === 'varias').map((p) => p.id));
  assert.deepEqual(PREGUNTAS.filter((p) => p.tipo === 'varias').map((p) => p.exclusivo), ['ninguna', 'nada']);
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
  assert.deepEqual(elegir('usos', ['escribir', 'nada'], 'escribir'), ['nada']);
  assert.deepEqual(elegir('usos', ['escribir'], 'nada'), ['nada']);
});

test('contact: name and email are required, cleaned and normalised', () => {
  const ok = validarContacto(full);
  assert.deepEqual(ok.errores, {});
  assert.equal(ok.nombre, 'Sofía Ruiz');
  assert.equal(ok.email, 'sofia@correo.co');
  const bad = validarContacto({ nombre: 'L', email: 'sofia@' });
  assert.deepEqual(Object.keys(bad.errores).sort(), ['email', 'nombre']);
});

test('a complete answer is valid; a missing or unknown answer is an error for that screen', () => {
  assert.deepEqual(validar(full).errores, {});
  const { errores } = validar({ ...full, rol: '', plan: 'oro', email: 'x' });
  assert.deepEqual(Object.keys(errores).sort(), ['contacto', 'email', 'plan', 'rol']);
  // The retired legal options are no longer accepted.
  assert.ok(validar({ ...full, rol: 'litigante' }).errores.rol);
  assert.ok(validar({ ...full, usos: ['jurisprudencia'] }).errores.usos);
});

test('the clean payload carries the contact, derives the favourite and drops unknown options', () => {
  const { payload } = validar({ ...full, herramientas: ['claude'], favorita: '', usos: ['escribir', 'escribir', 'hackear'] });
  assert.equal(payload.nombre, 'Sofía Ruiz');
  assert.equal(payload.email, 'sofia@correo.co');
  assert.equal(payload.favorita, 'claude');
  assert.deepEqual(payload.usos, ['escribir']);
  assert.equal(validar({ ...full, herramientas: ['ninguna'], favorita: 'x' }).payload.favorita, '');
});

test('"Otra" counts as a tool and can be the favourite', () => {
  const two = validar({ ...full, herramientas: ['otra', 'claude'], favorita: 'otra' });
  assert.deepEqual(two.errores, {});
  assert.equal(two.payload.favorita, 'otra');
  assert.deepEqual(opcionesDe('favorita', { herramientas: ['otra', 'claude'] }).map((o) => o.id), ['claude', 'otra']);
  assert.equal(validar({ ...full, herramientas: ['otra'], favorita: '' }).payload.favorita, 'otra');
});

test('the row: workshop, form, session, payload and the consent timestamp', () => {
  const row = buildRow(validar(full).payload, SESSION_DEFAULT, new Date('2026-11-05T20:30:00Z'));
  assert.deepEqual(Object.keys(row).sort(), ['consent_at', 'form', 'payload', 'session', 'workshop']);
  assert.equal(row.workshop, WORKSHOP);
  assert.equal(row.form, FORM);
  assert.equal(row.session, 'cerebro-skills');
  assert.equal(row.consent_at, '2026-11-05T20:30:00.000Z');
  assert.equal(cleanSession('?'), SESSION_DEFAULT);
  assert.equal(cleanSession(' Cerebro-2 '), 'cerebro-2');
});

const rows = [
  validar(full).payload,
  validar({ ...full, nombre: 'Andrés Ruiz', email: 'a@b.co', rol: 'empresa', herramientas: ['chatgpt'], favorita: '', frecuencia: 'semanal', proyectos: 'uso', skill: 'si', entrena: 'apagado', alucino: 'no', plan: 'empresa' }).payload,
  validar({ ...full, nombre: 'Marcela Díaz', email: 'm@d.co', rol: 'publico', herramientas: ['ninguna'], favorita: '', frecuencia: 'casi-nunca', usos: ['nada'], proyectos: 'no', skill: 'nose', entrena: 'activo', alucino: 'noverifique', plan: 'gratis' }).payload,
];

test('the summary counts answers only: never the name or the email', () => {
  const s = summarize(rows);
  assert.equal(s.total, 3);
  assert.ok(!('nombre' in s.counts) && !('email' in s.counts));
  assert.deepEqual(s.counts.rol, { independiente: 1, empresa: 1, publico: 1 });
  assert.deepEqual(s.counts.herramientas, { chatgpt: 2, claude: 1, ninguna: 1 });
  assert.deepEqual(s.counts.favorita, { claude: 1, chatgpt: 1 });
  assert.ok(!JSON.stringify(s).includes('Sofía'));
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
  assert.deepEqual(k.top('rol', 3).map((x) => x.label).sort(), ['Independiente o freelance', 'Profesional en una empresa', 'Sector público']);
  assert.deepEqual(k.top('usos', 3).map((x) => x.id).sort(), ['buscar', 'escribir']);
  assert.equal(label('herramientas', 'notebooklm'), 'Gemini Notebook (NotebookLM)');
  assert.equal(label('herramientas', 'juridica'), '');
  const empty = kpis({ total: 0, counts: {} });
  assert.equal(empty.favorita, null);
  assert.equal(empty.activosPct, 0);
});

test('the headline favourite is a named tool, never the "Otra" bucket', () => {
  const k = kpis({ total: 10, counts: { favorita: { otra: 5, claude: 3, chatgpt: 2 } } });
  assert.equal(k.favorita.id, 'claude');
  assert.equal(k.favorita.pct, 30);
  assert.equal(kpis({ total: 4, counts: { favorita: { otra: 4 } } }).favorita, null);
});
