// The live files: one tab per file of the active cerebro and a monospace preview
// rewritten on every change. Lines that changed flash, the preview scrolls to the
// first of them, and the tabs of the other files that changed blink so nothing
// happens off screen. `setArchivos` swaps the tab set when the cerebro changes.

import { nombreCorto } from '../shared/cerebros.js';
import { renderPreview } from '../shared/preview.js';
import { bindCopy, downloadText, reducedMotion } from '../shared/ui.js';

const slug = (name) => name.replace(/\W+/g, '-').toLowerCase();
// 'references/plantilla-spec.md' is too long for a tab: 'plantilla-spec'.
const etiqueta = (name) => (name.startsWith('references/') ? nombreCorto(name) : name);

export function mountArchivos({ tabs, panel, pre, meta, copyBtn, downBtn }) {
  let list = [];
  let files = null;
  let active = null;

  const tab = (n) => tabs.querySelector(`[data-archivo="${CSS.escape(n)}"]`);

  function renderTabs() {
    tabs.innerHTML = list
      .map(
        (n) =>
          `<button class="tab" type="button" role="tab" id="tab-${slug(n)}" data-archivo="${n}" aria-controls="${panel.id}" aria-selected="false" tabindex="-1"${
            etiqueta(n) === n ? '' : ` title="${n}"`
          }><span class="tab__name">${etiqueta(n)}</span><i class="tab__dot" aria-hidden="true"></i></button>`,
      )
      .join('');
  }

  /**
   * New tab set. `reset` (a new cerebro) forgets the previous files, so the next
   * update() shows `principal` without diff; otherwise (a file appeared in the same
   * cerebro) the files stay and the next update() still flashes what changed.
   */
  function setArchivos(next, principal = next[0], { reset = true } = {}) {
    list = [...next];
    active = list.includes(principal) ? principal : list[0];
    if (reset) files = null;
    renderTabs();
    if (!reset && files?.[active] !== undefined) select(active);
  }

  function show(name, prev) {
    const text = files[name];
    const { html, changed } = renderPreview(text, prev);
    pre.innerHTML = html;
    const lines = text.trimEnd().split('\n').length;
    meta.textContent = `${lines} líneas${changed ? ` · ${changed} ${changed === 1 ? 'cambió' : 'cambiaron'}` : ''}`;
    clearTimeout(show.t);
    if (changed) {
      const first = pre.querySelector('.is-new');
      pre.scrollTo({ top: Math.max(0, first.offsetTop - pre.clientHeight * 0.28), behavior: reducedMotion() ? 'auto' : 'smooth' });
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
    const i = list.indexOf(active);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(list[(to + list.length) % list.length], { focus: true });
  });

  // The toast names the file copied at click time (toast() reads it through textContent).
  bindCopy(copyBtn, () => files[active], { done: 'Copiado', message: { toString: () => `Copiaste ${active}.` } });
  downBtn.addEventListener('click', () => downloadText(active.split('/').pop(), files[active]));

  const blinkTimers = new Map();
  function blink(name) {
    const t = tab(name);
    if (!t) return;
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

  return {
    setArchivos,
    update,
    select,
    get active() {
      return active;
    },
    get list() {
      return list;
    },
  };
}
