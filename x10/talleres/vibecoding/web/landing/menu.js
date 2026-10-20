// #menu — menú de proyectos. "Usar este proyecto" prefills blocks 1–3 of the
// spec builder; if those blocks already have text, it asks first, in the card.

import { MENU } from '../shared/content.js';
import { esc, ICONS } from '../shared/ui.js';

export function initMenu({ builder }) {
  const list = document.getElementById('menu-list');

  list.innerHTML = MENU.map(
    (m, i) => `
    <li>
      <article class="mcard" id="m-${m.id}" aria-labelledby="m-${m.id}-t">
        <span class="mcard__n" aria-hidden="true">0${i + 1}</span>
        <h3 id="m-${m.id}-t">${esc(m.proyecto)}</h3>
        <div><p class="mcard__k">Para quién</p><p class="mcard__v">${esc(m.paraQuien)}</p></div>
        <div><p class="mcard__k">Tres acciones de V1</p><ol>${m.acciones.map((a) => `<li>${esc(a.charAt(0).toUpperCase() + a.slice(1))}</li>`).join('')}</ol></div>
        <div><p class="mcard__k">Qué guarda</p><p class="mcard__v">${esc(m.guarda)}</p></div>
        <div class="mcard__foot">
          <button class="btn btn--primary btn--sm" type="button" data-use="${m.id}" aria-describedby="m-${m.id}-t">Usar este proyecto ${ICONS.arrow}</button>
          <div class="confirm" data-confirm="${m.id}" hidden>
            <p>Esto reemplaza lo que escribiste en los bloques 1 a 3 de tu spec. Lo demás se queda igual.</p>
            <div class="confirm__actions">
              <button class="btn btn--primary btn--sm" type="button" data-use-yes="${m.id}">Reemplazar</button>
              <button class="btn btn--ghost btn--sm" type="button" data-use-no="${m.id}">Cancelar</button>
            </div>
          </div>
        </div>
      </article>
    </li>`,
  ).join('');

  const confirmOf = (id) => list.querySelector(`[data-confirm="${id}"]`);
  const closeAll = () => list.querySelectorAll('[data-confirm]').forEach((c) => (c.hidden = true));

  function apply(id) {
    const row = MENU.find((m) => m.id === id);
    closeAll();
    list.querySelectorAll('.mcard').forEach((c) => c.classList.toggle('is-used', c.id === `m-${id}`));
    builder.applyMenu(row);
  }

  list.addEventListener('click', (e) => {
    const use = e.target.closest('[data-use]');
    const yes = e.target.closest('[data-use-yes]');
    const no = e.target.closest('[data-use-no]');
    if (use) {
      const id = use.dataset.use;
      if (builder.hasWork()) {
        closeAll();
        confirmOf(id).hidden = false;
        list.querySelector(`[data-use-no="${id}"]`).focus();
      } else {
        apply(id);
      }
    } else if (yes) {
      apply(yes.dataset.useYes);
    } else if (no) {
      const id = no.dataset.useNo;
      confirmOf(id).hidden = true;
      list.querySelector(`[data-use="${id}"]`).focus();
    }
  });

  list.addEventListener('keydown', (e) => {
    const box = e.target.closest('[data-confirm]');
    if (e.key === 'Escape' && box) {
      box.hidden = true;
      list.querySelector(`[data-use="${box.dataset.confirm}"]`).focus();
    }
  });
}
