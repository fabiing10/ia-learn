// Profile persistence in this browser only: one localStorage key per cerebro
// (`cj-perfil-skill`, `cj-perfil-ideacion`, `cj-perfil` for the legal one) and the
// chosen tab in `cj-cerebro`. Every access is wrapped: private windows, blocked
// storage or quota errors just mean the profile lives for this visit.

import { normalizeProfile } from './generator.js';

export const KEYS = {
  perfil: 'cj-perfil',
  perfilSkill: 'cj-perfil-skill',
  perfilIdeacion: 'cj-perfil-ideacion',
  cerebro: 'cj-cerebro',
  theme: 'cj-theme',
  encuesta: 'cj-encuesta',
  demo: 'cj-demo-submissions',
  queue: 'cj-queue',
};

/** window.localStorage, or null where reading the property itself throws. */
export function localStore() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const LEGAL = { storeKey: KEYS.perfil, normalize: normalizeProfile };

/** The saved profile of a cerebro ({ storeKey, normalize } of cerebros.js), or null. */
export function loadProfileFor(cerebro, storage = localStore()) {
  try {
    const raw = storage?.getItem(cerebro.storeKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' && !Array.isArray(data) ? cerebro.normalize(data) : null;
  } catch {
    return null;
  }
}

export function saveProfileFor(cerebro, profile, storage = localStore()) {
  try {
    if (!storage) return false;
    storage.setItem(cerebro.storeKey, JSON.stringify(cerebro.normalize(profile)));
    return true;
  } catch {
    return false;
  }
}

export const loadProfile = (storage = localStore()) => loadProfileFor(LEGAL, storage);
export const saveProfile = (profile, storage = localStore()) => saveProfileFor(LEGAL, profile, storage);

/** The last chosen cerebro tab, as stored (cerebros.js validates it). */
export function loadCerebro(storage = localStore()) {
  try {
    return storage?.getItem(KEYS.cerebro) ?? null;
  } catch {
    return null;
  }
}

export function saveCerebro(id, storage = localStore()) {
  try {
    if (!storage) return false;
    storage.setItem(KEYS.cerebro, id);
    return true;
  } catch {
    return false;
  }
}

/** «Borrar mis datos»: the three profiles, the tab choice and the theme. */
export function clearData(storage = localStore()) {
  try {
    if (!storage) return false;
    for (const k of [KEYS.perfil, KEYS.perfilSkill, KEYS.perfilIdeacion, KEYS.cerebro, KEYS.theme]) storage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export const sameProfile = (a, b) => JSON.stringify(normalizeProfile(a)) === JSON.stringify(normalizeProfile(b));

// ── Generic JSON helpers for the survey page (never throw) ──

export function readJSON(key, fallback) {
  try {
    const raw = localStore()?.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStore()?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
