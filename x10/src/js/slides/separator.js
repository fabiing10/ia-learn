// Block separators: number, giant word, 10-segment bar filling to this block.
import { gsap, defineCtrl } from '../core/motion.js';

defineCtrl('separator', {
  enter(slide, { lite }) {
    if (lite) return;
    const done = slide.querySelectorAll('.sep__bar .segbar__seg.is-done .segbar__fill');
    const cur = slide.querySelector('.sep__bar .segbar__seg.is-current .segbar__fill');
    gsap.fromTo(done, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'expo.out', stagger: 0.035 });
    if (cur) gsap.fromTo(cur, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'expo.inOut', delay: 0.25 });
  },
});
