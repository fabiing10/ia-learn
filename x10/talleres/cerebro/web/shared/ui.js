// DOM helpers shared by the Cerebro Jurídico pages: theme toggle, toast, copy
// with fallbacks that survive iOS Safari, downloads and inline icons.

import { KEYS } from './store.js';
export { esc } from './preview.js';

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function debounce(fn, ms) {
  let t;
  const run = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  run.cancel = () => clearTimeout(t);
  return run;
}

// ── Theme (dark default, cj-theme in localStorage) ──

export const currentTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

export function bindThemeToggle(button) {
  const sync = () => {
    const light = currentTheme() === 'light';
    button.setAttribute('aria-pressed', String(light));
    button.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    button.title = light ? 'Tema oscuro' : 'Tema claro';
    button.innerHTML = light ? ICONS.moon : ICONS.sun;
  };
  button.addEventListener('click', () => {
    const root = document.documentElement;
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    if (!reducedMotion()) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 320);
    }
    root.dataset.theme = next;
    try {
      localStorage.setItem(KEYS.theme, next);
    } catch {
      /* storage blocked: the theme still applies for this visit */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#F7F5F0' : '#0B0F1A');
    sync();
  });
  sync();
}

// ── Toast ──

let toastTimer;
export function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3600);
}

// ── Clipboard ──

/** execCommand('copy') on a selected textarea; the iOS recipe needs a real range. */
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('aria-hidden', 'true');
  // 16px avoids the iOS zoom on focus; off-screen but still selectable.
  ta.style.cssText = 'position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;font-size:16px;';
  document.body.append(ta);
  let ok = false;
  try {
    ta.contentEditable = 'true';
    ta.readOnly = false;
    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  window.getSelection()?.removeAllRanges();
  return ok;
}

/** Last resort: a dialog with the text selected, for a manual copy. */
function manualCopy(text, title) {
  let dlg = document.getElementById('copia-manual');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'copia-manual';
    dlg.className = 'manual';
    dlg.setAttribute('aria-labelledby', 'copia-manual-t');
    dlg.innerHTML = `
      <div class="manual__in">
        <h2 class="manual__title" id="copia-manual-t"></h2>
        <p class="manual__hint">Tu navegador no dejó copiar automáticamente. El texto ya está seleccionado: en el celular, mantén presionado y elige <b>Copiar</b>; en el computador, <kbd>Ctrl</kbd> o <kbd>⌘</kbd> + <kbd>C</kbd>.</p>
        <textarea class="manual__text" readonly rows="10" aria-label="Texto para copiar"></textarea>
        <form method="dialog"><button class="btn btn--ghost btn--sm" value="close">Cerrar</button></form>
      </div>`;
    document.body.append(dlg);
  }
  dlg.querySelector('.manual__title').textContent = title || 'Cópialo a mano';
  const ta = dlg.querySelector('textarea');
  ta.value = text;
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
}

/**
 * Copies text from inside a click handler. Tries the async Clipboard API first
 * (called synchronously in the gesture, which iOS requires), then a selected
 * textarea with execCommand, then a dialog for a manual copy.
 * Resolves to 'api' | 'legacy' | 'manual'.
 */
export async function copyText(text, { title } = {}) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return 'api';
    } catch {
      /* permission denied or not in a gesture: fall through */
    }
  }
  if (legacyCopy(text)) return 'legacy';
  manualCopy(text, title);
  return 'manual';
}

/** Wires a copy button: label feedback + toast. `getText` runs at click time. */
export function bindCopy(button, getText, { done = 'Copiado', message, title } = {}) {
  const label = button.querySelector('[data-label]');
  const original = label?.textContent;
  let t;
  button.addEventListener('click', async () => {
    const how = await copyText(getText(), { title });
    if (how === 'manual') return toast('Selecciona el texto y cópialo a mano.');
    button.classList.add('is-done');
    if (label) label.textContent = done;
    clearTimeout(t);
    t = setTimeout(() => {
      button.classList.remove('is-done');
      if (label) label.textContent = original;
    }, 2200);
    if (message) toast(message);
  });
}

// ── Downloads ──

export function downloadBlob(filename, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export const downloadText = (filename, text) =>
  downloadBlob(filename, new Blob([text], { type: 'text/markdown;charset=utf-8' }));

export const downloadZip = (filename, bytes) => downloadBlob(filename, new Blob([bytes], { type: 'application/zip' }));

// ── Icons (inline SVG, stroke = currentColor) ──

const svg = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICONS = {
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  download: svg('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  reset: svg('<path d="M4 4v6h6"/><path d="M4.6 15a8 8 0 1 0 1.9-8.3L4 10"/>'),
  blank: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/>'),
  doc: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
  zip: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M11 3v2M11 7v2M11 11v2"/><rect x="9.5" y="14" width="3" height="4" rx="1"/>'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  book: svg('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'),
  chat: svg('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/>'),
  vault: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V7M12 17v-1.5M15.5 12H17M7 12h1.5"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  play: svg('<path d="M7 4v16l13-8L7 4Z"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Z"/>'),
  spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
};

/** Fills every [data-icon] placeholder in `root`. */
export function paintIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    if (!el.firstElementChild) el.innerHTML = ICONS[el.dataset.icon] || '';
  }
}
