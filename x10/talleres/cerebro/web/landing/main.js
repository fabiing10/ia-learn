// /cerebro/ — the page attendees open from the QR. Three cerebros as tabs of
// «Construir» (shared/cerebros.js): a general skill, the ideation skill and the
// legal brain. Everything below the tabs reads the active one: profile → files →
// copy, ZIPs, test, and the vault for the legal brain. Everything runs in the
// browser; nothing is sent anywhere.

import { INSTALAR_SKILL, PREGUNTA_PRUEBA, PRIVACIDAD_VERIFICADA, RUTAS_VERIFICADAS } from '../shared/catalog.js';
import { CEREBROS, cerebroById, elegirCerebro, inicialDock } from '../shared/cerebros.js';
import { ARCHIVOS, privacidadOrdenada, rutasOrdenadas, sistemaBlock } from '../shared/generator.js';
import { clearData, loadCerebro, loadProfileFor, saveCerebro, saveProfileFor } from '../shared/store.js';
import { ARBOL_BOVEDA, CARPETA_BOVEDA, buildVaultZip } from '../shared/vault.js';
import {
  bindCopy, bindThemeToggle, downloadText, downloadZip, esc, paintIcons, reducedMotion, toast,
} from '../shared/ui.js';
import { mountForm } from './form.js';
import { mountGenericForm } from './form-generic.js';
import { mountMapa } from './mapa.js';
import { mountArchivos } from './archivos.js';

const $ = (id) => document.getElementById(id);

// A text read when it is shown, not when it is bound: toast() and the manual-copy
// dialog put it through textContent, which calls toString().
const dyn = (fn) => ({ toString: fn });

/** Debounce whose pending call can also run now (before a tab switch) or be dropped. */
function later(fn, ms) {
  let t = null;
  let args = [];
  const run = (...a) => {
    args = a;
    clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, ms);
  };
  run.flush = () => {
    if (t === null) return;
    clearTimeout(t);
    t = null;
    fn(...args);
  };
  run.cancel = () => {
    clearTimeout(t);
    t = null;
  };
  return run;
}

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\{\{[A-Z0-9_]+\}\}/g, '<span class="ph">$&</span>');

// ── State: the active cerebro, and the profile of each one visited ──

const deepLink = !!cerebroById(location.hash.slice(1)) || new URLSearchParams(location.search).has('c');
let cerebro = cerebroById(elegirCerebro({ hash: location.hash, search: location.search, guardado: loadCerebro() }));
if (deepLink) saveCerebro(cerebro.id);

const perfiles = new Map(); // id → profile, so switching tabs keeps unsaved edits
function perfilDe(c) {
  if (!perfiles.has(c.id)) perfiles.set(c.id, loadProfileFor(c) ?? { ...c.perfilEjemplo });
  return perfiles.get(c.id);
}

let profile = perfilDe(cerebro);
let files = cerebro.build(profile);

/** The tabs of a cerebro's files: its list, plus any extra file its profile adds (references/material.md). */
const nombres = (c, fs) => [...c.archivos, ...Object.keys(fs).filter((n) => !c.archivos.includes(n))];

// ── Live files and map ──

const archivos = mountArchivos({
  tabs: $('archivos-tabs'),
  panel: $('archivos-panel'),
  pre: $('archivos-pre'),
  meta: $('archivos-meta'),
  copyBtn: $('archivo-copiar'),
  downBtn: $('archivo-bajar'),
});

const mapa = mountMapa($('mapa-stage'), {
  mapa: cerebro.mapa,
  archivos: cerebro.archivos,
  fijos: cerebro.fijos,
  live: $('mapa-live'),
  onPickFile: (name) => archivos.select(name),
  onPickField: (campo) => form().focusField(campo),
});

// One <form> per cerebro, mounted the first time its tab opens and kept, so a
// tab switch never loses what was typed. The legal one keeps its custom form.
const formEls = Object.fromEntries([...document.querySelectorAll('form[data-form]')].map((f) => [f.dataset.form, f]));
const forms = new Map();
function formFor(c) {
  if (!forms.has(c.id)) {
    const handlers = {
      onChange: (campo, next, { typing }) => {
        if (c !== cerebro) return;
        if (typing) applyTyping(next, campo);
        else apply(next, [campo]);
      },
      onFocusField: (campo) => c === cerebro && mapa.highlight(campo),
    };
    const f = c.campos ? mountGenericForm(formEls[c.id], { cerebro: c, ...handlers }) : mountForm(formEls[c.id], handlers);
    f.set(perfilDe(c));
    forms.set(c.id, f);
  }
  return forms.get(c.id);
}
const form = () => formFor(cerebro);

const persist = later((c, p) => state(saveProfileFor(c, p)), 300);

function apply(next, campos, { save = true } = {}) {
  const c = cerebro;
  const nextFiles = c.build(next);
  const lista = nombres(c, nextFiles);
  if (lista.join('|') !== archivos.list.join('|')) {
    archivos.setArchivos(lista, archivos.active, { reset: false });
    renderDock(lista);
  }
  const changed = lista.filter((n) => nextFiles[n] !== files[n]);
  const toolsChanged = JSON.stringify(next.herramientas) !== JSON.stringify(profile.herramientas);
  const tasksChanged = JSON.stringify(next.tareas) !== JSON.stringify(profile.tareas);
  profile = next;
  perfiles.set(c.id, next);
  files = nextFiles;
  archivos.update(files, changed);
  if (campos.length === 1) {
    mapa.pulse(campos[0], changed);
    mapa.announce(campos[0], changed);
  } else {
    mapa.cascade(campos, changed);
  }
  dockPulse(changed);
  if (toolsChanged) {
    if (c.rutas) renderRutas();
    renderCuenta();
  }
  // The legal downloads and tests follow the chosen tasks; the general ones
  // follow the skill name, the example and the phrase.
  if (tasksChanged || c.campos) {
    renderDescargas();
    renderPruebas();
  }
  if (save) persist(c, next);
  else persist.cancel();
  state();
}

const applyTyping = later((next, campo) => apply(next, [campo]), 280);

function reset(next, message, opts) {
  applyTyping.cancel();
  const campos = cerebro.cambios(profile, next);
  form().set(next);
  apply({ ...next }, campos, opts);
  toast(message);
}

$('perfil-blanco').addEventListener('click', () => reset(cerebro.perfilVacio, cerebro.vacio.toast));
$('perfil-laura').addEventListener('click', () => reset(cerebro.perfilEjemplo, `Volviste al ejemplo de ${cerebro.ejemplo.nombre}.`));

let lastSaveOk = true;
function state(saveOk = lastSaveOk) {
  lastSaveOk = saveOk;
  const c = cerebro;
  const el = $('perfil-estado');
  if (c.same(profile, c.perfilEjemplo)) {
    el.innerHTML = `<span class="pill-state pill-state--demo">Ejemplo</span>${esc(c.ejemplo.descripcion)}`;
  } else if (c.same(profile, c.perfilVacio)) {
    el.innerHTML = `<span class="pill-state">En blanco</span>${esc(c.vacio.estado)}`;
  } else {
    el.innerHTML = saveOk
      ? `<span class="pill-state pill-state--ok">${esc(c.mio)}</span>Guardado solo en este navegador.`
      : `<span class="pill-state">${esc(c.mio)}</span>Este navegador no deja guardarlo: se pierde al cerrar.`;
  }
}

// ── Cargar ──

bindCopy($('copiar-todo'), () => cerebro.paste(profile), {
  done: 'Copiado. Pégalo en un chat nuevo',
  message: 'Copiado. Abre un chat nuevo en tu IA, pega y envía.',
  title: dyn(() => cerebro.copiar.titulo),
});
bindCopy($('copiar-sistema'), () => sistemaBlock(profile), {
  done: 'Bloque copiado',
  message: 'Bloque de sistema copiado. Pégalo en las instrucciones del Proyecto o la Gem.',
});

function renderConfirm() {
  $('confirm3').innerHTML = cerebro.confirm3
    .map(([b, rest], i) => `<li><span class="confirm3__n">${i + 1}</span><span><b>${esc(b)}</b>${esc(rest)}</span></li>`)
    .join('');
}

/** A ZIP of descargas(), built with the profile at click time. */
function descargar(d) {
  if (!d) return;
  downloadZip(d.archivo, d.bytes());
  toast(d.aviso ? `Descargando ${d.archivo}. ${d.aviso}` : `Descargando ${d.archivo}`);
}
const descarga = (pred) => cerebro.descargas(profile).find(pred);

// Legal: the brain ZIP (not a skill) and its six files one by one.
$('bajar-zip').addEventListener('click', () => descargar(descarga((d) => d.tipo === 'cerebro')));
const dl = $('bajar-archivos');
dl.innerHTML = ARCHIVOS.map(
  (n) => `<li><button class="file-dl" type="button" data-archivo="${n}"><span data-icon="download"></span><code>${n}</code></button></li>`,
).join('');
dl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-archivo]');
  if (b) downloadText(b.dataset.archivo, files[b.dataset.archivo]);
});

// Legal: one ZIP per chosen task. The general cerebros: the skill and the whole kit.
function renderDescargas() {
  const list = cerebro.descargas(profile);
  if (list.some((d) => d.tipo === 'cerebro')) {
    const skills = list.filter((d) => d.tipo === 'skill');
    $('bajar-skills').innerHTML = skills.length
      ? skills
          .map(
            (d) =>
              `<li><button class="file-dl" type="button" data-skill="${esc(d.id)}"><span data-icon="download"></span><span class="file-dl__two"><code>${esc(d.archivo)}</code><small>${esc(d.titulo)}</small></span></button></li>`,
          )
          .join('')
      : '<li class="dl__empty">Elige hasta tres tareas en tu perfil y aquí aparecen tus skills.</li>';
    paintIcons($('bajar-skills'));
    return;
  }
  $('descargas-lead').textContent = cerebro.dlLead;
  $('descargas').innerHTML = list
    .map(
      (d) =>
        `<li><button class="file-dl" type="button" data-descarga="${esc(d.id)}"><span data-icon="${d.tipo === 'todo' ? 'zip' : 'download'}"></span><span class="file-dl__two"><code>${esc(d.archivo)}</code><small>${esc(d.titulo)} · ${esc(d.nota)}</small></span></button></li>`,
    )
    .join('');
  paintIcons($('descargas'));
}
$('bajar-skills').addEventListener('click', (e) => {
  const b = e.target.closest('[data-skill]');
  if (b) descargar(descarga((d) => d.tipo === 'skill' && d.id === b.dataset.skill));
});
$('descargas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-descarga]');
  if (b) descargar(descarga((d) => d.id === b.dataset.descarga));
});
for (const [pasos, nota] of [['skills-pasos', 'skills-nota'], ['descargas-pasos', 'descargas-nota']]) {
  $(pasos).innerHTML = INSTALAR_SKILL.pasos.map((x) => `<li>${inline(x)}</li>`).join('');
  $(nota).textContent = INSTALAR_SKILL.nota;
}

// Legal: «Para dejarlo fijo», one route per tool, the user's tools first.
let ruta = null;
function renderRutas() {
  const rutas = rutasOrdenadas(profile);
  if (!rutas.some((r) => r.id === ruta)) ruta = rutas[0].id;
  const tabs = $('rutas-tabs');
  const hadFocus = tabs.contains(document.activeElement);
  tabs.innerHTML = rutas
    .map(
      (r) =>
        `<button class="pill" type="button" role="tab" id="ruta-${r.id}" data-ruta="${r.id}" aria-controls="rutas-panel" aria-selected="${r.id === ruta}" tabindex="${r.id === ruta ? 0 : -1}">${esc(r.label)}${r.mia ? '<span class="pill__mine">la usas</span>' : ''}</button>`,
    )
    .join('');
  const r = rutas.find((x) => x.id === ruta);
  const panel = $('rutas-panel');
  panel.setAttribute('aria-labelledby', `ruta-${r.id}`);
  panel.innerHTML = `<ol class="route-steps">${r.pasos.map((s) => `<li>${inline(s)}</li>`).join('')}</ol>${
    r.nota ? `<p class="route-note">${inline(r.nota)}</p>` : ''
  }`;
  if (hadFocus) $(`ruta-${ruta}`).focus();
}

$('rutas-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ruta]');
  if (!b) return;
  ruta = b.dataset.ruta;
  renderRutas();
});
$('rutas-tabs').addEventListener('keydown', (e) => {
  const ids = rutasOrdenadas(profile).map((r) => r.id);
  const i = ids.indexOf(ruta);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  ruta = ids[(to + ids.length) % ids.length];
  renderRutas();
  $(`ruta-${ruta}`).focus();
});
$('rutas-verificadas').textContent = RUTAS_VERIFICADAS;

// What each account does with the data, the user's tools first (every cerebro).
function renderCuenta() {
  $('cuenta-lista').innerHTML = privacidadOrdenada(profile)
    .map(
      (x) => `<li class="account__item${x.mia ? ' is-mine' : ''}">
  <p class="account__name">${esc(x.label)}${x.mia ? '<span class="pill__mine">la usas</span>' : ''}</p>
  <p class="account__train"><b>¿Entrena con lo que subes?</b> ${esc(x.entrena)}</p>
  <p><b>Cómo apagarlo:</b> ${esc(x.apagar)}</p>
  ${x.sinRastro ? `<p><b>Sin rastro:</b> ${esc(x.sinRastro)}</p>` : ''}
  <p class="account__ojo"><b>Ojo:</b> ${esc(x.ojo)}</p>
  <p class="account__src"><a href="${esc(x.fuente)}" target="_blank" rel="noopener">Fuente oficial</a></p>
</li>`,
    )
    .join('');
}
$('cuenta-verificada').textContent = PRIVACIDAD_VERIFICADA;

// ── Prueba: legal, one test per chosen task (contracts when none); general, one test ──

let prueba = null;
let pruebaTabs = [];

function renderPruebas() {
  const pr = cerebro.prueba(profile);
  const tabs = $('pruebas-tabs');
  const panel = $('pruebas-panel');
  const hadFocus = tabs.contains(document.activeElement);
  pruebaTabs = pr.tabs ?? [];
  tabs.hidden = !pruebaTabs.length;
  if (pruebaTabs.length) {
    if (!pruebaTabs.some((t) => t.id === prueba)) prueba = pruebaTabs[0].id;
    tabs.innerHTML = pruebaTabs
      .map(
        (t) =>
          `<button class="pill" type="button" role="tab" id="prueba-${t.id}" data-prueba="${t.id}" aria-controls="pruebas-panel" aria-selected="${t.id === prueba}" tabindex="${t.id === prueba ? 0 : -1}">${esc(t.label)}</button>`,
      )
      .join('');
    const t = pruebaTabs.find((x) => x.id === prueba);
    panel.setAttribute('role', 'tabpanel');
    panel.removeAttribute('aria-label');
    panel.setAttribute('aria-labelledby', `prueba-${t.id}`);
    $('pregunta').textContent = t.pregunta;
  } else {
    tabs.innerHTML = '';
    panel.setAttribute('role', 'group');
    panel.removeAttribute('aria-labelledby');
    panel.setAttribute('aria-label', 'La prueba');
    $('pregunta').textContent = pr.pregunta;
  }
  const nota = $('pregunta-nota');
  nota.hidden = !pr.aviso;
  nota.textContent = pr.aviso || '';
  if (hadFocus && pruebaTabs.length) $(`prueba-${prueba}`).focus();
  renderComparar(pr.esperado);
}

$('pruebas-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-prueba]');
  if (!b) return;
  prueba = b.dataset.prueba;
  renderPruebas();
});
$('pruebas-tabs').addEventListener('keydown', (e) => {
  const ids = pruebaTabs.map((t) => t.id);
  const i = ids.indexOf(prueba);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  prueba = ids[(to + ids.length) % ids.length];
  renderPruebas();
  $(`prueba-${prueba}`).focus();
});
bindCopy($('copiar-pregunta'), () => $('pregunta').textContent || PREGUNTA_PRUEBA, {
  done: 'Prueba copiada',
  message: dyn(() => cerebro.copiar.prueba),
});

function renderComparar(esperado) {
  const { sin, con } = cerebro.comparar;
  $('comparar').setAttribute('aria-label', `${sin} y ${con.toLowerCase()}`);
  $('comparar-sin').textContent = `${sin}: lo que suele pasar`;
  $('comparar-con').textContent = `${con}: lo que debes ver`;
  const filas = Math.max(esperado.sin.length, esperado.con.length);
  // data-lado labels each cell on phones, where the column headers are hidden.
  const cell = (side, lado, text) =>
    `<p role="cell" class="compare__cell compare__cell--${side}${text ? '' : ' is-empty'}" data-lado="${esc(lado)}">${text ? esc(text) : ''}</p>`;
  $('comparacion').innerHTML = Array.from(
    { length: filas },
    (_, i) => `<div class="compare__row" role="row">${cell('sin', sin, esperado.sin[i])}${cell('con', con, esperado.con[i])}</div>`,
  ).join('');
}

// ── Bóveda (legal) ──

$('arbol-boveda').textContent = ARBOL_BOVEDA;
$('bajar-boveda').addEventListener('click', () => {
  const now = new Date();
  downloadZip('boveda-obsidian.zip', buildVaultZip(profile, { today: now, date: now }));
  toast(`Descargando la bóveda: descomprímela y abre la carpeta ${CARPETA_BOVEDA} en Obsidian.`);
});

// ── Privacidad ──

// Clears the three profiles and the tab choice; every cerebro goes back to its
// example and nothing is saved again until the next edit. The open tab stays.
$('borrar-datos').addEventListener('click', () => {
  const ok = clearData();
  applyTyping.cancel();
  persist.cancel();
  for (const c of CEREBROS) {
    if (c === cerebro) continue;
    perfiles.set(c.id, { ...c.perfilEjemplo });
    forms.get(c.id)?.set(c.perfilEjemplo);
  }
  reset(
    cerebro.perfilEjemplo,
    ok ? `Borrado de este navegador. Volviste al ejemplo de ${cerebro.ejemplo.nombre}.` : 'Este navegador no guarda datos: no había nada que borrar.',
    { save: false },
  );
});

// ── Dock (phones): the files react even while the preview is off screen ──

const dock = $('dock');
const dockFiles = $('dock-files');
function renderDock(list) {
  dockFiles.innerHTML = list.map((n) => `<span class="dock__node" data-archivo="${n}" title="${n}">${inicialDock(n)}</span>`).join('');
}
dockFiles.addEventListener('click', () => $('archivos').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }));

const dockTimers = new Map();
function dockPulse(changed) {
  for (const n of changed) {
    const el = dockFiles.querySelector(`[data-archivo="${CSS.escape(n)}"]`);
    if (!el) continue;
    clearTimeout(dockTimers.get(n));
    el.classList.remove('is-lit');
    void el.offsetWidth;
    el.classList.add('is-lit');
    dockTimers.set(n, setTimeout(() => el.classList.remove('is-lit'), 1600));
  }
}

const seen = { forms: new Set(), files: false };
const narrow = window.matchMedia('(max-width: 899px)');
const syncDock = () => (dock.hidden = !(narrow.matches && seen.forms.size > 0 && !seen.files));
const formObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) seen.forms.add(e.target);
    else seen.forms.delete(e.target);
  }
  syncDock();
});
for (const el of Object.values(formEls)) formObserver.observe(el);
new IntersectionObserver(([e]) => {
  seen.files = e.isIntersecting;
  syncDock();
}).observe($('archivos'));
narrow.addEventListener?.('change', syncDock);

// ── Cerebro tabs ──

const tabsEl = $('cerebros');

function syncTabs(focus = false) {
  for (const b of tabsEl.querySelectorAll('[data-cerebro]')) {
    const on = b.dataset.cerebro === cerebro.id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus) b.focus();
  }
  $('cerebro-panel').setAttribute('aria-labelledby', `cerebro-${cerebro.id}`);
}

function renderLlevas() {
  const { titulo, items, foot } = cerebro.llevas;
  $('leave-title').textContent = titulo;
  $('leave-list').innerHTML = items.map(({ archivo, que }) => `<li><code>${esc(archivo)}</code><span>${esc(que)}</span></li>`).join('');
  const f = $('leave-foot');
  f.hidden = !foot;
  f.innerHTML = foot ? inline(foot) : '';
}

function renderTextos() {
  $('construir-eyebrow').textContent = cerebro.eyebrow;
  $('construir-t').textContent = cerebro.titulo;
  $('construir-lead').textContent = cerebro.lead;
  $('perfil-ejemplo-label').textContent = `Volver al ejemplo de ${cerebro.ejemplo.nombre}`;
  $('cargar-lead').textContent = cerebro.cargarLead;
  $('prueba-lead').textContent = cerebro.pruebaLead;
}

/** Blocks that exist for some cerebros only: data-solo="juridico", data-solo="skill ideacion". */
function syncSolo() {
  for (const el of document.querySelectorAll('[data-solo]')) el.hidden = !el.dataset.solo.split(' ').includes(cerebro.id);
}

/** Everything that depends on the active cerebro. */
function mostrar() {
  profile = perfilDe(cerebro);
  files = cerebro.build(profile);
  for (const [id, el] of Object.entries(formEls)) el.hidden = id !== cerebro.id;
  formFor(cerebro);
  const lista = nombres(cerebro, files);
  archivos.setArchivos(lista, cerebro.principal);
  archivos.update(files);
  mapa.set({ mapa: cerebro.mapa, archivos: cerebro.archivos, fijos: cerebro.fijos });
  renderDock(lista);
  renderTextos();
  renderLlevas();
  syncSolo();
  renderConfirm();
  renderDescargas();
  renderCuenta();
  if (cerebro.rutas) renderRutas();
  renderPruebas();
  state();
}

/** A deep link (#ideacion or ?c=) follows the tab, so a reload opens what is on screen. */
function syncUrl() {
  try {
    const url = new URL(location.href);
    let touched = false;
    if (cerebroById(url.hash.slice(1))) {
      url.hash = cerebro.id;
      touched = true;
    }
    if (url.searchParams.has('c')) {
      url.searchParams.set('c', cerebro.id);
      touched = true;
    }
    if (touched) history.replaceState(history.state, '', url);
  } catch {
    /* file:// or a sandbox without history: the tab still switches */
  }
}

function elegir(id, { focus = false } = {}) {
  const next = cerebroById(id);
  if (!next) return;
  if (next !== cerebro) {
    // What was typed in the tab we leave is applied and saved first.
    applyTyping.flush();
    persist.flush();
    cerebro = next;
    saveCerebro(next.id);
    mostrar();
    syncUrl();
  }
  syncTabs(focus);
}

tabsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cerebro]');
  if (b) elegir(b.dataset.cerebro);
});
// Roving focus like the other tablists: arrows, Home and End move and select.
tabsEl.addEventListener('keydown', (e) => {
  const ids = CEREBROS.map((c) => c.id);
  const i = ids.indexOf(cerebro.id);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  elegir(ids[(to + ids.length) % ids.length], { focus: true });
});

const irAConstruir = (behavior) => $('construir').scrollIntoView({ block: 'start', behavior });
addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (!cerebroById(id)) return;
  elegir(id);
  irAConstruir(reducedMotion() ? 'auto' : 'smooth');
});

mostrar();
syncTabs();

// A deep link lands on «Construir»: no element has the cerebro's id, so the
// browser does not scroll by itself. Once more when the fonts settle the layout,
// unless the reader already moved.
if (deepLink) {
  irAConstruir('instant');
  const y = scrollY;
  document.fonts?.ready.then(() => scrollY === y && irAConstruir('instant'));
}

// ── Top bar: mark the section in view ──

const links = [...document.querySelectorAll('.bar__nav a[href^="#"]')];
const navObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const l of links) {
        if (l.getAttribute('href') === `#${e.target.id}`) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      }
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
for (const id of ['inicio', 'construir', 'cargar', 'prueba', 'boveda']) navObserver.observe($(id));

bindThemeToggle($('theme'));
paintIcons();
