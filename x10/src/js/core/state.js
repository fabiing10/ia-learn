// Runtime modes shared by every module.
//  lite      — no WebGL, no heavy motion (key M, reduced motion, receivers, PDF)
//  receiver  — iframes inside the speaker view; must stay cheap
//  print     — ?print-pdf export; everything static and visible
const root = document.documentElement;
const listeners = new Set();

export const state = {
  get lite() {
    return root.classList.contains('is-lite');
  },
  get receiver() {
    return root.classList.contains('is-receiver');
  },
  get print() {
    return root.classList.contains('is-print');
  },
  get reduced() {
    return root.classList.contains('is-reduced');
  },
  get theme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark';
  },
};

export function onModeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn(state));
}

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage can be blocked; modes still work for this session */
  }
}

export function setLite(on) {
  if (state.receiver || state.print) return;
  root.classList.toggle('is-lite', on);
  store('x10-lite', on ? '1' : '0');
  emit();
}

export function toggleLite() {
  setLite(!state.lite);
  return state.lite;
}

export function setTheme(theme) {
  root.dataset.theme = theme;
  store('x10-theme', theme);
  emit();
}

export function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
  return state.theme;
}

// Speaker-view previews follow the projected window's theme.
window.addEventListener('storage', (e) => {
  if (e.key === 'x10-theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
    root.dataset.theme = e.newValue;
    emit();
  }
});

/** Follows the OS "reduce motion" switch live, not only at load. */
export function watchReducedMotion() {
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  mq?.addEventListener?.('change', (e) => {
    root.classList.toggle('is-reduced', e.matches);
    setLite(e.matches);
  });
}

let toastTimer;
export function toast(message) {
  if (state.receiver || state.print) return;
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 1600);
}
