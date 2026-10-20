// Cerebro Jurídico playbook: progressive enhancement over static HTML. Renders the
// catalog-driven parts (skills, load routes, test questions, Colombian frame), then
// wires the theme toggle (cj-theme), TOC drawer + scrollspy, reading progress, copy
// and download buttons, heading deep links, the verification checklist and the
// model grid (both saved in this browser only), stacked tables on phones, glossary
// filter, print preparation and the figures. The page makes no network requests.
import './playbook.css';
import './figures.css';
import './print.css';
import * as catalog from '../shared/catalog.js';
import { buildFiles } from '../shared/generator.js';
import { loadProfile } from '../shared/store.js';
import { initFigures, finishFigures } from './figures.js';

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

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.filter((c) => c != null));
  return node;
}

function icon(id, cls = 'ico') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

const copyButton = () =>
  el('button', { class: 'copy', type: 'button', 'data-copy': true }, icon('i-copy', 'ico copy__i1'), icon('i-check', 'ico copy__i2'), el('span', { class: 'copy__label', text: 'Copiar' }));

const downloadButton = (name) =>
  el('button', { class: 'copy copy--ghost', type: 'button', 'data-download': name }, icon('i-file'), el('span', { text: 'Descargar' }));

// A tool fact still to confirm: the token stays in the DOM, the reader sees "verificar".
const verifyTag = (token) =>
  el('span', { class: 'verify', title: 'Dato que cambia con frecuencia: confírmalo en la herramienta.' }, 'verificar', el('span', { class: 'verify__id', text: ` ${token}` }));

// Catalog strings: Markdown backticks become <code>, {{VERIFICAR_*}} tokens become tags.
function inline(text) {
  const out = document.createDocumentFragment();
  text.split(/(`[^`]+`|\{\{VERIFICAR_[A-Z0-9_]+\}\})/).forEach((part) => {
    if (part.startsWith('`') && part.endsWith('`')) out.append(el('code', { text: part.slice(1, -1) }));
    else if (part.startsWith('{{')) out.append(verifyTag(part));
    else if (part) out.append(part);
  });
  return out;
}

// Contract exports (CONTRACT.md) plus optional ones the coordinator may add or drop.
const { TAREAS, RUTAS_CARGA, PREGUNTA_PRUEBA, PREGUNTA_RESERVA, COMPARACION_PRUEBA = [], MARCO_COLOMBIANO = [], FUENTES_OFICIALES = [] } = catalog;
const guillemets = (s) => s.replace(/"([^"]+)"/g, '«$1»');
const profile = loadProfile();

/* ---------- Catalog-driven content ---------- */

// Skills: one switchable block per task; print shows them all.
function renderSkills() {
  const host = $('[data-skills]');
  if (!host) return;
  const mine = new Set(profile?.tareas || []);
  const first = TAREAS.find((t) => mine.has(t.id))?.id || TAREAS[0].id;
  const bar = el('div', { class: 'switch', role: 'group', 'aria-label': 'Skills del catálogo' });
  const blocks = TAREAS.map((t) => {
    const { titulo, cuando, texto } = t.skill;
    bar.append(el('button', { type: 'button', 'data-show': t.id, 'aria-pressed': String(t.id === first), text: mine.has(t.id) ? `${t.label} · tuya` : t.label }));
    const pre = el('pre', { 'data-copy-src': true }, el('span', { class: 'h', text: `## Skill: ${titulo}` }), `\n\n${cuando ? `Cuándo: ${cuando}\n` : ''}${texto}`);
    return el(
      'div',
      { class: 'code code--tall code--md', 'data-copy-scope': true, 'data-variant': t.id, hidden: t.id !== first },
      el('div', { class: 'code__head' }, el('p', { class: 'code__title', text: `02_PLAYBOOK.md · ${titulo}` }), el('div', { class: 'code__actions' }, copyButton(), downloadButton(`skill-${t.id}.md`))),
      pre,
    );
  });
  host.replaceChildren(bar, ...blocks);
  host.classList.add('variants');
  host.dataset.switch = '';
}

// Load routes: the reader's own tools (from the landing profile) come first.
function renderRoutes() {
  const host = $('[data-routes]');
  if (!host) return;
  const mine = new Set(profile?.herramientas || []);
  const routes = [...RUTAS_CARGA].sort((a, b) => Number(mine.has(b.herramienta)) - Number(mine.has(a.herramienta)));
  host.replaceChildren(
    ...routes.map((r) =>
      el(
        'article',
        { class: 'route' },
        el('div', { class: 'route__head' }, el('h4', { class: 'route__title', text: r.label }), mine.has(r.herramienta) ? el('span', { class: 'k t-accent', text: 'Tu IA' }) : null),
        el('ol', {}, ...r.pasos.map((p) => el('li', {}, inline(p)))),
        r.nota ? el('p', { class: 'route__note' }, inline(r.nota)) : null,
      ),
    ),
  );
}

function renderCatalogText() {
  const texts = { PREGUNTA_PRUEBA, PREGUNTA_RESERVA };
  $$('[data-catalog]').forEach((node) => {
    const value = texts[node.dataset.catalog];
    if (value) node.textContent = value;
  });

  $$('[data-comparacion]').forEach((list) => {
    const side = list.dataset.comparacion;
    const rows = COMPARACION_PRUEBA.map((row) => row[side]).filter(Boolean);
    if (rows.length) list.replaceChildren(...rows.map((t) => el('li', { text: `${guillemets(t)}.` })));
  });

  const verified = $('[data-rutas-verificadas]');
  if (verified && catalog.RUTAS_VERIFICADAS) {
    verified.textContent = catalog.RUTAS_VERIFICADAS;
    verified.hidden = false;
  }

  const marco = $('[data-marco]');
  if (marco && MARCO_COLOMBIANO.length) {
    marco.replaceChildren(
      ...MARCO_COLOMBIANO.map((m) =>
        el('tr', {}, el('th', { scope: 'row', text: m.instrumento }), el('td', { text: m.fija }), el('td', { text: guillemets(m.cerebro) })),
      ),
    );
  }

  // T-323 principles, read from the frame row so the fact-checked list stays the only source.
  const chips = $('[data-principios]');
  const t323 = MARCO_COLOMBIANO.find((m) => /T-323/.test(m.instrumento));
  const list = t323?.fija.match(/principios:\s*([^.]+)\./i)?.[1];
  if (chips && list) {
    const items = list.split(/,\s*/);
    const last = items.pop().split(/\s+[ey]\s+(?=[^\s]+$)/);
    chips.replaceChildren(...[...items, ...last].map((p) => el('li', { class: 'chip', text: p.charAt(0).toUpperCase() + p.slice(1) })));
  } else if (chips) {
    chips.hidden = true;
  }

  const fuentes = $('[data-fuentes]');
  if (fuentes && FUENTES_OFICIALES.length) {
    fuentes.replaceChildren(
      ...FUENTES_OFICIALES.map((f) => {
        const [title, kind] = f.label.split(/\s*\((.+)\)$/);
        return el('a', { class: 'card', href: f.url, rel: 'noopener' }, el('span', { class: 'card__k', text: kind || 'Fuente oficial' }), el('span', { class: 'card__title', text: title }));
      }),
    );
  }
}

/* ---------- Model grid (fillable, saved locally) ---------- */

const GRID_KEY = 'cj-playbook-grilla-v1';
const GRID_ROWS = [
  ['termino', 'Término correcto (10 días)'],
  ['fuente', 'Fuente exacta (art. 14, num. 1, del CPACA; Ley 1755 de 2015)'],
  ['trampa', 'Menciona la trampa (art. 5 del Decreto 491 → Ley 2207)'],
  ['silencio', 'Efecto del silencio (aceptación + 3 días)'],
  ['cierre', 'Cierra con «Verificación pendiente»'],
  ['tono', 'Respeta el tono/formato del ADN'],
  ['longitud', 'Longitud y orden'],
];
const GRID_COLS = [
  ['claude', 'Claude'],
  ['chatgpt', 'ChatGPT'],
  ['gemini', 'Gemini'],
  ['local', 'Local'],
];

function readGrid() {
  try {
    const saved = JSON.parse(store.get(GRID_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function renderGrids() {
  const saved = readGrid();
  $$('[data-grid]').forEach((block) => {
    const grid = block.dataset.grid;
    const label = grid === 'antes' ? 'Antes' : 'Después';
    $('[data-grid-body]', block).replaceChildren(
      ...GRID_ROWS.map(([row, rowLabel]) =>
        el(
          'tr',
          {},
          el('th', { scope: 'row', text: rowLabel }),
          ...GRID_COLS.map(([col, colLabel]) => {
            const key = `${grid}:${row}:${col}`;
            const input = el('input', { type: 'text', maxlength: '60', autocomplete: 'off', 'data-cell': key, 'aria-label': `${label} · ${rowLabel} · ${colLabel}` });
            input.value = saved[key] || '';
            return el('td', {}, input);
          }),
        ),
      ),
    );
  });
}

// Laura's extracts and the full 04_VERIFICACION.md come from the same generator as
// the landing, so the playbook shows exactly what attendees download.
function renderLaura() {
  let files;
  try {
    files = buildFiles(catalog.PERFIL_LAURA);
  } catch {
    return; // keep the static copy
  }
  const section = (md = '', start) => {
    const i = md.indexOf(start);
    if (i < 0) return '';
    const rest = md.slice(i + start.length);
    const j = rest.search(/\n#{1,2} /);
    return (start + (j < 0 ? rest : rest.slice(0, j))).trim();
  };
  const texts = {
    adn: files['00_ADN.md']?.match(/```text\n([\s\S]*?)\n```/)?.[1].trim(),
    lineas: section(files['01_LINEAS_ROJAS.md'], '## Lo que nunca delego'),
    fuentes: [section(files['03_FUENTES.md'], '## Entrada verificada: derecho de petición'), section(files['03_FUENTES.md'], '## Alertas de vigencia')]
      .filter(Boolean)
      .join('\n\n'),
    verificacion: files['04_VERIFICACION.md']?.trim(),
  };
  $$('[data-laura]').forEach((pre) => {
    const text = texts[pre.dataset.laura];
    if (!text) return;
    pre.replaceChildren(
      ...text.split('\n').flatMap((line, i) => [
        i ? '\n' : '',
        line.startsWith('#') || line === 'REGLAS' ? el('span', { class: 'h', text: line }) : line,
      ]),
    );
  });
}

renderSkills();
renderRoutes();
renderLaura();
renderCatalogText();
renderGrids();

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

const THEME_KEY = 'cj-theme';
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
  .map((a) => ({ a, el: document.getElementById(a.hash.slice(1)), parent: a.closest('.toc__sub')?.closest('li')?.querySelector(':scope > a') }))
  .filter((t) => t.el)
  .sort((x, y) => (x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
const background = [$('main'), $('.topbar'), hero, $('.footer'), pill].filter(Boolean);
let lastOpener = null;

function setDrawer(open) {
  toc.classList.toggle('is-open', open);
  scrim.hidden = !open;
  openers.forEach((b) => b.setAttribute('aria-expanded', String(open)));
  document.body.classList.toggle('is-locked', open);
  background.forEach((node) => (node.inert = open));
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
$$('[data-toc-close]').forEach((node) => node.addEventListener('click', () => closeDrawer(true)));
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
  tocLinks.forEach((a) => {
    a.removeAttribute('aria-current');
    a.classList.remove('is-parent');
  });
  if (!target) {
    currentLabel.textContent = 'Portada';
    return;
  }
  target.a.setAttribute('aria-current', 'true');
  target.parent?.classList.add('is-parent');
  currentLabel.textContent = target.el.dataset.title || target.a.textContent.trim();

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
  const heroGone = hero.getBoundingClientRect().bottom < 0;
  pill.classList.toggle('is-visible', heroGone);
  hero.classList.toggle('is-off', heroGone);
}

function requestUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate);
update();

// Deep links (#red-team from the landing or the deck) land instantly; once the
// fonts have settled the target is re-aligned, then smooth scrolling is switched on
// for clicks inside the page.
function settleDeepLink() {
  const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const startY = scrollY;
  const finish = () => {
    if (target && Math.abs(scrollY - startY) < 4) target.scrollIntoView({ block: 'start' });
    requestAnimationFrame(() => html.classList.add('is-smooth'));
  };
  (document.fonts?.ready || Promise.resolve()).then(finish, finish);
}
if (document.readyState === 'complete') settleDeepLink();
else addEventListener('load', settleDeepLink, { once: true });

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
  // Plain-http fallback (for example, a phone opening the dev server by IP). iOS
  // ignores select() on a readonly field, so the range is set explicitly.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none';
  document.body.append(area);
  area.focus({ preventScroll: true });
  area.select();
  area.setSelectionRange(0, text.length);
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

function selectText(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const sel = getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

const sourceOf = (btn) => $('[data-copy-src]', btn.closest('[data-copy-scope]') || document.body);

// Each copy button is described by the title of its block.
$$('[data-copy-scope]').forEach((scope, i) => {
  const title = $('.code__title, .msg__title, .q__n', scope);
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
  const text = sourceText(src);
  const ok = await writeClipboard(text);

  if (ok) {
    btn.classList.add('is-done');
    label.textContent = 'Copiado';
    toast(/<usuario>/.test(text) ? 'Copiado. Cambia <usuario> por tu usuario.' : 'Copiado.');
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

/* ---------- Variant switches (macOS / Windows, skills) ---------- */

$$('[data-switch]').forEach((group) => {
  const buttons = $$(':scope > .switch button', group);
  const panels = $$(':scope > [data-variant]', group);
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      panels.forEach((p) => (p.hidden = p.dataset.variant !== btn.dataset.show));
    }),
  );
});

/* ---------- Deep links on headings ---------- */

function addAnchor(heading, id) {
  if (!heading || !id || $(':scope > .anchor', heading)) return;
  const link = document.createElement('a');
  link.className = 'anchor';
  link.href = `#${id}`;
  link.setAttribute('aria-label', `Copiar enlace a «${heading.textContent.trim()}»`);
  link.append(icon('i-link'));
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
$$('main .concept[id]').forEach((section) => addAnchor($('.concept__title', section), section.id));
$$('main h3[id], main h4[id]').forEach((h) => addAnchor(h, h.id));

/* ---------- Checklist (saved in this browser only) ---------- */

const CHECK_KEY = 'cj-playbook-checks-v1';
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

// Two taps instead of confirm(): the first arms, the second runs `onConfirm`.
function twoTapReset(button, idleLabel, onConfirm) {
  const label = $('[data-reset-label]', button);
  let armTimer = null;
  const disarm = () => {
    clearTimeout(armTimer);
    armTimer = null;
    button.classList.remove('is-armed');
    label.textContent = idleLabel;
  };
  button.addEventListener('click', () => {
    if (!armTimer) {
      button.classList.add('is-armed');
      label.textContent = '¿Borrar? Toca otra vez';
      armTimer = setTimeout(disarm, 4000);
      return;
    }
    disarm();
    onConfirm();
  });
}

lists.forEach((list) => {
  $$('input[data-check]', list).forEach((b) =>
    b.addEventListener('change', () => {
      saveList(list);
      if (b.checked && $$('input[data-check]', list).every((x) => x.checked)) toast('Protocolo completo.');
    }),
  );
  const reset = $('[data-check-reset]', list);
  if (reset)
    twoTapReset(reset, 'Reiniciar', () => {
      $$('input[data-check]', list).forEach((b) => (b.checked = false));
      saveList(list);
      toast('Lista reiniciada.');
    });
});

loadChecks();

/* ---------- Model grid persistence ---------- */

function saveGrid() {
  const data = {};
  $$('[data-cell]').forEach((input) => {
    const v = input.value.trim();
    if (v) data[input.dataset.cell] = v;
  });
  store.set(GRID_KEY, JSON.stringify(data));
}

$$('[data-cell]').forEach((input) => input.addEventListener('input', saveGrid));
const gridReset = $('[data-grid-reset]');
if (gridReset)
  twoTapReset(gridReset, 'Borrar las grillas', () => {
    $$('[data-cell]').forEach((input) => (input.value = ''));
    saveGrid();
    toast('Grillas borradas.');
  });

// Keep two open tabs in sync.
addEventListener('storage', (e) => {
  if (e.key === CHECK_KEY) loadChecks();
  if (e.key === GRID_KEY) {
    const saved = readGrid();
    $$('[data-cell]').forEach((input) => (input.value = saved[input.dataset.cell] || ''));
  }
});

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

/* ---------- Figures ---------- */

initFigures();

/* ---------- Print / Descargar PDF ---------- */

// Paper needs the full address of links that leave the page (print.css shows it).
// Set up front: headless PDF rendering does not fire beforeprint.
$$('main a[href^="/"], main a[href^="http"], .hero a[href^="/"]').forEach((a) => (a.dataset.printUrl = a.href));

let glossaryQuery = '';

$$('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));

// Everything goes on paper in its final state, whatever the reader was searching.
addEventListener('beforeprint', () => {
  finishFigures();
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
