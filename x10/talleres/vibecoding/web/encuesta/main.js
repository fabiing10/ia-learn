// /vibecoding/encuesta/ — encuesta de entrada. One question per screen, a tap
// answers and moves on; at the end the person sees how the room arrives (the
// same numbers the deck's live slide shows). Questions, validation and the
// aggregation live in shared/encuesta.js (tested); this file is the flow.

import { pregunta, opcionesDe, pasos, elegir, validar, buildRow, kpis, label } from '../shared/encuesta.js';
import { cleanSession } from '../shared/salida.js';
import { submitRow, flushQueue } from '../shared/supabase.js';
import { fetchResumen } from '../shared/resumen.js';
import { KEYS, readJSON, writeJSON } from '../shared/store.js';
import { bindThemeToggle, esc, readParam, reducedMotion, ICONS } from '../shared/ui.js';

const $ = (id) => document.getElementById(id);
const session = cleanSession(readParam('s'));
const REFRESH_MS = 8000;

// ── Saved state, per session: { answers, done } ──
const all = readJSON(KEYS.encuesta, {});
const saved = all && typeof all === 'object' && all[session] && typeof all[session] === 'object' ? all[session] : {};
const state = {
  answers: saved.answers && typeof saved.answers === 'object' ? saved.answers : {},
  done: saved.done === true,
  step: 0,
};
const persist = () => {
  const cur = readJSON(KEYS.encuesta, {});
  writeJSON(KEYS.encuesta, { ...(cur && typeof cur === 'object' ? cur : {}), [session]: { answers: state.answers, done: state.done } });
};

function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (!el.firstElementChild) el.innerHTML = ICONS[el.dataset.icon] ?? '';
  });
}

// ── Screens ──
const screens = ['intro', 'q', 'done'];
function show(id) {
  for (const s of screens) $(s).hidden = s !== id;
  $('progress').hidden = id !== 'q';
  const el = $(id);
  if (!reducedMotion()) {
    el.classList.remove('is-in');
    void el.offsetWidth; // restart the entrance animation
    el.classList.add('is-in');
  }
}

// ── Questions ──
const steps = () => pasos(state.answers);

/** "3 / 9" and the bar; the total can drop by one once the tools are known. */
function syncProgress() {
  const total = steps().length;
  $('step').textContent = `${state.step + 1} / ${total}`;
  $('bar').style.setProperty('--p', `${(state.step / total) * 100}%`);
}

function render() {
  const ids = steps();
  state.step = Math.min(state.step, ids.length - 1);
  const id = ids[state.step];
  const p = pregunta(id);
  const opts = opcionesDe(id, state.answers);
  const value = state.answers[id];
  const multi = p.tipo === 'varias';

  $('q-n').textContent = `Pregunta ${state.step + 1} de ${ids.length}`;
  $('q-t').textContent = p.titulo;
  $('q-help').textContent = p.ayuda ?? '';
  $('q-help').hidden = !p.ayuda;
  $('q-error').hidden = true;
  syncProgress();

  const box = $('opts');
  box.className = `opts opts--${p.tipo}${opts.length > 6 ? ' opts--many' : ''}`;
  box.setAttribute('role', 'group');
  box.setAttribute('aria-labelledby', 'q-t');
  box.innerHTML = opts
    .map((o, i) => {
      const on = multi ? Array.isArray(value) && value.includes(o.id) : String(value ?? '') === o.id;
      const meter =
        p.tipo === 'escala'
          ? `<span class="opt__meter" aria-hidden="true">${[0, 1, 2, 3, 4].map((b) => `<i class="${b <= i ? 'is-on' : ''}"></i>`).join('')}</span>`
          : '';
      const key = i < 9 ? `<kbd class="opt__key" aria-hidden="true">${i + 1}</kbd>` : '';
      return `<button class="opt${on ? ' is-on' : ''}${o.id === p.exclusivo ? ' opt--none' : ''}" type="button" data-opt="${esc(o.id)}" aria-pressed="${on}">
        ${meter}${key}<span class="opt__text"><b>${esc(o.text)}</b>${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</span>
        <span class="opt__tick" aria-hidden="true">${ICONS.check}</span>
      </button>`;
    })
    .join('');

  $('next').hidden = !multi;
  $('next').disabled = multi && !(Array.isArray(value) && value.length);
  $('next').innerHTML = `${state.step === ids.length - 1 ? 'Enviar' : 'Siguiente'} ${ICONS.arrow}`;
  $('q-hint').textContent = multi ? 'Puedes marcar varias' : 'Un toque y sigues';
}

function goTo(step) {
  state.step = step;
  render();
  show('q');
  $('q-t').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function next() {
  const ids = steps();
  if (state.step < ids.length - 1) goTo(state.step + 1);
  else send();
}

let advanceTimer = 0;
function choose(optionId) {
  const ids = steps();
  const id = ids[state.step];
  const p = pregunta(id);
  if (p.tipo === 'varias') {
    // Update in place: re-rendering would replay the entrance animation on every tap.
    const picked = elegir(id, Array.isArray(state.answers[id]) ? state.answers[id] : [], optionId);
    state.answers[id] = picked;
    persist();
    $('opts').querySelectorAll('.opt').forEach((b) => {
      const on = picked.includes(b.dataset.opt);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('next').disabled = !picked.length;
    syncProgress();
    return;
  }
  state.answers[id] = p.tipo === 'escala' ? Number(optionId) : optionId;
  persist();
  $('opts').querySelectorAll('.opt').forEach((b) => {
    const on = b.dataset.opt === optionId;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(next, reducedMotion() ? 120 : 320);
}

$('opts').addEventListener('click', (e) => {
  const b = e.target.closest('[data-opt]');
  if (b) choose(b.dataset.opt);
});

$('next').addEventListener('click', next);
$('back').addEventListener('click', () => {
  clearTimeout(advanceTimer);
  if (state.step > 0) goTo(state.step - 1);
  else {
    show('intro');
    $('start').focus();
  }
});

document.addEventListener('keydown', (e) => {
  if ($('q').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input, textarea')) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 9) {
    const b = $('opts').querySelectorAll('[data-opt]')[n - 1];
    if (b) {
      e.preventDefault();
      choose(b.dataset.opt);
    }
  } else if (e.key === 'Enter' && !$('next').hidden && !$('next').disabled && !e.target.closest('button')) {
    e.preventDefault();
    next();
  }
});

// ── Send ──
async function send() {
  const { errores, payload } = validar(state.answers);
  const first = steps().find((id) => errores[id]);
  if (first) {
    goTo(steps().indexOf(first));
    $('q-error').textContent = errores[first];
    $('q-error').hidden = false;
    return;
  }
  show('done');
  $('done-k').textContent = 'Enviando…';
  $('done-status').textContent = 'Guardando tu respuesta.';
  $('retry').hidden = true;
  const res = await submitRow(buildRow(payload, session));
  if (res.status === 'error') {
    $('done-k').textContent = 'No se pudo enviar';
    $('done-status').textContent = 'El servidor no aceptó la respuesta. Inténtalo de nuevo en un momento.';
    $('retry').hidden = false;
    return;
  }
  state.done = true;
  persist();
  sentText(res.status);
  $('done-t').focus({ preventScroll: true });
  startRoom();
}

function sentText(status) {
  $('done-k').textContent = 'Gracias';
  $('done-status').textContent =
    status === 'queued'
      ? 'Estás sin conexión: tu respuesta se envía sola cuando vuelva internet.'
      : status === 'demo'
        ? 'Modo demo: la respuesta se guarda solo en este navegador.'
        : 'Respuesta guardada. Esto es lo que va respondiendo la sala; se actualiza solo.';
}

$('retry').addEventListener('click', send);

// ── How the room arrives ──
const pctText = (n) => `${n} %`;

function bars(items, mine) {
  const max = Math.max(1, ...items.map((x) => x.n));
  return `<ol class="bars">${items
    .map(
      (x) => `<li class="${String(mine) === x.id ? 'is-mine' : ''}">
        <span class="bars__k">${esc(x.label)}${String(mine) === x.id ? '<em>tú</em>' : ''}</span>
        <span class="bars__track" aria-hidden="true"><i style="--w:${((x.n / max) * 100).toFixed(1)}%"></i></span>
        <b class="bars__v">${pctText(x.pct)}</b>
      </li>`,
    )
    .join('')}</ol>`;
}

function renderRoom(summary) {
  const k = kpis(summary);
  const a = validar(state.answers).payload;
  if (!k.total) {
    $('room').innerHTML = '<p class="room__empty">Todavía no hay respuestas en esta sesión.</p>';
    return;
  }
  const fav = k.favorita;
  const myFav = a.favorita ? label('favorita', a.favorita) : '';
  const tried = k.top('creadores', 3);
  const where = k.top('entidad', 3);
  $('room').innerHTML = `
    <div class="tile tile--total"><b>${k.total}</b><span>${k.total === 1 ? 'persona respondió' : 'personas respondieron'}</span></div>
    <div class="tile"><p class="tile__k">Usan IA cada semana o más</p><p class="tile__big">${pctText(k.activosPct)}</p>
      <p class="tile__me">Tú: ${esc(label('frecuencia', a.frecuencia).toLowerCase())}</p></div>
    <div class="tile"><p class="tile__k">La favorita de la sala</p><p class="tile__big tile__big--text">${fav ? esc(fav.label) : '—'}</p>
      <p class="tile__me">${fav ? `${pctText(fav.pct)} la usa más que cualquier otra.` : ''}${myFav ? ` La tuya: ${esc(myFav)}.` : ''}</p></div>
    <div class="tile tile--wide"><p class="tile__k">Qué tanto sabe de IA la sala</p>${bars(k.nivel, a.nivel)}</div>
    <div class="tile"><p class="tile__k">Ya probaron una herramienta para crear apps</p><p class="tile__big">${pctText(k.creadoresPct)}</p>
      <p class="tile__me">${tried.map((t) => `${esc(t.label)} ${pctText(t.pct)}`).join(' · ')}</p></div>
    <div class="tile"><p class="tile__k">Dónde trabajan</p>
      <ol class="tile__list">${where.map((w) => `<li><span>${esc(w.label)}</span><b>${pctText(w.pct)}</b></li>`).join('')}</ol></div>`;
}

let roomTimer = 0;
let roomCtrl = null;
async function tickRoom() {
  roomCtrl?.abort();
  roomCtrl = new AbortController();
  try {
    renderRoom(await fetchResumen(session, { signal: roomCtrl.signal }));
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (!$('room').firstElementChild) {
      $('room').innerHTML = '<p class="room__empty">Los resultados de la sala se ven en la presentación.</p>';
    }
  }
}

function startRoom() {
  clearInterval(roomTimer);
  tickRoom();
  roomTimer = setInterval(() => {
    if (document.visibilityState === 'visible') tickRoom();
  }, REFRESH_MS);
}

// ── Start ──
async function introCount() {
  try {
    const s = await fetchResumen(session);
    const n = Number(s.total) || 0;
    if (n) $('intro-count').textContent = n === 1 ? 'Ya respondió 1 persona.' : `Ya respondieron ${n} personas.`;
  } catch {
    /* the count is a nicety; the survey works without it */
  }
}

bindThemeToggle($('theme'));
fillIcons();

$('start').addEventListener('click', () => goTo(0));

if (state.done) {
  show('done');
  $('done-k').textContent = 'Ya respondiste';
  $('done-status').textContent = 'Gracias. Esto es lo que va respondiendo la sala; se actualiza solo.';
  startRoom();
} else {
  if (Object.keys(state.answers).length) $('start').firstChild.textContent = 'Seguir donde ibas ';
  show('intro');
  introCount();
}

flushQueue().then((sent) => {
  if (sent && state.done) sentText('saved');
});
addEventListener('online', () => flushQueue().then((sent) => sent && state.done && sentText('saved')));
