// Cerebro Jurídico slide behaviours. Each one is decoration on top of content
// that is already readable (see util.js for the rule).
import { gsap, defineCtrl } from '@engine/core/motion.js';
import { state } from '@engine/core/state.js';
import { config } from '@engine/core/config.js';
import { fire, rounds, stopRounds, miles, copyText } from './util.js';

const $$ = (slide, sel) => [...slide.querySelectorAll(sel)];

/* C01 · the three numbers count up */
defineCtrl('cj-count', {
  enter(slide, { lite }) {
    if (lite) return;
    $$(slide, '[data-count]').forEach((el, i) => {
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      el.dataset.final ??= el.textContent;
      const o = { v: 0 };
      gsap.to(o, {
        v: end,
        duration: 1.5,
        delay: 0.2 + i * 0.3,
        ease: 'expo.out',
        onUpdate: () => (el.textContent = miles(o.v) + suffix),
        onComplete: () => fire(0.35),
      });
    });
  },
  leave(slide) {
    $$(slide, '[data-count]').forEach((el) => {
      if (el.dataset.final) el.textContent = el.dataset.final;
    });
  },
});

/* Trampa · every check lands with a burst; the closing line, a bigger one */
defineCtrl('cj-trap', {
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    const end = frags.some((f) => f.classList.contains('cj-trap__end'));
    fire(end ? 0.9 : 0.35);
    frags
      .filter((f) => f.tagName === 'LI')
      .forEach((li) => gsap.fromTo(li.querySelector('i'), { scale: 2.2, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2.4)' }));
  },
});

/* C02 · the system lights up when it appears */
defineCtrl('cj-vs', {
  fragment(slide, frags, shown) {
    if (shown) fire(0.8);
  },
});

/* C04 · an impulse runs through the neuron, stage by stage, in a loop */
defineCtrl('cj-neuron', {
  enter(slide, { lite }) {
    const hebb = slide.querySelector('.cj-neuron__hebb');
    slide.classList.toggle('is-strong', hebb.classList.contains('visible'));
    if (lite) return;
    slide.classList.add('is-play');
    const steps = $$(slide, '[data-step]');
    const on = (n) => () => steps.filter((s) => s.dataset.step === String(n)).forEach((s) => s.classList.add('is-on'));
    const pulse = (targets, duration, ease = 'none') => [
      targets,
      { strokeDashoffset: 10 },
      { strokeDashoffset: -100, duration, ease, stagger: 0.05 },
    ];
    const grow = (targets, scale) => [
      targets,
      { scale: 1 },
      { scale, transformOrigin: '50% 50%', duration: 0.17, yoyo: true, repeat: 1, ease: 'power2.out' },
    ];
    const q = (sel) => slide.querySelectorAll(sel);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 0.7 });
    tl.call(on(1))
      .fromTo(...pulse(q('.cj-n__dend-pulse path'), 0.75, 'power1.in'))
      .call(on(2), null, '>-0.1')
      .fromTo(...grow(q('.cj-n__soma--a'), 1.2), '<')
      .call(() => fire(0.3), null, '<')
      .call(on(3))
      .fromTo(...pulse(q('.cj-n__axon-pulse:not(.cj-n__axon-pulse--b)'), 1.05))
      .fromTo(q('.cj-n__term path'), { strokeOpacity: 0.4 }, { strokeOpacity: 1, duration: 0.15, yoyo: true, repeat: 1 }, '>-0.05')
      .fromTo(...grow(q('.cj-n__bulbs circle'), 1.4), '<')
      .call(on(4), null, '<')
      .fromTo(q('.cj-n__tx circle'), { x: 0, autoAlpha: 0 }, { x: 56, autoAlpha: 1, duration: 0.45, ease: 'power1.out', stagger: 0.03 }, '<+0.08')
      .to(q('.cj-n__tx circle'), { autoAlpha: 0, duration: 0.15 }, '>-0.05')
      .fromTo(...grow(q('.cj-n__spines circle'), 1.6), '<')
      .fromTo(q('.cj-n__dend--b path'), { strokeOpacity: 0.45 }, { strokeOpacity: 1, duration: 0.2, yoyo: true, repeat: 1 }, '<')
      .fromTo(...grow(q('.cj-n__soma--b'), 1.2), '>-0.1')
      .fromTo(...pulse(q('.cj-n__axon-pulse--b'), 0.6), '>-0.1');
  },
  fragment(slide, frags, shown) {
    const hebb = slide.querySelector('.cj-neuron__hebb');
    if (!frags.includes(hebb)) return;
    slide.classList.toggle('is-strong', shown);
    if (shown) fire(0.9);
  },
  leave(slide) {
    slide.classList.remove('is-play');
    $$(slide, '[data-step]').forEach((s) => s.classList.remove('is-on'));
  },
});

/* C05 · the five functions light up one by one, with a burst each */
defineCtrl('cj-map', {
  enter(slide, { lite }) {
    if (lite) return;
    const rows = $$(slide, '.cj-map__rows li');
    const tl = gsap.timeline({ delay: 0.55 });
    rows.forEach((row, i) => {
      tl.fromTo(row, { x: -48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.55, ease: 'expo.out' }, i * 0.32);
      tl.call(() => fire(0.45), null, i * 0.32);
    });
  },
});

/* C06 · every DOTS letter fires the network when it joins */
defineCtrl('cj-dots', {
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    fire(0.55);
    frags.forEach((g) =>
      gsap.fromTo(
        g.querySelectorAll('.cj-pill, .cj-box'),
        { scale: 0.92, transformOrigin: '50% 50%' },
        { scale: 1, duration: 0.6, ease: 'back.out(2)' },
      ),
    );
  },
});

/* C09 · the files land on the table; what is off the table drifts away */
defineCtrl('cj-table', {
  enter(slide, { lite }) {
    if (lite) return;
    const cards = $$(slide, '.cj-table__cards li');
    gsap.fromTo(
      cards,
      { y: -70, rotate: (i) => (i % 2 ? 4 : -4), autoAlpha: 0 },
      { y: 0, rotate: 0, autoAlpha: 1, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.09, delay: 0.35 },
    );
    gsap.to($$(slide, '.cj-table__out s'), {
      x: (i) => 14 + i * 6,
      autoAlpha: 0.3,
      duration: 2.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      stagger: 0.4,
    });
  },
  fragment(slide, frags, shown) {
    if (!shown || state.lite) return;
    gsap.fromTo($$(slide, '.cj-tokens i'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.08 });
    gsap.fromTo(slide.querySelector('.cj-meter__bar s'), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.out', delay: 0.3 });
  },
});

/* C10 · each account row lands; the warnings fire the network */
defineCtrl('cj-priv', {
  fragment(slide, frags, shown) {
    if (shown && !state.lite) fire(0.45);
  },
});

/* C11 · the citation slots roll through plausible values, then the stamp */
defineCtrl('cj-halluc', {
  enter(slide, { lite }) {
    if (lite) return;
    const slots = $$(slide, '.cj-slot[data-reel]');
    const stamp = slide.querySelector('.cj-cite__stamp');
    const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
    slots.forEach((s) => (s.dataset.final ??= s.textContent));
    rounds(slide, () => {
      const roll = { t: 0 };
      return gsap
        .timeline()
        .set(stamp, { autoAlpha: 0 })
        .call(() => slots.forEach((s) => s.classList.add('is-rolling')))
        .to(roll, {
          t: 1,
          duration: 1.8,
          ease: 'none',
          onUpdate: () =>
            slots.forEach((s) => {
              s.textContent = s.dataset.reel === 'T-' ? `T-${digits(3)}` : `20${digits(2)}`;
            }),
        })
        .call(() =>
          slots.forEach((s) => {
            s.textContent = s.dataset.final;
            s.classList.remove('is-rolling');
          }),
        )
        .fromTo(stamp, { scale: 1.8, rotate: -14, autoAlpha: 0 }, { scale: 1, rotate: -4, autoAlpha: 1, duration: 0.45, ease: 'back.out(2.4)' })
        .call(() => fire(0.4), null, '<')
        .to({}, { duration: 2.6 });
    });
  },
  leave(slide) {
    stopRounds(slide);
    $$(slide, '.cj-slot[data-reel]').forEach((s) => {
      if (s.dataset.final) s.textContent = s.dataset.final;
      s.classList.remove('is-rolling');
    });
  },
});

/* C12 · the cursor clicks "Copiar todo", then the three lines come back */
defineCtrl('cj-load', {
  enter(slide, { lite }) {
    if (lite) return;
    const btn = slide.querySelector('.cj-load__btn');
    const cursor = slide.querySelector('.cj-load__cursor');
    const lines = $$(slide, '.cj-chat__ai li');
    gsap
      .timeline({ delay: 0.6 })
      .fromTo(cursor, { x: 220, y: 120, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' })
      .to(cursor, { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1 })
      .call(() => btn.classList.add('is-done'))
      .fromTo(btn, { scale: 0.96 }, { scale: 1, duration: 0.5, ease: 'expo.out' }, '<')
      .fromTo(slide.querySelector('.cj-chat__me'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out' }, '+=0.15')
      .fromTo(lines, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut', stagger: 0.75, clearProps: 'clipPath' }, '+=0.3')
      .call(() => fire(0.5));
  },
  leave(slide) {
    slide.querySelector('.cj-load__btn')?.classList.remove('is-done');
  },
});

/* Any slide with [data-copy] buttons copies the matching [data-copy-src] */
defineCtrl('cj-copy', {
  init(slide) {
    $$(slide, '[data-copy]').forEach((btn) => {
      const src = slide.querySelector(`[data-copy-src="${btn.dataset.copy}"]`);
      const label = btn.querySelector('.cj-copybtn__label');
      if (!src || !label) return;
      const idle = label.textContent;
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await copyText(src.textContent.replace(/\s+/g, ' ').trim());
        btn.classList.toggle('is-done', ok);
        label.textContent = ok ? 'Copiado' : 'Selecciona y copia';
        gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'expo.out' });
        gsap.fromTo(src, { boxShadow: '0 0 0 0 rgba(157,134,255,0.55)' }, { boxShadow: '0 0 0 22px rgba(157,134,255,0)', duration: 0.9, ease: 'power2.out', clearProps: 'boxShadow' });
        clearTimeout(btn._t);
        btn._t = setTimeout(() => {
          btn.classList.remove('is-done');
          label.textContent = idle;
        }, 2600);
      });
    });
  },
});

/* C14 · the "you are here" marker climbs from level 0 to level 1 */
defineCtrl('cj-ladder', {
  build(slide) {
    const dot = document.createElement('i');
    dot.className = 'cj-ladder__dot';
    dot.setAttribute('aria-hidden', 'true');
    slide.querySelector('.cj-ladder__steps').appendChild(dot);
  },
  enter(slide, { lite }) {
    const dot = slide.querySelector('.cj-ladder__dot');
    const at = (l) => slide.querySelector(`[data-l="${l}"]`);
    const y = (l) => at(l).offsetTop + at(l).offsetHeight / 2;
    gsap.set(dot, { y: y(1) });
    if (lite) return;
    gsap
      .timeline({ delay: 0.5 })
      .fromTo(dot, { y: y(0), scale: 0.6 }, { y: y(1), scale: 1, duration: 1.1, ease: 'expo.inOut' })
      .call(() => fire(0.6));
  },
  fragment(slide, frags, shown) {
    if (shown && !state.lite) fire(0.5);
  },
});

/* C18 · the same task in two chats. Real excerpts come from config.prueba;
   an empty one is removed, so the slide never shows a placeholder. */
const isFilled = (v) => typeof v === 'string' && v.trim() !== '' && !/^\s*\{\{.*\}\}\s*$/.test(v);

defineCtrl('cj-two', {
  build(slide) {
    const p = config.prueba || {};
    let real = false;
    $$(slide, '[data-prueba]').forEach((el) => {
      const v = p[el.dataset.prueba];
      if (isFilled(v)) {
        el.textContent = v.trim();
        real = true;
      } else el.remove();
    });
    const tag = slide.querySelector('[data-two-tag]');
    if (real) tag.textContent = isFilled(p.modelo) ? `Captura real · ${p.modelo.trim()}` : 'Captura real';
    slide.classList.toggle('has-excerpts', real);
  },
  enter(slide, { lite }) {
    if (lite) return;
    gsap.fromTo(
      $$(slide, '.cj-two__checks li'),
      { x: -18, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out', stagger: 0.12, delay: 0.8 },
    );
    gsap.delayedCall(1.4, () => fire(0.5));
  },
});

/* R3 · the sampling dice keeps picking a different bar */
defineCtrl('cj-why', {
  enter(slide, { lite }) {
    if (lite) return;
    const bars = $$(slide, '.cj-why__dice i');
    const order = [0, 0, 1, 0, 2, 0, 3, 1];
    rounds(slide, (i) =>
      gsap
        .timeline()
        .call(() => bars.forEach((b, k) => b.classList.toggle('is-pick', k === order[i % order.length])))
        .to({}, { duration: 0.9 }),
    );
  },
  leave(slide) {
    stopRounds(slide);
    $$(slide, '.cj-why__dice i').forEach((b) => b.classList.remove('is-pick'));
  },
  fragment(slide, frags, shown) {
    if (shown) fire(0.5);
  },
});

/* C21 · the AI output walks through the three gates */
defineCtrl('cj-gates', {
  enter(slide, { lite }) {
    if (lite) return;
    const token = slide.querySelector('.cj-gates__token');
    const gates = $$(slide, '.cj-gates__row li');
    const track = slide.querySelector('.cj-gates__track');
    const xs = gates.map((g) => g.offsetLeft + g.offsetWidth / 2 - token.offsetWidth / 2);
    rounds(slide, () => {
      const tl = gsap.timeline();
      tl.call(() => gates.forEach((g) => g.classList.remove('is-pass')));
      tl.fromTo(token, { x: -token.offsetWidth - 20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
      xs.forEach((x, i) => {
        tl.to(token, { x, duration: 0.7, ease: 'power2.inOut' });
        tl.call(() => {
          gates[i].classList.add('is-pass');
          fire(0.25);
        });
        tl.to({}, { duration: 0.35 });
      });
      tl.to(token, { x: track.offsetWidth, autoAlpha: 0, duration: 0.6, ease: 'power2.in' });
      tl.to({}, { duration: 1.2 });
      return tl;
    });
  },
  leave(slide) {
    stopRounds(slide);
    $$(slide, '.cj-gates__row li').forEach((g) => g.classList.remove('is-pass'));
  },
});

/* C22 · YO DECIDO lands like a seal */
defineCtrl('cj-stamp', {
  enter(slide, { lite }) {
    if (lite) return;
    gsap.fromTo(
      slide.querySelector('.cj-court__stamp span'),
      { scale: 2.6, rotate: -16, autoAlpha: 0 },
      { scale: 1, rotate: -5, autoAlpha: 1, duration: 0.55, ease: 'back.out(2.2)', delay: 1 },
    );
    gsap.delayedCall(1.05, () => fire(0.9));
  },
});
