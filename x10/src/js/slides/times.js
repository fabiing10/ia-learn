// Block 2: the timeline (S06) and the "every new tool was feared" sequence (S07).
import { gsap, defineCtrl } from '../core/motion.js';
import { readStep } from '../core/stepper.js';
import { state } from '../core/state.js';

/* ---------- S06 · horizontal timeline with parallax layers ---------- */

const LINE_LENGTH = 3900; // px of track; the dashed tail is "what comes next"
const FOCUS_FIRST = 420; // where the active stop sits on screen (px from content left)
const FOCUS_STEP = 110; // the focus drifts right so the compressed end stays in view

function stopsOf(slide) {
  return [...slide.querySelectorAll('.tl__stop')];
}

function cameraFor(stops, step) {
  const x = Number(stops[step].dataset.x);
  return FOCUS_FIRST + step * FOCUS_STEP - x;
}

function buildTimeline(slide) {
  const stops = stopsOf(slide);
  stops.forEach((s) => (s.style.left = `${s.dataset.x}px`));

  // Background layer: giant outlined years, one per stop
  const bg = slide.querySelector('.tl__layer--bg');
  bg.innerHTML = stops
    .map((s) => `<span class="tl__ghost" style="left:${Number(s.dataset.x) * 0.35}px">${s.dataset.year.slice(0, 4)}</span>`)
    .join('');

  // Foreground layer: a scatter of × marks that travels faster than the track
  const fg = slide.querySelector('.tl__layer--fg');
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let html = '';
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rnd() * LINE_LENGTH * 1.45);
    const top = rnd() < 0.5 ? 40 + rnd() * 200 : 560 + rnd() * 170;
    const size = 16 + Math.round(rnd() * 26);
    html += `<span class="x tl__mark" style="left:${x}px;top:${Math.round(top)}px;font-size:${size}px;opacity:${(0.18 + rnd() * 0.3).toFixed(2)}"></span>`;
  }
  fg.innerHTML = html;

  // Static list for the PDF export
  const list = document.createElement('ol');
  list.className = 'tl__print';
  stops.forEach((s) => {
    const li = document.createElement('li');
    const y = document.createElement('b');
    y.textContent = s.dataset.year;
    const p = s.querySelector('.tl__text').cloneNode(true);
    li.append(y, p);
    list.appendChild(li);
  });
  slide.appendChild(list);
}

function renderTimeline(slide, { animate, intro = false }) {
  const stops = stopsOf(slide);
  const step = Math.max(0, readStep(slide).index + 1); // 0..6
  const prev = slide.dataset.step != null ? Number(slide.dataset.step) : -1;
  const active = stops[step];
  const cam = cameraFor(stops, step);
  const d = animate ? 0.95 : 0;
  const ease = 'expo.inOut';

  stops.forEach((s, i) => {
    s.classList.toggle('is-past', i < step);
    s.classList.toggle('is-active', i === step);
    s.classList.toggle('is-future', i > step);
  });

  // Camera + parallax: each layer moves by its depth
  slide.querySelectorAll('.tl__layer').forEach((layer) => {
    const depth = Number(layer.dataset.depth);
    gsap.to(layer, { x: cam * depth, duration: d, ease, overwrite: true });
  });

  // The line grows to the active stop
  const fill = slide.querySelector('.tl__line-fill');
  const target = Number(active.dataset.x) / LINE_LENGTH;
  if (intro && animate) gsap.fromTo(fill, { scaleX: 0 }, { scaleX: target, duration: 1, ease: 'expo.out', delay: 0.1 });
  else gsap.to(fill, { scaleX: target, duration: d, ease, overwrite: true });

  // Ghost year in the background
  slide.querySelectorAll('.tl__ghost').forEach((g, i) => {
    gsap.to(g, { opacity: i === step ? 1 : 0, duration: animate ? 0.6 : 0, ease: 'power2.out', overwrite: true });
  });

  // The newly reached stop pops in
  if (animate && step !== prev) {
    const dot = active.querySelector('.tl__dot');
    const year = active.querySelector('.tl__year');
    gsap.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'expo.out', delay: intro ? 0.2 : 0.55 });
    gsap.fromTo(year, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: intro ? 0.15 : 0.5, clearProps: 'opacity' });
  }

  // Caption below the track
  const cap = slide.querySelector('.tl__caption');
  const capYear = cap.querySelector('.tl__caption-year');
  const capText = cap.querySelector('.tl__caption-text');
  const swap = () => {
    capYear.textContent = active.dataset.year;
    capText.innerHTML = active.querySelector('.tl__text').innerHTML;
  };
  if (animate && step !== prev && prev >= 0) {
    const dir = step > prev ? 1 : -1;
    gsap.timeline()
      .to([capYear, capText], { yPercent: -110 * dir, duration: 0.22, ease: 'power2.in', overwrite: true })
      .add(swap)
      .fromTo([capYear, capText], { yPercent: 110 * dir }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
  } else {
    swap();
    if (animate) gsap.fromTo([capYear, capText], { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06, delay: 0.1 });
  }

  slide.dataset.step = String(step);
}

defineCtrl('timeline', {
  build: buildTimeline,
  enter(slide, { lite }) {
    delete slide.dataset.step;
    renderTimeline(slide, { animate: !lite, intro: true });
  },
  fragment(slide) {
    renderTimeline(slide, { animate: !state.lite });
  },
});

/* ---------- S07 · icons draw in sequence ---------- */

defineCtrl('tools', {
  enter(slide, { lite }) {
    if (lite) return;
    const eras = slide.querySelectorAll('.era');
    eras.forEach((era, i) => {
      gsap.fromTo(
        era.querySelectorAll('.era__icon path, .era__icon circle'),
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 0.7, ease: 'expo.inOut', delay: 0.1 + i * 0.12 },
      );
      gsap.fromTo(era.querySelector('.era__name'), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'expo.out', delay: 0.15 + i * 0.1 });
    });
    gsap.fromTo(slide.querySelectorAll('.era__arrow path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'expo.out', stagger: 0.12, delay: 0.3 });
  },
});
