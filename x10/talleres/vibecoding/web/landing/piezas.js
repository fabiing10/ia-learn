// #cinco-piezas — hoja "Mi app en 5 piezas", one line per piece, saved locally.
// Dominio and repositorio start as "(hoy lo resuelve la herramienta)".

import { PIECES, LA_HERRAMIENTA } from '../shared/content.js';
import { KEYS, readJSON, writeJSON } from '../shared/store.js';
import { esc, debounce } from '../shared/ui.js';

function load() {
  const raw = readJSON(KEYS.piezas, {});
  const src = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(
    PIECES.map((p) => [p.id, typeof src[p.id] === 'string' ? src[p.id].slice(0, 300) : p.lahace ? LA_HERRAMIENTA : '']),
  );
}

export function initPiezas() {
  const state = load();
  const list = document.getElementById('piezas');
  const save = debounce(() => writeJSON(KEYS.piezas, state), 250);

  list.innerHTML = PIECES.map((p, i) => {
    const id = `pieza-${p.id}`;
    const tool = state[p.id] === LA_HERRAMIENTA;
    return `
      <li class="pieza">
        <div class="pieza__name">
          <span class="pieza__n" aria-hidden="true">0${i + 1}</span>
          <h3>${esc(p.name)}</h3>
          <p class="pieza__clase">${esc(p.clase)}</p>
        </div>
        <div class="pieza__dom">
          <p class="pieza__ej"><span class="pieza__lbl">En una app de domicilios: </span>${esc(p.domicilios)}</p>
          <p class="pieza__q">${esc(p.pregunta)}</p>
        </div>
        <div class="pieza__mine">
          <label class="pieza__lbl pieza__lbl--input" for="${id}">Mi app · ${esc(p.name)}</label>
          <input class="input${tool ? ' is-tool' : ''}" id="${id}" data-pieza="${p.id}" type="text" maxlength="300" autocomplete="off"
            value="${esc(state[p.id])}" placeholder="${p.lahace ? esc(LA_HERRAMIENTA) : 'Una línea para tu idea'}" />
        </div>
      </li>`;
  }).join('');

  list.addEventListener('input', (e) => {
    const id = e.target.dataset.pieza;
    if (!id) return;
    state[id] = e.target.value.slice(0, 300);
    e.target.classList.toggle('is-tool', state[id] === LA_HERRAMIENTA);
    save();
  });
}
