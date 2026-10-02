// Blocks 7–8: tool map, before→after morphs, chat→agent flow, idea vote.
import { gsap, defineCtrl } from '../core/motion.js';
import { state } from '../core/state.js';

/* S31 · categories light up one by one */
defineCtrl('toolmap', {
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    frags.forEach((row) => {
      gsap.fromTo(row.querySelectorAll('dd span'), { y: 24, opacity: 0.2 }, { y: 0, opacity: 1, duration: 0.55, ease: 'expo.out', stagger: 0.05, clearProps: 'transform,opacity' });
    });
  },
});

/* S32 · each icon morphs from "before" to "after" */
defineCtrl('cases3', {
  enter(slide, { lite }) {
    slide.querySelectorAll('.case3__morph').forEach((path, i) => {
      if (lite) {
        path.setAttribute('d', path.dataset.to);
        return;
      }
      gsap.to(path, { morphSVG: path.dataset.to, duration: 1.1, ease: 'expo.inOut', delay: 0.7 + i * 0.18 });
      gsap.fromTo(path.parentNode.querySelector('.case3__frame'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.9, ease: 'expo.inOut', delay: 0.2 + i * 0.1 });
    });
  },
  print(slide) {
    slide.querySelectorAll('.case3__morph').forEach((p) => p.setAttribute('d', p.dataset.to));
  },
});

/* S33 · the agent flow draws itself step by step */
function ticks(slide) {
  const busy = slide.querySelector('.node--busy');
  const marks = busy?.querySelectorAll('.node__ticks b');
  if (!marks?.length || state.reduced) return;
  gsap.timeline({ repeat: -1, repeatDelay: 0.3 })
    .set(marks, { scale: 0.5, opacity: 0.25 })
    .to(marks, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.35 })
    .to(marks, { opacity: 0.25, duration: 0.4 }, '+=0.6');
}

defineCtrl('flow', {
  enter(slide, { lite }) {
    if (!lite) {
      gsap.fromTo(slide.querySelector('.flow__row:not(.flow__row--agent) .flow__arrow path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'expo.inOut', delay: 0.35 });
    }
    ticks(slide);
  },
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    frags.forEach((step) => {
      gsap.fromTo(step.querySelectorAll('.flow__arrow path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.55, ease: 'expo.inOut' });
      gsap.fromTo(step.querySelector('.node'), { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.25, clearProps: 'transform,opacity' });
    });
  },
});

/* S35 · click the winning idea */
defineCtrl('vote', {
  init(slide) {
    const ideas = [...slide.querySelectorAll('.idea')];
    ideas.forEach((idea) =>
      idea.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = !idea.classList.contains('is-win');
        ideas.forEach((i) => i.classList.remove('is-win'));
        slide.classList.toggle('has-winner', on);
        idea.classList.toggle('is-win', on);
        if (on && !state.lite) gsap.fromTo(idea, { scale: 0.96 }, { scale: 1, duration: 0.6, ease: 'expo.out', clearProps: 'transform' });
      }),
    );
  },
});
