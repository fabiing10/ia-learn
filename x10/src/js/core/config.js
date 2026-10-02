// Pours config.json into the slides before Reveal starts:
// text values, QR codes, media files, slide order tweaks and cuts.
import config from '../../../config.json';
import qrPlaybook from '../../assets/qr/playbook.svg?raw';
import qrTest from '../../assets/qr/test.svg?raw';
import qrSite from '../../assets/qr/site.svg?raw';
import qrWhatsapp from '../../assets/qr/whatsapp.svg?raw';

export { config };

const QR = { playbook: qrPlaybook, test: qrTest, site: qrSite, whatsapp: qrWhatsapp };

export const isPlaceholder = (v) => typeof v !== 'string' || /^\s*\{\{.*\}\}\s*$/.test(v);

const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), config);

function fillText(el, value, token) {
  if (isPlaceholder(value)) {
    el.textContent = '';
    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.textContent = typeof value === 'string' ? value : `{{${token}}}`;
    el.appendChild(ph);
    el.classList.add('has-ph');
  } else {
    el.textContent = value;
  }
}

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
const AUDIO = /\.(mp3|m4a|wav|ogg|aac)$/i;

/** Builds <img>/<video>/<audio> for a .media box and shows the placeholder if the file is missing. */
function mountMedia(box) {
  const key = box.dataset.media;
  const src = config.media?.[key];
  const token = box.dataset.ph || key;

  const missing = document.createElement('div');
  missing.className = 'media__missing';
  const label = document.createElement('span');
  label.textContent = `{{${token}}}`;
  const hint = document.createElement('small');
  hint.textContent = src ? `Coloca el archivo en ${src}` : 'Falta la ruta en config.json';
  missing.append(label, hint);

  if (!src) {
    box.classList.add('is-missing');
    box.appendChild(missing);
    return;
  }

  let el;
  if (VIDEO.test(src)) {
    el = document.createElement('video');
    el.playsInline = true;
    if (box.hasAttribute('data-loop')) {
      // game clips: silent loop, no controls, started by the slide controller
      el.muted = true;
      el.loop = true;
      el.preload = 'auto';
    } else {
      el.preload = 'metadata';
      el.controls = true;
    }
    if (box.hasAttribute('data-autoplay')) el.setAttribute('data-autoplay', '');
  } else if (AUDIO.test(src)) {
    el = document.createElement('audio');
    el.preload = 'auto';
  } else {
    el = document.createElement('img');
    el.alt = box.dataset.alt || '';
    el.decoding = 'async';
  }
  el.addEventListener('error', () => box.classList.add('is-missing'));
  el.addEventListener(el.tagName === 'IMG' ? 'load' : 'loadedmetadata', () => box.classList.remove('is-missing'));
  el.src = src;
  box.prepend(el);
  box.appendChild(missing);
}

/** Reorders the traffic-light cases (config.semaforoOrden) and drops the ones not listed. */
function orderCases() {
  const list = document.querySelector('[data-cases]');
  if (!list) return;
  const order = Array.isArray(config.semaforoOrden) && config.semaforoOrden.length ? config.semaforoOrden : null;
  if (!order) return;
  const byId = new Map([...list.querySelectorAll('[data-case]')].map((el) => [Number(el.dataset.case), el]));
  byId.forEach((el) => el.remove());
  order.forEach((id) => byId.has(id) && list.appendChild(byId.get(id)));
}

/** Places the AI-made sample on side A or B per round (config.humanoOIa). */
function placeHumanOrAi() {
  document.querySelectorAll('[data-round]').forEach((round) => {
    const name = round.dataset.round;
    const aiSide = (config.humanoOIa?.[name]?.ia || 'B').toUpperCase() === 'A' ? 'A' : 'B';
    round.querySelectorAll('[data-opt]').forEach((opt) => {
      const isAi = opt.dataset.opt === aiSide;
      opt.classList.toggle('is-ai', isAi);
      const slot = opt.querySelector('[data-slot]');
      if (!slot) return;
      const src = isAi ? slot.dataset.ai : slot.dataset.human;
      const [kind, key, token] = src.split(':');
      if (kind === 'media') {
        slot.classList.add('media');
        slot.dataset.media = key;
        slot.dataset.ph = token;
      } else if (kind === 'text') {
        slot.dataset.text = key;
        slot.dataset.ph = token;
      }
    });
  });
}

export function applyConfig(rootEl = document) {
  // Cuts for running late (config.recortes = ["s08", ...])
  (config.recortes || []).forEach((id) => {
    const s = rootEl.querySelector(`section#${CSS.escape(id)}`);
    if (s) s.setAttribute('data-visibility', 'hidden');
  });

  orderCases();
  placeHumanOrAi();

  rootEl.querySelectorAll('[data-config]').forEach((el) => {
    fillText(el, get(el.dataset.config), el.dataset.ph || el.dataset.config);
  });
  rootEl.querySelectorAll('[data-text]').forEach((el) => {
    fillText(el, config.textos?.[el.dataset.text], el.dataset.ph || el.dataset.text);
  });
  rootEl.querySelectorAll('[data-qr]').forEach((el) => {
    el.innerHTML = QR[el.dataset.qr] || '';
    el.classList.toggle('is-pending', el.querySelector('.qr--pending') !== null);
  });
  rootEl.querySelectorAll('.media[data-media], [data-slot].media').forEach(mountMedia);

  // Attribution for licensed example media (config.creditos: { mediaKey: text })
  rootEl.querySelectorAll('.opt [data-slot].media').forEach((slot) => {
    const text = config.creditos?.[slot.dataset.media];
    if (!text) return;
    const credit = document.createElement('span');
    credit.className = 'opt__credit';
    credit.textContent = text;
    slot.closest('.opt').appendChild(credit);
  });
}
