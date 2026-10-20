// #antes — checklist del estudiante, saved in localStorage, with progress.

import { CHECKLIST } from '../shared/content.js';
import { KEYS, readJSON, writeJSON } from '../shared/store.js';
import { esc, debounce } from '../shared/ui.js';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function load() {
  const raw = readJSON(KEYS.antes, {});
  const checked = raw && typeof raw.checked === 'object' && raw.checked ? raw.checked : {};
  return {
    checked: Object.fromEntries(CHECKLIST.map((c) => [c.id, checked[c.id] === true])),
    que: typeof raw?.que === 'string' ? raw.que.slice(0, 200) : '',
    para: typeof raw?.para === 'string' ? raw.para.slice(0, 200) : '',
  };
}

/** Links the site name inside the detail text (lovable.dev, github.com, claude.ai). */
function detailHtml(item) {
  const text = esc(item.detail);
  if (!item.href) return text;
  const host = new URL(item.href).hostname;
  return text.replace(
    esc(host),
    `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">${esc(host)}</a>`,
  );
}

export function initAntes({ onFrase } = {}) {
  const state = load();
  const list = document.getElementById('checklist');
  const save = debounce(() => writeJSON(KEYS.antes, state), 200);

  list.innerHTML = CHECKLIST.map((item) => {
    const id = `antes-${item.id}`;
    const frase =
      item.id === 'frase'
        ? `<div class="frase-form" role="group" aria-label="Mi frase">
            <label for="frase-que">Quiero una app que</label>
            <input class="input" id="frase-que" data-frase="que" type="text" maxlength="200" autocomplete="off" value="${esc(state.que)}" />
            <label for="frase-para">para</label>
            <input class="input" id="frase-para" data-frase="para" type="text" maxlength="200" autocomplete="off" value="${esc(state.para)}" />
          </div>`
        : '';
    return `
      <li data-id="${item.id}" class="${state.checked[item.id] ? 'is-checked' : ''}">
        <input class="check" type="checkbox" id="${id}" data-check="${item.id}" ${state.checked[item.id] ? 'checked' : ''} aria-describedby="${id}-d" />
        <div>
          <label class="checklist__label" for="${id}">${esc(capitalize(item.text))}${item.optional ? '<span class="badge">Opcional</span>' : ''}</label>
          <p class="checklist__detail" id="${id}-d">${detailHtml(item)}</p>
          ${frase}
        </div>
      </li>`;
  }).join('');

  const progress = document.getElementById('antes-progress');
  const progressText = document.getElementById('antes-progress-text');
  const bar = document.getElementById('antes-progress-bar');

  function renderProgress() {
    const required = CHECKLIST.filter((c) => !c.optional);
    const done = required.filter((c) => state.checked[c.id]).length;
    const optional = CHECKLIST.filter((c) => c.optional);
    const optDone = optional.every((c) => state.checked[c.id]);
    const all = done === required.length;
    progress.classList.toggle('is-done', all);
    bar.style.setProperty('--p', `${(done / required.length) * 100}%`);
    progressText.innerHTML = all
      ? `Todo listo para la clase<small>${optDone ? 'incluido el opcional' : 'el opcional, cuando quieras'}</small>`
      : `${done} de ${required.length} listos<small>${optDone ? '+ el opcional' : ''}</small>`;
  }

  const fraseText = () => (state.que.trim() && state.para.trim() ? { que: state.que.trim(), para: state.para.trim() } : null);

  list.addEventListener('change', (e) => {
    const id = e.target.dataset.check;
    if (!id) return;
    state.checked[id] = e.target.checked;
    e.target.closest('li').classList.toggle('is-checked', e.target.checked);
    renderProgress();
    save.flush();
  });

  list.addEventListener('input', (e) => {
    const key = e.target.dataset.frase;
    if (!key) return;
    state[key] = e.target.value.slice(0, 200);
    onFrase?.(fraseText());
    save();
  });

  renderProgress();
  onFrase?.(fraseText());
}
