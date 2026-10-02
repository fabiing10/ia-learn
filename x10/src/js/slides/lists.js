// Small list flourishes: S02 hands (marker pops), S04 promise (× turns in).
import { gsap, defineCtrl } from '../core/motion.js';

defineCtrl('hands', {
  fragment(slide, frags, shown) {
    if (!shown) return;
    frags.forEach((li) => {
      const icon = li.querySelector('.hands__icon');
      gsap.fromTo(icon, { scale: 0.4, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'expo.out' });
    });
  },
});

defineCtrl('promise', {
  fragment(slide, frags, shown) {
    if (!shown) return;
    frags.forEach((li) => {
      gsap.fromTo(li.querySelector('.x'), { rotate: -135, scale: 0.3 }, { rotate: 0, scale: 1, duration: 0.8, ease: 'expo.out' });
    });
  },
});
