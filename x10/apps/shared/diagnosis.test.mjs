// Plain node test, no framework: `node apps/shared/diagnosis.test.mjs`
// 1. Enumerates every branch of the questionnaire and asserts ≤ 15 questions per path.
// 2. Runs representative profiles and asserts each lands in its expected level.
// 3. Checks playbook anchors, row payload limits, aggregation and CSV.

import assert from 'node:assert/strict';
import {
  QUESTIONS, BRANCH_KEYS, MAX_QUESTIONS, getPath, pruneAnswers, isAnswered, answerKeys,
} from './questions.js';
import { diagnose, LEVELS, PLAYBOOK_ANCHORS, scoreDimensions } from './diagnosis.js';
import { buildRow, aggregate, toCSV, makeSampleRows, validateAlias, validateEmail, cleanSession } from './data.js';

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

// ── 1 · Structure and branching ───────────────────────────

console.log('\nStructure');

test('question ids are unique and every answer key is unique', () => {
  const keys = QUESTIONS.flatMap(answerKeys);
  assert.equal(new Set(keys).size, keys.length);
});

test('option values are unique inside each question', () => {
  for (const q of QUESTIONS) {
    for (const opts of [q.options, q.extra?.options].filter(Boolean)) {
      const values = opts.map((o) => o.value);
      assert.equal(new Set(values).size, values.length, q.id);
    }
  }
});

// Record which answer keys each `when` reads, using a Proxy.
const reads = new Map();
for (const q of QUESTIONS.filter((x) => x.when)) {
  const seen = new Set();
  const spy = new Proxy({}, { get: (_, k) => (typeof k === 'string' && seen.add(k), undefined) });
  q.when(spy);
  reads.set(q.id, seen);
}

test('branching only depends on BRANCH_KEYS, asked before the branch', () => {
  const index = new Map(QUESTIONS.map((q, i) => [q.id, i]));
  for (const [qid, keys] of reads) {
    for (const k of keys) {
      assert.ok(BRANCH_KEYS.includes(k), `${qid} reads ${k}, which is not a branch key`);
      assert.ok(index.get(k) < index.get(qid), `${qid} depends on ${k}, asked later`);
    }
  }
});

test('at least 2 questions branch by role, with a variant for every role', () => {
  const byRole = QUESTIONS.filter((q) => reads.get(q.id)?.has('role'));
  const groups = new Set(byRole.map((q) => q.id.split('_')[0]));
  assert.ok(groups.size >= 2, `role-branched groups: ${[...groups]}`);
  for (const role of QUESTIONS[0].options.map((o) => o.value)) {
    const own = byRole.filter((q) => q.when({ role }));
    assert.ok(own.length >= 2, `${role} has ${own.length} branched questions`);
  }
});

console.log('\nEvery path (role × usage)');
const branchValues = BRANCH_KEYS.map((k) => QUESTIONS.find((q) => q.id === k).options.map((o) => o.value));
const combos = branchValues.reduce((acc, values) => acc.flatMap((c) => values.map((v) => [...c, v])), [[]]);
const lengths = [];
for (const combo of combos) {
  const answers = Object.fromEntries(BRANCH_KEYS.map((k, i) => [k, combo[i]]));
  const path = getPath(answers);
  lengths.push(path.length);
  console.log(`  ${combo.join('/').padEnd(20)} ${String(path.length).padStart(2)}  ${path.map((q) => q.id).join(' › ')}`);
}

test(`${combos.length} paths, every path ≤ ${MAX_QUESTIONS} questions`, () => {
  assert.equal(combos.length, 25);
  assert.ok(Math.max(...lengths) <= MAX_QUESTIONS, `longest path: ${Math.max(...lengths)}`);
});
console.log(`       lengths: min ${Math.min(...lengths)}, max ${Math.max(...lengths)}`);

// ── 2 · Representative profiles ───────────────────────────

const PROFILES = [
  {
    name: 'Never used it, fearful field employee',
    expect: 'x1',
    answers: {
      role: 'empleado', industry: 'transporte', ctx_trabajo: 'campo', usage: 'nunca',
      k_predice: 'busca', k_alucina: 'falla', k_prompt: ['corto'],
      areas_trabajo: ['aprender'], delegar_trabajo: 'todavia', semaforo: 'rojo',
      fear_level: 4, worries: ['empleo', 'voz'], goal: 'entender',
    },
  },
  {
    name: 'Knows the theory but has never used it (use gate)',
    expect: 'x1',
    answers: {
      role: 'estudiante', industry: 'educacion', ctx_estudio: 'universidad', usage: 'nunca',
      k_predice: 'predice', k_alucina: 'inventa', k_prompt: ['rol', 'contexto', 'tarea', 'formato'],
      areas_estudio: ['estudiar', 'resumenes', 'idiomas'], delegar_estudio: 'explicar', semaforo: 'amarillo',
      fear_level: 2, worries: [], goal: 'entender',
    },
  },
  {
    name: 'Church leader who tried Meta AI once',
    expect: 'x2',
    answers: {
      role: 'lider', industry: 'comercio', ctx_ministerio: 'celula', usage: 'probado', tools: ['meta_ai'],
      k_predice: 'predice', k_alucina: 'inventa', k_prompt: ['rol', 'contexto', 'corto'],
      areas_ministerio: ['biblia', 'comunicacion'], delegar_ministerio: 'esquema', semaforo: 'verde',
      fear_level: 3, worries: ['espiritual'], goal: 'ministerio',
    },
  },
  {
    name: 'Weekly office user who verifies',
    expect: 'x5',
    answers: {
      role: 'empleado', industry: 'finanzas', ctx_trabajo: 'oficina', usage: 'semanal',
      tools: ['chatgpt', 'gemini'], usos_hoy: ['escribir', 'resumir'],
      k_predice: 'predice', k_alucina: 'inventa', k_prompt: ['rol', 'contexto', 'tarea'],
      areas_trabajo: ['correos', 'datos', 'reuniones'], delegar_trabajo: 'resumir', semaforo: 'amarillo',
      fear_level: 2, worries: ['privacidad'], goal: 'tiempo',
    },
  },
  {
    name: 'Weekly user with many tools but no advanced use (×10 gate)',
    expect: 'x5',
    answers: {
      role: 'lider', industry: 'educacion', ctx_ministerio: 'red', usage: 'semanal',
      tools: ['chatgpt', 'meta_ai', 'gemini'], usos_hoy: ['escribir', 'resumir', 'biblia'],
      k_predice: 'predice', k_alucina: 'inventa', k_prompt: ['rol', 'contexto', 'tarea', 'formato'],
      areas_ministerio: ['biblia', 'ensenanzas', 'discusion'], delegar_ministerio: 'contexto', semaforo: 'amarillo',
      fear_level: 3, worries: ['hijos'], goal: 'ministerio',
    },
  },
  {
    name: 'Daily power user without criteria (delegates unreviewed)',
    expect: 'x2',
    answers: {
      role: 'empleado', industry: 'tecnologia', ctx_trabajo: 'tecnico', usage: 'diario',
      tools: ['chatgpt', 'claude', 'copilot'], usos_hoy: ['programar', 'escribir', 'resumir'],
      k_predice: 'predice', k_alucina: 'inventa', k_prompt: ['rol', 'contexto', 'tarea', 'formato'],
      areas_trabajo: ['procesos', 'datos', 'correos'], delegar_trabajo: 'sin_revisar', semaforo: 'verde',
      fear_level: 1, worries: ['ninguno'], goal: 'tiempo',
    },
  },
  {
    name: 'Business owner who builds with AI daily',
    expect: 'x10',
    answers: {
      role: 'empresario', industry: 'servicios', ctx_negocio: '2_10', usage: 'diario',
      tools: ['chatgpt', 'claude', 'perplexity', 'apps'],
      usos_hoy: ['escribir', 'contenido', 'datos', 'programar', 'agentes'],
      k_predice: 'predice', k_alucina: 'inventa', k_prompt: ['rol', 'contexto', 'tarea', 'formato'],
      areas_negocio: ['ventas', 'marketing', 'clientes', 'web'], delegar_negocio: 'cotizaciones', semaforo: 'amarillo',
      fear_level: 1, worries: [], goal: 'negocio',
    },
  },
];

console.log('\nProfiles');
const reached = new Set();
for (const p of PROFILES) {
  const d = diagnose(p.answers);
  reached.add(d.level);
  const s = d.scores;
  console.log(
    `  ${LEVELS[d.level].mult.padEnd(4)} ${LEVELS[d.level].name.padEnd(13)} score ${String(d.score).padStart(3)}` +
      `  (uso ${s.uso}, fund ${s.fundamentos}, apl ${s.aplicacion}, disc ${s.discernimiento})  ${p.name}`,
  );
  test(`${p.name} → ${p.expect}`, () => {
    const path = getPath(p.answers);
    for (const q of path) assert.ok(isAnswered(q, p.answers), `profile misses ${q.id}`);
    assert.equal(d.level, p.expect);
    assert.ok(d.score >= 0 && d.score <= 100);
    assert.equal(d.steps.length, 3);
    assert.ok(d.strengths.length >= 1 && d.strengths.length <= 3);
    assert.equal(d.knowledge.length, 4);
  });
}

test('profiles cover all four levels', () => {
  assert.deepEqual([...reached].sort(), ['x1', 'x10', 'x2', 'x5']);
});

test('level names match CONTRACT.md', () => {
  const names = Object.values(LEVELS).map((l) => `${l.mult} ${l.name}`);
  assert.deepEqual(names, ['×1 Observador', '×2 Explorador', '×5 Practicante', '×10 Multiplicador']);
});

test('empty answers score 0 and land in ×1 without throwing', () => {
  const d = diagnose({});
  assert.equal(d.score, 0);
  assert.equal(d.level, 'x1');
});

test('privacy slip in the prompt question costs discernment', () => {
  const base = PROFILES[3].answers;
  const slip = { ...base, k_prompt: [...base.k_prompt, 'datos'] };
  assert.ok(scoreDimensions(slip).discernimiento < scoreDimensions(base).discernimiento);
});

test('high fear gets a respectful note that links to safety sections', () => {
  const d = diagnose(PROFILES[0].answers);
  assert.ok(d.fearNote);
  assert.ok(d.fearNote.items.some((i) => i.link.anchor === 'palabra-clave'));
});

// ── 3 · Links, rows, aggregation ──────────────────────────

test('every playbook link uses a CONTRACT anchor', () => {
  for (const p of PROFILES) {
    const d = diagnose(p.answers);
    const links = [
      ...d.steps.flatMap((s) => s.links),
      ...d.knowledge.map((k) => k.link),
      ...(d.fearNote?.items.map((i) => i.link) ?? []),
    ];
    for (const l of links) {
      assert.ok(PLAYBOOK_ANCHORS.includes(l.anchor), `unknown anchor #${l.anchor}`);
      assert.equal(l.href, `/playbook/#${l.anchor}`);
    }
  }
  assert.equal(PLAYBOOK_ANCHORS.length, 18);
});

test('pruneAnswers drops answers from an abandoned branch', () => {
  const a = { ...PROFILES[3].answers, areas_negocio: ['ventas'], delegar_negocio: 'contenido' };
  const pruned = pruneAnswers(a);
  assert.equal(pruned.areas_negocio, undefined);
  assert.equal(pruned.delegar_negocio, undefined);
  assert.deepEqual(pruned.areas_trabajo, a.areas_trabajo);
});

test('row payload fits the table constraints', () => {
  for (const p of PROFILES) {
    const row = buildRow({
      answers: p.answers,
      alias: '  Juan   Pablo ',
      email: ' Juan@Correo.com ',
      consentAt: '2026-10-02T18:00:00.000Z',
      session: 'MCI-2026',
      durationMs: 183456.7,
    });
    assert.deepEqual(Object.keys(row).sort(), [
      'alias', 'answers', 'consent_at', 'duration_ms', 'email', 'fear_level', 'industry', 'level', 'role',
      'score', 'scores', 'session', 'usage_frequency', 'use_areas',
    ]);
    assert.equal(row.email, 'juan@correo.com');
    assert.equal(row.consent_at, '2026-10-02T18:00:00.000Z');
    assert.equal(row.session, 'mci-2026');
    assert.equal(row.alias, 'Juan Pablo');
    assert.ok(row.role.length <= 60 && row.use_areas.length <= 12);
    assert.ok(['x1', 'x2', 'x5', 'x10'].includes(row.level));
    assert.ok(Buffer.byteLength(JSON.stringify(row.answers)) < 4000);
    assert.ok(Buffer.byteLength(JSON.stringify(row.scores)) < 500);
    assert.equal(row.duration_ms, 183457);
  }
});

test('email is required, normalised and validated', () => {
  assert.equal(validateEmail('  Ana@Correo.CO ').value, 'ana@correo.co');
  assert.ok(validateEmail('').error);
  assert.ok(validateEmail('ana@correo').error);
  assert.ok(validateEmail('sin-arroba.com').error);
  const anon = buildRow({ answers: PROFILES[0].answers, session: 'x' });
  assert.equal(anon.email, null);
  assert.equal(anon.consent_at, null);
});

test('alias rejects contact data and session falls back safely', () => {
  assert.equal(validateAlias('juan@correo.com').value, '');
  assert.ok(validateAlias('3001234567').error);
  assert.equal(validateAlias('Pipe').value, 'Pipe');
  assert.equal(cleanSession('taller-bogota'), 'taller-bogota');
  assert.equal(cleanSession('<script>'), 'mci-2026');
  assert.equal(cleanSession(''), 'mci-2026');
});

test('sample rows obey branching and aggregate consistently', () => {
  const rows = makeSampleRows(60, { seed: 7, now: Date.parse('2026-10-02T15:00:00Z') });
  for (const r of rows) {
    for (const q of getPath(r.answers)) {
      if (q.type === 'fear') continue;
      assert.ok(isAnswered(q, r.answers), `sample misses ${q.id}`);
    }
  }
  const agg = aggregate(rows);
  assert.equal(agg.total, 60);
  assert.equal(Object.values(agg.levels).reduce((s, n) => s + n, 0), 60);
  assert.equal(Object.values(agg.fear).reduce((s, n) => s + n, 0), 60);
  assert.ok(agg.knowledge.every((k) => k.answered === 60 && k.correct <= 60));
  assert.equal(agg.latest.length, 12);
});

test('aggregation treats hostile keys as plain strings', () => {
  const [row] = makeSampleRows(1, { seed: 5 });
  const evil = { ...row, id: 'evil', role: '__proto__', industry: 'constructor', answers: { ...row.answers, worries: ['toString'] } };
  const agg = aggregate([row, evil]);
  assert.equal(agg.roles['__proto__'], 1);
  assert.equal(agg.industries.constructor, 1);
  assert.equal(agg.worries.toString, 1);
  assert.equal(Object.getPrototypeOf(agg.roles), null);
});

test('CSV escapes quotes and neutralises formulas', () => {
  const [row] = makeSampleRows(1, { seed: 3 });
  const csv = toCSV([{ ...row, alias: '=HYPERLINK("x")' }]);
  assert.ok(csv.startsWith('﻿created_at,'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
});

console.log(failures ? `\n${failures} failing\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
