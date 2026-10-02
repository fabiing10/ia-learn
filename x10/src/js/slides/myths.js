// Block 4 myths: the claim is shown, the room answers, the verdict stamps in
// and a gold line strikes the claim out — only halfway for "MEDIA VERDAD".
import { gsap, defineCtrl, ensureSplit } from '../core/motion.js';
import { state } from '../core/state.js';

function strikes(slide) {
  const claim = slide.querySelector('.myth__claim');
  if (!claim.querySelector('.myth__strike')) {
    // One strike per rendered line so it follows the text
    const lines = ensureSplit(claim).lines;
    lines.forEach((line) => {
      const s = document.createElement('span');
      s.className = 'myth__strike';
      s.setAttribute('aria-hidden', 'true');
      line.appendChild(s);
    });
  }
  return claim.querySelectorAll('.myth__strike');
}

function revealed(slide) {
  return slide.querySelector('.myth__reveal').classList.contains('visible');
}

function render(slide, animate) {
  const on = revealed(slide);
  const half = slide.dataset.verdict === 'half';
  const lines = strikes(slide);
  const claim = slide.querySelector('.myth__claim');
  const stamp = slide.querySelector('.myth__stamp');
  const was = slide.classList.contains('is-busted');
  slide.classList.toggle('is-busted', on);
  const reach = half ? 0.5 : 1;

  if (on && !was && animate) {
    gsap.fromTo(lines, { scaleX: 0 }, { scaleX: reach, duration: 0.7, ease: 'expo.inOut', stagger: 0.12 });
    gsap.fromTo(claim, { opacity: 1 }, { opacity: half ? 0.7 : 0.42, duration: 0.6, ease: 'power2.out', delay: 0.25 });
    gsap.fromTo(stamp, { scale: 1.6, opacity: 0, rotate: -14 }, { scale: 1, opacity: 1, rotate: -5, duration: 0.55, ease: 'expo.out', delay: 0.18 });
    gsap.fromTo(slide.querySelector('.myth__fact'), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.32 });
  } else if (on) {
    gsap.set(lines, { scaleX: reach });
    gsap.set(claim, { opacity: half ? 0.7 : 0.42 });
    gsap.set(stamp, { rotate: -5, opacity: 1, scale: 1 });
  } else {
    gsap.killTweensOf([lines, claim, stamp]);
    gsap.set(lines, { scaleX: 0 });
    gsap.set(claim, { opacity: 1 });
  }
}

defineCtrl('myth', {
  init(slide) {
    // Renumber after cuts (config.recortes) so the count stays honest
    const all = [...document.querySelectorAll('.reveal .slides section.s-myth')];
    const n = slide.querySelector('.myth__count');
    if (n) n.innerHTML = `Mito <b>${all.indexOf(slide) + 1}</b> de ${all.length}`;
  },
  enter(slide, { lite }) {
    slide.classList.remove('is-busted');
    render(slide, !lite);
  },
  fragment(slide) {
    render(slide, !state.lite);
  },
  leave(slide) {
    slide.classList.remove('is-busted');
  },
  print(slide) {
    const half = slide.dataset.verdict === 'half';
    slide.classList.add('is-busted');
    strikes(slide).forEach((s) => (s.style.transform = `scaleX(${half ? 0.5 : 1})`));
  },
});
