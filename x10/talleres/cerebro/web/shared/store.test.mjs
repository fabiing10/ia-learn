// Profile persistence: localStorage when it works, nothing breaks when it does not.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KEYS, clearData, loadCerebro, loadProfile, loadProfileFor, sameProfile, saveCerebro, saveProfile, saveProfileFor,
} from './store.js';
import { PERFIL_LAURA, PERFIL_VACIO } from './catalog.js';
import { EJEMPLO_SKILL, normalizeSkill } from './skill-general.js';
import { EJEMPLO_IDEACION, normalizeIdeacion } from './ideacion.js';
import { EJEMPLO_MVP, normalizeMvp } from './brief-a-mvp.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const broken = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
  removeItem() { throw new Error('SecurityError'); },
};

// The two fields loadProfileFor/saveProfileFor read from a cerebro of cerebros.js.
const SKILL = { storeKey: 'cj-perfil-skill', normalize: normalizeSkill };
const IDEACION = { storeKey: 'cj-perfil-ideacion', normalize: normalizeIdeacion };
const MVP = { storeKey: 'cj-perfil-mvp', normalize: normalizeMvp };

test('keys are the contract ones', () => {
  assert.deepEqual(KEYS, {
    perfil: 'cj-perfil',
    perfilSkill: 'cj-perfil-skill',
    perfilIdeacion: 'cj-perfil-ideacion',
    perfilMvp: 'cj-perfil-mvp',
    cerebro: 'cj-cerebro',
    theme: 'cj-theme',
    encuesta: 'cj-encuesta',
    demo: 'cj-demo-submissions',
    queue: 'cj-queue',
  });
});

test('save then load returns the normalized profile', () => {
  const s = memory();
  assert.equal(saveProfile({ ...PERFIL_LAURA, areas: ['constitucional', 'civil', 'nope'] }, s), true);
  const p = loadProfile(s);
  assert.ok(sameProfile(p, PERFIL_LAURA));
  assert.deepEqual(JSON.parse(s.m.get('cj-perfil')).areas, ['civil', 'constitucional']);
});

test('nothing stored, garbage or a broken storage give null, never an exception', () => {
  assert.equal(loadProfile(memory()), null);
  const g = memory();
  g.setItem('cj-perfil', '{not json');
  assert.equal(loadProfile(g), null);
  g.setItem('cj-perfil', '"texto"');
  assert.equal(loadProfile(g), null);
  assert.equal(loadProfile(broken), null);
  assert.equal(loadProfile(null), null);
  assert.equal(saveProfile(PERFIL_LAURA, broken), false);
  assert.equal(clearData(broken), false);
});

test('each cerebro saves under its own key, normalized by its own module', () => {
  const s = memory();
  assert.equal(saveProfileFor(SKILL, { ...EJEMPLO_SKILL, pasos: 'Uno\n\n- Dos\n' }, s), true);
  assert.equal(saveProfileFor(IDEACION, { ...EJEMPLO_IDEACION, sector: 'nope' }, s), true);
  assert.equal(saveProfileFor(MVP, { ...EJEMPLO_MVP, restricciones: 'Uno\n\n- Dos' }, s), true);
  assert.deepEqual(JSON.parse(s.m.get('cj-perfil-skill')).pasos, ['Uno', 'Dos']);
  assert.equal(JSON.parse(s.m.get('cj-perfil-ideacion')).sector, null);
  assert.deepEqual(loadProfileFor(SKILL, s), normalizeSkill({ ...EJEMPLO_SKILL, pasos: ['Uno', 'Dos'] }));
  assert.deepEqual(loadProfileFor(IDEACION, s), normalizeIdeacion({ ...EJEMPLO_IDEACION, sector: null }));
  assert.deepEqual(loadProfileFor(MVP, s), normalizeMvp({ ...EJEMPLO_MVP, restricciones: ['Uno', 'Dos'] }));
  assert.equal(s.m.has('cj-perfil'), false, 'the legal key is untouched');
});

test('loadProfileFor: nothing, garbage, an array or a broken storage give null', () => {
  assert.equal(loadProfileFor(SKILL, memory()), null);
  const g = memory();
  g.setItem('cj-perfil-skill', '{not json');
  assert.equal(loadProfileFor(SKILL, g), null);
  g.setItem('cj-perfil-skill', '[1,2]');
  assert.equal(loadProfileFor(SKILL, g), null);
  assert.equal(loadProfileFor(SKILL, broken), null);
  assert.equal(loadProfileFor(SKILL, null), null);
  assert.equal(saveProfileFor(SKILL, EJEMPLO_SKILL, broken), false);
  assert.equal(saveProfileFor(SKILL, EJEMPLO_SKILL, null), false);
});

test('the chosen tab is remembered as a plain id', () => {
  const s = memory();
  assert.equal(loadCerebro(s), null);
  assert.equal(saveCerebro('ideacion', s), true);
  assert.equal(s.m.get('cj-cerebro'), 'ideacion');
  assert.equal(loadCerebro(s), 'ideacion');
  assert.equal(loadCerebro(broken), null);
  assert.equal(saveCerebro('skill', broken), false);
});

test('clearData removes the four profiles, the tab choice and the theme', () => {
  const s = memory();
  for (const k of ['cj-perfil', 'cj-perfil-skill', 'cj-perfil-ideacion', 'cj-perfil-mvp', 'cj-cerebro']) s.setItem(k, '{}');
  s.setItem('cj-theme', 'light');
  s.setItem('otra', 'x');
  assert.equal(clearData(s), true);
  assert.deepEqual([...s.m.keys()], ['otra']);
});

test('sameProfile ignores order and unknown ids', () => {
  assert.ok(sameProfile(PERFIL_LAURA, { ...PERFIL_LAURA, herramientas: ['chatgpt', 'claude', 'x'] }));
  assert.ok(!sameProfile(PERFIL_LAURA, PERFIL_VACIO));
});
