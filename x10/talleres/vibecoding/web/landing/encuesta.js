// #encuesta — invitation to the intro survey (/vibecoding/encuesta/). Keeps the
// session code of the link, says how many already answered, and changes the
// button once this browser has answered.

import { cleanSession } from '../shared/salida.js';
import { fetchResumen } from '../shared/resumen.js';
import { KEYS, readJSON } from '../shared/store.js';
import { readParam } from '../shared/ui.js';

export function initEncuesta() {
  const raw = readParam('s');
  const session = cleanSession(raw);
  const href = raw ? `/vibecoding/encuesta/?s=${encodeURIComponent(session)}` : '/vibecoding/encuesta/';
  document.querySelectorAll('[data-encuesta-link]').forEach((a) => (a.href = href));

  const done = readJSON(KEYS.encuesta, {})?.[session]?.done === true;
  if (done) {
    document.querySelectorAll('[data-encuesta-cta]').forEach((el) => (el.textContent = 'Ver cómo llega la sala'));
  }

  const count = document.getElementById('encuesta-count');
  fetchResumen(session)
    .then((s) => {
      const n = Number(s?.total) || 0;
      if (!n) return;
      const who = n === 1 ? 'Ya respondió 1 persona' : `Ya respondieron ${n} personas`;
      count.textContent = done ? `${who}, incluida tu respuesta.` : `${who}.`;
    })
    .catch(() => {
      /* the count is a nicety; the link works without it */
    });
}
