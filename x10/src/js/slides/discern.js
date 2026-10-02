// Block 5: the traffic light (S21) and the 8-case exercise (S22).
import { gsap, defineCtrl } from '../core/motion.js';
import { readStep, addDrivers } from '../core/stepper.js';
import { state } from '../core/state.js';

export const VERDICT = {
  go: 'Úsala con confianza',
  wait: 'Úsala, pero revisa y complementa',
  stop: 'No la uses para esto',
};

/* S21 · lamps light up in order: green, yellow, red */
defineCtrl('semaforo', {
  enter(slide, { lite }) {
    const rows = slide.querySelectorAll('.light__row');
    const lamps = slide.querySelectorAll('.light__row .lamp i');
    if (lite) {
      gsap.set(lamps, { opacity: 1 });
      return;
    }
    gsap.fromTo(slide.querySelector('.light'), { clipPath: 'inset(0% 100% 0% 0% round 200px)' }, { clipPath: 'inset(0% 0% 0% 0% round 200px)', duration: 0.8, ease: 'expo.inOut', delay: 0.1, clearProps: 'clipPath' });
    gsap.fromTo(rows, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', stagger: 0.12, delay: 0.2 });
    gsap.fromTo(lamps, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out', stagger: 0.18, delay: 0.35 });
  },
  print(slide) {
    slide.querySelectorAll('.lamp').forEach((l) => l.classList.add('is-lit'));
  },
});

/* S22 · ¿Qué color es? — show case, room answers, reveal; one case at a time */
function frameFor(card) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('case__frame');
  svg.innerHTML = '<rect />';
  card.appendChild(svg);
}

function sizeFrame(card) {
  const svg = card.querySelector('.case__frame');
  const w = card.offsetWidth + 6;
  const h = card.offsetHeight + 6;
  if (!w || !h) return;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const r = svg.querySelector('rect');
  Object.entries({ x: 4, y: 4, width: w - 8, height: h - 8, rx: 38 }).forEach(([k, v]) => r.setAttribute(k, v));
}

function render(slide, animate) {
  const cards = [...slide.querySelectorAll('.case')];
  const step = readStep(slide).name; // null | "c3:show" | "c3:reveal"
  let idx = 0;
  let revealed = false;
  if (step) {
    const [c, phase] = step.split(':');
    idx = Number(c.slice(1));
    revealed = phase === 'reveal';
  }
  const prevIdx = slide.dataset.idx != null ? Number(slide.dataset.idx) : -1;
  const wasRevealed = slide.dataset.revealed === '1';
  const card = cards[idx];
  const v = card.dataset.verdict;

  cards.forEach((c, i) => {
    c.classList.toggle('is-current', i === idx);
    c.classList.toggle('is-revealed', i === idx && revealed);
  });

  // housing lamps
  slide.querySelectorAll('.cases__light .lamp').forEach((lamp) => {
    const lit = revealed && lamp.classList.contains(`lamp--${v}`);
    lamp.classList.toggle('is-lit', lit);
  });

  // track
  slide.querySelectorAll('.cases__dot').forEach((dot, i) => {
    dot.classList.toggle('is-current', i === idx);
    if (i < idx || (i === idx && revealed)) dot.dataset.v = cards[i].dataset.verdict;
    else delete dot.dataset.v;
  });
  slide.querySelector('.cases__count').textContent = `Caso ${idx + 1} de ${cards.length}`;

  const rect = card.querySelector('.case__frame rect');

  // Cards that are neither current nor animating out go back to pure CSS state
  cards.forEach((c, i) => {
    if (i === idx || c.classList.contains('is-exiting')) return;
    gsap.killTweensOf(c);
    gsap.set(c, { clearProps: 'transform,opacity,visibility' });
  });

  if (animate && idx !== prevIdx && prevIdx >= 0) {
    const dir = idx > prevIdx ? 1 : -1;
    const old = cards[prevIdx];
    if (old && old !== card) {
      gsap.killTweensOf(old);
      old.classList.add('is-exiting');
      gsap.to(old, {
        xPercent: -6 * dir,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          old.classList.remove('is-exiting');
          gsap.set(old, { clearProps: 'transform,opacity,visibility' });
        },
      });
    }
    gsap.killTweensOf(card);
    gsap.fromTo(
      card,
      { xPercent: 6 * dir, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.1, clearProps: 'transform,opacity' },
    );
    gsap.fromTo(card.querySelector('.case__text'), { yPercent: 30 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', delay: 0.1 });
  }

  if (revealed && (!wasRevealed || idx !== prevIdx)) {
    if (animate) {
      gsap.fromTo(rect, { drawSVG: '0%', opacity: 1 }, { drawSVG: '100%', duration: 0.8, ease: 'expo.inOut' });
      gsap.fromTo(card.querySelector('.case__verdict'), { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'expo.out', delay: 0.1 });
      gsap.fromTo(card.querySelector('.case__note'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'expo.out', delay: 0.2 });
      gsap.fromTo(card.querySelector('.case__wash'), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
      const lamp = slide.querySelector(`.cases__light .lamp--${v} i`);
      gsap.fromTo(lamp, { scale: 0.5 }, { scale: 1, duration: 0.6, ease: 'expo.out' });
    } else {
      gsap.set(rect, { drawSVG: '100%', opacity: 1 });
    }
  } else if (!revealed) {
    gsap.set(rect, { opacity: 0 });
  }

  slide.dataset.idx = String(idx);
  slide.dataset.revealed = revealed ? '1' : '0';
}

defineCtrl('cases', {
  build(slide) {
    const cards = [...slide.querySelectorAll('.case')];
    const names = [];
    cards.forEach((card, i) => {
      const v = card.dataset.verdict;
      card.insertAdjacentHTML('afterbegin', '<span class="case__wash" aria-hidden="true"></span>');
      const verdict = document.createElement('p');
      verdict.className = 'case__verdict';
      verdict.innerHTML = `<span class="lamp lamp--${v} is-lit" aria-hidden="true"><i></i></span>`;
      verdict.append(VERDICT[v]);
      card.appendChild(verdict);
      if (card.dataset.note) {
        const note = document.createElement('p');
        note.className = 'case__note';
        note.textContent = card.dataset.note;
        card.appendChild(note);
      }
      frameFor(card);
      if (i > 0) names.push(`c${i}:show`);
      names.push(`c${i}:reveal`);
    });
    addDrivers(slide, names);
    const track = slide.querySelector('.cases__track');
    track.innerHTML = cards.map(() => '<span class="cases__dot"></span>').join('') + '<span class="cases__count"></span>';
  },
  prepare(slide) {
    slide.querySelectorAll('.case').forEach(sizeFrame);
  },
  enter(slide, { lite }) {
    slide.querySelectorAll('.case').forEach(sizeFrame);
    delete slide.dataset.idx;
    delete slide.dataset.revealed;
    render(slide, !lite);
  },
  fragment(slide) {
    render(slide, !state.lite);
  },
  print(slide) {
    slide.querySelectorAll('.case').forEach((c) => c.classList.add('is-current', 'is-revealed'));
    const dots = slide.querySelectorAll('.cases__dot');
    slide.querySelectorAll('.case').forEach((c, i) => {
      if (dots[i]) dots[i].dataset.v = c.dataset.verdict;
    });
  },
});
