// Mechanical counter 1 → 10, then the × draws in: "×10".
// Used on the cover (S01) and again on "¿Por qué x10?" (S37).
import { gsap, defineCtrl } from '../core/motion.js';
import { fx } from '../core/fxhub.js';

const ONES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
// Tick lengths: slow start, quick middle, heavy landing — like a real counter.
const TICKS = [0.15, 0.12, 0.1, 0.085, 0.075, 0.075, 0.085, 0.11, 0.2];

function build(el) {
  el.innerHTML = `
    <svg class="odo__x" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 14 L86 86"/><path d="M86 14 L14 86"/></svg>
    <span class="odo__col odo__col--tens" aria-hidden="true"><span class="odo__reel"><span>1</span></span></span>
    <span class="odo__col odo__col--ones" aria-hidden="true"><span class="odo__reel">${ONES.map((d) => `<span>${d}</span>`).join('')}</span></span>`;
}

function finalState(el) {
  const tens = el.querySelector('.odo__col--tens');
  gsap.set(tens, { width: 'auto' });
  gsap.set(el.querySelector('.odo__col--ones .odo__reel'), { yPercent: (-100 * 9) / ONES.length });
  gsap.set(el.querySelectorAll('.odo__x path'), { drawSVG: '0% 100%' });
}

defineCtrl('odometer', {
  build(slide) {
    slide.querySelectorAll('[data-odometer]').forEach(build);
  },
  print(slide) {
    slide.querySelectorAll('[data-odometer]').forEach(finalState);
  },
  enter(slide, { lite }) {
    slide.querySelectorAll('[data-odometer]').forEach((el) => {
      const ones = el.querySelector('.odo__col--ones .odo__reel');
      const tens = el.querySelector('.odo__col--tens');
      const x = el.querySelector('.odo__x');
      const strokes = x.querySelectorAll('path');
      const step = -100 / ONES.length;

      if (lite) {
        finalState(el);
        fx.bg?.morph('ten');
        return;
      }

      const tensWidth = tens.scrollWidth || tens.querySelector('span').getBoundingClientRect().width;
      gsap.set(ones, { yPercent: 0 });
      gsap.set(tens, { width: 0 });
      gsap.set(x, { width: 0, marginRight: 0, autoAlpha: 0 });
      gsap.set(strokes, { drawSVG: '50% 50%' });

      const tl = gsap.timeline({ delay: 0.12 });
      TICKS.forEach((d, i) => {
        tl.to(ones, { yPercent: step * (i + 1), duration: d, ease: i === TICKS.length - 1 ? 'back.out(1.6)' : 'power2.out' });
      });
      // 9 → 10: the tens digit slides in with the last tick
      tl.to(tens, { width: tensWidth, duration: 0.32, ease: 'expo.out' }, `-=${TICKS.at(-1)}`)
        .fromTo(tens.querySelector('.odo__reel'), { yPercent: 100 }, { yPercent: 0, duration: 0.32, ease: 'expo.out' }, '<')
        // then the × locks in front: "×10"
        .to(x, { width: '0.56em', marginRight: '0.06em', autoAlpha: 1, duration: 0.5, ease: 'expo.inOut' }, '+=0.05')
        .to(strokes, { drawSVG: '0% 100%', duration: 0.5, ease: 'expo.out', stagger: 0.08 }, '-=0.25')
        .add(() => fx.bg?.morph('ten', 1.6), '<');
    });
  },
});
