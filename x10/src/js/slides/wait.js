// S00 waiting loop: the question stays, "Probablemente sí." answers after 3 s,
// holds, leaves, and comes back. Particles multiply in the background.
import { gsap, defineCtrl } from '../core/motion.js';

defineCtrl('wait', {
  enter(slide, { lite }) {
    const a = slide.querySelector('.wait__a-inner');
    if (lite) {
      gsap.timeline({ repeat: -1 })
        .set(a, { autoAlpha: 0 })
        .to(a, { autoAlpha: 1, duration: 0.3 }, 3)
        .to(a, { autoAlpha: 0, duration: 0.3 }, 14);
      return;
    }
    gsap.timeline({ repeat: -1 })
      .set(a, { yPercent: 110, autoAlpha: 1 })
      .to(a, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 3)
      .to(a, { yPercent: -110, duration: 0.6, ease: 'expo.in' }, 14)
      .to({}, { duration: 1.4 });
  },
});
