// Motion engine: SplitText preparation, slide entrances, fragment flourishes.
// Every slide gets its own gsap.context; leaving the slide reverts it, so a
// revisit always replays from a clean state.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';
import { state } from './state.js';

gsap.registerPlugin(SplitText, DrawSVGPlugin, MorphSVGPlugin, Flip, CustomEase);
gsap.config({ force3D: true, nullTargetWarn: false });
CustomEase.create('x10.out', 'M0,0 C0.12,0.8 0.2,1 1,1');
CustomEase.create('x10.inOut', 'M0,0 C0.7,0 0.2,1 1,1');

export { gsap, SplitText, Flip, MorphSVGPlugin };

/* ---------- Registry of slide controllers ---------- */

const controllers = new Map();

/** Registers behaviour for slides with data-ctrl="name". */
export function defineCtrl(name, ctrl) {
  controllers.set(name, ctrl);
}

function ctrlsOf(slide) {
  return (slide.dataset.ctrl || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => controllers.get(n))
    .filter(Boolean);
}

/* ---------- One-time preparation (needs layout, so runs on first visit) ---------- */

const prepared = new WeakSet();
const splits = new WeakMap();

function fitText(el) {
  // Scales a mega word so it fills its line without overflowing.
  const max = parseFloat(el.dataset.fitMax || 380);
  // 0.97: negative tracking lets the last glyph overhang its advance width
  const width = (parseFloat(el.dataset.fit) || el.parentElement.clientWidth) * 0.97;
  el.style.fontSize = `${max}px`;
  el.style.whiteSpace = 'nowrap';
  const natural = el.scrollWidth;
  if (natural > width) el.style.fontSize = `${Math.floor((max * width) / natural)}px`;
}

export function ensureSplit(el) {
  let s = splits.get(el);
  if (s) return s;
  const mode = el.dataset.split;
  const vars = { linesClass: 'ln', wordsClass: 'wd', charsClass: 'ch', aria: 'auto', mask: 'lines' };
  vars.type = mode === 'chars' ? 'lines,words,chars' : mode === 'words' ? 'lines,words' : 'lines';
  s = SplitText.create(el, vars);
  splits.set(el, s);
  return s;
}

export function prepareSlide(slide) {
  if (prepared.has(slide)) return;
  prepared.add(slide);
  slide.querySelectorAll('[data-fit]').forEach(fitText);
  ctrlsOf(slide).forEach((c) => c.prepare?.(slide));
  if (state.lite) return;
  slide.querySelectorAll('[data-split]').forEach(ensureSplit);
}

/* ---------- Entrances ---------- */

function splitTargets(el) {
  const s = ensureSplit(el);
  const mode = el.dataset.split;
  return mode === 'chars' ? s.chars : mode === 'words' ? s.words : s.lines;
}

/** Tween that brings one element in. All entrances settle well under 800 ms. */
export function animateIn(el) {
  if (el.dataset.split) {
    const targets = splitTargets(el);
    const per = el.dataset.split === 'chars' ? 0.022 : 0.05;
    const amount = Math.min(el.dataset.split === 'chars' ? 0.26 : 0.2, targets.length * per);
    return gsap.fromTo(
      targets,
      { yPercent: 118 },
      { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: { amount }, overwrite: true },
    );
  }
  switch (el.dataset.in) {
    case 'mask':
      return gsap.fromTo(
        el,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.out', clearProps: 'clipPath' },
      );
    case 'wipe':
      return gsap.fromTo(
        el,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'expo.inOut', clearProps: 'clipPath' },
      );
    case 'scale':
      return gsap.fromTo(el, { scale: 0.94, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.7, ease: 'expo.out' });
    case 'fade':
      return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
    case 'draw':
      return gsap.fromTo(
        el.querySelectorAll('path, line, polyline, circle, rect'),
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.9, ease: 'expo.inOut', stagger: 0.06 },
      );
    case 'stagger':
      return gsap.fromTo(
        el.children,
        { y: 46, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.62, ease: 'expo.out', stagger: Math.min(0.08, 0.4 / el.children.length) },
      );
    default:
      return gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.62, ease: 'expo.out' });
  }
}

const contexts = new Map();

function entranceItems(slide) {
  return [...slide.querySelectorAll('[data-split], [data-in]')].filter(
    (el) =>
      !el.closest('.fragment:not(.visible)') &&
      !el.parentElement.closest('[data-in="stagger"]') &&
      !el.closest('[data-in-skip]'),
  );
}

/**
 * Plays the slide entrance. Elements animate in document order with a short
 * cascade (max 0.3 s offset) so the whole slide is readable in < 800 ms.
 */
export function enterSlide(slide, { direction = 1, fromBlock = false } = {}) {
  leaveSlide(slide);
  prepareSlide(slide);
  const ctx = gsap.context(() => {
    if (state.lite) {
      gsap.fromTo(slide, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18, ease: 'none' });
      ctrlsOf(slide).forEach((c) => c.enter?.(slide, { lite: true, direction, fromBlock }));
      return;
    }
    const tl = gsap.timeline();
    entranceItems(slide).forEach((el, i) => {
      const at = el.dataset.at != null ? parseFloat(el.dataset.at) : Math.min(i * 0.075, 0.3);
      tl.add(animateIn(el), at);
    });
    ctrlsOf(slide).forEach((c) => c.enter?.(slide, { lite: false, direction, fromBlock, tl }));
  }, slide);
  contexts.set(slide, ctx);
}

export function leaveSlide(slide) {
  const ctx = contexts.get(slide);
  if (!ctx) return;
  ctrlsOf(slide).forEach((c) => c.leave?.(slide));
  ctx.revert();
  contexts.delete(slide);
}

/* ---------- Fragments ---------- */

export function fragmentsChanged(slide, fragments, shown) {
  const ctx = contexts.get(slide);
  const run = () => {
    if (shown && !state.lite) {
      fragments.forEach((frag) => {
        const targets = [frag, ...frag.querySelectorAll('[data-split], [data-in]')].filter(
          (el) => el.dataset.split || el.dataset.in,
        );
        targets.forEach((el, i) => animateIn(el).delay(i * 0.06));
      });
    }
    ctrlsOf(slide).forEach((c) => c.fragment?.(slide, fragments, shown));
  };
  if (ctx) ctx.add(run);
  else run();
}

/** Print/PDF: controllers lay out their final state statically. */
export function printSlide(slide) {
  ctrlsOf(slide).forEach((c) => c.print?.(slide));
}

/** Runs before Reveal initialises: controllers may add markup or fragments. */
export function buildSlides(root = document) {
  root.querySelectorAll('section[data-ctrl]').forEach((slide) => ctrlsOf(slide).forEach((c) => c.build?.(slide)));
}

/** Runs once for every slide right after Reveal is ready (no layout needed). */
export function initSlides(slides) {
  slides.forEach((slide) => ctrlsOf(slide).forEach((c) => c.init?.(slide)));
}
