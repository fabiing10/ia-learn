// Prompt block with «Copiar» and tool tabs (generic; can move to src/js/slides/).
//
// Markup, inside a slide with data-ctrl="pbox":
//   <div class="pbox" data-pbox [data-pbox-label="Prompt de prueba"]>
//     <pre>…</pre>                                   one prompt, or one per tool:
//     <pre data-tool="lovable">…</pre>
//     <pre data-tool="code">…</pre>
//     <pre data-tool="artifact">…</pre>
//   </div>
// build() adds a bar (tabs when there are tool variants, otherwise a label, and
// «Copiar») and puts the <pre>s in a box with its own vertical scroll, so the
// button stays visible however long the prompt is.
//  - «Copiar» copies the visible <pre>'s textContent (newlines kept) and reads
//    «Copiado» for 2 s.
//  - The chosen tool is stored in localStorage (vc-herramienta) and applied to
//    every tabbed block in the page, on load, on change and from other tabs.
//  - Keyboard: ←/→/Home/End move between tabs; ↑/↓/PgUp/PgDn/Space scroll a
//    focused prompt; Space/Enter press a focused button. Reveal never sees
//    those keys, so they do not change slides.
// Listeners live on document/window, so cloned blocks (reading mode) work too.
import { defineCtrl } from '@engine/core/motion.js';

export const TOOLS = {
  lovable: 'Lovable / AI Studio',
  code: 'Claude Code / Codex',
  artifact: 'Claude (artifact)',
};

const STORE = 'vc-herramienta';
const COPIED_MS = 2000;
let uid = 0;

function storedTool() {
  try {
    return localStorage.getItem(STORE);
  } catch {
    return null;
  }
}

function storeTool(tool) {
  try {
    localStorage.setItem(STORE, tool);
  } catch {
    /* blocked storage: the choice still applies to this page */
  }
}

/** Shows one tool in one block; falls back to the block's first tool. */
function select(box, tool) {
  const tabs = [...box.querySelectorAll('.pbox__tab')];
  if (!tabs.length) return;
  const active = tabs.find((t) => t.dataset.tool === tool) || tabs[0];
  tabs.forEach((t) => {
    const on = t === active;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}

function applyAll(tool) {
  document.querySelectorAll('.pbox[data-tabbed]').forEach((box) => select(box, tool));
}

function enhance(box) {
  if (box.classList.contains('is-ready')) return;
  const pres = [...box.querySelectorAll(':scope > pre')];
  if (!pres.length) return;
  const n = ++uid;
  const label = box.dataset.pboxLabel || 'Prompt';

  const bar = document.createElement('div');
  bar.className = 'pbox__bar';
  const scroll = document.createElement('div');
  scroll.className = 'pbox__scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', label);
  scroll.setAttribute('data-prevent-swipe', '');

  if (pres.length > 1) {
    box.setAttribute('data-tabbed', '');
    const list = document.createElement('div');
    list.className = 'pbox__tabs';
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Herramienta');
    pres.forEach((pre) => {
      const tool = pre.dataset.tool;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'pbox__tab';
      tab.id = `pbox${n}-${tool}-tab`;
      tab.dataset.tool = tool;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', `pbox${n}-${tool}`);
      tab.textContent = TOOLS[tool] || tool;
      pre.id = `pbox${n}-${tool}`;
      pre.setAttribute('role', 'tabpanel');
      pre.setAttribute('aria-labelledby', tab.id);
      list.appendChild(tab);
    });
    bar.appendChild(list);
  } else {
    const p = document.createElement('p');
    p.className = 'pbox__label';
    p.textContent = label;
    bar.appendChild(p);
  }

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'pbox__copy';
  const icon = document.createElement('span');
  icon.className = 'pbox__copy-icon';
  icon.setAttribute('aria-hidden', 'true');
  const copyLabel = document.createElement('span');
  copyLabel.className = 'pbox__copy-label';
  copyLabel.setAttribute('aria-live', 'polite');
  copyLabel.textContent = 'Copiar';
  copy.append(icon, copyLabel);
  bar.appendChild(copy);

  scroll.append(...pres);
  box.prepend(bar);
  box.appendChild(scroll);
  box.classList.add('is-ready');
  if (pres.length > 1) select(box, storedTool());
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback where the async clipboard is blocked (file://, old browsers)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

async function onCopy(btn) {
  const box = btn.closest('.pbox');
  const pre = [...box.querySelectorAll('.pbox__scroll > pre')].find((p) => !p.hidden);
  if (!pre) return;
  const label = btn.querySelector('.pbox__copy-label');
  const ok = await copyText(pre.textContent);
  btn.classList.toggle('is-done', ok);
  label.textContent = ok ? 'Copiado' : 'Selecciona y copia';
  if (!ok) window.getSelection()?.selectAllChildren(pre);
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    btn.classList.remove('is-done');
    label.textContent = 'Copiar';
  }, COPIED_MS);
}

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.pbox__tab');
  if (tab) {
    storeTool(tab.dataset.tool);
    applyAll(tab.dataset.tool);
    return;
  }
  const btn = e.target.closest('.pbox__copy');
  if (btn) onCopy(btn);
});

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
const TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

window.addEventListener(
  'keydown',
  (e) => {
    const el = e.target;
    if (!(el instanceof Element) || !el.closest('.pbox')) return;
    if (el.matches('.pbox__tab') && TAB_KEYS.has(e.key)) {
      const tabs = [...el.parentElement.querySelectorAll('.pbox__tab')];
      const i = tabs.indexOf(el);
      const next =
        e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[tabs.length - 1] : tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      e.preventDefault();
      e.stopPropagation();
      next.focus();
      next.click();
      return;
    }
    if (el.matches('button') && (e.key === ' ' || e.key === 'Enter')) e.stopPropagation();
    else if (el.matches('.pbox__scroll') && SCROLL_KEYS.has(e.key)) e.stopPropagation();
  },
  true,
);

window.addEventListener('storage', (e) => {
  if (e.key === STORE && e.newValue) applyAll(e.newValue);
});

defineCtrl('pbox', {
  build(slide) {
    slide.querySelectorAll('[data-pbox]').forEach(enhance);
  },
});
