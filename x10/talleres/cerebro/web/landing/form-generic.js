// The form of the general cerebros (skill, ideación), rendered from the field
// schema of cerebros.js with native inputs, radios and checkboxes and the same
// classes as form.js, so both look and behave alike. Each field shows which files
// it feeds, from the map the generator is tested on. `lines` fields are a textarea
// read as one item per line; a `switch` is one native checkbox with role="switch"
// (its checked state is the aria-checked the reader hears), read as a boolean.

import { nombreCorto } from '../shared/cerebros.js';
import { esc, reducedMotion } from '../shared/ui.js';

const TYPING = new Set(['text', 'textarea', 'lines']);

/** Escaped hint text with file names (references/material.md) as code. */
const hintHtml = (s) => esc(s).replace(/\b[\w-]+(?:\/[\w-]+)*\.md\b/g, '<code>$&</code>');

/**
 * Renders `cerebro.campos` into `form`. `onChange(campo, profile, { typing })` fires
 * on every edit and `onFocusField(campo | null)` when a field gains or loses focus;
 * `campo` is the map node the field feeds (both example fields feed «ejemplo»).
 */
export function mountGenericForm(form, { cerebro, onChange, onFocusField }) {
  const { campos, mapa, normalize } = cerebro;
  const fid = (id) => `f-${cerebro.id}-${id}`;
  const nodo = (f) => f.mapa ?? f.id;

  function feeds(f) {
    const { archivos } = mapa.find((m) => m.id === nodo(f));
    return `<p class="feeds" id="${fid(f.id)}-feeds"><span class="sr-only">Alimenta</span><span class="feeds__arrow" aria-hidden="true">→</span>${archivos
      .map((a) => `<code>${esc(nombreCorto(a))}</code>`)
      .join('')}</p>`;
  }

  const numero = (f) => `<span class="field__n" aria-hidden="true">${String(f.n).padStart(2, '0')}</span>`;
  const hintText = (f) => [f.opcional ? 'Opcional.' : '', f.hint || ''].filter(Boolean).join(' ');
  const hint = (f) => (hintText(f) ? `<p class="field__hint" id="${fid(f.id)}-h">${hintHtml(hintText(f))}</p>` : '');
  const describedBy = (f) => [`${fid(f.id)}-feeds`, hintText(f) ? `${fid(f.id)}-h` : ''].filter(Boolean).join(' ');

  const chips = (f, type) =>
    `<div class="chips">${f.opciones
      .map(
        (o) =>
          `<label class="chip"><input class="chip__input" type="${type}" name="${f.id}" value="${o.id}" /><span class="chip__box">${esc(o.label)}</span></label>`,
      )
      .join('')}</div>`;

  const cards = (f) =>
    `<div class="cards">${f.opciones
      .map(
        (o) =>
          `<label class="card"><input class="card__input" type="radio" name="${f.id}" value="${o.id}" /><span class="card__box"><span class="card__title">${esc(
            o.label,
          )}</span><span class="card__desc">${esc(o.desc)}</span></span></label>`,
      )
      .join('')}</div>`;

  function control(f) {
    const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
    const max = f.max ? ` maxlength="${f.max}"` : '';
    const aria = ` aria-describedby="${describedBy(f)}"`;
    if (f.tipo === 'text') {
      const name = f.autocomplete === 'given-name' ? ' autocapitalize="words" spellcheck="false"' : '';
      return `<input class="input" id="${fid(f.id)}" name="${f.id}" type="text"${max} autocomplete="${f.autocomplete || 'off'}"${name}${ph}${aria} />`;
    }
    return `<textarea class="textarea" id="${fid(f.id)}" name="${f.id}" rows="${f.rows || 3}"${max}${ph}${aria}></textarea>`;
  }

  // One on/off option, unnumbered: the chip is its label, with a track for a dot.
  const sw = (f) => `<div class="field field--switch" data-campo="${nodo(f)}">
    <label class="chip chip--switch"><input class="chip__input" id="${fid(f.id)}" name="${f.id}" type="checkbox" role="switch" aria-describedby="${describedBy(f)}" /><span class="chip__box">${esc(f.label)}</span></label>
    ${feeds(f)}
    ${hint(f)}
  </div>`;

  function field(f) {
    if (f.tipo === 'switch') return sw(f);
    if (TYPING.has(f.tipo)) {
      return `<div class="field" data-campo="${nodo(f)}">
    <label class="field__label" for="${fid(f.id)}">${numero(f)}${esc(f.label)}</label>
    ${feeds(f)}
    ${control(f)}
    ${hint(f)}
  </div>`;
    }
    const body = f.tipo === 'cards' ? cards(f) : chips(f, f.tipo === 'checkbox' ? 'checkbox' : 'radio');
    return `<fieldset class="field" data-campo="${nodo(f)}" aria-describedby="${describedBy(f)}">
    <legend class="field__label">${numero(f)}${esc(f.label)}</legend>
    ${feeds(f)}
    ${body}
    ${hint(f)}
  </fieldset>`;
  }

  form.innerHTML = campos.map(field).join('\n');

  const inputs = (name) => [...form.querySelectorAll(`input[name="${name}"]`)];
  const checked = (name) => inputs(name).filter((i) => i.checked).map((i) => i.value);
  const control$ = (f) => form.querySelector(`#${fid(f.id)}`);
  const campoDe = (el) => campos.find((f) => f.id === el?.name) ?? null;

  function read() {
    const raw = {};
    for (const f of campos) {
      if (f.tipo === 'lines') raw[f.id] = control$(f).value.split('\n');
      else if (TYPING.has(f.tipo)) raw[f.id] = control$(f).value;
      else if (f.tipo === 'switch') raw[f.id] = control$(f).checked;
      else if (f.tipo === 'checkbox') raw[f.id] = checked(f.id);
      else raw[f.id] = checked(f.id)[0] ?? null;
    }
    return normalize(raw);
  }

  form.addEventListener('change', (e) => {
    const input = e.target;
    const f = campoDe(input);
    if (!f || TYPING.has(f.tipo)) return;
    // «Ninguna» excludes the rest, as in the legal form.
    if (f.id === 'herramientas' && input.checked) {
      for (const i of inputs('herramientas')) {
        if (input.value === 'ninguna' ? i.value !== 'ninguna' : i.value === 'ninguna') i.checked = false;
      }
    }
    onChange(nodo(f), read(), { typing: false });
  });

  form.addEventListener('input', (e) => {
    const f = campoDe(e.target);
    if (f && TYPING.has(f.tipo)) onChange(nodo(f), read(), { typing: true });
  });

  form.addEventListener('submit', (e) => e.preventDefault());

  form.addEventListener('focusin', (e) => onFocusField(e.target.closest('[data-campo]')?.dataset.campo ?? null));
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) onFocusField(null);
  });
  for (const el of form.querySelectorAll('[data-campo]')) {
    el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && onFocusField(el.dataset.campo));
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && onFocusField(null));
  }

  function set(profile) {
    const p = normalize(profile);
    for (const f of campos) {
      if (f.tipo === 'lines') control$(f).value = p[f.id].join('\n');
      else if (TYPING.has(f.tipo)) control$(f).value = p[f.id] ?? '';
      else if (f.tipo === 'switch') control$(f).checked = p[f.id] === true;
      else if (f.tipo === 'checkbox') for (const i of inputs(f.id)) i.checked = p[f.id].includes(i.value);
      else for (const i of inputs(f.id)) i.checked = i.value === p[f.id];
    }
  }

  /** Scrolls a field into view and focuses its first control (from the map). */
  function focusField(campo) {
    const el = form.querySelector(`[data-campo="${campo}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    el.querySelector('input:checked, input, textarea')?.focus({ preventScroll: true });
  }

  return { set, read, focusField };
}
