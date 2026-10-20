// #spec — guided builder for the one-page spec. The model, the markdown and
// the prueba del adivino live in shared/spec.js (pure, tested); this file is
// the DOM: render the seven blocks, keep the model in sync, show the live
// hints, the first message, copy / download / reset, and autosave.

import {
  BLOCKS, LIMITS, emptySpec, normalizeSpec, firstMessage, adivino, hintsByBlock, prefillFromMenu,
  hasContentInBlocks, specSlug, CABECERA,
} from '../shared/spec.js';
import { KEYS, readJSON, writeJSON, remove } from '../shared/store.js';
import { esc, debounce, copyText, downloadText, toast, reducedMotion, ICONS } from '../shared/ui.js';

const $ = (id) => document.getElementById(id);

// Placeholders use the plan's tablero example ("Ej.: …" in the template).
const PH = {
  paraQuien:
    'Ej.: El equipo de mantenimiento recibe solicitudes por WhatsApp y las pierde. Esta app las recibe en un solo lugar y muestra en qué estado van.',
  acciones: [
    ['Ej.: Cualquier persona', 'registrar una solicitud con título, descripción y área'],
    ['Ej.: El responsable', 'cambiar el estado: nueva, en proceso, resuelta'],
    ['Ej.: Cualquier persona', 'ver la lista de solicitudes y su estado'],
  ],
  guarda: [['Ej.: Solicitud', 'título, descripción, área, fecha de creación, estado, nombre de quien la pidió']],
  roles: [
    ['Rol 1', 'qué ve y qué puede hacer'],
    ['Rol 2', 'qué ve y qué puede hacer'],
  ],
  noHace: [
    'Ej.: no envía correos ni notificaciones',
    'Ej.: no tiene inicio de sesión; el responsable entra por una URL aparte',
    'Ej.: no adjunta archivos',
  ],
  escenarios: [['una persona', 'registra una solicitud', 'aparece en la lista con estado Nueva y la fecha de hoy']],
  pantallas: [['Ej.: Lista', 'todas las solicitudes, la más reciente arriba, con filtro por estado']],
};

const ADD_LABEL = {
  acciones: 'Agregar acción',
  guarda: 'Agregar otra cosa',
  roles: 'Agregar rol',
  noHace: 'Agregar otra',
  escenarios: 'Agregar escenario',
  pantallas: 'Agregar pantalla',
};

const NEW_ROW = {
  acciones: () => ({ rol: '', accion: '' }),
  guarda: () => ({ cosa: '', datos: '' }),
  roles: () => ({ rol: '', puede: '' }),
  noHace: () => '',
  escenarios: () => ({ quien: '', hace: '', pasa: '' }),
  pantallas: () => ({ pantalla: '', muestra: '' }),
};

const ph = (key, i, j) => {
  const row = PH[key]?.[i];
  if (row === undefined) return null;
  return Array.isArray(row) ? row[j] : row;
};

const input = (path, label, placeholder, value) =>
  `<label class="sr-only" for="f-${path}">${esc(label)}</label><input class="input" id="f-${path}" data-path="${path}" type="text" maxlength="600" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(value)}" />`;

const removeBtn = (key, i, label) =>
  `<button class="row__btn" type="button" data-remove="${key}.${i}" aria-label="${esc(label)}" title="Quitar">${ICONS.cross}</button>`;

// ── Block bodies ──

function rowsAcciones(s) {
  const many = s.acciones.length > 5;
  return s.acciones
    .map((a, i) => {
      const n = i + 1;
      return `<li class="row row--pair">
        ${input(`acciones.${i}.rol`, `Acción ${n}: rol`, ph('acciones', i, 0) ?? 'Rol', a.rol)}
        <span class="row__joint" aria-hidden="true">puede</span>
        ${input(`acciones.${i}.accion`, `Acción ${n}: qué puede hacer, con verbo`, ph('acciones', i, 1) ?? 'acción con verbo', a.accion)}
        <span class="row__tools">
          ${many ? `<button class="row__btn row__btn--later" type="button" data-later="${i}" title="Bajar a «Qué NO hace»">A después</button>` : ''}
          ${s.acciones.length > 1 ? removeBtn('acciones', i, `Quitar la acción ${n}`) : ''}
        </span>
      </li>`;
    })
    .join('');
}

function rowsPair(s, key, a, b, joint, labels) {
  return s[key]
    .map((r, i) => {
      const n = i + 1;
      return `<li class="row row--pair">
        ${input(`${key}.${i}.${a}`, `${labels[0]} ${n}`, ph(key, i, 0) ?? labels[2], r[a])}
        <span class="row__joint" aria-hidden="true">${joint}</span>
        ${input(`${key}.${i}.${b}`, `${labels[1]} ${n}`, ph(key, i, 1) ?? labels[3], r[b])}
        <span class="row__tools">${s[key].length > 1 ? removeBtn(key, i, `Quitar la fila ${n}`) : ''}</span>
      </li>`;
    })
    .join('');
}

function rowsNoHace(s) {
  return s.noHace
    .map(
      (v, i) => `<li class="row row--single">
        ${input(`noHace.${i}`, `Qué NO hace ${i + 1}`, ph('noHace', i) ?? 'otra cosa que va a "después"', v)}
        <span class="row__tools">${s.noHace.length > 1 ? removeBtn('noHace', i, `Quitar la fila ${i + 1}`) : ''}</span>
      </li>`,
    )
    .join('');
}

function rowsEscenarios(s) {
  return s.escenarios
    .map((e, i) => {
      const n = i + 1;
      const p = (j, fallback) => {
        const ex = ph('escenarios', i, j);
        return ex ? `${fallback} (ej.: ${ex})` : fallback;
      };
      return `<li class="row row--esc">
        <span class="row__n" aria-hidden="true">${n}</span>
        ${input(`escenarios.${i}.quien`, `Escenario ${n}: cuando quién`, p(0, 'Cuando… quién'), e.quien)}
        ${input(`escenarios.${i}.hace`, `Escenario ${n}: hace qué`, p(1, 'hace…'), e.hace)}
        <span class="row__joint" aria-hidden="true">→</span>
        ${input(`escenarios.${i}.pasa`, `Escenario ${n}: pasa qué`, p(2, 'pasa…'), e.pasa)}
        <span class="row__tools">${s.escenarios.length > 1 ? removeBtn('escenarios', i, `Quitar el escenario ${n}`) : ''}</span>
      </li>`;
    })
    .join('');
}

function blockBody(b, s) {
  const add = (key) =>
    `<button class="btn btn--quiet btn--sm add-row" type="button" data-add="${key}" ${s[key].length >= LIMITS[key] ? 'disabled' : ''}>${ICONS.plus}${ADD_LABEL[key]}</button>`;
  switch (b.key) {
    case 'paraQuien':
      return `<label class="sr-only" for="f-paraQuien">Para quién y qué problema</label>
        <textarea class="textarea" id="f-paraQuien" data-path="paraQuien" rows="3" maxlength="2000" placeholder="${esc(PH.paraQuien)}">${esc(s.paraQuien)}</textarea>`;
    case 'acciones':
      return `<ul class="rows rows--pair">${rowsAcciones(s)}</ul>${add('acciones')}`;
    case 'guarda':
      return `<ul class="rows rows--pair">${rowsPair(s, 'guarda', 'cosa', 'datos', ':', ['Cosa', 'Datos de la cosa', 'Cosa', 'sus datos'])}</ul>${add('guarda')}`;
    case 'roles':
      return `<ul class="rows rows--pair">${rowsPair(s, 'roles', 'rol', 'puede', ':', ['Rol', 'Qué ve y qué puede hacer el rol', 'Rol', 'qué ve y qué puede hacer'])}</ul>${add('roles')}`;
    case 'noHace':
      return `<ul class="rows">${rowsNoHace(s)}</ul>${add('noHace')}`;
    case 'escenarios':
      return `<ul class="rows rows--esc">${rowsEscenarios(s)}</ul>${add('escenarios')}`;
    case 'pantallas':
      return `<ul class="rows rows--pair">${rowsPair(s, 'pantallas', 'pantalla', 'muestra', ':', ['Pantalla', 'Qué muestra la pantalla', 'Pantalla', 'qué muestra'])}</ul>${add('pantallas')}`;
    default:
      return '';
  }
}

// ── Model path helpers ("acciones.2.rol") ──

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) cur = cur[/^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i]];
  const last = parts.at(-1);
  cur[/^\d+$/.test(last) ? Number(last) : last] = value;
}

const blockTouched = (s, n) => (n === 0 ? !!s.nombre.trim() : hasContentInBlocks(s, [n]));

// ── Output highlighting ──

function highlight(message) {
  const cabLines = CABECERA.split('\n').length;
  return message
    .split('\n')
    .map((line, i) => {
      if (i < cabLines) return `<span class="cab">${esc(line)}</span>`;
      const html = esc(line).replace(/\[[^\]\n]*\]/g, (m) => `<span class="gap">${m}</span>`);
      return line.startsWith('#') ? `<span class="hd">${html}</span>` : html;
    })
    .join('\n');
}

export function initBuilder() {
  const stored = readJSON(KEYS.spec, null);
  let spec = normalizeSpec(stored?.spec);
  let adivinoOpen = false;
  let lastCount = -1;

  const form = $('spec-form');
  const blocksEl = $('blocks');
  const out = $('spec-out');
  const adivinoEl = $('adivino');
  const liveEl = $('adivino-live');
  const savedEl = $('spec-saved');
  const statusEl = $('spec-status');
  const nameInput = $('spec-nombre');

  const save = debounce(() => {
    const ok = writeJSON(KEYS.spec, { v: 1, spec, savedAt: new Date().toISOString() });
    savedEl.textContent = ok
      ? 'Guardado en este navegador'
      : 'No se pudo guardar en este navegador: copia o descarga tu spec.';
  }, 300);

  function renderBlocks() {
    nameInput.value = spec.nombre;
    blocksEl.innerHTML = BLOCKS.map(
      (b) => `
      <section class="block" id="b-${b.n}" aria-labelledby="b-${b.n}-t">
        <header class="block__head">
          <span class="block__n" aria-hidden="true">${b.n}</span>
          <h3 class="block__title" id="b-${b.n}-t"><span class="sr-only">Bloque ${b.n}: </span>${esc(b.title)}${b.optional ? '<small>opcional</small>' : ''}</h3>
          <span class="badge block__state" data-state="${b.n}"></span>
        </header>
        <p class="block__guide">${esc(b.guide)}</p>
        <div class="block__body">
          ${blockBody(b, spec)}
          <ul class="hints" data-hints="${b.n}"></ul>
        </div>
      </section>`,
    ).join('');
  }

  function renderOutputs() {
    const hints = adivino(spec);
    const by = hintsByBlock(hints);

    for (let n = 0; n <= 7; n += 1) {
      const touched = blockTouched(spec, n);
      const list = form.querySelector(`[data-hints="${n}"]`);
      // Inline hints only once the student has written something in the block;
      // the summary panel lists everything from the start.
      list.innerHTML = touched ? by[n].map((h) => `<li class="hint">${esc(h.text)}</li>`).join('') : '';
      const badge = form.querySelector(`[data-state="${n}"]`);
      if (!badge) continue;
      const optional = BLOCKS[n - 1].optional;
      badge.className = 'badge block__state';
      if (!touched) {
        badge.textContent = optional ? 'Opcional' : 'Por llenar';
      } else if (by[n].length) {
        badge.classList.add('is-hint');
        badge.textContent = `${by[n].length} ${by[n].length === 1 ? 'pista' : 'pistas'}`;
      } else {
        badge.classList.add('is-ok');
        badge.textContent = 'Listo';
      }
    }

    const n = hints.length;
    adivinoEl.innerHTML = n
      ? `<details class="adivino"${adivinoOpen ? ' open' : ''}>
          <summary class="adivino__sum"><span class="adivino__dot" aria-hidden="true"></span>La IA tendría que adivinar ${n} ${n === 1 ? 'cosa' : 'cosas'}</summary>
          <ul class="adivino__list">${hints
            .map((h) => `<li><a href="#${h.block ? `b-${h.block}` : 'spec-nombre'}"><b>${h.block ? `Bloque ${h.block}` : 'Nombre'}</b><span>${esc(h.text)}</span></a></li>`)
            .join('')}</ul>
        </details>`
      : `<div class="adivino is-ok"><p class="adivino__sum"><span class="adivino__dot" aria-hidden="true"></span>Pasa la prueba del adivino: nada que adivinar.</p></div>`;

    if (hints.length !== lastCount) {
      liveEl.textContent = hints.length
        ? `Prueba del adivino: la IA tendría que adivinar ${hints.length} ${hints.length === 1 ? 'cosa' : 'cosas'}.`
        : 'Prueba del adivino: nada que adivinar.';
      lastCount = hints.length;
    }

    out.innerHTML = highlight(firstMessage(spec));
  }

  function changed({ structure = false } = {}) {
    if (structure) renderBlocks();
    renderOutputs();
    save();
  }

  // ── Events ──

  form.addEventListener('input', (e) => {
    const path = e.target.dataset.path;
    if (!path) return;
    setPath(spec, path, e.target.value);
    changed();
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  // "toggle" does not bubble: listen in the capture phase on the stable wrapper.
  adivinoEl.addEventListener(
    'toggle',
    (e) => {
      adivinoOpen = e.target.open;
    },
    true,
  );

  form.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    const del = e.target.closest('[data-remove]');
    const later = e.target.closest('[data-later]');
    if (add) {
      const key = add.dataset.add;
      if (spec[key].length >= LIMITS[key]) return;
      spec[key].push(NEW_ROW[key]());
      changed({ structure: true });
      const i = spec[key].length - 1;
      form.querySelector(`[data-path^="${key}.${i}"]`)?.focus();
    } else if (del) {
      const [key, i] = del.dataset.remove.split('.');
      spec[key].splice(Number(i), 1);
      changed({ structure: true });
      const next = form.querySelector(`[data-path^="${key}.${Math.max(0, Number(i) - 1)}"]`);
      next?.focus();
    } else if (later) {
      // "Si la lista de acciones pasa de cinco, lo que sobra baja a esta lista."
      const i = Number(later.dataset.later);
      const [a] = spec.acciones.splice(i, 1);
      const text = a.accion.trim() ? `no permite ${a.accion.trim().replace(/^puede\s+/i, '')}` : '';
      const emptyAt = spec.noHace.findIndex((v) => !v.trim());
      if (text) {
        if (emptyAt >= 0) spec.noHace[emptyAt] = text;
        else if (spec.noHace.length < LIMITS.noHace) spec.noHace.push(text);
      }
      changed({ structure: true });
      toast(text ? 'La acción bajó a «Qué NO hace»: va a «después».' : 'Acción quitada.');
      form.querySelector('[data-path^="acciones.0"]')?.focus();
    }
  });

  // Copy, download, reset
  const copyBtn = $('spec-copy');
  let copyTimer;
  copyBtn.addEventListener('click', async () => {
    const ok = await copyText(firstMessage(spec));
    const n = adivino(spec).length;
    if (ok) {
      copyBtn.classList.add('is-done');
      copyBtn.querySelector('[data-label]').textContent = 'Copiado';
      copyBtn.querySelector('[data-icon]').innerHTML = ICONS.check;
      statusEl.textContent = n
        ? `Copiado. Ojo: la IA todavía tendría que adivinar ${n} ${n === 1 ? 'cosa' : 'cosas'}. Puedes ajustarlas antes de pegarlo.`
        : 'Copiado. Pégalo en Lovable en el bloque 5.';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyBtn.classList.remove('is-done');
        copyBtn.querySelector('[data-label]').textContent = 'Copiar primer mensaje';
        copyBtn.querySelector('[data-icon]').innerHTML = ICONS.copy;
      }, 2500);
    } else {
      statusEl.textContent = 'No se pudo copiar. Selecciona el texto del recuadro y cópialo a mano.';
      const range = document.createRange();
      range.selectNodeContents(out);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  $('spec-download').addEventListener('click', () => {
    downloadText(`spec-v1-${specSlug(spec)}.md`, firstMessage(spec));
    statusEl.textContent = 'Descargado como archivo .md.';
  });

  const resetBtn = $('spec-reset');
  const confirmBox = $('spec-reset-confirm');
  const closeConfirm = (focus = true) => {
    confirmBox.hidden = true;
    resetBtn.setAttribute('aria-expanded', 'false');
    if (focus) resetBtn.focus();
  };
  resetBtn.addEventListener('click', () => {
    const open = confirmBox.hidden;
    confirmBox.hidden = !open;
    resetBtn.setAttribute('aria-expanded', String(open));
    if (open) $('spec-reset-no').focus();
  });
  $('spec-reset-no').addEventListener('click', () => closeConfirm());
  $('spec-reset-yes').addEventListener('click', () => {
    spec = emptySpec();
    remove(KEYS.spec);
    renderBlocks();
    renderOutputs();
    closeConfirm(false);
    savedEl.textContent = '';
    statusEl.textContent = 'Spec borrada. Empieza por el nombre.';
    nameInput.focus();
  });
  confirmBox.addEventListener('keydown', (e) => e.key === 'Escape' && closeConfirm());

  // ── Boot ──
  renderBlocks();
  renderOutputs();
  if (stored?.savedAt) savedEl.textContent = 'Guardado en este navegador';

  return {
    getSpec: () => spec,
    hasWork: () => hasContentInBlocks(spec, [1, 2, 3]),
    /** Menu → blocks 1–3 (and the name, if empty), then go to #spec. */
    applyMenu(row) {
      spec = prefillFromMenu(spec, row);
      changed({ structure: true });
      save.flush();
      const section = $('spec');
      section.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      for (const n of [1, 2, 3]) {
        const el = $(`b-${n}`);
        el.classList.remove('is-flash');
        void el.offsetWidth;
        el.classList.add('is-flash');
      }
      form.querySelector('[data-path="acciones.0.rol"]')?.focus({ preventScroll: true });
      statusEl.textContent = '';
      toast(`Bloques 1 a 3 llenos con «${row.proyecto}». Ahora escribe quién hace cada acción.`);
    },
    showFrase(frase) {
      const el = $('frase');
      if (!frase) {
        el.hidden = true;
        return;
      }
      el.innerHTML = `<b>Tu frase:</b> Quiero una app que ${esc(frase.que)} para ${esc(frase.para)}.`;
      el.hidden = false;
    },
  };
}
