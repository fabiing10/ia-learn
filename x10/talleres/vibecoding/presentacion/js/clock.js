// Block clock: one countdown per workshop block, e.g. the 30 minutes of the spec
// workshop. Every slide of the block carries data-clock="id" data-clock-min="30";
// the clock starts the first time one of them shows, keeps running while the
// presenter moves between them, and hides on slides without a clock.
// Click pauses or resumes; double click resets.
import { defineCtrl } from '@engine/core/motion.js';
import { state } from '@engine/core/state.js';

const clocks = new Map(); // id -> { total, left, since }
let el;
let timeEl;
let fillEl;
let active = null;
let ticker = 0;

const remaining = (c) => Math.max(0, c.since == null ? c.left : c.left - (performance.now() - c.since));

function paint() {
  const c = clocks.get(active);
  if (!c || !el) return;
  const left = remaining(c);
  const s = Math.ceil(left / 1000);
  timeEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  fillEl.style.transform = `scaleX(${left / c.total})`;
  el.classList.toggle('is-paused', c.since == null && left > 0);
  el.classList.toggle('is-done', left <= 0);
  el.setAttribute('aria-label', `Tiempo restante ${timeEl.textContent}. Clic para pausar o reanudar.`);
}

function toggle() {
  const c = clocks.get(active);
  if (!c) return;
  if (c.since == null) {
    if (c.left > 0) c.since = performance.now();
  } else {
    c.left = remaining(c);
    c.since = null;
  }
  paint();
}

function reset() {
  const c = clocks.get(active);
  if (!c) return;
  c.left = c.total;
  c.since = null;
  paint();
}

function mount() {
  if (el) return;
  el = document.createElement('button');
  el.type = 'button';
  el.className = 'vc-clock';
  el.innerHTML =
    '<span class="vc-clock__time"></span><span class="vc-clock__bar"><span class="vc-clock__fill"></span></span>';
  timeEl = el.querySelector('.vc-clock__time');
  fillEl = el.querySelector('.vc-clock__fill');
  // Keep Reveal from treating these clicks as navigation
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    reset();
  });
  document.querySelector('.reveal .slides').appendChild(el);
}

function show(slide) {
  const id = slide.dataset.clock;
  if (!clocks.has(id)) {
    const total = (Number(slide.dataset.clockMin) || 5) * 60_000;
    clocks.set(id, { total, left: total, since: performance.now() });
  }
  active = id;
  mount();
  paint();
  el.classList.add('is-on');
  clearInterval(ticker);
  ticker = setInterval(paint, 250);
}

function hideUnlessCurrent() {
  const cur = document.querySelector('.reveal .slides section.present:not(.stack)');
  if (cur?.dataset.clock) return;
  clearInterval(ticker);
  el?.classList.remove('is-on');
}

defineCtrl('vc-clock', {
  enter(slide) {
    if (state.receiver || state.print) return;
    show(slide);
  },
  leave() {
    // The next slide may carry the same clock: decide once Reveal has moved on.
    setTimeout(hideUnlessCurrent, 60);
  },
});
