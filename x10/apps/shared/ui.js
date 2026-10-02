// Small DOM helpers shared by /test and /panel.

const THEME_KEY = 'x10-theme';

/** HTML-escape any text that did not come from our own source (alias, session). */
export function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Wires a button that flips dark/light and remembers the choice. */
export function bindThemeToggle(button) {
  const sync = () => {
    const light = currentTheme() === 'light';
    button.setAttribute('aria-pressed', String(light));
    button.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    button.innerHTML = light ? ICONS.moon : ICONS.sun;
  };
  button.addEventListener('click', () => {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
    sync();
  });
  sync();
}

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
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

export function readParam(name) {
  return new URLSearchParams(location.search).get(name);
}

const svg = (body, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const ICONS = {
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>'),
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  next: svg('<path d="M9 18l6-6-6-6"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  cross: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  share: svg('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  book: svg('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  download: svg('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  logout: svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3Z"/>'),
};

