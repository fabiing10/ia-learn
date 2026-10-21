// /vibecoding/ — landing of Vibe Coding · Clase 1.
// Every section renders from shared/content.js (checked against the plan by
// shared/content.test.mjs); this file wires them together.

import { bindThemeToggle, ICONS } from '../shared/ui.js';
import { TESIS, CLASE_2 } from '../shared/content.js';
import { initEncuesta } from './encuesta.js';
import { initPiezas } from './piezas.js';
import { initBuilder } from './builder.js';
import { initMenu } from './menu.js';
import { initReglas } from './reglas.js';
import { initSalida } from './salida.js';

const $ = (sel) => document.querySelector(sel);

function fillStatic() {
  $('[data-tesis]').textContent = TESIS;
  $('[data-clase2]').textContent = `Cómo funciona la clase 2: no es otra clase magistral. ${CLASE_2}`;
}

function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (!el.firstElementChild) el.innerHTML = ICONS[el.dataset.icon] ?? '';
  });
}

/** Highlights the nav link of the section in view. */
function scrollSpy() {
  const links = new Map([...document.querySelectorAll('.bar__nav a')].map((a) => [a.hash.slice(1), a]));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a, id) => (id === e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
        // Keep the active link visible in the scrollable mobile nav.
        const nav = $('.bar__nav');
        const a = links.get(e.target.id);
        if (a && nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: 'auto' });
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/** Sections fill in after the first paint; re-apply a #hash from a QR code. */
function restoreHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id && document.getElementById(id);
  if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
}

fillStatic();
bindThemeToggle($('#theme'));

const builder = initBuilder();
initEncuesta();
initPiezas();
initMenu({ builder });
initReglas();
initSalida();

fillIcons();
scrollSpy();
restoreHash();
