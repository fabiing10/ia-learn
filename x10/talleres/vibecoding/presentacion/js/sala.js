// Sala · ¿Quiénes llegaron hoy? — live aggregates of the intro survey
// (/vibecoding/encuesta/). Reads the public vc_intro_summary function (totals
// only, no rows) and refreshes while the slide is on screen. Offline it says so
// and the class goes on. Labels and maths come from the survey's own module.
import { gsap, defineCtrl } from '@engine/core/motion.js';
import { config } from '@engine/core/config.js';
import { state } from '@engine/core/state.js';
import { kpis } from '../../web/shared/encuesta.js';
import { fetchResumen, isLive } from '../../web/shared/resumen.js';

const SESSION = config.encuesta?.sesion || 'clase-1';
const EVERY_MS = 4000;

let timer = 0;
let controller = null;

const pct = (n) => `${n} %`;
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

function renderBars(slide, k, animate) {
  const ol = $(slide, '[data-sala-bars="nivel"]');
  if (!ol.children.length) {
    ol.replaceChildren(
      ...k.nivel.map((x) => {
        const row = document.createElement('li');
        row.dataset.id = x.id;
        row.innerHTML = '<span class="vc-bars__k"></span><span class="vc-bars__bar"><i></i></span><span class="vc-bars__pct"></span>';
        row.querySelector('.vc-bars__k').textContent = x.label;
        return row;
      }),
    );
  }
  const max = Math.max(1, ...k.nivel.map((x) => x.n));
  k.nivel.forEach((x, i) => {
    const row = ol.children[i];
    row.querySelector('.vc-bars__pct').textContent = pct(x.pct);
    row.classList.toggle('is-top', x.n > 0 && x.n === max);
    const bar = row.querySelector('i');
    if (animate) gsap.to(bar, { scaleX: x.n / max, duration: 0.9, ease: 'expo.out' });
    else gsap.set(bar, { scaleX: x.n / max });
  });
}

function renderList(slide, key, k) {
  const ol = $(slide, `[data-sala-list="${key}"]`);
  const rows = k.top(key, 3);
  ol.replaceChildren(...(rows.length ? rows.map((r) => li(r.label, pct(r.pct))) : [li('Esperando respuestas…', null, 'is-empty')]));
}

function render(slide, summary, animate) {
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
  $(slide, '[data-sala-kpi="activos"]').textContent = empty ? '–' : pct(k.activosPct);
  $(slide, '[data-sala-kpi="creadores"]').textContent = empty ? '–' : pct(k.creadoresPct);
  $(slide, '[data-sala-kpi="favorita"]').textContent = k.favorita ? k.favorita.label : '–';
  $(slide, '[data-sala-kpi="favorita-k"]').textContent = k.favorita
    ? `el asistente que más usan · ${pct(k.favorita.pct)}`
    : 'el asistente que más usan';
  renderBars(slide, k, animate);
  ['entidad', 'construido', 'creadores'].forEach((key) => renderList(slide, key, k));
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
    slide.classList.add('is-offline');
    setStatus(slide, 'Sin conexión: los resultados en vivo aparecerán cuando vuelva internet.');
  }
}

function stop() {
  clearInterval(timer);
  timer = 0;
  controller?.abort();
}

defineCtrl('vc-sala', {
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
