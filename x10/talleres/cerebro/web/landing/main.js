// /cerebro/ — the page attendees open from the QR at minute 3. Everything runs in
// the browser: profile → six files → copy, ZIP, vault. Nothing is sent anywhere.

import {
  ESPERADO, INSTALAR_SKILL, PERFIL_LAURA, PERFIL_VACIO, PREGUNTA_PRUEBA, PRIVACIDAD_VERIFICADA, RUTAS_VERIFICADAS, TAREAS,
} from '../shared/catalog.js';
import {
  ARCHIVOS, CAMPOS, buildFiles, buildPaste, privacidadOrdenada, rutasOrdenadas, sistemaBlock,
} from '../shared/generator.js';
import { buildSkills, skillZip } from '../shared/skills.js';
import { clearData, loadProfile, sameProfile, saveProfile } from '../shared/store.js';
import { ARBOL_BOVEDA, CARPETA_BOVEDA, buildVaultZip } from '../shared/vault.js';
import { zip } from '../shared/zip.js';
import {
  bindCopy, bindThemeToggle, debounce, downloadText, downloadZip, esc, paintIcons, reducedMotion, toast,
} from '../shared/ui.js';
import { mountForm } from './form.js';
import { mountMapa } from './mapa.js';
import { mountArchivos } from './archivos.js';

const $ = (id) => document.getElementById(id);

let profile = loadProfile() ?? { ...PERFIL_LAURA };
let files = buildFiles(profile);

// ── Live files and map ──

const archivos = mountArchivos({
  tabs: $('archivos-tabs'),
  panel: $('archivos-panel'),
  pre: $('archivos-pre'),
  meta: $('archivos-meta'),
  copyBtn: $('archivo-copiar'),
  downBtn: $('archivo-bajar'),
});

const form = mountForm($('perfil'), {
  onChange: (campo, next, { typing }) => (typing ? applyTyping(next, campo) : apply(next, [campo])),
  onFocusField: (campo) => mapa.highlight(campo),
});

const mapa = mountMapa($('mapa-stage'), {
  live: $('mapa-live'),
  onPickFile: (name) => archivos.select(name),
  onPickField: (campo) => form.focusField(campo),
});

form.set(profile);
archivos.update(files);

const changedFields = (a, b) => CAMPOS.map((c) => c.id).filter((id) => JSON.stringify(a[id]) !== JSON.stringify(b[id]));

const persist = debounce(() => {
  const ok = saveProfile(profile);
  state(ok);
}, 300);

function apply(next, campos, { save = true } = {}) {
  const nextFiles = buildFiles(next);
  const changed = ARCHIVOS.filter((n) => nextFiles[n] !== files[n]);
  const toolsChanged = JSON.stringify(next.herramientas) !== JSON.stringify(profile.herramientas);
  const tasksChanged = JSON.stringify(next.tareas) !== JSON.stringify(profile.tareas);
  profile = next;
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
    renderRutas();
    renderCuenta();
  }
  if (tasksChanged) {
    renderSkills();
    renderPruebas();
  }
  if (save) persist();
  else persist.cancel();
  state();
}

const applyTyping = debounce((next, campo) => apply(next, [campo]), 280);

function reset(next, message, opts) {
  const campos = changedFields(profile, next);
  form.set(next);
  apply({ ...next }, campos, opts);
  toast(message);
}

$('perfil-blanco').addEventListener('click', () => reset(PERFIL_VACIO, 'Perfil en blanco. Llénalo con lo tuyo.'));
$('perfil-laura').addEventListener('click', () => reset(PERFIL_LAURA, 'Volviste al ejemplo de Laura.'));

let lastSaveOk = true;
function state(saveOk = lastSaveOk) {
  lastSaveOk = saveOk;
  const el = $('perfil-estado');
  if (sameProfile(profile, PERFIL_LAURA)) {
    el.innerHTML = '<span class="pill-state pill-state--demo">Ejemplo</span>Laura, litigante. Cámbialo por lo tuyo.';
  } else if (sameProfile(profile, PERFIL_VACIO)) {
    el.innerHTML = '<span class="pill-state">En blanco</span>Empieza por tu rol.';
  } else {
    el.innerHTML = saveOk
      ? '<span class="pill-state pill-state--ok">Tu perfil</span>Guardado solo en este navegador.'
      : '<span class="pill-state">Tu perfil</span>Este navegador no deja guardarlo: se pierde al cerrar.';
  }
}
state();

// ── Cargar ──

bindCopy($('copiar-todo'), () => buildPaste(profile), {
  done: 'Copiado. Pégalo en un chat nuevo',
  message: 'Copiado. Abre un chat nuevo en tu IA, pega y envía.',
  title: 'Tu cerebro jurídico, para pegar en un chat',
});
bindCopy($('copiar-sistema'), () => sistemaBlock(profile), {
  done: 'Bloque copiado',
  message: 'Bloque de sistema copiado. Pégalo en las instrucciones del Proyecto o la Gem.',
});

$('bajar-zip').addEventListener('click', () => {
  const bytes = zip(Object.fromEntries(ARCHIVOS.map((n) => [`cerebro-juridico/${n}`, files[n]])));
  downloadZip('cerebro-juridico.zip', bytes);
  toast('Descargando cerebro-juridico.zip');
});

const dl = $('bajar-archivos');
dl.innerHTML = ARCHIVOS.map(
  (n) => `<li><button class="file-dl" type="button" data-archivo="${n}"><span data-icon="download"></span><code>${n}</code></button></li>`,
).join('');
dl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-archivo]');
  if (b) downloadText(b.dataset.archivo, files[b.dataset.archivo]);
});

let ruta = null;
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\{\{[A-Z0-9_]+\}\}/g, '<span class="ph">$&</span>');

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
renderRutas();
$('rutas-verificadas').textContent = RUTAS_VERIFICADAS;

// What each account does with the data, the user's tools first.
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
renderCuenta();
$('cuenta-verificada').textContent = PRIVACIDAD_VERIFICADA;

// One ZIP per chosen task; the content is built with the profile at click time.
function renderSkills() {
  const skills = buildSkills(profile);
  $('bajar-skills').innerHTML = skills.length
    ? skills
        .map(
          (k) =>
            `<li><button class="file-dl" type="button" data-skill="${esc(k.tarea)}"><span data-icon="download"></span><span class="file-dl__two"><code>${esc(k.carpeta)}.zip</code><small>${esc(k.titulo)}</small></span></button></li>`,
        )
        .join('')
    : '<li class="dl__empty">Elige hasta tres tareas en tu perfil y aquí aparecen tus skills.</li>';
  paintIcons($('bajar-skills'));
}
$('bajar-skills').addEventListener('click', (e) => {
  const b = e.target.closest('[data-skill]');
  if (!b) return;
  const k = buildSkills(profile).find((x) => x.tarea === b.dataset.skill);
  if (!k) return;
  downloadZip(`${k.carpeta}.zip`, skillZip(k));
  toast(`Descargando ${k.carpeta}.zip. Súbelo a Claude sin descomprimirlo.`);
});
$('skills-pasos').innerHTML = INSTALAR_SKILL.pasos.map((x) => `<li>${inline(x)}</li>`).join('');
$('skills-nota').textContent = INSTALAR_SKILL.nota;
renderSkills();

// ── Prueba: one test per chosen task (contracts when none is chosen) ──

let prueba = null;
function pruebas() {
  const mine = TAREAS.filter((t) => profile.tareas?.includes(t.id));
  return mine.length ? mine : TAREAS.filter((t) => t.id === 'contratos');
}

function renderPruebas() {
  const list = pruebas();
  if (!list.some((t) => t.id === prueba)) prueba = list[0].id;
  const tabs = $('pruebas-tabs');
  const hadFocus = tabs.contains(document.activeElement);
  tabs.innerHTML = list
    .map(
      (t) =>
        `<button class="pill" type="button" role="tab" id="prueba-${t.id}" data-prueba="${t.id}" aria-controls="pruebas-panel" aria-selected="${t.id === prueba}" tabindex="${t.id === prueba ? 0 : -1}">${esc(t.label)}</button>`,
    )
    .join('');
  const t = list.find((x) => x.id === prueba);
  $('pruebas-panel').setAttribute('aria-labelledby', `prueba-${t.id}`);
  $('pregunta').textContent = t.prueba;
  const nota = $('pregunta-nota');
  const sinTareas = !profile.tareas?.length;
  nota.hidden = !sinTareas;
  nota.textContent = sinTareas ? 'No elegiste tareas: esta es la prueba de contratos, la del taller. Elige tus tareas y aparece la prueba de cada una.' : '';
  if (hadFocus) $(`prueba-${prueba}`).focus();
}

$('pruebas-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-prueba]');
  if (!b) return;
  prueba = b.dataset.prueba;
  renderPruebas();
});
$('pruebas-tabs').addEventListener('keydown', (e) => {
  const ids = pruebas().map((t) => t.id);
  const i = ids.indexOf(prueba);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  prueba = ids[(to + ids.length) % ids.length];
  renderPruebas();
  $(`prueba-${prueba}`).focus();
});
renderPruebas();
bindCopy($('copiar-pregunta'), () => $('pregunta').textContent || PREGUNTA_PRUEBA, {
  done: 'Prueba copiada',
  message: 'Prueba copiada. Hazla en el chat con tu cerebro.',
});

const filas = Math.max(ESPERADO.sin.length, ESPERADO.con.length);
$('comparacion').innerHTML = Array.from({ length: filas }, (_, i) => {
  const cell = (side, text) =>
    `<p role="cell" class="compare__cell compare__cell--${side}${text ? '' : ' is-empty'}">${text ? esc(text) : ''}</p>`;
  return `<div class="compare__row" role="row">${cell('sin', ESPERADO.sin[i])}${cell('con', ESPERADO.con[i])}</div>`;
}).join('');

// ── Bóveda ──

$('arbol-boveda').textContent = ARBOL_BOVEDA;
$('bajar-boveda').addEventListener('click', () => {
  const now = new Date();
  downloadZip('boveda-obsidian.zip', buildVaultZip(profile, { today: now, date: now }));
  toast(`Descargando la bóveda: descomprímela y abre la carpeta ${CARPETA_BOVEDA} en Obsidian.`);
});

// ── Privacidad ──

// Clears storage and does not save again until the next edit.
$('borrar-datos').addEventListener('click', () => {
  const ok = clearData();
  reset(PERFIL_LAURA, ok ? 'Borrado de este navegador. Volviste al ejemplo de Laura.' : 'Este navegador no guarda datos: no había nada que borrar.', { save: false });
});

// ── Dock (phones): the files react even while the preview is off screen ──

const dock = $('dock');
const dockFiles = $('dock-files');
dockFiles.innerHTML = ARCHIVOS.map(
  (n) => `<span class="dock__node" data-archivo="${n}">${n === 'README.md' ? 'R' : n.slice(0, 2)}</span>`,
).join('');
dockFiles.addEventListener('click', () => $('archivos').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }));

const dockTimers = new Map();
function dockPulse(changed) {
  for (const n of changed) {
    const el = dockFiles.querySelector(`[data-archivo="${n}"]`);
    clearTimeout(dockTimers.get(n));
    el.classList.remove('is-lit');
    void el.offsetWidth;
    el.classList.add('is-lit');
    dockTimers.set(n, setTimeout(() => el.classList.remove('is-lit'), 1600));
  }
}

const seen = { build: false, files: false };
const narrow = window.matchMedia('(max-width: 899px)');
const syncDock = () => (dock.hidden = !(narrow.matches && seen.build && !seen.files));
new IntersectionObserver(([e]) => {
  seen.build = e.isIntersecting;
  syncDock();
}).observe($('perfil'));
new IntersectionObserver(([e]) => {
  seen.files = e.isIntersecting;
  syncDock();
}).observe($('archivos'));
narrow.addEventListener?.('change', syncDock);

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
