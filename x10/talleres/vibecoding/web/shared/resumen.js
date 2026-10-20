// Public aggregates of the intro survey, read with a plain fetch (no supabase-js)
// so the deck can import it too. Returns { total, counts } like summarize().
// Without Supabase env vars (local demo) it aggregates this browser's demo rows.

import { readJSON, KEYS } from './store.js';
import { WORKSHOP, FORM, summarize } from './encuesta.js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isLive = Boolean(URL_ && KEY);

export async function fetchResumen(session, { signal } = {}) {
  if (!isLive) {
    const rows = readJSON(KEYS.demo, []);
    const mine = (Array.isArray(rows) ? rows : []).filter(
      (r) => r?.workshop === WORKSHOP && r.form === FORM && r.session === session,
    );
    return summarize(mine.map((r) => r.payload));
  }
  const res = await fetch(`${URL_}/rest/v1/rpc/vc_intro_summary`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_session: session }),
    signal,
  });
  if (!res.ok) throw new Error(`http-${res.status}`);
  return res.json();
}
