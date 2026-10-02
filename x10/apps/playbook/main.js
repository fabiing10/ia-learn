// x10 Playbook — progressive enhancement over static HTML: theme toggle,
// TOC drawer + scrollspy, reading progress, copy buttons, heading deep links,
// semáforo filter, the 30-day checklist (localStorage) and print preparation.
// Everything is bundled; the page makes no network requests of its own.
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';

import '../../src/styles/tokens.css';
import '../../src/styles/theme-dark.css';
import '../../src/styles/theme-light.css';
import './playbook.css';
import './print.css';

import { contacto, whatsapp } from '../../config.json';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const html = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 1080px)');

// localStorage can throw (private mode, blocked storage): never let it break the page.
const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable: state lives only in this page view */
    }
  },
};

/* ---------- Toast (polite live region) ---------- */

const toastEl = $('.toast');
let toastTimer;

function toast(message) {
  toastEl.textContent = '';
  toastEl.classList.add('is-on');
  // A fresh text node in the next frame makes screen readers announce repeats too.
  requestAnimationFrame(() => (toastEl.textContent = message));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2800);
}

/* ---------- Theme ---------- */

const THEME_KEY = 'x10-playbook-theme';
const themeBtn = $('[data-theme-toggle]');
const themeMeta = $('meta[name="theme-color"]');

function applyTheme(theme) {
  html.dataset.theme = theme;
  themeMeta?.setAttribute('content', theme === 'light' ? '#F7F5F0' : '#0B0F1A');
  themeBtn?.setAttribute('aria-label', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
}

applyTheme(html.dataset.theme === 'light' ? 'light' : 'dark');

themeBtn?.addEventListener('click', () => {
  const next = html.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  store.set(THEME_KEY, next);
});

matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
  if (!store.get(THEME_KEY)) applyTheme(e.matches ? 'light' : 'dark');
});

/* ---------- Hero counter: ×1 → ×10, like the deck's cover ---------- */

const counter = $('[data-count]');
if (counter && !reducedMotion.matches) {
  let n = 1;
  counter.textContent = '1';
  const tick = () => {
    n += 1;
    counter.textContent = String(n);
    if (n < 10) setTimeout(tick, 30 + n * n * 2.5);
  };
  setTimeout(tick, 280);
}

/* ---------- Table of contents: drawer on mobile, scrollspy everywhere ---------- */

const toc = $('#indice');
const scrim = $('.scrim');
const openers = $$('[data-toc-open]');
const pill = $('.pill');
const currentLabel = $('[data-current]');
const readPct = $('[data-read-pct]');
const progressBar = $('.progress__bar');
const hero = $('.hero');
const tocLinks = $$('.toc a[href^="#"]');
const targets = tocLinks
  .map((a) => ({ a, el: document.getElementById(a.hash.slice(1)) }))
  .filter((t) => t.el);
const background = [$('main'), $('.topbar'), $('.hero'), $('.footer'), pill].filter(Boolean);
let lastOpener = null;

function setDrawer(open) {
  toc.classList.toggle('is-open', open);
  scrim.hidden = !open;
  openers.forEach((b) => b.setAttribute('aria-expanded', String(open)));
  document.body.classList.toggle('is-locked', open);
  background.forEach((el) => (el.inert = open));
  if (open) {
    const first = $('a[aria-current="true"]', toc) || $('a', toc);
    first?.focus({ preventScroll: true });
  }
}

function closeDrawer(restoreFocus) {
  if (!toc.classList.contains('is-open')) return;
  setDrawer(false);
  if (restoreFocus) lastOpener?.focus();
}

openers.forEach((btn) =>
  btn.addEventListener('click', () => {
    lastOpener = btn;
    setDrawer(true);
  }),
);
$$('[data-toc-close]').forEach((el) => el.addEventListener('click', () => closeDrawer(true)));
toc.addEventListener('click', (e) => {
  if (e.target.closest('a') && !desktop.matches) closeDrawer(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDrawer(true);
});
desktop.addEventListener('change', () => closeDrawer(false));

let activeTarget = null;
let ticking = false;

function markActive(target) {
  if (target === activeTarget) return;
  activeTarget = target;
  tocLinks.forEach((a) => a.removeAttribute('aria-current'));
  if (!target) {
    currentLabel.textContent = 'Inicio';
    return;
  }
  target.a.setAttribute('aria-current', 'true');
  // A sub-section also lights up its chapter.
  const parentItem = target.a.closest('ol ol')?.closest('li');
  parentItem?.querySelector(':scope > a')?.setAttribute('aria-current', 'true');

  const chapter = target.el.closest('.chapter');
  if (chapter) currentLabel.textContent = `${$('.chapter__n', chapter).textContent} · ${chapter.dataset.title}`;

  // Keep the active entry visible inside the desktop sidebar.
  if (desktop.matches && toc.scrollHeight > toc.clientHeight) {
    const r = target.a.getBoundingClientRect();
    const box = toc.getBoundingClientRect();
    if (r.top < box.top || r.bottom > box.bottom) toc.scrollTop += r.top - box.top - box.height / 2;
  }
}

function update() {
  ticking = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  progressBar.style.setProperty('--p', p.toFixed(4));
  readPct.textContent = String(Math.round(p * 100));

  const line = innerHeight * 0.3;
  let current = null;
  for (const t of targets) {
    if (t.el.getBoundingClientRect().top - line <= 0) current = t;
    else break;
  }
  markActive(current);
  pill.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < 0);
}

function requestUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate);
update();

// Deep links (#semaforo from /test, a shared link) land instantly; smooth
// scrolling is switched on only afterwards, for clicks inside the page.
function enableSmoothScroll() {
  requestAnimationFrame(() => html.classList.add('is-smooth'));
}
if (document.readyState === 'complete') enableSmoothScroll();
else addEventListener('load', enableSmoothScroll, { once: true });

/* ---------- Copy to clipboard ---------- */

async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  // Plain-http fallback (for example, a phone opening the dev server by IP).
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

// A prompt card copies its four parts as four lines; other blocks copy their text.
function copyText(src) {
  const parts = $$('.part__t', src);
  const raw = parts.length ? parts.map((p) => p.textContent).join('\n') : src.textContent;
  return raw
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function selectText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Give every prompt's copy button its prompt title as a description.
$$('.pcard').forEach((card) => {
  const title = $('.pcard__title', card);
  if (!title) return;
  title.id ||= `${card.id}-titulo`;
  $('[data-copy]', card)?.setAttribute('aria-describedby', title.id);
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const scope = btn.closest('[data-copy-scope]');
  const src = scope && $('[data-copy-src]', scope);
  if (!src) return;

  const label = $('.copy__label', btn);
  btn.dataset.label ||= label.textContent;
  const ok = await writeClipboard(copyText(src));

  if (ok) {
    btn.classList.add('is-done');
    label.textContent = 'Copiado';
    toast(
      $('.fill', src)
        ? 'Copiado. Pégalo en tu IA y cambia lo que está entre {{llaves}} por tus datos.'
        : 'Copiado. Pégalo en tu IA.',
    );
  } else {
    selectText(src);
    toast('No se pudo copiar automáticamente. El texto quedó seleccionado: cópialo desde el menú.');
  }
  clearTimeout(btn._reset);
  btn._reset = setTimeout(() => {
    btn.classList.remove('is-done');
    label.textContent = btn.dataset.label;
  }, 2200);
});

/* ---------- Deep links on headings ---------- */

$$('main section[id]').forEach((section) => {
  const heading = $(':scope > .chapter__head > .chapter__title, :scope > .prose > .sub__title', section);
  if (!heading) return;
  const link = document.createElement('a');
  link.className = 'anchor';
  link.href = `#${section.id}`;
  link.setAttribute('aria-label', `Copiar enlace a «${heading.textContent.trim()}»`);
  link.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-link" /></svg>';
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    history.replaceState(null, '', link.hash);
    const ok = await writeClipboard(location.href);
    toast(ok ? 'Enlace a esta sección copiado.' : 'El enlace quedó en la barra de direcciones.');
  });
  heading.append(link);
});

/* ---------- Semáforo filter ---------- */

const chips = $$('[data-filter]');
const caseItems = $$('[data-cases] .scase');
const caseGroups = $$('[data-cases] .casegroup');
const filterCount = $('[data-filter-count]');
let activeFilter = 'all';

function applyFilter(filter) {
  activeFilter = filter;
  chips.forEach((chip) => {
    const on = chip.dataset.filter === filter;
    chip.setAttribute('aria-pressed', String(on));
    chip.classList.toggle('is-on', on);
  });
  let shown = 0;
  caseItems.forEach((item) => {
    const visible = filter === 'all' || item.dataset.color === filter;
    item.hidden = !visible;
    if (visible) shown += 1;
  });
  caseGroups.forEach((group) => (group.hidden = !$('.scase:not([hidden])', group)));
  filterCount.textContent = filter === 'all' ? '' : `${shown} casos`;
}

chips.forEach((chip) => chip.addEventListener('click', () => applyFilter(chip.dataset.filter)));

/* ---------- Ruta de 30 días ---------- */

const RUTA_KEY = 'x10-playbook-ruta-v1';
const boxes = $$('input[data-ruta]');
const doneEl = $('[data-ruta-done]');
const totalEl = $('[data-ruta-total]');
const fillEl = $('[data-ruta-fill]');
const completeEl = $('[data-ruta-complete]');
const resetBtn = $('[data-ruta-reset]');
const resetLabel = $('[data-ruta-reset-label]');

function loadRuta() {
  try {
    const saved = new Set(JSON.parse(store.get(RUTA_KEY) || '[]'));
    boxes.forEach((b) => (b.checked = saved.has(b.dataset.ruta)));
  } catch {
    /* corrupted value: start clean */
  }
}

function renderRuta() {
  const done = boxes.filter((b) => b.checked).length;
  doneEl.textContent = String(done);
  totalEl.textContent = String(boxes.length);
  fillEl.style.setProperty('--done', (done / boxes.length).toFixed(3));
  $$('.week').forEach((week) => {
    const own = $$('input[data-ruta]', week);
    $('[data-week-count]', week).textContent = `${own.filter((b) => b.checked).length}/${own.length}`;
  });
  completeEl.hidden = done !== boxes.length;
}

function saveRuta() {
  store.set(RUTA_KEY, JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.dataset.ruta)));
  renderRuta();
}

let armTimer = null;

function disarmReset() {
  clearTimeout(armTimer);
  armTimer = null;
  resetBtn.classList.remove('is-armed');
  resetLabel.textContent = 'Reiniciar';
}

resetBtn.addEventListener('click', () => {
  // Two taps instead of confirm(): the first arms, the second clears.
  if (!armTimer) {
    resetBtn.classList.add('is-armed');
    resetLabel.textContent = '¿Borrar todo? Toca otra vez';
    armTimer = setTimeout(disarmReset, 4000);
    return;
  }
  disarmReset();
  boxes.forEach((b) => (b.checked = false));
  saveRuta();
  toast('Ruta reiniciada.');
});

boxes.forEach((b) =>
  b.addEventListener('change', () => {
    saveRuta();
    if (boxes.every((x) => x.checked)) toast('×10: completaste la ruta.');
  }),
);

// Keep two open tabs in sync.
addEventListener('storage', (e) => {
  if (e.key !== RUTA_KEY) return;
  loadRuta();
  renderRuta();
});

loadRuta();
renderRuta();

/* ---------- Contact from config.json, once the presenter fills it ---------- */

if (contacto && !/^\s*\{\{/.test(contacto)) {
  $$('[data-config="contacto"]').forEach((el) => {
    if (!whatsapp?.numero) {
      el.textContent = contacto;
      return;
    }
    // WhatsApp link pre-filled so the presenter knows the message comes from the workshop
    const a = document.createElement('a');
    a.href = `https://wa.me/${whatsapp.numero}?text=${encodeURIComponent(whatsapp.mensaje || '')}`;
    a.rel = 'noopener';
    a.textContent = contacto;
    el.replaceChildren(a);
  });
}

/* ---------- Print / Guardar como PDF ---------- */

let openedForPrint = [];
let filterBeforePrint = 'all';

$$('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));

addEventListener('beforeprint', () => {
  openedForPrint = $$('details:not([open])');
  openedForPrint.forEach((d) => (d.open = true));
  filterBeforePrint = activeFilter;
  applyFilter('all');
  // Paper needs the full address of links that leave the page.
  $$('main a[href^="/"]').forEach((a) => (a.dataset.printUrl = a.href));
});

addEventListener('afterprint', () => {
  openedForPrint.forEach((d) => (d.open = false));
  openedForPrint = [];
  applyFilter(filterBeforePrint);
});
