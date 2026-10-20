// Generated diagrams: the next-word network (C08), the vault graph (C15), the
// open-book space (C16), the agent loop (C17) and the concept map (R2).
// Built once before Reveal starts; animated only while their slide is on.
import { gsap, defineCtrl } from '@engine/core/motion.js';
import { state } from '@engine/core/state.js';
import { svg, fire, rand, rounds, stopRounds } from './util.js';
import { brainPoint } from '@engine/fx/neural.js';

const $$ = (root, sel) => [...root.querySelectorAll(sel)];

/* ── C08 · tokens → three layers → next-word probabilities ── */

const LAYERS = [
  { x: 50, n: 5 },
  { x: 220, n: 6 },
  { x: 390, n: 5 },
];
const PICKS = ['diez', 'diez', 'veinte', 'diez', 'quince', 'diez', 'treinta'];

defineCtrl('cj-predict', {
  build(slide) {
    const net = slide.querySelector('.cj-predict__net');
    const ys = (n) => Array.from({ length: n }, (_, i) => 50 + (i * 360) / (n - 1));
    const edges = svg('g', { class: 'cj-pn__edges' }, net);
    const pulses = svg('g', { class: 'cj-pn__pulses' }, net);
    const r = rand(808);
    LAYERS.slice(0, -1).forEach((a, li) => {
      const b = LAYERS[li + 1];
      ys(a.n).forEach((y1) =>
        ys(b.n).forEach((y2) => {
          const d = `M${a.x} ${y1} C ${a.x + 70} ${y1}, ${b.x - 70} ${y2}, ${b.x} ${y2}`;
          svg('path', { d }, edges);
          if (r() < 0.32) svg('path', { d, pathLength: 100, 'data-layer': li, class: 'cj-pn__pulse' }, pulses);
        }),
      );
    });
    LAYERS.forEach((l, li) =>
      ys(l.n).forEach((y) => svg('circle', { cx: l.x, cy: y, r: 15, class: 'cj-pn__node', 'data-layer': li }, net)),
    );
    slide.querySelectorAll('.cj-predict__bars li').forEach((li) => li.style.setProperty('--p', li.dataset.p));
  },
  enter(slide, { lite }) {
    if (lite) return;
    const tokens = $$(slide, '.tk:not(.tk--blank)');
    const blank = slide.querySelector('[data-blank]');
    const bars = $$(slide, '.cj-predict__bars li');
    const nodes = (l) => $$(slide, `.cj-pn__node[data-layer="${l}"]`);
    const pulses = (l) => $$(slide, `.cj-pn__pulse[data-layer="${l}"]`);
    blank.dataset.final ??= blank.textContent;
    gsap.fromTo(slide.querySelectorAll('.cj-predict__bars s'), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.out', stagger: 0.1, delay: 0.5 });
    rounds(slide, (i) => {
      const word = PICKS[i % PICKS.length];
      const target = bars.find((b) => b.dataset.word === word);
      const tl = gsap.timeline({ delay: i === 0 ? 0.9 : 0 });
      tl.call(() => {
        blank.textContent = blank.dataset.final;
        blank.className = 'tk tk--blank';
        bars.forEach((b) => b.classList.remove('is-pick'));
      });
      tl.fromTo(tokens, { '--lit': 0 }, { '--lit': 1, duration: 0.18, stagger: 0.04, yoyo: true, repeat: 1 });
      [0, 1, 2].forEach((l) => {
        tl.fromTo(nodes(l), { '--lit': 0 }, { '--lit': 1, duration: 0.2, stagger: 0.03, yoyo: true, repeat: 1 }, l === 0 ? '>-0.2' : '>-0.25');
        if (l < 2) tl.fromTo(pulses(l), { strokeDashoffset: 12 }, { strokeDashoffset: -100, duration: 0.45, ease: 'none', stagger: 0.015 }, '<');
      });
      // the choice hops between the candidates before it lands (sampling)
      const hops = [0, 1, 2, 3, 0, 1].map((k) => bars[k]);
      hops.concat(target).forEach((b, k) =>
        tl.call(() => bars.forEach((x) => x.classList.toggle('is-pick', x === b)), null, `>+${k === 0 ? 0.05 : 0.09}`),
      );
      tl.call(() => {
        blank.textContent = word;
        blank.classList.add('is-filled', target.classList.contains('is-old') ? 'is-old' : target.classList.contains('is-ok') ? 'is-ok' : 'is-meh');
        fire(0.3);
      });
      tl.fromTo(blank, { scale: 1.35 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)' });
      tl.to({}, { duration: 2.1 });
      return tl;
    });
  },
  leave(slide) {
    stopRounds(slide);
    const blank = slide.querySelector('[data-blank]');
    if (blank.dataset.final) blank.textContent = blank.dataset.final;
    blank.className = 'tk tk--blank';
    $$(slide, '.cj-predict__bars li').forEach((b) => b.classList.remove('is-pick'));
  },
});

/* ── C15 · the vault graph: one case wired to the sources it uses ── */

const VAULT = {
  nodes: [
    { id: 'c1', label: 'CLIENTE-01', x: 470, y: 280, kind: 'case', r: 34 },
    { id: 'tab', label: '05_TABLERO', x: 112, y: 272, kind: 'file' },
    { id: 'pb', label: '02_PLAYBOOK', x: 484, y: 66, kind: 'file' },
    { id: 'fu', label: '03_FUENTES', x: 650, y: 488, kind: 'file' },
    { id: 'l1755', label: 'Ley 1755 de 2015', x: 250, y: 112, kind: 'src' },
    { id: 'l2207', label: 'Ley 2207 de 2022', x: 742, y: 140, kind: 'src' },
    { id: 'd491', label: 'Decreto 491 de 2020', x: 790, y: 330, kind: 'src' },
    { id: 't323', label: 'T-323 de 2024', x: 312, y: 470, kind: 'src' },
    { id: 'c2', label: 'CLIENTE-02', x: 110, y: 470, kind: 'case', r: 28, later: true },
  ],
  edges: [
    ['c1', 'l1755'], ['c1', 'l2207'], ['c1', 't323'], ['c1', 'pb'], ['c1', 'tab'],
    ['l2207', 'd491'], ['fu', 'l2207'], ['fu', 'd491'], ['fu', 't323'], ['fu', 'c1'],
    ['c2', 'l1755', true], ['c2', 't323', true], ['c2', 'tab', true],
  ],
};

// Nodes and edges marked "later" go into one fragment: they join on the next click.
function graph(root, data) {
  const byId = Object.fromEntries(data.nodes.map((n) => [n.id, n]));
  const layers = { base: svg('g', {}, root) };
  const hasLater = data.nodes.some((n) => n.later) || data.edges.some((e) => e[2]);
  const later = hasLater ? svg('g', { class: 'fragment cj-graph__later' }, root) : null;
  const edgeG = svg('g', { class: 'cj-graph__edges' }, layers.base);
  const pulseG = svg('g', { class: 'cj-graph__pulses' }, layers.base);
  const nodeG = svg('g', { class: 'cj-graph__nodes' }, layers.base);
  data.edges.forEach(([a, b, isLater], i) => {
    const A = byId[a];
    const B = byId[b];
    const mx = (A.x + B.x) / 2 + (A.y - B.y) * 0.12;
    const my = (A.y + B.y) / 2 + (B.x - A.x) * 0.12;
    const d = `M${A.x} ${A.y} Q ${mx} ${my}, ${B.x} ${B.y}`;
    const host = isLater ? later : null;
    svg('path', { d, class: 'cj-graph__edge', pathLength: 100 }, host || edgeG);
    svg('path', { d, class: 'cj-syn', pathLength: 100, style: `--d: ${(i * 0.37) % 2.4}s` }, host || pulseG);
  });
  data.nodes.forEach((n) => {
    const g = svg('g', { class: `cj-graph__node is-${n.kind}`, transform: `translate(${n.x} ${n.y})` }, n.later ? later : nodeG);
    svg('circle', { r: n.r || (n.kind === 'file' ? 16 : 20) }, g);
    const t = svg('text', { y: (n.r || 20) + 32 }, g);
    t.textContent = n.label;
  });
  return later;
}

defineCtrl('cj-vault', {
  build(slide) {
    graph(slide.querySelector('.cj-graph'), VAULT);
  },
  enter(slide, { lite }) {
    if (lite) return;
    gsap.fromTo($$(slide, '.cj-graph__edges .cj-graph__edge'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'expo.inOut', stagger: 0.06, delay: 0.5 });
    gsap.fromTo($$(slide, '.cj-graph__nodes .cj-graph__node'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.55, ease: 'back.out(2)', stagger: 0.07, delay: 0.35 });
  },
  fragment(slide, frags, shown) {
    const later = frags.find((f) => f.classList.contains('cj-graph__later'));
    if (!later || !shown || state.lite) return;
    gsap.fromTo(later.querySelectorAll('.cj-graph__edge'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'expo.inOut', stagger: 0.1, delay: 0.2 });
    gsap.fromTo(later.querySelectorAll('.cj-graph__node'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'back.out(2.2)' });
    fire(0.7);
  },
});

/* ── C16 · open book: fragments become points, the question pulls the nearest ── */

const CLUSTERS = [
  { x: 150, y: 140, label: 'Ley 1755' },
  { x: 430, y: 110, label: 'Decreto 491' },
  { x: 470, y: 330, label: 'Ley 2207' },
  { x: 180, y: 380, label: 'CPACA' },
  { x: 320, y: 450, label: 'T-323' },
];
const STAR = { x: 300, y: 215 };

defineCtrl('cj-rag', {
  build(slide) {
    const space = slide.querySelector('.cj-rag__space');
    const r = rand(1755);
    const pts = [];
    CLUSTERS.forEach((c, ci) => {
      for (let k = 0; k < 13; k++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * 78;
        pts.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.8, c: ci });
      }
    });
    const near = pts
      .map((p, i) => [i, (p.x - STAR.x) ** 2 + (p.y - STAR.y) ** 2])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([i]) => i);
    const links = svg('g', { class: 'cj-rag__links' }, space);
    near.forEach((i) => svg('path', { d: `M${STAR.x} ${STAR.y} L${pts[i].x} ${pts[i].y}`, pathLength: 100 }, links));
    const dots = svg('g', { class: 'cj-rag__dots' }, space);
    pts.forEach((p, i) =>
      svg('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 7, class: `c${p.c}${near.includes(i) ? ' is-near' : ''}` }, dots),
    );
    CLUSTERS.forEach((c, ci) => {
      const t = svg('text', { x: c.x, y: c.y - 92, class: `cj-rag__cl c${ci}` }, space);
      t.textContent = c.label;
    });
    const star = svg('g', { class: 'cj-rag__star', transform: `translate(${STAR.x} ${STAR.y})` }, space);
    svg('path', { d: 'M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 9 L-14 19 L-9 3 L-22 -7 L-6 -7 Z' }, star);
  },
  enter(slide, { lite }) {
    if (lite) return;
    const dots = $$(slide, '.cj-rag__dots circle');
    const near = $$(slide, '.cj-rag__dots circle.is-near');
    const links = $$(slide, '.cj-rag__links path');
    const star = slide.querySelector('.cj-rag__star');
    const answer = slide.querySelector('.cj-rag__answer');
    const steps = $$(slide, '.cj-rag__steps li');
    slide.classList.add('is-play');
    rounds(slide, (i) => {
      const tl = gsap.timeline({ delay: i === 0 ? 0.6 : 0 });
      const step = (n) => () => steps.forEach((s, k) => s.classList.toggle('is-on', k === n));
      tl.call(() => {
        answer.classList.remove('is-on');
        near.forEach((n) => n.classList.remove('is-lit'));
      });
      tl.call(step(0));
      tl.fromTo($$(slide, '.cj-rag__docs li'), { x: 0 }, { x: 14, duration: 0.18, yoyo: true, repeat: 1, stagger: 0.06 });
      tl.call(step(1));
      tl.fromTo(dots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: { amount: 0.8, from: 'random' } });
      tl.call(step(2));
      tl.fromTo(star, { scale: 0, rotate: -90, transformOrigin: '50% 50%' }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2.2)' });
      tl.call(step(3));
      tl.fromTo(links, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power2.out', stagger: 0.12 });
      tl.call(() => near.forEach((n) => n.classList.add('is-lit')), null, '<');
      tl.call(step(4), null, '+=0.3');
      tl.call(() => {
        answer.classList.add('is-on');
        fire(0.45);
      });
      tl.to({}, { duration: 3 });
      return tl;
    });
  },
  leave(slide) {
    stopRounds(slide);
    slide.classList.remove('is-play');
    slide.querySelector('.cj-rag__answer')?.classList.remove('is-on');
    $$(slide, '.cj-rag__steps li').forEach((s) => s.classList.remove('is-on'));
    $$(slide, '.cj-rag__dots .is-near').forEach((n) => n.classList.remove('is-lit'));
  },
});

/* ── C17 · think → act → observe, and a permission click on every write ── */

defineCtrl('cj-agent', {
  enter(slide, { lite }) {
    if (lite) return;
    const pulse = slide.querySelector('.cj-loop__pulse');
    const nodes = $$(slide, '.cj-loop__node');
    const cursor = slide.querySelector('.cj-ask__cursor');
    const yes = slide.querySelector('.cj-ask .is-yes');
    const lap = 3.3;
    const light = (n) => () => nodes.forEach((g, k) => g.classList.toggle('is-on', k === n));
    const orbit = gsap.timeline({ repeat: -1 });
    orbit
      .fromTo(pulse, { strokeDashoffset: 8 }, { strokeDashoffset: -100, duration: lap, ease: 'none' }, 0)
      .call(light(0), null, 0)
      .call(light(1), null, lap * 0.33)
      .call(light(2), null, lap * 0.67);
    const ask = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.2 });
    ask
      .fromTo(cursor, { x: 160, y: 90, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' })
      .to(cursor, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
      .call(() => {
        yes.classList.add('is-done');
        fire(0.35);
      })
      .to({}, { duration: 1.4 })
      .to(cursor, { autoAlpha: 0, duration: 0.3 })
      .call(() => yes.classList.remove('is-done'));
  },
  leave(slide) {
    $$(slide, '.cj-loop__node').forEach((g) => g.classList.remove('is-on'));
    slide.querySelector('.cj-ask .is-yes')?.classList.remove('is-done');
  },
});

/* ── R2 · concept map: every foundation ends in a file ── */

const CONCEPTS = {
  nodes: [
    { id: 'llm', label: 'Modelo de lenguaje', x: 150, y: 300, kind: 'core', r: 30 },
    { id: 'hal', label: 'Alucinación', x: 470, y: 110, kind: 'src' },
    { id: 'cut', label: 'Corte de conocimiento', x: 470, y: 300, kind: 'src' },
    { id: 'ctx', label: 'La mesa de trabajo', x: 470, y: 490, kind: 'src' },
    { id: 'cap', label: 'Sistema · contexto · mensaje', x: 760, y: 580, kind: 'src' },
    { id: 'rag', label: 'Libro abierto (RAG)', x: 830, y: 410, kind: 'src' },
    { id: 'ce', label: 'Ingeniería de contexto', x: 1120, y: 580, kind: 'src' },
    { id: 'ag', label: 'Agentes y MCP', x: 1450, y: 580, kind: 'src' },
    { id: 'adn', label: '00_ADN', x: 830, y: 60, kind: 'file' },
    { id: 'rojas', label: '01_LINEAS_ROJAS', x: 1180, y: 100, kind: 'file' },
    { id: 'pb', label: '02_PLAYBOOK', x: 1240, y: 360, kind: 'file' },
    { id: 'fu', label: '03_FUENTES', x: 830, y: 230, kind: 'file' },
    { id: 've', label: '04_VERIFICACION', x: 1500, y: 230, kind: 'file' },
  ],
  edges: [
    ['llm', 'hal'], ['llm', 'cut'], ['llm', 'ctx'], ['hal', 'adn'], ['hal', 've'], ['cut', 'fu'],
    ['ctx', 'cap'], ['ctx', 'rag'], ['cap', 'adn'], ['cap', 'ce'], ['ce', 'pb'], ['ce', 'ag'],
    ['rag', 'fu'], ['ag', 'pb'], ['rojas', 've'], ['adn', 'rojas'],
  ],
};

defineCtrl('cj-concepts', {
  build(slide) {
    graph(slide.querySelector('.cj-concepts__art'), CONCEPTS);
  },
  enter(slide, { lite }) {
    if (lite) return;
    gsap.fromTo($$(slide, '.cj-graph__edge'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'expo.inOut', stagger: 0.05, delay: 0.4 });
    gsap.fromTo($$(slide, '.cj-graph__node'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.06, delay: 0.3 });
    gsap.delayedCall(1.2, () => fire(0.8));
  },
});

/* ── Lite mode and PDF: a still brain where the WebGL one would be ── */

// world units → slide px for the background camera (fov 50°, z = 10, 16:9)
const PX = 960 / (Math.tan((25 * Math.PI) / 180) * 10 * (16 / 9));

function stillBrain(section) {
  const [cx, cy] = (section.dataset.bgCenter || '0,0').split(',').map(Number);
  const r = rand(77);
  const box = svg('svg', { class: 'cj-still', viewBox: '-370 -250 740 520', 'aria-hidden': 'true' });
  for (let i = 0; i < 900; i++) {
    const [x, y] = brainPoint(r);
    svg('circle', { cx: (x * PX).toFixed(1), cy: (-y * PX).toFixed(1), r: 2.6 }, box);
  }
  box.style.left = `${Math.round(960 + cx * PX - 370)}px`;
  box.style.top = `${Math.round(540 - cy * PX - 250)}px`;
  section.appendChild(box);
}

document.querySelectorAll('.reveal .slides section[data-bg="brain"]').forEach(stillBrain);
