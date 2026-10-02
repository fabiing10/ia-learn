// Block transition: a gold-edged ink curtain sweeps over the outgoing slide,
// a × marks the cut, then the curtain lifts off the next block.
// The leading edge bends while moving (path morph), flat when at rest.
import { gsap } from '../core/motion.js';

const el = () => document.querySelector('.curtain');

// Rising from the bottom: bottom corners fixed, top edge at y with a bulge.
const rise = (y, bulge) => `M0 100 L100 100 L100 ${y} Q50 ${y - bulge} 0 ${y} Z`;
// Leaving through the top: top corners fixed, bottom edge at y.
const lift = (y, bulge) => `M0 0 L100 0 L100 ${y} Q50 ${y - bulge} 0 ${y} Z`;

let active = null;

export function curtainBusy() {
  return !!active;
}

/** Stops the curtain immediately (used when the presenter clicks fast). */
export function killCurtain() {
  if (!active) return;
  const { tl, onCovered, covered } = active;
  active = null;
  tl.kill();
  if (!covered) onCovered?.();
  reset();
}

function reset() {
  const c = el();
  if (!c) return;
  c.style.visibility = 'hidden';
  c.querySelectorAll('svg path').forEach((p) => p.removeAttribute('style'));
  gsap.set(c.querySelectorAll('.curtain__x, .curtain__label'), { clearProps: 'all' });
}

/**
 * @param {object} o
 * @param {1|-1} o.direction  1 forward (rises from bottom), -1 backward (falls from top)
 * @param {string} [o.label]  optional block label shown while covered
 * @param {() => void} o.onCovered  swap slides here
 */
export function playCurtain({ direction = 1, label = '', onCovered }) {
  killCurtain();
  const c = el();
  const [edge, body] = c.querySelectorAll('svg:first-child path');
  const svg = c.querySelector('svg:first-child');
  const mark = c.querySelector('.curtain__x');
  const strokes = mark.querySelectorAll('path');
  const labelEl = c.querySelector('.curtain__label');

  labelEl.innerHTML = label; // trusted: built from the deck's own block names
  svg.style.transform = direction < 0 ? 'scaleY(-1)' : '';
  c.style.visibility = 'visible';

  const e = { p: 0 };
  const b = { p: 0 };
  const bend = (p) => Math.sin(p * Math.PI) * 24;
  const drawRise = () => {
    edge.setAttribute('d', rise(100 - e.p * 100, bend(e.p)));
    body.setAttribute('d', rise(100 - b.p * 100, bend(b.p)));
  };
  const drawLift = () => {
    edge.setAttribute('d', lift(100 - e.p * 100, bend(e.p)));
    body.setAttribute('d', lift(100 - b.p * 100, bend(b.p)));
  };

  const dir = direction < 0 ? -1 : 1;
  const state = { tl: null, onCovered, covered: false };

  const tl = gsap.timeline({
    onComplete: () => {
      if (active === state) active = null;
      reset();
    },
  });
  state.tl = tl;
  active = state;

  drawRise();
  // In: edge leads, ink body follows a beat behind
  tl.to(e, { p: 1, duration: 0.3, ease: 'power2.in', onUpdate: drawRise }, 0)
    .to(b, { p: 1, duration: 0.3, ease: 'power2.in', onUpdate: drawRise }, 0.05)
    .fromTo(mark, { scale: 0.55, rotate: -45 * dir, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.32, ease: 'expo.out' }, 0.27)
    .fromTo(strokes, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 0.3, ease: 'expo.out', stagger: 0.04 }, 0.27)
    .fromTo(labelEl, { autoAlpha: 0, y: 20 }, { autoAlpha: label ? 1 : 0, y: 0, duration: 0.3, ease: 'expo.out' }, 0.29)
    .add(() => {
      state.covered = true;
      onCovered?.();
      e.p = 0;
      b.p = 0;
      drawLift();
    }, 0.36)
    // Out: ink lifts first, the gold edge trails it off screen
    // power2.out uncovers most of the slide in the first 0.25 s (800 ms rule)
    .to(b, { p: 1, duration: 0.52, ease: 'power2.out', onUpdate: drawLift }, 0.37)
    .to(e, { p: 1, duration: 0.52, ease: 'power2.out', onUpdate: drawLift }, 0.42)
    .to([mark, labelEl], { yPercent: -160 * dir, autoAlpha: 0, duration: 0.42, ease: 'power3.in' }, 0.37);

  return tl;
}
