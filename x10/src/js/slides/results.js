// S37b · ¿Dónde estamos? — live aggregates of the /test answers.
// Reads the public x10_summary RPC (aggregates only, no rows) and refreshes
// while the slide is on screen. Offline it says so and the talk goes on.
import { gsap, defineCtrl } from '../core/motion.js';
import { config } from '../core/config.js';
import { state } from '../core/state.js';
import { labelFor } from './results-labels.js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SESSION = config.testSession || 'mci-2026';
const EVERY_MS = 4000;
const LEVELS = ['x1', 'x2', 'x5', 'x10'];

let timer = 0;
let controller = null;

async function fetchSummary() {
  if (!URL || !KEY) throw new Error('not-configured');
  controller?.abort();
  controller = new AbortController();
  const res = await fetch(`${URL}/rest/v1/rpc/x10_summary`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_session: SESSION }),
    signal: controller.signal,
  });
  if (!res.ok) throw new Error(`http-${res.status}`);
  return res.json();
}

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function top(obj = {}, n = 3) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function renderList(slide, key, data, total) {
  const ol = slide.querySelector(`[data-res-list="${key}"]`);
  const rows = top(data[key]);
  // use_areas counts can exceed the number of people (multi-select)
  const base = key === 'use_areas' ? Math.max(total, 1) : total;
  ol.replaceChildren(
    ...rows.map(([k, n]) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = labelFor(key, k);
      const val = document.createElement('b');
      val.textContent = `${pct(n, base)}%`;
      li.append(name, val);
      return li;
    }),
  );
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'is-empty';
    li.textContent = 'Esperando respuestas…';
    ol.append(li);
  }
}

function render(slide, data, animate) {
  const total = Number(data.total) || 0;
  const totalEl = slide.querySelector('[data-res-total]');
  const prev = Number(totalEl.textContent) || 0;
  if (animate && prev !== total) {
    const o = { v: prev };
    gsap.to(o, { v: total, duration: 0.8, ease: 'power2.out', onUpdate: () => (totalEl.textContent = Math.round(o.v)) });
  } else {
    totalEl.textContent = total;
  }

  const levels = data.level || {};
  const max = Math.max(1, ...LEVELS.map((l) => levels[l] || 0));
  slide.querySelectorAll('[data-res-levels] li').forEach((li) => {
    const n = levels[li.dataset.level] || 0;
    li.querySelector('.results__pct').textContent = `${pct(n, total)}%`;
    const bar = li.querySelector('.results__bar i');
    const scale = n / max;
    if (animate) gsap.to(bar, { scaleX: scale, duration: 0.9, ease: 'expo.out' });
    else gsap.set(bar, { scaleX: scale });
    li.classList.toggle('is-top', n > 0 && n === max);
  });

  const fear = data.fear_avg == null ? null : Number(data.fear_avg);
  slide.querySelector('[data-res-fear]').textContent = fear == null ? '–' : fear.toFixed(1).replace('.', ',');
  slide.querySelectorAll('[data-res-fear-scale] i').forEach((dot, i) => {
    const fill = fear == null ? 0 : Math.max(0, Math.min(1, fear - i));
    dot.style.setProperty('--fill', fill.toFixed(2));
  });

  ['role', 'industry', 'use_areas'].forEach((k) => renderList(slide, k, data, total));
}

function setStatus(slide, text) {
  slide.querySelector('[data-res-status]').textContent = text;
}

async function tick(slide, animate) {
  try {
    const data = await fetchSummary();
    render(slide, data, animate);
    slide.classList.remove('is-offline');
    setStatus(slide, '');
  } catch (err) {
    if (err.name === 'AbortError') return;
    slide.classList.add('is-offline');
    setStatus(
      slide,
      err.message === 'not-configured'
        ? 'Resultados en vivo no configurados en esta copia (faltan las variables de Supabase).'
        : 'Sin conexión: los resultados en vivo aparecerán cuando vuelva internet.',
    );
  }
}

function stop() {
  clearInterval(timer);
  timer = 0;
  controller?.abort();
}

defineCtrl('results', {
  enter(slide, { lite }) {
    stop();
    tick(slide, !lite);
    timer = setInterval(() => tick(slide, !state.lite), EVERY_MS);
  },
  leave: stop,
  print(slide) {
    setStatus(slide, 'Resultados en vivo: se muestran durante la presentación y en /panel.');
  },
});
