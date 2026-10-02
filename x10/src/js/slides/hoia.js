// S03 · ¿Humano o IA? — two rounds (image, video), each revealed with a gold
// frame drawn around the AI-made option. Video clips loop muted while shown.
import { gsap, defineCtrl } from '../core/motion.js';
import { readStep } from '../core/stepper.js';

const ROUNDS = ['imagen', 'video'];

function parse(name) {
  if (!name) return { round: 'imagen', phase: 'show' };
  const [round, phase] = name.split(':');
  return { round, phase };
}

/* ---------- frames ---------- */

function sizeFrames(slide) {
  slide.querySelectorAll('.opt').forEach((opt) => {
    let svg = opt.querySelector('.opt__frame');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('opt__frame');
      svg.innerHTML = '<rect />';
      opt.appendChild(svg);
    }
    const w = opt.offsetWidth + 4;
    const h = opt.offsetHeight + 4;
    if (!w || !h) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const r = svg.querySelector('rect');
    Object.entries({ x: 3.5, y: 3.5, width: w - 7, height: h - 7, rx: 30 }).forEach(([k, v]) => r.setAttribute(k, v));
  });
}

/* ---------- state ---------- */

function render(slide, { animate }) {
  const { round, phase } = parse(readStep(slide).name);
  const revealed = phase === 'reveal';
  const prevRound = slide.dataset.round;
  const wasRevealed = slide.dataset.revealed === '1';

  slide.querySelector('[data-round-n]').textContent = String(ROUNDS.indexOf(round) + 1);
  slide.querySelector('[data-round-kind]').textContent =
    slide.querySelector(`[data-round="${round}"]`).dataset.kind;

  ROUNDS.forEach((name) => {
    const el = slide.querySelector(`[data-round="${name}"]`);
    el.classList.toggle('is-current', name === round);
    el.classList.toggle('is-revealed', name === round && revealed);
    el.querySelectorAll('.opt').forEach((opt) => {
      opt.querySelector('.opt__verdict').textContent = opt.classList.contains('is-ai') ? 'IA' : 'Humano';
    });
  });

  const cur = slide.querySelector(`[data-round="${round}"]`);
  const opts = cur.querySelectorAll('.opt');
  const ai = cur.querySelector('.opt.is-ai');
  const verdicts = cur.querySelectorAll('.opt__verdict');
  const frame = ai?.querySelector('.opt__frame rect');

  // Round change: cards wipe in left to right
  if (round !== prevRound && animate && prevRound) {
    gsap.fromTo(
      opts,
      { clipPath: 'inset(0% 100% 0% 0% round 28px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 0.75, ease: 'expo.inOut', stagger: 0.09, clearProps: 'clipPath' },
    );
    gsap.fromTo(cur.querySelectorAll('.opt__key'), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.09, delay: 0.2 });
  }

  // Reveal / un-reveal
  if (revealed && (!wasRevealed || round !== prevRound)) {
    if (animate) {
      gsap.fromTo(frame, { drawSVG: '0%', opacity: 1 }, { drawSVG: '100%', duration: 0.9, ease: 'expo.inOut' });
      gsap.fromTo(verdicts, { autoAlpha: 0, y: 24, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out', stagger: 0.12, delay: 0.25 });
      gsap.fromTo(ai, { scale: 1 }, { scale: 1.02, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 1, delay: 0.5 });
    } else {
      gsap.set(frame, { drawSVG: '100%', opacity: 1 });
      gsap.set(verdicts, { autoAlpha: 1 });
    }
  } else if (!revealed) {
    slide.querySelectorAll('.opt__frame rect').forEach((r) => gsap.set(r, { opacity: 0 }));
    gsap.set(slide.querySelectorAll('.opt__verdict'), { autoAlpha: 0 });
  }

  // Video round: both clips loop muted while the round is on screen
  slide.querySelectorAll('[data-round="video"] video').forEach((v) => {
    if (round === 'video') v.play?.().catch(() => {});
    else v.pause?.();
  });


  slide.dataset.round = round;
  slide.dataset.revealed = revealed ? '1' : '0';
}

defineCtrl('hoia', {
  prepare(slide) {
    sizeFrames(slide);
  },
  enter(slide, { lite }) {
    sizeFrames(slide);
    delete slide.dataset.round;
    delete slide.dataset.revealed;
    render(slide, { animate: !lite });
  },
  fragment(slide) {
    render(slide, { animate: !document.documentElement.classList.contains('is-lite') });
  },
  leave(slide) {
    slide.querySelectorAll('[data-round="video"] video').forEach((v) => v.pause());
  },
  print(slide) {
    slide.querySelectorAll('.round').forEach((r) => r.classList.add('is-current', 'is-revealed'));
    slide.querySelectorAll('.opt').forEach((opt) => {
      opt.querySelector('.opt__verdict').textContent = opt.classList.contains('is-ai') ? 'IA' : 'Humano';
    });
  },
});
