// The live files: six tabs and a monospace preview rewritten on every change.
// Lines that changed flash, the preview scrolls to the first of them, and the
// tabs of the other files that changed blink so nothing happens off screen.

import { ARCHIVOS } from '../shared/generator.js';
import { renderPreview } from '../shared/preview.js';
import { bindCopy, downloadText, reducedMotion } from '../shared/ui.js';

const slug = (name) => name.replace(/\W+/g, '-').toLowerCase();

export function mountArchivos({ tabs, panel, pre, meta, copyBtn, downBtn }) {
  let files = null;
  let active = '00_ADN.md';

  tabs.innerHTML = ARCHIVOS.map(
    (n) =>
      `<button class="tab" type="button" role="tab" id="tab-${slug(n)}" data-archivo="${n}" aria-controls="${panel.id}" aria-selected="false" tabindex="-1"><span class="tab__name">${n}</span><i class="tab__dot" aria-hidden="true"></i></button>`,
  ).join('');
  const tab = (n) => tabs.querySelector(`[data-archivo="${n}"]`);

  function show(name, prev) {
    const text = files[name];
    const { html, changed } = renderPreview(text, prev);
    pre.innerHTML = html;
    const lines = text.trimEnd().split('\n').length;
    meta.textContent = `${lines} líneas${changed ? ` · ${changed} ${changed === 1 ? 'cambió' : 'cambiaron'}` : ''}`;
    if (changed) {
      const first = pre.querySelector('.is-new');
      pre.scrollTo({ top: Math.max(0, first.offsetTop - pre.clientHeight * 0.28), behavior: reducedMotion() ? 'auto' : 'smooth' });
      clearTimeout(show.t);
      show.t = setTimeout(() => {
        for (const l of pre.querySelectorAll('.is-new')) l.classList.remove('is-new');
        meta.textContent = `${lines} líneas`;
      }, 2600);
    }
  }

  function select(name, { focus = false } = {}) {
    active = name;
    for (const b of tabs.querySelectorAll('.tab')) {
      const on = b.dataset.archivo === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', `tab-${slug(name)}`);
    pre.setAttribute('aria-label', `Contenido de ${name}`);
    // Scroll only the tab strip (never the page) to keep the active tab in view.
    const t = tab(name);
    tabs.scrollTo({ left: t.offsetLeft - (tabs.clientWidth - t.offsetWidth) / 2 });
    if (focus) t.focus({ preventScroll: true });
    pre.scrollTop = 0;
    show(name);
  }

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) select(b.dataset.archivo);
  });

  // Roving focus: arrows, Home and End move between tabs.
  tabs.addEventListener('keydown', (e) => {
    const i = ARCHIVOS.indexOf(active);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ARCHIVOS.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(ARCHIVOS[(to + ARCHIVOS.length) % ARCHIVOS.length], { focus: true });
  });

  bindCopy(copyBtn, () => files[active], { done: 'Copiado', message: `Copiaste ${active}.` });
  downBtn.addEventListener('click', () => downloadText(active, files[active]));

  const blinkTimers = new Map();
  function blink(name) {
    const t = tab(name);
    clearTimeout(blinkTimers.get(name));
    t.classList.remove('is-changed');
    void t.offsetWidth;
    t.classList.add('is-changed');
    blinkTimers.set(name, setTimeout(() => t.classList.remove('is-changed'), 2400));
  }

  /** New files; `changed` lists the names that differ from the previous ones. */
  function update(next, changed = []) {
    const prev = files;
    files = next;
    if (!prev) return select(active);
    for (const n of changed) blink(n);
    if (changed.includes(active)) show(active, prev[active]);
  }

  return { update, select, get active() { return active; } };
}
