// Vibe Coding slide behaviours. Each one is decoration on top of content that is
// already readable: lite mode (key M, reduced motion, speaker view) and print
// show the final state.
import { gsap, defineCtrl } from '@engine/core/motion.js';
import { state } from '@engine/core/state.js';

/* V03 · the lazy prompt types itself in, fast enough to read under 800 ms */
defineCtrl('vc-type', {
  enter(slide, { lite }) {
    const el = slide.querySelector('[data-type]');
    if (!el || lite) return;
    const full = (el.dataset.full ??= el.textContent);
    const shown = { n: 0 };
    el.classList.add('is-typing');
    gsap.to(shown, {
      n: full.length,
      duration: 0.6,
      delay: 0.15,
      ease: 'none',
      onUpdate: () => (el.textContent = full.slice(0, Math.round(shown.n))),
      onComplete: () => el.classList.remove('is-typing'),
    });
  },
  leave(slide) {
    const el = slide.querySelector('[data-type]');
    if (el?.dataset.full) el.textContent = el.dataset.full;
    el?.classList.remove('is-typing');
  },
});

/* V11 · the delivery-app examples slide in row by row */
defineCtrl('vc-map', {
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    gsap.fromTo(
      frags,
      { x: -36, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity,visibility' },
    );
  },
});

/* V16 · every guess pops up around the prompt */
defineCtrl('vc-guess', {
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    frags
      .filter((f) => f.closest('.vc-guess__marks'))
      .forEach((f) =>
        gsap.fromTo(
          f,
          { scale: 0.6, rotate: -6, autoAlpha: 0 },
          { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(2)', clearProps: 'transform,opacity,visibility' },
        ),
      );
  },
});

/* V21 · the open box lifts its lid and shows the five pieces */
defineCtrl('vc-boxes', {
  enter(slide, { lite }) {
    if (lite) return;
    const open = slide.querySelector('.vc-box--open');
    gsap.fromTo(
      open.querySelector('.vc-box__lid'),
      { rotate: 0, y: 0 },
      { rotate: -18, y: -46, x: -20, duration: 0.9, ease: 'expo.out', delay: 0.5 },
    );
    gsap.fromTo(
      open.querySelectorAll('.vc-box__body i'),
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.06, delay: 0.7 },
    );
  },
});

/* Steps that light up one after another, in a loop, while the slide is on */
function cycle(slide, selector, hold = 1.1) {
  const items = [...slide.querySelectorAll(selector)];
  if (!items.length || state.lite) return;
  const tl = gsap.timeline({ repeat: -1, delay: 0.6 });
  items.forEach((item) => {
    tl.call(() => {
      items.forEach((i) => i.classList.toggle('is-active', i === item));
    });
    tl.to({}, { duration: hold });
  });
  return tl;
}

function clearActive(slide, selector) {
  slide.querySelectorAll(selector).forEach((i) => i.classList.remove('is-active'));
}

/* V25 · read → write → run → test → retry */
defineCtrl('vc-loop', {
  enter(slide) {
    cycle(slide, '.vc-loop li', 0.9);
  },
  leave(slide) {
    clearActive(slide, '.vc-loop li');
  },
});

/* V39 · while the first version generates, the map narrates what is being built */
defineCtrl('vc-build', {
  enter(slide) {
    cycle(slide, '.vc-mini li', 1.4);
  },
  leave(slide) {
    clearActive(slide, '.vc-mini li');
  },
});

/* V41 · the tab test: close the tab, reopen it, the records are still there */
defineCtrl('vc-tab', {
  enter(slide, { lite }) {
    if (lite) return;
    const win = slide.querySelector('.vc-tabtest__win');
    const fresh = slide.querySelector('.vc-tabtest__rows .is-new');
    gsap
      .timeline({ repeat: -1, repeatDelay: 1.2, delay: 0.8 })
      .fromTo(fresh, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.out' })
      .to(win, { scale: 0.9, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, '+=1')
      .to(win, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }, '+=0.5')
      .fromTo(fresh, { boxShadow: '0 0 0 0 rgba(58, 199, 232, 0.7)' }, { boxShadow: '0 0 0 14px rgba(58, 199, 232, 0)', duration: 0.8, clearProps: 'boxShadow' });
  },
});
