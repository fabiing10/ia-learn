// Profile persistence: localStorage when it works, nothing breaks when it does not.

import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, clearData, loadProfile, sameProfile, saveProfile } from './store.js';
import { PERFIL_LAURA, PERFIL_VACIO } from './catalog.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const broken = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
  removeItem() { throw new Error('SecurityError'); },
};

test('keys are the contract ones', () => {
  assert.deepEqual(KEYS, { perfil: 'cj-perfil', theme: 'cj-theme' });
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

test('clearData removes the profile and the theme', () => {
  const s = memory();
  s.setItem('cj-perfil', '{}');
  s.setItem('cj-theme', 'light');
  s.setItem('otra', 'x');
  assert.equal(clearData(s), true);
  assert.deepEqual([...s.m.keys()], ['otra']);
});

test('sameProfile ignores order and unknown ids', () => {
  assert.ok(sameProfile(PERFIL_LAURA, { ...PERFIL_LAURA, herramientas: ['chatgpt', 'claude', 'x'] }));
  assert.ok(!sameProfile(PERFIL_LAURA, PERFIL_VACIO));
});
