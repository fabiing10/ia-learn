// Supabase access for the intro survey, with a demo mode. No env vars → DEMO:
// rows live in this browser's localStorage so the page works offline and
// locally. supabase-js is loaded lazily, only when a row is actually sent.

import { KEYS, readJSON, writeJSON } from './store.js';
import { WORKSHOP, FORM } from './encuesta.js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const TABLE = 'workshop_submissions';
export const isDemo = !(URL_ && KEY);
const QUEUE_MAX = 10;

let clientPromise = null;

function getClient() {
  if (isDemo) return Promise.resolve(null);
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }),
  );
  return clientPromise;
}

// ── Demo store (this browser only) ──

export function demoRows({ session } = {}) {
  const rows = readJSON(KEYS.demo, []);
  return (Array.isArray(rows) ? rows : []).filter(
    (r) => r && r.workshop === WORKSHOP && r.form === FORM && (!session || r.session === session),
  );
}

function demoInsert(rows) {
  const all = readJSON(KEYS.demo, []);
  const stamped = rows.map((r, i) => ({
    id: r.id ?? `demo-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: r.created_at ?? new Date().toISOString(),
    ...r,
  }));
  return writeJSON(KEYS.demo, [...(Array.isArray(all) ? all : []), ...stamped].slice(-500));
}

// ── Submit with one retry and an offline queue ──

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

// Network-ish failures are worth retrying; a Postgres/RLS rejection is not.
function isTransient(error) {
  if (!error) return false;
  if (offline()) return true;
  const status = Number(error.status ?? 0);
  return !error.code || status === 0 || status === 408 || status === 429 || status >= 500;
}

async function insertOnce(row) {
  try {
    const supabase = await getClient();
    // No .select(): anon has INSERT but no SELECT under RLS.
    const { error, status } = await supabase.from(TABLE).insert(row);
    return { error: error ? { ...error, status: error.status ?? status } : null, status };
  } catch (err) {
    return { error: { message: String(err?.message ?? err) }, status: 0 };
  }
}

function queue() {
  const q = readJSON(KEYS.queue, []);
  return Array.isArray(q) ? q : [];
}

function enqueue(row) {
  writeJSON(KEYS.queue, [...queue(), row].slice(-QUEUE_MAX));
}

/**
 * Saves one survey row. Resolves to { status, httpStatus }:
 *   'demo'    stored in this browser (no Supabase configured)
 *   'saved'   inserted in Supabase
 *   'queued'  offline or transient failure; kept here and retried later
 *   'error'   rejected by the server (not queued)
 */
export async function submitRow(row) {
  if (isDemo) return { status: demoInsert([row]) ? 'demo' : 'error' };
  if (offline()) {
    enqueue(row);
    return { status: 'queued' };
  }
  let res = await insertOnce(row);
  if (res.error && isTransient(res.error)) {
    await sleep(1200);
    res = await insertOnce(row);
  }
  if (!res.error) return { status: 'saved', httpStatus: res.status };
  if (isTransient(res.error)) {
    enqueue(row);
    return { status: 'queued', httpStatus: res.status };
  }
  console.warn('[cerebro] submission rejected:', res.error.message ?? res.error);
  return { status: 'error', httpStatus: res.status, error: res.error };
}

/** Sends rows queued by an earlier offline submit. Resolves to how many were sent. */
export async function flushQueue() {
  if (isDemo || offline()) return 0;
  const pending = queue();
  if (!pending.length) return 0;
  const left = [];
  let sent = 0;
  for (const row of pending) {
    const { error } = await insertOnce(row);
    if (!error) sent += 1;
    else if (isTransient(error)) left.push(row);
  }
  writeJSON(KEYS.queue, left);
  return sent;
}
