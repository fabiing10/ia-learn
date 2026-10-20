// localStorage helpers that never throw (private mode, quota, blocked storage).
// Every key used by the Vibe Coding pages is listed here.

export const KEYS = {
  theme: 'vc-theme',
  antes: 'vc-antes',
  piezas: 'vc-piezas',
  spec: 'vc-spec',
  salidaDraft: 'vc-salida-draft',
  demo: 'vc-demo-submissions',
  queue: 'vc-queue',
  panelBig: 'vc-panel-big',
};

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage blocked: nothing to remove */
  }
}
