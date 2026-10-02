// Decides how each slide change looks:
//  - new block      → curtain sweep (page transition), then the entrance
//  - same block     → quick crossfade of the old slide + entrance of the new
//  - lite/print     → instant swap with a short fade
import { gsap, enterSlide, leaveSlide } from './motion.js';
import { playCurtain, killCurtain } from '../fx/curtain.js';
import { state } from './state.js';
import { blockOf, BLOCKS, updateHud } from './hud.js';

const pending = new Set();

function stackOf(slide) {
  return slide.parentElement?.matches('section') ? slide.parentElement : null;
}

function markLeaving(prev, cur) {
  prev.classList.add('is-leaving');
  const stack = stackOf(prev);
  const ownStack = stack && stack !== stackOf(cur) ? stack : null;
  ownStack?.classList.add('is-leaving-stack');
  const cleanup = () => {
    pending.delete(cleanup);
    gsap.killTweensOf(prev);
    prev.classList.remove('is-leaving');
    ownStack?.classList.remove('is-leaving-stack');
    gsap.set(prev, { clearProps: 'opacity,visibility,transform' });
    leaveSlide(prev);
  };
  pending.add(cleanup);
  return cleanup;
}

/** Finishes any transition still running (fast clicking never leaves debris). */
function flush() {
  killCurtain();
  [...pending].forEach((fn) => fn());
  document.querySelectorAll('section.is-waiting').forEach((s) => s.classList.remove('is-waiting'));
}

function direction(e, prevIdx) {
  if (!prevIdx) return 1;
  if (e.indexh !== prevIdx.h) return e.indexh > prevIdx.h ? 1 : -1;
  return (e.indexv || 0) >= (prevIdx.v || 0) ? 1 : -1;
}

export function createTransitions(deck, getBg) {
  let prevIdx = null;

  function background(cur) {
    const bg = getBg();
    if (!bg || state.lite) return;
    const center = cur.dataset.bgCenter?.split(',').map(Number);
    bg.onSlide({
      form: cur.dataset.bg || 'field',
      alpha: cur.dataset.bgAlpha ? parseFloat(cur.dataset.bgAlpha) : 1,
      index: deck.getIndices(cur).h,
      center: center?.length === 2 ? center : undefined,
    });
  }

  function show(cur, opts) {
    updateHud(cur);
    enterSlide(cur, opts);
    background(cur);
  }

  function onChange(e) {
    flush();
    const prev = e.previousSlide;
    const cur = e.currentSlide;
    const dir = direction(e, prevIdx);
    prevIdx = { h: e.indexh, v: e.indexv };

    if (!prev || prev === cur || state.lite || state.print) {
      if (prev && prev !== cur) leaveSlide(prev);
      show(cur, { direction: dir });
      return;
    }

    const toBlock = blockOf(cur);
    if (toBlock !== blockOf(prev)) {
      const cleanup = markLeaving(prev, cur);
      cur.classList.add('is-waiting');
      const info = BLOCKS[toBlock];
      // Blocks without a separator slide get their name on the curtain.
      const label = cur.classList.contains('sep') || !info ? '' : `<span>${info.num}</span>${info.name}`;
      playCurtain({
        direction: dir,
        label,
        onCovered: () => {
          cleanup();
          cur.classList.remove('is-waiting');
          show(cur, { direction: dir, fromBlock: true });
        },
      });
      return;
    }

    const cleanup = markLeaving(prev, cur);
    gsap.to(prev, { autoAlpha: 0, y: -18 * dir, duration: 0.2, ease: 'power2.in', onComplete: cleanup });
    show(cur, { direction: dir });
  }

  function start() {
    const cur = deck.getCurrentSlide();
    prevIdx = deck.getIndices();
    show(cur, { direction: 1 });
  }

  return { onChange, start, refreshBackground: () => background(deck.getCurrentSlide()) };
}
