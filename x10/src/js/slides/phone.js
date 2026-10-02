// S10: a phone keyboard autocompletes a sentence word by word, picking the
// most likely suggestion each time (bars are illustrative, not data).
import { gsap, defineCtrl } from '../core/motion.js';
import { state } from '../core/state.js';

const SENTENCE = 'Hola, ¿nos vemos mañana en la reunión?';

const STEPS = [
  { pick: 1, options: ['¿Cómo', 'Hola,', 'Buenas'], weights: [0.35, 0.8, 0.45] },
  { pick: 1, options: ['¿vamos', '¿nos', '¿te'], weights: [0.4, 0.85, 0.3] },
  { pick: 1, options: ['vamos', 'vemos', 'hablamos'], weights: [0.3, 0.9, 0.45] },
  { pick: 0, options: ['mañana', 'hoy', 'luego'], weights: [0.88, 0.4, 0.3] },
  { pick: 1, options: ['a', 'en', 'temprano'], weights: [0.45, 0.82, 0.25] },
  { pick: 0, options: ['la', 'el', 'casa'], weights: [0.86, 0.35, 0.3] },
  { pick: 2, options: ['tarde', 'iglesia', 'reunión'], weights: [0.4, 0.5, 0.84] },
];

function loop(slide) {
  const typed = slide.querySelector('[data-typed]');
  const sent = slide.querySelector('[data-sent]');
  const chips = [...slide.querySelectorAll('[data-suggest] .chip')];
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
  let text = '';

  tl.call(() => {
    text = '';
    typed.textContent = '';
    gsap.set(sent, { autoAlpha: 0, y: 20 });
  });

  STEPS.forEach((step, i) => {
    const at = 0.3 + i * 1.05;
    tl.call(() => {
      chips.forEach((chip, k) => {
        chip.classList.remove('is-pick');
        chip.querySelector('b').textContent = step.options[k];
        chip.style.setProperty('--p', '0');
      });
    }, null, at);
    tl.call(() => chips.forEach((chip, k) => chip.style.setProperty('--p', String(step.weights[k]))), null, at + 0.15);
    tl.call(() => chips[step.pick].classList.add('is-pick'), null, at + 0.6);
    tl.call(() => {
      text += (text ? ' ' : '') + step.options[step.pick];
      typed.textContent = text + (i === STEPS.length - 1 ? '?' : '');
    }, null, at + 0.85);
  });

  const end = 0.3 + STEPS.length * 1.05 + 0.4;
  tl.call(() => {
    sent.textContent = typed.textContent;
    typed.textContent = '';
    chips.forEach((c) => {
      c.classList.remove('is-pick');
      c.style.setProperty('--p', '0');
    });
  }, null, end);
  tl.fromTo(sent, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, end);
  tl.to({}, { duration: 2.2 });
  return tl;
}

function still(slide) {
  const sent = slide.querySelector('[data-sent]');
  sent.textContent = SENTENCE;
  gsap.set(sent, { autoAlpha: 1 });
}

function keys(slide) {
  const box = slide.querySelector('.phone__keys');
  if (!box || box.children.length) return;
  const rows = ['k'.repeat(10), 'h' + 'k'.repeat(9) + 'h', 'k'.repeat(10), 's'];
  box.innerHTML = rows
    .join('')
    .split('')
    .map((c) => (c === 'h' ? '<i class="is-half"></i>' : c === 's' ? '<i class="is-space"></i>' : '<i></i>'))
    .join('');
}

defineCtrl('phone', {
  build: keys,
  enter(slide) {
    // Reduced motion: show the finished sentence, no loop.
    if (state.reduced) still(slide);
    else loop(slide);
  },
  print: still,
});
