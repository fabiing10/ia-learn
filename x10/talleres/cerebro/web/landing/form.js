// The profile form: the eight fields of §6.3, rendered from the catalog with
// native radios and checkboxes (keyboard and screen readers for free). Each
// field shows which files it feeds, from the same map the generator is tested on.

import { AREAS, CONFIDENCIALIDAD, HERRAMIENTAS, MAX_TAREAS, POSICIONES, ROLES, TAREAS, TONOS } from '../shared/catalog.js';
import { CAMPOS, normalizeProfile } from '../shared/generator.js';
import { esc, reducedMotion } from '../shared/ui.js';

const short = (file) => file.replace(/\.md$/, '');

function feeds(campo) {
  const { archivos } = CAMPOS.find((c) => c.id === campo);
  return `<p class="feeds" id="f-${campo}-feeds"><span class="sr-only">Alimenta</span><span class="feeds__arrow" aria-hidden="true">→</span>${archivos
    .map((a) => `<code>${short(a)}</code>`)
    .join('')}</p>`;
}

const legend = (n, text) => `<legend class="field__label"><span class="field__n" aria-hidden="true">${String(n).padStart(2, '0')}</span>${text}</legend>`;

const chips = (name, type, list) =>
  `<div class="chips">${list
    .map(
      (o) =>
        `<label class="chip"><input class="chip__input" type="${type}" name="${name}" value="${o.id}" /><span class="chip__box">${esc(o.label)}</span></label>`,
    )
    .join('')}</div>`;

const cards = (name, list, desc) =>
  `<div class="cards">${list
    .map(
      (o) =>
        `<label class="card"><input class="card__input" type="radio" name="${name}" value="${o.id}" /><span class="card__box"><span class="card__title">${esc(
          o.corto || o.label,
        )}</span><span class="card__desc">${esc(desc(o))}</span></span></label>`,
    )
    .join('')}</div>`;

function template() {
  return `
  <div class="field" data-campo="nombre">
    <label class="field__label" for="f-nombre"><span class="field__n" aria-hidden="true">01</span>¿Cómo quieres que la IA te llame?</label>
    ${feeds('nombre')}
    <input class="input" id="f-nombre" name="nombre" type="text" maxlength="60" autocomplete="given-name" autocapitalize="words" spellcheck="false" placeholder="Ej.: Laura" aria-describedby="f-nombre-feeds f-nombre-h" />
    <p class="field__hint" id="f-nombre-h">Opcional. Va en el saludo del bloque de sistema y en la portada del README.</p>
  </div>

  <div class="field" data-campo="ciudad">
    <label class="field__label" for="f-ciudad"><span class="field__n" aria-hidden="true">02</span>¿En qué ciudad ejerces?</label>
    ${feeds('ciudad')}
    <input class="input" id="f-ciudad" name="ciudad" type="text" maxlength="40" autocomplete="address-level2" autocapitalize="words" spellcheck="false" placeholder="Ej.: Medellín" aria-describedby="f-ciudad-feeds f-ciudad-h" />
    <p class="field__hint" id="f-ciudad-h">Opcional. Sin ella, la IA te pregunta la ciudad cada vez que un foro o un juzgado dependa de eso.</p>
  </div>

  <fieldset class="field" data-campo="rol" aria-describedby="f-rol-feeds f-rol-h">
    ${legend(3, 'Tu rol principal')}
    ${feeds('rol')}
    ${chips('rol', 'radio', ROLES)}
    <p class="field__hint" id="f-rol-h" aria-live="polite"></p>
  </fieldset>

  <fieldset class="field" data-campo="areas" aria-describedby="f-areas-feeds f-areas-h">
    ${legend(4, 'Tus áreas de práctica')}
    ${feeds('areas')}
    ${chips('areas', 'checkbox', AREAS)}
    <p class="field__hint" id="f-areas-h">Todas las que apliquen. Cada área trae su semilla de normas a <code>03_FUENTES</code>.</p>
  </fieldset>

  <fieldset class="field" data-campo="tareas" aria-describedby="f-tareas-feeds f-tareas-h">
    ${legend(5, 'Las tareas que más tiempo te quitan')}
    ${feeds('tareas')}
    ${chips('tareas', 'checkbox', TAREAS)}
    <p class="field__hint" id="f-tareas-h">Hasta tres. Cada una se vuelve una skill en <code>02_PLAYBOOK</code>. <b class="count" id="f-tareas-count"></b></p>
    <p class="field__warn" id="f-tareas-warn" role="status"></p>
  </fieldset>

  <fieldset class="field" data-campo="herramientas" aria-describedby="f-herramientas-feeds f-herramientas-h">
    ${legend(6, 'La IA que usas hoy')}
    ${feeds('herramientas')}
    ${chips('herramientas', 'checkbox', HERRAMIENTAS)}
    <p class="field__hint" id="f-herramientas-h">Sus rutas de carga salen primero en el README.</p>
  </fieldset>

  <fieldset class="field" data-campo="confidencialidad" aria-describedby="f-confidencialidad-feeds">
    ${legend(7, 'Qué tan sensible es lo que manejas')}
    ${feeds('confidencialidad')}
    ${cards('confidencialidad', CONFIDENCIALIDAD, (o) => o.que)}
  </fieldset>

  <fieldset class="field" data-campo="tono" aria-describedby="f-tono-feeds">
    ${legend(8, 'Cómo quieres que te responda')}
    ${feeds('tono')}
    ${cards('tono', TONOS, (o) => o.formato)}
  </fieldset>

  <div class="field" data-campo="nuncaDelego">
    <label class="field__label" for="f-nunca"><span class="field__n" aria-hidden="true">09</span>Una decisión que nunca delegarías</label>
    ${feeds('nuncaDelego')}
    <textarea class="textarea" id="f-nunca" name="nuncaDelego" rows="2" maxlength="280" aria-describedby="f-nuncaDelego-feeds f-nunca-h"></textarea>
    <p class="field__hint" id="f-nunca-h">Opcional. Va de primera en «Lo que nunca delego»; debajo, la de tu rol.</p>
  </div>

  <fieldset class="field field--criterio" data-campo="posiciones" aria-describedby="f-posiciones-feeds f-posiciones-h" hidden>
    ${legend(10, 'Tu criterio en contratos')}
    ${feeds('posiciones')}
    <p class="field__hint" id="f-posiciones-h">Lo que ningún buscador sabe de ti. Cada respuesta reescribe una fila de tu tabla de posiciones; la primera opción es la práctica común.</p>
    ${POSICIONES.map(
      (pos) => `<div class="subfield" role="group" aria-labelledby="f-pos-${pos.id}-l">
      <p class="subfield__label" id="f-pos-${pos.id}-l">${esc(pos.label)}</p>
      ${chips(`pos-${pos.id}`, 'radio', pos.opciones)}
    </div>`,
    ).join('')}
  </fieldset>`;
}

/**
 * Renders the form into `form`. `onChange(campo, profile, { typing })` fires on
 * every edit; `onFocusField(campo | null)` when a field gains or loses focus.
 */
export function mountForm(form, { onChange, onFocusField }) {
  form.innerHTML = template();
  const $ = (sel) => form.querySelector(sel);
  const inputs = (name) => [...form.querySelectorAll(`input[name="${name}"]`)];
  const checked = (name) => inputs(name).filter((i) => i.checked).map((i) => i.value);
  const value = (name) => checked(name)[0] ?? null;

  const read = () =>
    normalizeProfile({
      nombre: $('#f-nombre').value,
      ciudad: $('#f-ciudad').value,
      rol: value('rol'),
      areas: checked('areas'),
      tareas: checked('tareas'),
      herramientas: checked('herramientas'),
      confidencialidad: value('confidencialidad'),
      tono: value('tono'),
      nuncaDelego: $('#f-nunca').value,
      posiciones: Object.fromEntries(POSICIONES.map((pos) => [pos.id, value(`pos-${pos.id}`)])),
    });

  // Live hints that depend on the current values.
  function sync() {
    const rol = ROLES.find((r) => r.id === value('rol'));
    $('#f-rol-h').innerHTML = rol
      ? `La IA te va a describir como <b>${esc(rol.sistema)}</b>.`
      : 'Sin rol, la IA te describe solo como abogado/a.';
    $('#f-nunca').placeholder = `Ej.: ${(rol || ROLES[0]).nuncaDelego}`;
    const n = checked('tareas').length;
    $('#f-tareas-count').textContent = `${n} de ${MAX_TAREAS}`;
    for (const i of inputs('tareas')) {
      const blocked = n >= MAX_TAREAS && !i.checked;
      i.setAttribute('aria-disabled', String(blocked));
      i.closest('.chip').classList.toggle('is-blocked', blocked);
    }
    if (n < MAX_TAREAS) $('#f-tareas-warn').textContent = '';
    // The positions only exist for the contracts skill.
    $('[data-campo="posiciones"]').hidden = !checked('tareas').includes('contratos');
  }

  form.addEventListener('change', (e) => {
    const input = e.target;
    const campo = input.closest('[data-campo]')?.dataset.campo;
    if (!campo || campo === 'nombre' || campo === 'ciudad' || campo === 'nuncaDelego') return;

    if (campo === 'tareas' && input.checked && checked('tareas').length > MAX_TAREAS) {
      input.checked = false;
      const warn = $('#f-tareas-warn');
      warn.textContent = 'Máximo tres tareas. Quita una para elegir otra.';
      const chip = input.closest('.chip');
      chip.classList.remove('is-nope');
      void chip.offsetWidth;
      chip.classList.add('is-nope');
      return;
    }
    if (campo === 'herramientas' && input.checked) {
      for (const i of inputs('herramientas')) {
        if (input.value === 'ninguna' ? i.value !== 'ninguna' : i.value === 'ninguna') i.checked = false;
      }
    }
    sync();
    onChange(campo, read(), { typing: false });
  });

  form.addEventListener('input', (e) => {
    const campo = e.target.closest('[data-campo]')?.dataset.campo;
    if (campo === 'nombre' || campo === 'ciudad' || campo === 'nuncaDelego') onChange(campo, read(), { typing: true });
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  form.addEventListener('focusin', (e) => onFocusField(e.target.closest('[data-campo]')?.dataset.campo ?? null));
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) onFocusField(null);
  });
  for (const f of form.querySelectorAll('[data-campo]')) {
    f.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && onFocusField(f.dataset.campo));
    f.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && onFocusField(null));
  }

  function set(profile) {
    const p = normalizeProfile(profile);
    $('#f-nombre').value = p.nombre;
    $('#f-ciudad').value = p.ciudad;
    $('#f-nunca').value = p.nuncaDelego;
    for (const pos of POSICIONES) {
      const chosen = p.posiciones[pos.id] ?? pos.opciones[0].id;
      for (const i of inputs(`pos-${pos.id}`)) i.checked = i.value === chosen;
    }
    for (const name of ['rol', 'confidencialidad', 'tono']) for (const i of inputs(name)) i.checked = i.value === p[name];
    for (const name of ['areas', 'tareas', 'herramientas']) for (const i of inputs(name)) i.checked = p[name].includes(i.value);
    $('#f-tareas-warn').textContent = '';
    sync();
  }

  /** Scrolls a field into view and focuses its first control (from the map). */
  function focusField(campo) {
    const f = form.querySelector(`[data-campo="${campo}"]`);
    if (!f) return;
    f.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    f.querySelector('input:checked, input, textarea')?.focus({ preventScroll: true });
  }

  return { set, read, focusField };
}
