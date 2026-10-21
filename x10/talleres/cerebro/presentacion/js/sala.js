// Sala · ¿Quiénes están en la sala? — live aggregates of the intro survey
// (/cerebro/encuesta/). Reads the public cj_intro_summary function (counts per
// option, never a row, never a name) and refreshes while the slide is on screen.
// Offline it says so and the class goes on.
import { gsap, defineCtrl } from '@engine/core/motion.js';
import { config } from '@engine/core/config.js';
import { state } from '@engine/core/state.js';
import { kpis, SESSION_DEFAULT } from '../../web/shared/encuesta.js';
import { fetchResumen, isLive } from '../../web/shared/resumen.js';

const SESSION = config.encuesta?.sesion || SESSION_DEFAULT;
const EVERY_MS = 4000;

let timer = 0;
let controller = null;

const pct = (n) => `${n} %`;
const $ = (slide, sel) => slide.querySelector(sel);

function li(text, value, cls = '') {
  const el = document.createElement('li');
  if (cls) el.className = cls;
  const name = document.createElement('span');
  name.textContent = text;
  el.append(name);
  if (value != null) {
    const v = document.createElement('b');
    v.textContent = value;
    el.append(v);
  }
  return el;
}

function renderList(slide, key, k, limit = 3) {
  const ol = $(slide, `[data-sala-list="${key}"]`);
  const rows = k.top(key, limit);
  ol.replaceChildren(...(rows.length ? rows.map((r) => li(r.label, pct(r.pct))) : [li('Esperando respuestas…', null, 'is-empty')]));
}

function render(slide, summary, animate) {
  slide.dataset.rendered = '1';
  const k = kpis(summary);
  const totalEl = $(slide, '[data-sala-total]');
  const prev = Number(totalEl.textContent) || 0;
  if (animate && prev !== k.total) {
    const o = { v: prev };
    gsap.to(o, { v: k.total, duration: 0.8, ease: 'power2.out', onUpdate: () => (totalEl.textContent = Math.round(o.v)) });
  } else {
    totalEl.textContent = k.total;
  }
  const empty = !k.total;
  const set = (key, v) => {
    const el = $(slide, `[data-sala-kpi="${key}"]`);
    if (el) el.textContent = empty ? '–' : v;
  };
  set('activos', pct(k.activosPct));
  set('proyectos', pct(k.proyectosPct));
  set('skill', pct(k.skillPct));
  set('entrena', pct(k.entrenaRiesgoPct));
  set('alucino', pct(k.alucinoPct));
  $(slide, '[data-sala-kpi="favorita"]').textContent = k.favorita ? k.favorita.label : '–';
  $(slide, '[data-sala-kpi="favorita-k"]').textContent = k.favorita ? `la IA que más usan · ${pct(k.favorita.pct)}` : 'la IA que más usan';
  renderList(slide, 'rol', k, 3);
  renderList(slide, 'usos', k, 3);
}

function setStatus(slide, text) {
  $(slide, '[data-sala-status]').textContent = text;
}

async function tick(slide, animate) {
  controller?.abort();
  controller = new AbortController();
  try {
    render(slide, await fetchResumen(SESSION, { signal: controller.signal }), animate);
    slide.classList.remove('is-offline');
    setStatus(slide, isLive ? '' : 'Modo demo: sin Supabase en esta copia, se leen las respuestas de este navegador.');
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (!slide.dataset.rendered) render(slide, { total: 0, counts: {} }, false);
    slide.classList.add('is-offline');
    setStatus(slide, 'Sin conexión: los resultados en vivo aparecerán cuando vuelva internet.');
  }
}

function stop() {
  clearInterval(timer);
  timer = 0;
  controller?.abort();
}

defineCtrl('cj-sala', {
  enter(slide, { lite }) {
    stop();
    tick(slide, !lite);
    timer = setInterval(() => tick(slide, !state.lite), EVERY_MS);
  },
  leave: stop,
  print(slide) {
    render(slide, { total: 0, counts: {} }, false);
    setStatus(slide, 'Resultados en vivo de la encuesta de entrada: se ven durante la presentación.');
  },
});
