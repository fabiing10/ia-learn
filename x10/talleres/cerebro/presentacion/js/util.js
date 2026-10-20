// Helpers shared by the Cerebro Jurídico slide controllers.
// Rule for every controller: the markup and CSS already show the final state,
// so lite mode (key M, reduced motion, speaker view) and the PDF need no JS.
// Controllers only animate *from* an initial state, and undo what they add.
import { fx } from '@engine/core/fxhub.js';

const NS = 'http://www.w3.org/2000/svg';

/** Creates an SVG element with attributes and appends it to parent. */
export function svg(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent?.appendChild(el);
  return el;
}

/** A burst of impulses through the background synapses. */
export const fire = (strength = 0.6) => fx.bg?.fire?.(strength);

/** Seeded RNG so generated diagrams look the same on every load. */
export function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Runs rounds back to back while the slide is on (each round may differ).
 * makeRound(i) returns a gsap timeline; stop() kills the current one.
 */
export function rounds(slide, makeRound) {
  let i = 0;
  let current = null;
  let stopped = false;
  const next = () => {
    if (stopped) return;
    current = makeRound(i++);
    current.eventCallback('onComplete', next);
  };
  next();
  slide._cjStop = () => {
    stopped = true;
    current?.kill();
  };
}

export function stopRounds(slide) {
  slide._cjStop?.();
  slide._cjStop = null;
}

/** 2000 → "2.000" (Spanish keeps four-digit numbers ungrouped, Colombian usage groups them). */
export function miles(n) {
  const s = String(Math.round(n));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
