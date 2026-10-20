// The "neural" map of §6.4: profile fields (left) wired to the six files (right).
// Nodes are HTML so labels stay crisp at any zoom; the synapses are SVG paths
// measured from the nodes. When a field changes, pulses travel along its
// synapses with GSAP and the files they reach light up. With reduced motion the
// same synapses and files get a static highlight instead.

import { gsap } from 'gsap';
import { ARCHIVOS, CAMPOS, FIJOS } from '../shared/generator.js';
import { reducedMotion } from '../shared/ui.js';

const SVG = 'http://www.w3.org/2000/svg';
const ENTRADAS = [...CAMPOS, FIJOS];
const short = (file) => file.replace(/\.md$/, '');
const sel = (attr, value) => `[${attr}="${CSS.escape(value)}"]`;

export function mountMapa(stage, { onPickFile, onPickField, live }) {
  stage.innerHTML = `
    <svg class="mapa__svg" focusable="false"><g class="mapa__edges"></g><g class="mapa__pulses"></g></svg>
    <ul class="mapa__col mapa__col--in">${ENTRADAS.map(
      (c) =>
        `<li class="node node--in${c === FIJOS ? ' node--fijo' : ''}" data-campo="${c.id}"><span class="node__label">${c.label}</span><i class="node__dot"><i class="node__ring"></i></i></li>`,
    ).join('')}</ul>
    <ul class="mapa__col mapa__col--out">${ARCHIVOS.map(
      (a) =>
        `<li class="node node--out" data-archivo="${a}"><i class="node__dot"><i class="node__ring"></i></i><span class="node__label">${short(a)}</span></li>`,
    ).join('')}</ul>`;

  const svg = stage.querySelector('svg');
  const gEdges = svg.querySelector('.mapa__edges');
  const gPulses = svg.querySelector('.mapa__pulses');

  // One synapse per (field, file) pair, with its two pulse strokes.
  const edges = [];
  for (const c of ENTRADAS) {
    for (const a of c.archivos) {
      // Pulses measure their dash in pathLength units (0–100); base edges in px.
      const make = (cls, parent, pathLength) => {
        const p = document.createElementNS(SVG, 'path');
        p.setAttribute('class', cls);
        if (pathLength) p.setAttribute('pathLength', '100');
        parent.append(p);
        return p;
      };
      edges.push({
        from: c.id,
        to: a,
        base: make(`edge${c === FIJOS ? ' edge--fijo' : ''}`, gEdges, false),
        halo: make('pulse pulse--halo', gPulses, true),
        core: make('pulse pulse--core', gPulses, true),
      });
    }
  }

  const nodeIn = (id) => stage.querySelector(`.node--in${sel('data-campo', id)}`);
  const nodeOut = (file) => stage.querySelector(`.node--out${sel('data-archivo', file)}`);

  function layout() {
    const box = stage.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    const center = (el) => {
      const r = el.querySelector('.node__dot').getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    };
    for (const e of edges) {
      const [x1, y1] = center(nodeIn(e.from));
      const [x2, y2] = center(nodeOut(e.to));
      const k = (x2 - x1) * 0.5;
      const d = `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + k).toFixed(1)} ${y1.toFixed(1)} ${(x2 - k).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      for (const p of [e.base, e.halo, e.core]) p.setAttribute('d', d);
    }
  }

  new ResizeObserver(layout).observe(stage);
  document.fonts?.ready.then(layout);
  layout();

  // ── Static highlight: which files does this field feed? ──

  let focused = null;
  function highlight(campo) {
    focused = campo;
    stage.classList.toggle('has-focus', !!campo);
    for (const e of edges) e.base.classList.toggle('is-focus', e.from === campo);
    for (const n of stage.querySelectorAll('.node--in')) n.classList.toggle('is-focus', n.dataset.campo === campo);
    const files = new Set(edges.filter((e) => e.from === campo).map((e) => e.to));
    for (const n of stage.querySelectorAll('.node--out')) n.classList.toggle('is-focus', files.has(n.dataset.archivo));
  }

  // ── Pulses ──

  const timers = new Map();
  const flash = (el, cls, ms) => {
    clearTimeout(timers.get(el));
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    timers.set(el, setTimeout(() => el.classList.remove(cls), ms));
  };

  const ring = (node) => {
    const r = node.querySelector('.node__ring');
    gsap.fromTo(r, { scale: 1, opacity: 0.8 }, { scale: 3.2, opacity: 0, duration: 0.8, ease: 'power2.out', overwrite: true });
  };

  let quietUntil = 0;

  /** Fire `campo`'s synapses towards the files that actually changed. */
  function pulse(campo, changed) {
    const targets = edges.filter((e) => e.from === campo && changed.includes(e.to));
    if (!targets.length) return;
    quietUntil = performance.now() + 2400;
    const src = nodeIn(campo);

    if (reducedMotion()) {
      flash(src, 'is-fire', 1600);
      for (const e of targets) {
        flash(e.base, 'is-hot', 1600);
        flash(nodeOut(e.to), 'is-lit', 1600);
      }
      return;
    }

    flash(src, 'is-fire', 900);
    ring(src);
    targets.forEach((e, i) => {
      const delay = i * 0.07;
      const dur = 0.78;
      flash(e.base, 'is-hot', (delay + dur) * 1000 + 500);
      gsap.killTweensOf([e.halo, e.core]);
      gsap
        .timeline({ delay })
        .set([e.halo, e.core], { opacity: 1, strokeDashoffset: 18 })
        .to([e.halo, e.core], { strokeDashoffset: -100, duration: dur, ease: 'power2.inOut' })
        .set([e.halo, e.core], { opacity: 0 });
      gsap.delayedCall(delay + dur * 0.82, () => {
        const out = nodeOut(e.to);
        flash(out, 'is-lit', 1300);
        ring(out);
      });
    });
  }

  /** Several fields at once (reset to Laura or to blank): a cascade. */
  function cascade(campos, changed) {
    campos.forEach((c, i) => gsap.delayedCall(reducedMotion() ? 0 : i * 0.09, () => pulse(c, changed)));
  }

  // Ambient activity while the map is on screen: a faint impulse now and then,
  // never right after a real change and never with reduced motion.
  let visible = false;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(stage);
  const idle = () => {
    if (visible && !document.hidden && !reducedMotion() && performance.now() > quietUntil && !focused) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      gsap
        .timeline()
        .set(e.core, { opacity: 0.45, strokeDashoffset: 18 })
        .to(e.core, { strokeDashoffset: -100, duration: 1.6, ease: 'sine.inOut' })
        .set(e.core, { opacity: 0 });
    }
    setTimeout(idle, 1400 + Math.random() * 1600);
  };
  setTimeout(idle, 1200);

  // Mouse conveniences; the tabs and the form remain the keyboard path.
  stage.addEventListener('click', (e) => {
    const out = e.target.closest('.node--out');
    if (out) return onPickFile?.(out.dataset.archivo);
    const inn = e.target.closest('.node--in');
    if (inn && inn.dataset.campo !== FIJOS.id) onPickField?.(inn.dataset.campo);
  });

  let liveTimer;
  function announce(campo, changed) {
    if (!live || !changed.length) return;
    const label = ENTRADAS.find((c) => c.id === campo)?.label ?? campo;
    clearTimeout(liveTimer);
    const verb = changed.length === 1 ? 'se reescribió' : 'se reescribieron';
    liveTimer = setTimeout(() => (live.textContent = `${label}: ${verb} ${changed.join(', ')}.`), 600);
  }

  return { layout, highlight, pulse, cascade, announce };
}
