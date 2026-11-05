// Reading mode for phones (generic; can move to src/js/slides/).
//
// A 1920×1080 slide scaled to a 390 px screen is unreadable, so on narrow or
// very short viewports the deck becomes one scrolling page: every slide is
// cloned, in order, into <main class="doc">, and the Reveal deck stays hidden
// underneath (it still boots, so nothing else in the engine changes).
//
//  - Decided once, at load, before Reveal starts. ?lectura forces it.
//  - Never in the speaker view (?receiver) or the PDF export (?print-pdf).
//  - Clones get every id prefixed with "doc-" (and the references to them).
//  - Links to #/<id> scroll to that slide; a floating «Índice» link goes back.
//  - Reveal's keyboard is kept away so arrows and space scroll the page.
// Widgets inside slides (prompt boxes, notes) listen on document, so they
// work the same in both copies.
const root = document.documentElement;
const NARROW = '(max-width: 760px), (max-height: 520px)';
const PREFIX = 'doc-';

const forced = /[?&]lectura\b/.test(location.search);
const skip = root.classList.contains('is-receiver') || root.classList.contains('is-print');
const wanted = forced || window.matchMedia?.(NARROW).matches;

const REF_ATTRS = ['for', 'aria-controls', 'aria-labelledby', 'aria-describedby'];
const URL_ATTRS = ['marker-start', 'marker-mid', 'marker-end', 'fill', 'stroke', 'clip-path', 'mask', 'filter'];

/** Prefixes ids inside a clone and rewrites what points at them. */
function renameIds(clone) {
  const ids = new Set([clone, ...clone.querySelectorAll('[id]')].filter((el) => el.id).map((el) => el.id));
  const fix = (v) => v.split(/\s+/).map((t) => (ids.has(t) ? PREFIX + t : t)).join(' ');
  [clone, ...clone.querySelectorAll('*')].forEach((el) => {
    if (el.id) el.id = PREFIX + el.id;
    REF_ATTRS.forEach((a) => el.hasAttribute(a) && el.setAttribute(a, fix(el.getAttribute(a))));
    URL_ATTRS.forEach((a) => {
      const v = el.getAttribute(a);
      if (v?.includes('url(#')) el.setAttribute(a, v.replace(/url\(#([^)]+)\)/g, (m, id) => (ids.has(id) ? `url(#${PREFIX}${id})` : m)));
    });
  });
}

function slideOf(hash) {
  const id = decodeURIComponent((hash || '').replace(/^#\/?/, '').split('/')[0]);
  return id ? document.getElementById(PREFIX + id) : null;
}

function buildDoc() {
  const doc = document.createElement('main');
  doc.className = 'doc';
  doc.setAttribute('aria-label', document.title);
  document.querySelectorAll('.reveal .slides > section').forEach((s) => {
    const clone = s.cloneNode(true);
    clone.removeAttribute('hidden');
    clone.removeAttribute('aria-hidden');
    renameIds(clone);
    doc.appendChild(clone);
  });
  const top = document.createElement('a');
  top.className = 'doc__top';
  top.href = '#/indice';
  top.textContent = 'Índice';
  doc.appendChild(top);
  document.body.appendChild(doc);
  return doc;
}

if (wanted && !skip) {
  // Lite: no WebGL background behind a page nobody sees as slides.
  root.classList.add('is-doc', 'is-lite');
  buildDoc();

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a) return;
    const target = slideOf(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ block: 'start' });
    history.replaceState(null, '', a.getAttribute('href'));
  });

  // Reveal listens on document; stopping keys at window keeps them for the page.
  window.addEventListener('keydown', (e) => e.stopPropagation(), true);

  const initial = location.hash;
  window.addEventListener('load', () => {
    const target = slideOf(initial);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  });
}

export const reading = root.classList.contains('is-doc');
