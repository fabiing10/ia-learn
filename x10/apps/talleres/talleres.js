// /talleres/ — index of every workshop in talleres.config.js.
import './talleres.css';
import { TALLERES } from '@platform/talleres.config.js';
import { bindThemeToggle } from '../shared/ui.js';

const LINKS = [
  ['landing', 'Landing'],
  ['presentacion', 'Presentación'],
  ['playbook', 'Playbook'],
  ['test', 'Test'],
];

const isPlaceholder = (v) => typeof v !== 'string' || /^\s*\{\{.*\}\}\s*$/.test(v);

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text != null) node.textContent = text;
  return node;
}

function card(t) {
  const li = el('li', { class: 'hub-card' });
  li.style.setProperty('--accent', t.marca?.color || 'var(--gold)');

  const head = el('div', { class: 'hub-card__head' });
  head.append(el('span', { class: 'hub-card__mark', 'aria-hidden': 'true' }, t.marca?.acento || '·'));
  const title = el('h2', { class: 'hub-card__title' });
  title.append(el('a', { href: t.enlaces.landing }, t.nombre));
  head.append(title);

  const date = el('p', { class: 'hub-card__date' }, isPlaceholder(t.fecha) ? 'Fecha por confirmar' : t.fecha);
  const summary = el('p', { class: 'hub-card__summary' }, t.resumen);

  const nav = el('nav', { class: 'hub-card__links', 'aria-label': `Materiales de ${t.nombre}` });
  LINKS.forEach(([key, label]) => {
    if (!t.enlaces[key]) return;
    nav.append(el('a', { class: key === 'landing' ? 'btn btn--accent' : 'btn btn--ghost', href: t.enlaces[key] }, label));
  });

  li.append(head, date, summary, nav);
  return li;
}

document.getElementById('lista').append(...TALLERES.map(card));
bindThemeToggle(document.querySelector('[data-theme-toggle]'));
