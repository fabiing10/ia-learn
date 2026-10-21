// #salida — formulario de salida. Validation and the row come from
// shared/salida.js (tested); this file is the form, the draft, the submit
// states and the offline queue.

import { CHECKPOINTS, TAREA } from '../shared/content.js';
import { cleanSession, validateSalida, buildRow } from '../shared/salida.js';
import { isDemo, submitRow, flushQueue, queuedCount } from '../shared/supabase.js';
import { KEYS, readJSON, writeJSON, remove } from '../shared/store.js';
import { esc, debounce, readParam, reducedMotion } from '../shared/ui.js';

const $ = (id) => document.getElementById(id);

// field name → [input element id, error element id]
const FIELDS = {
  nombre: ['f-nombre', 'f-nombre-err'],
  punto_control: ['f-puntos', 'f-punto-err'],
  url_app: ['f-app', 'f-app-err'],
  url_repo: ['f-repo', 'f-repo-err'],
  duda: ['f-duda', 'f-duda-err'],
  consent: ['f-consent', 'f-consent-err'],
};

export function initSalida() {
  const session = cleanSession(readParam('s'));
  const form = $('salida-form');
  const sendBtn = $('f-send');
  const statusEl = $('salida-status');
  const done = $('salida-done');
  const queueEl = $('salida-queue');

  $('salida-session').textContent = `Sesión: ${session}`;
  $('salida-demo').hidden = !isDemo;

  $('f-puntos').innerHTML = CHECKPOINTS.map(
    (c) => `<label class="radio">
      <input type="radio" name="punto_control" value="${c.n}" />
      <span class="radio__n" aria-hidden="true">${c.n}</span>
      <span class="radio__t"><span class="sr-only">Punto ${c.n}: </span>${esc(c.name)}</span>
    </label>`,
  ).join('');

  $('tarea-list').innerHTML = TAREA.map((t) => `<li>${esc(t)}</li>`).join('');

  const values = () => ({
    nombre: form.nombre.value,
    url_app: form.url_app.value,
    url_repo: form.url_repo.value,
    duda: form.duda.value,
    punto_control: form.querySelector('input[name="punto_control"]:checked')?.value ?? '',
    consent: form.consent.checked,
  });

  // ── Draft (consent is never remembered) ──
  const draft = readJSON(KEYS.salidaDraft, null);
  if (draft && typeof draft === 'object') {
    for (const k of ['nombre', 'url_app', 'url_repo', 'duda']) if (typeof draft[k] === 'string') form[k].value = draft[k];
    const r = form.querySelector(`input[name="punto_control"][value="${Number(draft.punto_control) || 0}"]`);
    if (r) r.checked = true;
  }
  const saveDraft = debounce(() => {
    const { consent, ...rest } = values();
    writeJSON(KEYS.salidaDraft, rest);
  }, 400);

  // ── Errors ──
  function showError(field, message) {
    const [inputId, errId] = FIELDS[field];
    const el = $(inputId);
    const err = $(errId);
    err.textContent = message ?? '';
    err.hidden = !message;
    if (field === 'punto_control') el.classList.toggle('is-invalid', !!message);
    else el.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function showWarnings(warnings) {
    const w = $('f-repo-warn');
    w.textContent = warnings.url_repo ?? '';
    w.hidden = !warnings.url_repo;
  }

  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (FIELDS[name]) showError(name, '');
    if (name === 'url_repo') $('f-repo-warn').hidden = true;
    statusEl.textContent = '';
    statusEl.classList.remove('is-error');
    saveDraft();
  });

  form.url_repo.addEventListener('blur', () => {
    if (form.url_repo.value.trim()) showWarnings(validateSalida(values()).warnings);
  });

  // ── Submit ──
  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const v = values();
    const { errors, warnings } = validateSalida(v);
    for (const f of Object.keys(FIELDS)) showError(f, errors[f]);
    showWarnings(warnings);
    const first = Object.keys(FIELDS).find((f) => errors[f]);
    if (first) {
      const target = first === 'punto_control' ? form.querySelector('input[name="punto_control"]') : $(FIELDS[first][0]);
      target.focus();
      statusEl.textContent = 'Revisa los campos marcados.';
      statusEl.classList.add('is-error');
      return;
    }

    sending = true;
    sendBtn.disabled = true;
    sendBtn.querySelector('[data-label]').textContent = 'Enviando…';
    statusEl.textContent = '';
    statusEl.classList.remove('is-error');

    const row = buildRow(v, { session });
    const res = await submitRow(row);

    sending = false;
    sendBtn.disabled = false;
    sendBtn.querySelector('[data-label]').textContent = 'Enviar';

    if (res.status === 'error') {
      statusEl.textContent = 'No pudimos enviarla. Inténtalo otra vez en un momento; si sigue fallando, avísale a Fabian en la clase.';
      statusEl.classList.add('is-error');
      return;
    }
    showDone(res, row.payload.nombre);
  });

  function showDone(res, nombre) {
    const first = nombre.split(' ')[0];
    const copy = {
      saved: [`¡Listo, ${first}! Quedó enviado.`, 'Fabian ya tiene tu respuesta. Con ella arma los grupos de la clase 2.'],
      demo: ['Guardado en modo demo', 'Esta página no está conectada a la base de datos: tu respuesta quedó solo en este navegador.'],
      queued: ['Guardado sin conexión', 'No hay conexión. Tu respuesta quedó en este navegador y se envía sola cuando vuelvas a abrir esta página con internet.'],
    }[res.status];
    $('done-title').textContent = copy[0];
    $('done-text').textContent = copy[1];
    done.classList.toggle('is-demo', res.status === 'demo');
    done.classList.toggle('is-queued', res.status === 'queued');
    done.dataset.status = res.status;
    if (res.httpStatus) done.dataset.http = String(res.httpStatus);
    form.hidden = true;
    done.hidden = false;
    remove(KEYS.salidaDraft);
    done.focus({ preventScroll: true });
    // The success card is shorter than the form: bring the section back to its top.
    $('salida').scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    renderQueue();
  }

  $('salida-again').addEventListener('click', () => {
    form.reset();
    for (const f of Object.keys(FIELDS)) showError(f, '');
    showWarnings({});
    done.hidden = true;
    form.hidden = false;
    form.nombre.focus();
  });

  // ── Offline queue ──
  function renderQueue(message) {
    const n = queuedCount();
    if (message) {
      queueEl.textContent = message;
      queueEl.hidden = false;
    } else if (n) {
      queueEl.textContent = `Tienes ${n === 1 ? 'una respuesta pendiente' : `${n} respuestas pendientes`} de enviar. Se envía sola cuando haya conexión.`;
      queueEl.hidden = false;
    } else {
      queueEl.hidden = true;
    }
  }

  async function tryFlush() {
    if (!queuedCount()) return;
    const sent = await flushQueue();
    renderQueue(sent ? (sent === 1 ? 'Se envió tu respuesta pendiente.' : `Se enviaron ${sent} respuestas pendientes.`) : undefined);
  }

  window.addEventListener('online', tryFlush);
  renderQueue();
  tryFlush();
}
