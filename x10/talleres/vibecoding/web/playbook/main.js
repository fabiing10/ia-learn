// Vibe Coding playbook: progressive enhancement over static HTML. Theme toggle
// (vc-theme), TOC drawer + scrollspy, reading progress, copy and download buttons,
// heading deep links, checklists saved in localStorage, stacked tables on phones,
// glossary filter and print preparation. The page makes no network requests.
import './playbook.css';
import './print.css';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const html = document.documentElement;
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
  // Set the text in the next frame so screen readers also announce repeats.
  requestAnimationFrame(() => (toastEl.textContent = message));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2800);
}

/* ---------- Theme ---------- */

const THEME_KEY = 'vc-theme';
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

/* ---------- Table of contents: drawer on phones, scrollspy everywhere ---------- */

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
const background = [$('main'), $('.topbar'), hero, $('.footer'), pill].filter(Boolean);
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
  const n = $('.chapter__n', target.el)?.textContent || '';
  currentLabel.textContent = `${n} · ${target.el.dataset.title || target.a.textContent.trim()}`;

  // Keep the active entry visible inside the desktop sidebar.
  if (desktop.matches && toc.scrollHeight > toc.clientHeight) {
    const r = target.a.getBoundingClientRect();
    const box = toc.getBoundingClientRect();
    if (r.top < box.top || r.bottom > box.bottom) toc.scrollTop += r.top - box.top - box.height / 2;
  }
}

function update() {
  ticking = false;
  const max = html.scrollHeight - innerHeight;
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

// Deep links (#ruta-a from the landing or the deck) land instantly; smooth
// scrolling is switched on afterwards for clicks inside the page.
function enableSmoothScroll() {
  requestAnimationFrame(() => html.classList.add('is-smooth'));
}
if (document.readyState === 'complete') enableSmoothScroll();
else addEventListener('load', enableSmoothScroll, { once: true });

/* ---------- Copy to clipboard + download ---------- */

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

// Keeps line breaks (templates are Markdown), trims trailing spaces and blank edges.
function sourceText(src) {
  return src.textContent
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

function selectText(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

const sourceOf = (btn) => $('[data-copy-src]', btn.closest('[data-copy-scope]') || document.body);

// Each copy button is described by the title of its block.
$$('[data-copy-scope]').forEach((scope, i) => {
  const title = $('.code__title, .msg__title, .vs__label', scope);
  if (!title) return;
  title.id ||= `copy-title-${i}`;
  $$('[data-copy], [data-download]', scope).forEach((b) => b.setAttribute('aria-describedby', title.id));
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const src = sourceOf(btn);
  if (!src) return;

  const label = $('.copy__label', btn);
  btn.dataset.label ||= label.textContent;
  const ok = await writeClipboard(sourceText(src));

  if (ok) {
    btn.classList.add('is-done');
    label.textContent = 'Copiado';
    toast(/\[[^\]]+\]/.test(src.textContent) ? 'Copiado. Cambia lo que está entre [corchetes] por lo tuyo.' : 'Copiado.');
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

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-download]');
  if (!btn) return;
  const src = sourceOf(btn);
  if (!src) return;
  const blob = new Blob([sourceText(src) + '\n'], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = btn.dataset.download;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Descargado: ${btn.dataset.download}`);
});

/* ---------- Deep links on headings ---------- */

function addAnchor(heading, id) {
  if (!heading || !id || $(':scope > .anchor', heading)) return;
  const link = document.createElement('a');
  link.className = 'anchor';
  link.href = `#${id}`;
  link.setAttribute('aria-label', `Copiar enlace a «${heading.textContent.trim()}»`);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ico');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-link');
  svg.append(use);
  link.append(svg);
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    history.replaceState(null, '', link.hash);
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
    const ok = await writeClipboard(location.href);
    toast(ok ? 'Enlace a esta sección copiado.' : 'El enlace quedó en la barra de direcciones.');
  });
  heading.append(link);
}

$$('main .chapter').forEach((section) => addAnchor($('.chapter__title', section), section.id));
$$('main h3[id], main h4[id]').forEach((h) => {
  if (!h.closest('.block, .rule')) addAnchor(h, h.id);
});
$$('main .block[id], main .rule[id]').forEach((box) => addAnchor($('.block__title, .rule__title', box), box.id));

/* ---------- Checklists (saved in this browser only) ---------- */

const CHECK_KEY = 'vc-playbook-checks-v1';
const lists = $$('[data-checklist]');

function readChecks() {
  try {
    const saved = JSON.parse(store.get(CHECK_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function renderList(list) {
  const boxes = $$('input[data-check]', list);
  const done = boxes.filter((b) => b.checked).length;
  $('[data-check-count]', list).textContent = `${done}/${boxes.length}`;
  $('[data-check-fill]', list)?.style.setProperty('--done', (done / boxes.length).toFixed(3));
  const doneEl = $('[data-check-done]', list);
  if (doneEl) doneEl.hidden = done !== boxes.length;
}

function loadChecks() {
  const saved = readChecks();
  lists.forEach((list) => {
    const ids = new Set(saved[list.dataset.checklist] || []);
    $$('input[data-check]', list).forEach((b) => (b.checked = ids.has(b.dataset.check)));
    renderList(list);
  });
}

function saveList(list) {
  const saved = readChecks();
  saved[list.dataset.checklist] = $$('input[data-check]', list)
    .filter((b) => b.checked)
    .map((b) => b.dataset.check);
  store.set(CHECK_KEY, JSON.stringify(saved));
  renderList(list);
}

lists.forEach((list) => {
  $$('input[data-check]', list).forEach((b) =>
    b.addEventListener('change', () => {
      saveList(list);
      const all = $$('input[data-check]', list);
      if (b.checked && all.every((x) => x.checked)) toast('Lista completa.');
    }),
  );

  // Two taps instead of confirm(): the first arms, the second clears.
  const reset = $('[data-check-reset]', list);
  const resetLabel = $('[data-reset-label]', list);
  let armTimer = null;
  const disarm = () => {
    clearTimeout(armTimer);
    armTimer = null;
    reset.classList.remove('is-armed');
    resetLabel.textContent = 'Reiniciar';
  };
  reset?.addEventListener('click', () => {
    if (!armTimer) {
      reset.classList.add('is-armed');
      resetLabel.textContent = '¿Borrar? Toca otra vez';
      armTimer = setTimeout(disarm, 4000);
      return;
    }
    disarm();
    $$('input[data-check]', list).forEach((b) => (b.checked = false));
    saveList(list);
    toast('Lista reiniciada.');
  });
});

// Keep two open tabs in sync.
addEventListener('storage', (e) => {
  if (e.key === CHECK_KEY) loadChecks();
});

loadChecks();

/* ---------- Tables become cards on phones: labels from the header ---------- */

$$('.rtable--stack').forEach((table) => {
  const heads = $$('thead th', table).map((th) => th.textContent.trim());
  $$('tbody tr', table).forEach((row) => {
    [...row.children].forEach((cell, i) => {
      if (cell.tagName === 'TD' && heads[i]) cell.dataset.label = heads[i];
    });
  });
});

/* ---------- Glossary filter ---------- */

const gInput = $('[data-gfilter]');
const gTerms = $$('[data-glossary] .term');
const gCount = $('[data-gcount]');
const gEmpty = $('[data-gempty]');
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function filterGlossary() {
  const q = fold(gInput.value.trim());
  let shown = 0;
  gTerms.forEach((term) => {
    const visible = !q || fold(term.textContent).includes(q);
    term.hidden = !visible;
    if (visible) shown += 1;
  });
  gCount.textContent = q ? `${shown} de ${gTerms.length}` : `${gTerms.length} términos`;
  gEmpty.hidden = shown > 0;
}

gInput?.addEventListener('input', filterGlossary);
if (gInput) filterGlossary();

/* ---------- Print / Guardar como PDF ---------- */

// Paper needs the full address of links that leave the page (print.css shows it).
// Set up front: headless PDF rendering does not fire beforeprint.
$$('main a[href^="/"], main a[href^="http"]').forEach((a) => (a.dataset.printUrl = a.href));

let glossaryQuery = '';

$$('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));

// The whole glossary goes on paper, whatever the reader was searching.
addEventListener('beforeprint', () => {
  if (!gInput) return;
  glossaryQuery = gInput.value;
  gInput.value = '';
  filterGlossary();
});

addEventListener('afterprint', () => {
  if (!gInput) return;
  gInput.value = glossaryQuery;
  filterGlossary();
});
