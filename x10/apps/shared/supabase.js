// Supabase access for /test and /panel, with a localStorage demo mode.
// No env vars → DEMO: rows live in this browser so the UI works offline/locally.
// supabase-js is loaded lazily so demo pages never download it.

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const TABLE = 'x10_responses';
export const isDemo = !(URL_ && KEY);

const DEMO_KEY = 'x10-demo-responses';
const QUEUE_KEY = 'x10-queue';
const QUEUE_MAX = 10;
export const DEMO_EVENT = 'x10-demo-change';

let clientPromise = null;

/** Lazily created client. `auth` options differ: /test never needs a session. */
export function getClient({ auth = false } = {}) {
  if (isDemo) return Promise.resolve(null);
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_, KEY, {
      auth: auth
        ? { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        : { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
  );
  return clientPromise;
}

// ── localStorage helpers (never throw: private mode, quota, blocked storage) ──

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── Demo store ──

export function demoRows(session) {
  const rows = readJSON(DEMO_KEY, []);
  return Array.isArray(rows) ? rows.filter((r) => !session || r.session === session) : [];
}

export function demoSessions() {
  return [...new Set(demoRows().map((r) => r.session))].sort();
}

function demoNotify() {
  window.dispatchEvent(new CustomEvent(DEMO_EVENT));
}

export function demoInsert(rows) {
  const all = demoRows();
  const stamped = rows.map((r, i) => ({
    id: r.id ?? `demo-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: r.created_at ?? new Date().toISOString(),
    ...r,
  }));
  // Keep the demo store bounded so localStorage never fills up.
  const ok = writeJSON(DEMO_KEY, [...all, ...stamped].slice(-500));
  if (ok) demoNotify();
  return ok;
}

export function demoClear(session) {
  writeJSON(DEMO_KEY, demoRows().filter((r) => r.session !== session));
  demoNotify();
}

// ── Submit with one retry and an offline queue ──

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Network-ish failures are worth retrying; a Postgres/RLS rejection is not.
function isTransient(error) {
  if (!error) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const status = Number(error.status ?? 0);
  return !error.code || status === 0 || status === 408 || status === 429 || status >= 500;
}

async function insertOnce(row) {
  const supabase = await getClient();
  // No .select(): anon has INSERT but no SELECT under RLS.
  const { error } = await supabase.from(TABLE).insert(row);
  return error ?? null;
}

async function insertWithRetry(row) {
  let error;
  try {
    error = await insertOnce(row);
  } catch (err) {
    error = { message: String(err?.message ?? err) };
  }
  if (!error || !isTransient(error)) return error;
  await sleep(1200);
  try {
    return await insertOnce(row);
  } catch (err) {
    return { message: String(err?.message ?? err) };
  }
}

function queue() {
  const q = readJSON(QUEUE_KEY, []);
  return Array.isArray(q) ? q : [];
}

/**
 * Saves one response. Resolves to { status } where status is
 *   'demo'    stored locally (no Supabase configured)
 *   'saved'   inserted in Supabase
 *   'queued'  offline or transient failure; retried on next load
 *   'error'   rejected by the server (kept out of the queue)
 */
export async function submitResponse(row) {
  if (isDemo) return { status: demoInsert([row]) ? 'demo' : 'error' };
  const error = await insertWithRetry(row);
  if (!error) return { status: 'saved' };
  if (isTransient(error)) {
    writeJSON(QUEUE_KEY, [...queue(), row].slice(-QUEUE_MAX));
    return { status: 'queued' };
  }
  console.warn('[x10] response rejected', error.message ?? error);
  return { status: 'error', error };
}

/** Sends queued rows from an earlier offline submit. Returns how many were sent. */
export async function flushQueue() {
  if (isDemo) return 0;
  const pending = queue();
  if (!pending.length || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 0;
  const left = [];
  let sent = 0;
  for (const row of pending) {
    const error = await insertOnce(row).catch((err) => ({ message: String(err?.message ?? err) }));
    if (!error) sent += 1;
    else if (isTransient(error)) left.push(row);
  }
  writeJSON(QUEUE_KEY, left);
  return sent;
}

export function queuedCount() {
  return queue().length;
}
