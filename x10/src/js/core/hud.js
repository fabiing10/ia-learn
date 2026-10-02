// Persistent chrome: brand mark, current block, 10-segment progress (one per block).
export const BLOCKS = {
  0: { num: '00', name: 'Antes de empezar' },
  1: { num: '01', name: 'Apertura' },
  2: { num: '02', name: 'Entender' },
  3: { num: '03', name: 'Conceptos' },
  4: { num: '04', name: 'Mitos' },
  5: { num: '05', name: 'Discernir' },
  6: { num: '06', name: 'Investigar' },
  7: { num: '07', name: 'Multiplicar' },
  8: { num: '08', name: 'Crear' },
  9: { num: '09', name: 'Decidir' },
  10: { num: '+', name: 'Bloque opcional' },
};

export function blockOf(slide) {
  const own = slide?.dataset.block ?? slide?.parentElement?.dataset?.block;
  return Number(own ?? 0);
}

export function segbarHTML(block) {
  let html = '';
  for (let i = 0; i < 10; i++) {
    const cls = i < block ? 'is-done' : i === block ? 'is-current' : '';
    html += `<span class="segbar__seg ${cls}"><span class="segbar__fill"></span></span>`;
  }
  return html;
}

let hud;

export function mountHud(slidesEl) {
  hud = document.createElement('div');
  hud.className = 'hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `
    <div class="hud__mark brandmark"><span class="times">×</span>10</div>
    <div class="hud__block"><span class="hud__num"></span><span class="hud__name"></span></div>
    <div class="hud__bar segbar"></div>`;
  slidesEl.appendChild(hud);
  // Separator slides carry a large version of the same bar
  document.querySelectorAll('[data-segbar]').forEach((el) => {
    el.classList.add('segbar');
    el.innerHTML = segbarHTML(blockOf(el.closest('section')));
  });
}

export function updateHud(slide) {
  if (!hud) return;
  const block = blockOf(slide);
  const info = BLOCKS[block] || BLOCKS[0];
  hud.classList.toggle('is-off', slide.dataset.hud === 'off');
  hud.querySelector('.hud__num').textContent = info.num;
  hud.querySelector('.hud__name').textContent = info.name;
  hud.querySelector('.hud__bar').innerHTML = segbarHTML(Math.min(block, 9 + (block > 9 ? 1 : 0)));
}
