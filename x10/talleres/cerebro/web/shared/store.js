// Profile persistence in this browser only (localStorage `cj-perfil`). Every access
// is wrapped: private windows, blocked storage or quota errors just mean the
// profile lives for this visit.

import { normalizeProfile } from './generator.js';

export const KEYS = {
  perfil: 'cj-perfil',
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

export function loadProfile(storage = localStore()) {
  try {
    const raw = storage?.getItem(KEYS.perfil);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' && !Array.isArray(data) ? normalizeProfile(data) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile, storage = localStore()) {
  try {
    if (!storage) return false;
    storage.setItem(KEYS.perfil, JSON.stringify(normalizeProfile(profile)));
    return true;
  } catch {
    return false;
  }
}

export function clearData(storage = localStore()) {
  try {
    if (!storage) return false;
    storage.removeItem(KEYS.perfil);
    storage.removeItem(KEYS.theme);
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
