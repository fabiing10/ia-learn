// Block 3 behaviours: glossary focus (S11), R·C·T·F merge (S13), exercise timer (S14).
import { gsap, Flip, defineCtrl } from '../core/motion.js';
import { readStep } from '../core/stepper.js';
import { state } from '../core/state.js';

/* S11 · one click puts "Alucinación" in focus */
defineCtrl('glossary', {
  enter(slide) {
    slide.classList.toggle('is-focus', readStep(slide).index >= 0);
  },
  fragment(slide) {
    const on = readStep(slide).index >= 0;
    slide.classList.toggle('is-focus', on);
    if (on && !state.lite) {
      const key = slide.querySelector('.term--key');
      gsap.fromTo(key, { y: 0 }, { y: -14, duration: 0.5, ease: 'expo.out', yoyo: true, repeat: 1 });
      gsap.fromTo(key.querySelector('dt'), { letterSpacing: '-0.03em' }, { letterSpacing: '0em', duration: 0.6, ease: 'expo.out' });
    }
  },
  leave(slide) {
    slide.classList.remove('is-focus');
  },
  print(slide) {
    slide.classList.add('is-focus');
  },
});

/* S13 · four blocks arrive one by one, then stack into a single prompt */
function setMerged(slide, merged, animate) {
  const box = slide.querySelector('[data-rctf]');
  if (box.classList.contains('is-merged') === merged) return;
  if (!animate) {
    box.classList.toggle('is-merged', merged);
    return;
  }
  const blocks = box.querySelectorAll('.rctf__block, .rctf__letter');
  // Finish any arrival tween first: Flip must measure the settled layout.
  gsap.killTweensOf(blocks);
  gsap.set(blocks, { clearProps: 'transform,opacity,visibility' });
  const targets = [box, ...box.querySelectorAll('.rctf__block, .rctf__letter, .rctf__text')];
  const flip = Flip.getState(targets, { props: 'borderRadius,backgroundColor,padding,borderColor' });
  box.classList.toggle('is-merged', merged);
  Flip.from(flip, { duration: 0.85, ease: 'expo.inOut', nested: true, scale: true, stagger: 0.03 });
}

defineCtrl('rctf', {
  enter(slide) {
    setMerged(slide, readStep(slide).index >= 0, false);
  },
  fragment(slide, frags, shown) {
    setMerged(slide, readStep(slide).index >= 0, !state.lite);
    if (!shown || state.lite) return;
    frags
      .filter((f) => f.classList.contains('rctf__block'))
      .forEach((block) => {
        gsap.fromTo(block, { xPercent: -6 }, { xPercent: 0, duration: 0.6, ease: 'expo.out', clearProps: 'transform' });
        gsap.fromTo(block.querySelector('.rctf__letter'), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.05, clearProps: 'transform,opacity' });
      });
  },
  leave(slide) {
    slide.querySelector('[data-rctf]').classList.remove('is-merged');
  },
  print(slide) {
    slide.querySelector('[data-rctf]').classList.add('is-merged');
  },
});

/* S14 · 3-minute countdown starts with the last step; click to pause */
function timerOf(slide) {
  const el = slide.querySelector('[data-timer]');
  if (!el) return null;
  if (el._t) return el._t;
  const total = Number(el.dataset.timer) || 180;
  const ring = el.querySelector('.timer__ring');
  const label = el.querySelector('.timer__time');
  const circ = 2 * Math.PI * 54;
  ring.style.strokeDasharray = `${circ}`;
  let left = total;
  let id = 0;
  let last = 0;
  const paint = () => {
    const s = Math.max(0, Math.ceil(left));
    label.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    ring.style.strokeDashoffset = `${circ * (1 - left / total)}`;
    el.classList.toggle('is-done', left <= 0);
  };
  const tick = (now) => {
    left -= (now - last) / 1000;
    last = now;
    paint();
    if (left > 0) id = requestAnimationFrame(tick);
  };
  const t = {
    start() {
      cancelAnimationFrame(id);
      el.classList.remove('is-paused');
      last = performance.now();
      id = requestAnimationFrame(tick);
    },
    pause() {
      cancelAnimationFrame(id);
      id = 0;
      el.classList.add('is-paused');
    },
    reset() {
      cancelAnimationFrame(id);
      id = 0;
      left = total;
      el.classList.remove('is-paused');
      paint();
    },
    toggle() {
      if (id) t.pause();
      else if (left > 0) t.start();
    },
  };
  el.addEventListener('click', t.toggle);
  el._t = t;
  paint();
  return t;
}

function syncTimer(slide) {
  const t = timerOf(slide);
  if (!t) return;
  const el = slide.querySelector('[data-timer]');
  const on = el.closest('.fragment')?.classList.contains('visible');
  if (on) t.start();
  else t.reset();
}

defineCtrl('exercise', {
  init(slide) {
    timerOf(slide);
  },
  enter(slide) {
    // Coming back to the slide shows a fresh timer; it restarts on its step.
    timerOf(slide)?.reset();
  },
  fragment(slide) {
    syncTimer(slide);
  },
  leave(slide) {
    timerOf(slide)?.reset();
  },
});
