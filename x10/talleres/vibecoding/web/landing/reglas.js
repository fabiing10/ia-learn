// #reglas — reglas de mesa, puntos de control, protocolo de error, qué no hacer.

import { REGLAS, PROTOCOLO, SEGURIDAD, CHECKPOINTS, FRASE_DATOS } from '../shared/content.js';
import { esc, copyText, toast, ICONS } from '../shared/ui.js';

const items = (list) => list.map((t) => `<li>${esc(t)}</li>`).join('');

export function initReglas() {
  document.getElementById('reglas-list').innerHTML = items(REGLAS);
  document.getElementById('protocolo-list').innerHTML = items(PROTOCOLO);
  document.getElementById('seguridad-list').innerHTML = items(SEGURIDAD);

  document.getElementById('puntos-list').innerHTML = CHECKPOINTS.map(
    (c) => `
      <li>
        <details class="punto">
          <summary><span class="punto__n">${c.n}</span><span>${esc(c.name)}</span></summary>
          <dl class="punto__body">
            <div><dt>Cómo se prueba</dt><dd>${esc(c.prueba)}</dd></div>
            <div><dt>Si falla</dt><dd>${esc(c.falla)}</dd></div>
            ${
              c.n === 3
                ? `<div class="frase-datos">
                    <q>${esc(FRASE_DATOS)}.</q>
                    <button class="btn btn--ghost btn--sm" type="button" data-copy-frase>${ICONS.copy}Copiar la frase</button>
                  </div>`
                : ''
            }
          </dl>
        </details>
      </li>`,
  ).join('');

  document.getElementById('puntos-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy-frase]');
    if (!btn) return;
    const ok = await copyText(`${FRASE_DATOS}.`);
    toast(ok ? 'Frase copiada. Pégala en Lovable tal cual.' : 'No se pudo copiar. Selecciónala y cópiala a mano.');
  });
}
