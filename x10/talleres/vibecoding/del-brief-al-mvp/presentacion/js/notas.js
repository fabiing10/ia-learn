// Facilitator notes for a deck that participants also open (generic; can move
// to src/js/slides/).
//
// The note lives twice in a slide:
//   <aside class="notes">…</aside>                 Reveal speaker view (key S)
//   <button data-notas-toggle aria-controls="x">   visible toggle
//   <div class="notas" id="x">…</div>              shown while html.show-notas
// Key N or any toggle button shows/hides every .notas at once. N is caught
// before Reveal sees it (Reveal would otherwise move to the next slide).
const root = document.documentElement;

function setShown(on) {
  root.classList.toggle('show-notas', on);
  document.querySelectorAll('[data-notas-toggle]').forEach((b) => b.setAttribute('aria-expanded', String(on)));
}

const toggle = () => setShown(!root.classList.contains('show-notas'));

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-notas-toggle]');
  if (!btn) return;
  e.stopPropagation();
  toggle();
});

const typing = (el) => el?.isContentEditable || /^(input|textarea|select)$/i.test(el?.tagName || '');

window.addEventListener(
  'keydown',
  (e) => {
    if (e.key !== 'n' && e.key !== 'N') return;
    if (e.ctrlKey || e.metaKey || e.altKey || typing(document.activeElement)) return;
    e.stopPropagation();
    e.preventDefault();
    toggle();
  },
  true,
);
