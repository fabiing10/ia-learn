// Pure data helpers shared by /test, /panel and the node test:
// row building (exact x10_responses columns), aggregation, CSV, demo samples.

import { QUESTIONS, DEFAULT_SESSION, getPath, pruneAnswers, branchAnswer, answerKeys } from './questions.js';
import { diagnose, gradeKnowledge, KNOWLEDGE, LEVEL_ORDER } from './diagnosis.js';

const list = (v) => (Array.isArray(v) ? v : []);

/** ?s=<code> → session key; anything odd falls back to the default. */
export function cleanSession(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(s) ? s : DEFAULT_SESSION;
}

/**
 * Optional alias: a first name or nickname only. Rejects anything that looks
 * like contact data so no PII beyond the alias reaches the table.
 */
export function validateAlias(raw) {
  const value = String(raw ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  if (!value) return { value: '', error: null };
  if (/@|https?:|www\./i.test(value) || (value.match(/\d/g) ?? []).length >= 4) {
    return { value: '', error: 'Solo tu nombre o apodo, sin correos ni números.' };
  }
  return { value, error: null };
}

/** One insert payload for public.x10_responses (columns per CONTRACT.md). */
export function buildRow({ answers, alias, session, durationMs }) {
  const a = pruneAnswers(answers);
  const d = diagnose(a);
  return {
    session: cleanSession(session),
    alias: validateAlias(alias).value || null,
    role: a.role,
    industry: a.industry ?? null,
    usage_frequency: a.usage ?? null,
    fear_level: Number.isInteger(a.fear_level) ? a.fear_level : null,
    use_areas: list(branchAnswer(a, 'areas_').value).slice(0, 12),
    level: d.level,
    score: d.score,
    scores: d.scores,
    answers: a,
    duration_ms: Math.max(0, Math.min(3600000, Math.round(Number(durationMs) || 0))),
  };
}

// Count maps have no prototype: row values come from anonymous inserts, so a
// key like "constructor" or "__proto__" must count like any other string.
const counter = (init = {}) => Object.assign(Object.create(null), init);

const bump = (map, key) => {
  if (key === undefined || key === null || key === '' || typeof key === 'object') return;
  map[key] = (map[key] ?? 0) + 1;
};

const avg = (nums) => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null);

/** Everything /panel shows, from raw rows. */
export function aggregate(rows = []) {
  const out = {
    total: rows.length,
    scoreAvg: avg(rows.map((r) => r.score).filter(Number.isFinite)),
    fearAvg: avg(rows.map((r) => r.fear_level).filter(Number.isFinite)),
    levels: counter(Object.fromEntries(LEVEL_ORDER.map((k) => [k, 0]))),
    roles: counter(),
    industries: counter(),
    usage: counter(),
    fear: counter({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    worries: counter(),
    areas: counter(),
    tools: counter(),
    goals: counter(),
    contexts: counter(),
    knowledge: KNOWLEDGE.map((k) => ({ id: k.id, short: k.short, answered: 0, correct: 0 })),
    latest: [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 12),
  };
  for (const r of rows) {
    const a = r.answers ?? {};
    if (LEVEL_ORDER.includes(r.level)) bump(out.levels, r.level);
    bump(out.roles, r.role);
    bump(out.industries, r.industry);
    bump(out.usage, r.usage_frequency);
    if (Number.isInteger(r.fear_level) && r.fear_level >= 1 && r.fear_level <= 5) bump(out.fear, r.fear_level);
    list(a.worries).forEach((w) => bump(out.worries, w));
    list(r.use_areas).forEach((x) => bump(out.areas, x));
    list(a.tools).forEach((t) => bump(out.tools, t));
    bump(out.goals, a.goal);
    const ctx = Object.keys(a).find((k) => k.startsWith('ctx_'));
    if (ctx) bump((out.contexts[ctx] ??= counter()), a[ctx]);
    gradeKnowledge(a).forEach((g, i) => {
      if (!g.answered) return;
      out.knowledge[i].answered += 1;
      if (g.correct) out.knowledge[i].correct += 1;
    });
  }
  return out;
}

/** Sorted [key, count] pairs, largest first. */
export function ranked(map, limit = Infinity) {
  return Object.entries(map)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

const CSV_COLUMNS = [
  'created_at', 'session', 'alias', 'role', 'industry', 'usage_frequency', 'fear_level',
  'use_areas', 'level', 'score', 'uso', 'fundamentos', 'aplicacion', 'discernimiento',
  'duration_ms', 'answers',
];

function csvCell(v) {
  let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  // Neutralise spreadsheet formulas (alias is user text).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows = []) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const r of rows) {
    const s = r.scores ?? {};
    lines.push(
      [
        r.created_at, r.session, r.alias, r.role, r.industry, r.usage_frequency, r.fear_level,
        list(r.use_areas).join('|'), r.level, r.score, s.uso, s.fundamentos, s.aplicacion, s.discernimiento,
        r.duration_ms, r.answers,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// ── Demo sample data (panel demo mode only; clearly labelled there) ──

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const SAMPLE_ALIASES = ['Andrés', 'Camilo', 'Juan', 'Felipe', 'Diego', 'Mauricio', 'Óscar', 'Jhon', 'Sebastián', 'Carlos', 'Pipe', 'Toño'];

/** Fills a questionnaire by walking the real path, so samples always obey branching. */
export function randomAnswers(rand) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const some = (opts, max) => {
    const n = 1 + Math.floor(rand() * Math.min(max, opts.length));
    return [...opts].sort(() => rand() - 0.5).slice(0, n).map((o) => o.value);
  };
  const a = {};
  for (const q of QUESTIONS) {
    if (q.when && !q.when(a)) continue;
    if (q.type === 'multi') a[q.id] = some(q.options.filter((o) => !q.exclusive?.includes(o.value)), q.max ?? 4);
    else if (q.type === 'fear') {
      a.fear_level = 1 + Math.floor(rand() * 5);
      a.worries = rand() < 0.85 ? some(q.extra.options.filter((o) => o.value !== 'ninguno'), 3) : ['ninguno'];
    } else if (q.id === 'usage') a.usage = pick(['nunca', 'probado', 'probado', 'mensual', 'semanal', 'semanal', 'diario']);
    else if (q.id === 'k_predice') a.k_predice = rand() < 0.6 ? 'predice' : 'busca';
    else a[q.id] = pick(q.options).value;
  }
  return a;
}

export function makeSampleRows(n = 30, { seed = 10, session = DEFAULT_SESSION, now = Date.now() } = {}) {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => {
    const answers = randomAnswers(rand);
    const row = buildRow({
      answers,
      alias: rand() < 0.7 ? SAMPLE_ALIASES[Math.floor(rand() * SAMPLE_ALIASES.length)] : '',
      session,
      durationMs: 120000 + Math.floor(rand() * 120000),
    });
    return {
      id: `demo-${seed}-${i}`,
      created_at: new Date(now - (n - i) * 37000).toISOString(),
      ...row,
    };
  });
}

/** Keys the questionnaire may write; used to sanity-check payload size. */
export const ANSWER_KEYS = QUESTIONS.flatMap(answerKeys);
export { getPath };
