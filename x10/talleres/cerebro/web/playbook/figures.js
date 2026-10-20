// Figures animate once, when they scroll into view. figures.css always describes
// the final state; a figure is "armed" (its parts hidden, screen + motion only)
// until it enters the viewport, then the class is removed and GSAP tweens each part
// FROM its starting point back to the stylesheet's values. Only transforms, opacity
// and SVG strokes move, so nothing shifts the layout. Reduced motion and print get
// the final state with no animation.
import { gsap } from 'gsap';

const CLEAR = 'transform,opacity,strokeDasharray,strokeDashoffset';
const running = new Set();

// Starting point for each data-a kind (see the armed rules in figures.css).
const FROM = {
  fade: { opacity: 0 },
  rise: { opacity: 0, y: 16 },
  drop: { opacity: 0, y: -18 },
  pop: { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' },
  bar: { scaleX: 0 },
  grow: { scaleY: 0 },
};

function reveal(tl, els, at, opts = {}) {
  const list = [...els];
  if (!list.length) return;
  const kind = opts.kind || list[0].dataset.a || 'fade';
  if (kind === 'draw') {
    tl.fromTo(list, { strokeDasharray: 100, strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: opts.duration ?? 0.55, ease: 'power1.inOut', stagger: opts.stagger ?? 0.06 }, at);
    return;
  }
  tl.from(list, { ...FROM[kind], duration: opts.duration ?? 0.5, stagger: opts.stagger ?? 0.08, ease: opts.ease || 'power2.out' }, at);
}

// A short bright dash travelling along each path (pathLength = 100).
function pulse(tl, paths, at, duration = 0.7, stagger = 0.06) {
  const list = [...paths];
  if (!list.length) return;
  tl.fromTo(list, { opacity: 1, strokeDashoffset: 9 }, { strokeDashoffset: -100, duration, ease: 'none', stagger }, at);
  tl.set(list, { opacity: 0 });
}

const visibleSvg = (fig, sel) => [...fig.querySelectorAll(sel)].find((s) => s.getBoundingClientRect().width > 0);

const BUILD = {
  dots(tl, fig) {
    const svg = visibleSvg(fig, 'svg.dots');
    if (!svg) return generic(tl, fig);
    const q = (sel) => svg.querySelectorAll(sel);
    const node = (name) => svg.querySelector(`[data-node="${name}"]`);
    tl.from(svg.querySelector('.soma'), { scale: 0.7, opacity: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)' });
    tl.from(svg.querySelector('.dendrite'), { opacity: 0, duration: 0.4 }, '<0.1');
    tl.addLabel('adn', '-=0.1');
    reveal(tl, q('[data-edges="adn"] .e'), 'adn', { kind: 'draw', duration: 0.6 });
    pulse(tl, q('[data-pulses="adn"] .pulse'), 'adn', 0.75, 0.08);
    reveal(tl, ['D', 'O', 'T', 'S'].map(node), 'adn+=0.45', { kind: 'fade', stagger: 0.08 });
    tl.to(q('.box--glow'), { opacity: 1, duration: 0.25, stagger: 0.08, yoyo: true, repeat: 1 }, 'adn+=0.55');
    tl.addLabel('ia', 'adn+=1.15');
    reveal(tl, q('[data-edges="ia"] .e'), 'ia', { kind: 'draw', duration: 0.5 });
    pulse(tl, q('[data-pulses="ia"] .pulse'), 'ia', 0.6, 0.05);
    tl.from(node('IA'), { opacity: 0, scale: 0.85, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(2)' }, 'ia+=0.55');
    tl.addLabel('out', 'ia+=0.95');
    reveal(tl, q('[data-edges="out"]'), 'out', { kind: 'draw', duration: 0.35 });
    pulse(tl, q('[data-pulses="out"]'), 'out', 0.4);
    tl.from(node('OUT'), { opacity: 0, duration: 0.4 }, 'out+=0.3');
    reveal(tl, q('[data-edges="yo"]'), 'out+=0.65', { kind: 'draw', duration: 0.3 });
    pulse(tl, q('[data-pulses="yo"]'), 'out+=0.65', 0.35);
    tl.from(node('YO'), { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2.4)' }, 'out+=0.95');
  },

  probs(tl, fig) {
    tl.from(fig.querySelectorAll('.prob__fill'), { scaleX: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' });
    const blank = fig.querySelector('[data-probs-blank]');
    const final = blank.textContent;
    const words = ['veinte', 'quince', 'treinta', 'diez', 'veinte', 'quince', final];
    const state = { i: 0 };
    tl.to(state, {
      i: words.length - 1,
      duration: 1.1,
      ease: 'power1.in',
      snap: 'i',
      onUpdate: () => (blank.textContent = words[state.i]),
      onComplete: () => (blank.textContent = final),
    }, '-=0.35');
    reveal(tl, fig.querySelectorAll('.probs__then'), '+=0.05', { kind: 'rise' });
  },

  biblioteca(tl, fig) {
    const line = fig.querySelector('.tl__line');
    const box = line.getBoundingClientRect();
    tl.from(line, { [box.height > box.width ? 'scaleY' : 'scaleX']: 0, duration: 1.3, ease: 'power1.inOut' }, 0);
    const evs = fig.querySelectorAll('.tl__ev[data-a="rise"]');
    reveal(tl, evs, 0.05, { stagger: 0.18 });
    tl.from(fig.querySelectorAll('.tl__books i'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.3, stagger: 0.025, ease: 'power2.out' }, 0.55);
    tl.from(fig.querySelector('.tl__ev--cut'), { opacity: 0, y: -28, duration: 0.6, ease: 'bounce.out' }, 1.0);
    reveal(tl, fig.querySelectorAll('.tl__ev--now'), 1.4, { kind: 'fade', duration: 0.5 });
    reveal(tl, fig.querySelectorAll('.tl-note'), 1.6, { kind: 'rise' });
  },

  cita(tl, fig) {
    // Each masked slot (#) flickers through plausible digits, then settles back on the
    // mask: the figure never lands on a real-looking sentencia number.
    fig.querySelectorAll('[data-slot]').forEach((slot, i) => {
      const final = slot.textContent;
      const state = { t: 0 };
      tl.to(state, {
        t: 1,
        duration: 1.1,
        ease: 'none',
        onUpdate() {
          slot.textContent = [...final]
            .map((ch, k) => (ch === '#' && state.t < 0.55 + (k * 0.35) / final.length ? String(Math.floor(Math.random() * 10)) : ch))
            .join('');
        },
        onComplete: () => (slot.textContent = final),
      }, i * 0.3);
    });
    tl.from(fig.querySelector('.slot--name'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, ease: 'power2.out' }, 0.55);
    tl.from(fig.querySelector('.cite__stamp'), { opacity: 0, scale: 2.4, rotation: -26, duration: 0.55, ease: 'back.out(1.8)' }, 1.45);
    reveal(tl, fig.querySelectorAll('.hq'), 1.6, { stagger: 0.15 });
  },

  rag(tl, fig) {
    const svg = fig.querySelector('.rag__map');
    tl.from(svg.querySelectorAll('.rag__pts .pt'), { opacity: 0, duration: 0.45, stagger: { each: 0.018, from: 'random' } }, 0);
    reveal(tl, fig.querySelectorAll('.rag__steps > li'), 0.15, { stagger: 0.32 });
    tl.from(svg.querySelector('.star'), { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2.2)' }, 0.75);
    tl.from(svg.querySelector('.ring'), { opacity: 0, scale: 0.3, transformOrigin: '50% 50%', duration: 0.7, ease: 'power2.out' }, '<');
    reveal(tl, svg.querySelectorAll('.link'), '+=0.05', { kind: 'draw', duration: 0.4, stagger: 0.14 });
    tl.from(svg.querySelectorAll('.pt--hit'), { attr: { r: 0 }, duration: 0.45, stagger: 0.14, ease: 'back.out(3)' }, '<0.2');
    tl.from(svg.querySelectorAll('.lbl'), { opacity: 0, duration: 0.3, stagger: 0.1 }, '<0.2');
  },

  loop(tl, fig) {
    const ios = fig.querySelectorAll('.io');
    tl.from(ios[0], { opacity: 0, y: -8, duration: 0.3 });
    tl.addLabel('loop');
    const ring = fig.querySelector('[data-loop-pulse]');
    tl.fromTo(ring, { opacity: 1, strokeDasharray: '10 100', strokeDashoffset: 10 }, { strokeDashoffset: -100, duration: 2.4, ease: 'none' }, 'loop');
    tl.set(ring, { opacity: 0 });
    fig.querySelectorAll('.nd-glow').forEach((g, i) => tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.25, yoyo: true, repeat: 1 }, `loop+=${i * 0.8}`));
    reveal(tl, fig.querySelectorAll('.mcp__srv'), 'loop+=0.75', { stagger: 0.14, kind: 'rise' });
    reveal(tl, fig.querySelectorAll('.mcp__lock'), 'loop+=1.6', { kind: 'pop' });
    tl.from(ios[1], { opacity: 0, y: 8, duration: 0.35 }, 'loop+=2.3');
  },

  skill(tl, fig) {
    reveal(tl, fig.querySelectorAll('.skill-when'), 0);
    reveal(tl, fig.querySelectorAll('.skill__step'), 0.15, { stagger: 0.16 });
    tl.from(fig.querySelector('.skill__stop'), { scale: 0, rotation: -90, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2.5)' }, '-=0.15');
  },

  stair(tl, fig) {
    reveal(tl, fig.querySelectorAll('.step'), 0, { stagger: 0.13, kind: 'rise' });
    reveal(tl, fig.querySelectorAll('.you'), '+=0.1', { kind: 'pop' });
  },

  abc(tl, fig) {
    reveal(tl, fig.querySelectorAll('.gate'), 0, { stagger: 0.16 });
    tl.from(fig.querySelectorAll('.gate__ok'), { opacity: 0, scale: 0, duration: 0.35, stagger: 0.35, ease: 'back.out(3)' }, '+=0.1');
    reveal(tl, fig.querySelectorAll('.abc-note'), '+=0.05', { kind: 'fade' });
  },
};

// Every [data-a] part in document order.
function generic(tl, fig) {
  fig.querySelectorAll('[data-a]').forEach((part, i) => reveal(tl, [part], i * 0.08));
}

function play(fig) {
  fig.classList.remove('is-armed');
  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete() {
      const targets = new Set(tl.getChildren(true, true, false).flatMap((t) => t.targets()));
      gsap.set([...targets].filter((t) => t instanceof Element), { clearProps: CLEAR });
      running.delete(tl);
    },
  });
  (BUILD[fig.dataset.fig] || generic)(tl, fig);
  running.add(tl);
}

export function initFigures() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('print').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        play(entry.target);
      }),
    { threshold: 0.2 },
  );
  document.querySelectorAll('[data-fig]').forEach((fig) => {
    fig.classList.add('is-armed');
    io.observe(fig);
  });
}

// Before printing: every running animation jumps to its end.
export function finishFigures() {
  [...running].forEach((tl) => tl.progress(1));
}
