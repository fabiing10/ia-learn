// The quote under the brain. Each one is written word by word: the brain sends a
// packet of light to every word and the word lights up when it lands, the way a
// language model streams tokens. Then the author appears, the quote holds, fades,
// and the next one starts.
//
// The quotes live in the page as a list (#frases) that screen readers read whole
// and that shows the first quote without JS; this animated copy is aria-hidden.
import { splitWords } from './words.js';

const WORD_GAP = 95; // ms between packets
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const visible = () =>
  document.hidden ? new Promise((ok) => document.addEventListener('visibilitychange', ok, { once: true })) : null;

function readQuotes(list) {
  return [...list.querySelectorAll('li')].map((li) => ({
    text: li.querySelector('blockquote').textContent.trim(),
    name: li.querySelector('.who__name').textContent.trim(),
    role: li.querySelector('.who__role').textContent.trim(),
  }));
}

// Typographic quotes hug the first and last words.
function wordSpans(text) {
  const words = splitWords(text);
  return words.map((w, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = (i === 0 ? '“' : '') + w + (i === words.length - 1 ? '”' : '');
    return span;
  });
}

function fill(figure, quote) {
  const text = figure.querySelector('.q__text');
  const spans = wordSpans(quote.text);
  text.replaceChildren(...spans.flatMap((s, i) => (i ? [document.createTextNode(' '), s] : [s])));
  figure.querySelector('.q__name').textContent = quote.name;
  figure.querySelector('.q__role').textContent = quote.role;
  return spans;
}

/** Keeps the figure as tall as its longest quote, so nothing above it moves. */
function reserveHeight(figure, quotes) {
  const probe = figure.cloneNode(true);
  probe.classList.add('q--probe');
  figure.after(probe);
  let max = 0;
  for (const q of quotes) {
    fill(probe, q);
    max = Math.max(max, probe.offsetHeight);
  }
  probe.remove();
  figure.style.minHeight = `${max}px`;
}

export function startQuotes({ list, figure, emit, reduced, onResize }) {
  const quotes = readQuotes(list);
  const caret = document.createElement('i');
  caret.className = 'q__caret';
  const who = figure.querySelector('.q__who');
  const measure = () => {
    reserveHeight(figure, quotes);
    onResize?.();
  };
  measure();
  addEventListener('resize', measure);

  async function write(quote) {
    const spans = fill(figure, quote);
    figure.classList.remove('is-leaving');
    who.classList.remove('is-on');
    if (reduced || !emit) {
      spans.forEach((s) => s.classList.add('is-on'));
      return;
    }
    spans[0].before(caret);
    let shown = 0;
    await new Promise((done) => {
      const show = (s) => {
        if (s.classList.contains('is-on')) return;
        s.classList.add('is-on');
        s.after(caret);
        if (++shown === spans.length) done();
      };
      spans.forEach((s, i) => {
        const target = () => {
          const r = s.getBoundingClientRect();
          return [r.left + r.width / 2, r.top + r.height / 2];
        };
        setTimeout(() => emit(target, () => show(s)), i * WORD_GAP);
        // If the frame loop is paused (background tab), the word still appears.
        setTimeout(() => show(s), i * WORD_GAP + 2500);
      });
    });
  }

  async function run() {
    for (let i = 0; ; i = (i + 1) % quotes.length) {
      await visible();
      const q = quotes[i];
      await write(q);
      await sleep(reduced ? 200 : 350);
      who.classList.add('is-on');
      await sleep(1100);
      caret.remove();
      await sleep(2600 + splitWords(q.text).length * 210);
      figure.classList.add('is-leaving');
      who.classList.remove('is-on');
      await sleep(900);
    }
  }
  run();
  return { measure };
}
