// Workshop landing (/). Progressive enhancement over static HTML: every
// widget reads its content from the markup, so without JS the page still
// shows everything (see the <noscript> rules in index.html).
import './home.css';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const THEME_KEY = 'x10-theme'; // shared with /test and /playbook (same origin)
const RETOS_KEY = 'x10-retos';

// localStorage can throw (private mode, blocked storage); never let it break the page.
const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* not persisted; the UI still works for this visit */
    }
  },
};

// One polite live region for results that appear away from the focused control.
const announcer = document.createElement('p');
announcer.className = 'sr-only';
announcer.setAttribute('aria-live', 'polite');
document.body.append(announcer);
function announce(text) {
  announcer.textContent = '';
  requestAnimationFrame(() => (announcer.textContent = text));
}

/* ---------- Theme ---------- */

function initTheme() {
  const btn = $('#theme');
  const meta = $('meta[name="theme-color"]');
  const root = document.documentElement;

  const apply = (theme) => {
    root.dataset.theme = theme;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    meta?.setAttribute('content', theme === 'dark' ? '#0B0F1A' : '#F7F5F0');
  };

  apply(root.dataset.theme === 'light' ? 'light' : 'dark');

  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!reduceMotion()) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 300);
    }
    apply(next);
    store.set(THEME_KEY, next);
  });

  // Follow the OS only while the visitor has not chosen a theme here.
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!store.get(THEME_KEY)) apply(e.matches ? 'light' : 'dark');
  });
}

/* ---------- Tabs (ARIA tabs pattern, automatic activation) ---------- */

function initTabs(root) {
  const tabs = $$('[role="tab"]', root);
  const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));
  let current = Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));

  const select = (index, { focus = false } = {}) => {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const on = i === current;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panelOf(tab).hidden = !on;
    });
    if (focus) tabs[current].focus({ preventScroll: true });
    root.classList.add('is-live');
    root.dispatchEvent(new CustomEvent('tabchange', { detail: current }));
  };

  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key in keys) next = i + keys[e.key];
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, { focus: true });
    });
  });

  return { select, get current() { return current; }, tabs };
}

/* ---------- 1 · Hero question ---------- */

function initAsk() {
  const opts = $$('[data-ask]');
  const answer = $('#ask-a');
  const big = $('[data-ask-big]');
  const text = $('.ask__text', answer);

  opts.forEach((btn) =>
    btn.addEventListener('click', () => {
      opts.forEach((o) => o.setAttribute('aria-pressed', String(o === btn)));
      big.textContent = btn.dataset.ask === 'si' ? 'Entonces ya empezaste.' : 'Probablemente sí.';
      answer.hidden = false;
      announce(`${big.textContent} ${text.textContent}`);
    }),
  );
}

/* ---------- 3 · Route ---------- */

function initRoute(route, tabsApi) {
  const sync = (step) => {
    route.style.setProperty('--step', step);
    tabsApi.tabs.forEach((tab, i) => {
      if (i < step) tab.dataset.state = 'done';
      else delete tab.dataset.state;
    });
  };
  route.addEventListener('tabchange', (e) => sync(e.detail));
  sync(tabsApi.current);

  $$('[data-next]', route).forEach((btn) =>
    btn.addEventListener('click', () => {
      tabsApi.select(tabsApi.current + 1, { focus: true });
      // Bring the rail back into view when the panel was read past it.
      if (route.getBoundingClientRect().top < 0) {
        route.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
    }),
  );
}

/* ---------- 4 · Semáforo game ---------- */

const LIGHTS = {
  verde: { name: 'Verde', hint: 'Úsala con confianza' },
  amarillo: { name: 'Amarillo', hint: 'Úsala, pero revisa y complementa' },
  rojo: { name: 'Rojo', hint: 'No la uses para esto' },
};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

function initGame(root) {
  const cases = $$('[data-cases] li', root).map((li) => ({
    text: li.textContent.trim(),
    light: li.dataset.light,
    note: li.dataset.note || '',
  }));
  const total = cases.length;
  let index = 0;
  let picks = [];

  // Question view
  const count = el('b', { text: '1' });
  const pips = el('ol', { class: 'play__pips', 'aria-hidden': 'true' }, ...cases.map(() => el('li')));
  const caseText = el('p', { class: 'play__case', tabindex: '-1' });
  const choices = Object.entries(LIGHTS).map(([key, l]) =>
    el(
      'button',
      { class: 'choice', type: 'button', 'data-light': key, 'aria-pressed': 'false' },
      el('span', { class: 'dot', 'aria-hidden': 'true' }),
      el('span', { class: 'choice__name', text: l.name }),
      el('span', { class: 'choice__hint', text: l.hint }),
    ),
  );
  const vName = el('b');
  const vHint = el('span');
  const vDot = el('span', { class: 'dot', 'aria-hidden': 'true' });
  const vNote = el('p', { class: 'verdict__note' });
  const vYou = el('p', { class: 'verdict__you' });
  const verdict = el(
    'div',
    { class: 'verdict' },
    el('p', { class: 'verdict__head' }, vDot, el('span', {}, 'En el taller: ', vName, '. ', vHint)),
    vNote,
    vYou,
  );
  const advance = el('button', { class: 'btn btn--gold', type: 'button' });
  const ask = el(
    'div',
    {},
    el('div', { class: 'play__top' }, el('p', { class: 'play__count' }, 'Caso ', count, ` de ${total}`), pips),
    caseText,
    el('div', { class: 'play__choices', role: 'group', 'aria-label': '¿Qué color le das?' }, ...choices),
    verdict,
    el('div', { class: 'play__foot' }, advance),
  );

  // Summary view
  const score = el('p', { class: 'play__score', tabindex: '-1' });
  const recap = el('ol', { class: 'recap' });
  const restart = el('button', { class: 'btn btn--line', type: 'button', text: 'Volver a empezar' });
  const end = el(
    'div',
    {},
    score,
    el('p', { class: 'play__moral', text: 'La IA propone. Tú decides y respondes por lo que decides.' }),
    recap,
    restart,
  );

  const play = el('div', { class: 'play' }, ask, end);
  root.append(play);

  function showCase() {
    const c = cases[index];
    count.textContent = String(index + 1);
    caseText.textContent = c.text;
    [...pips.children].forEach((pip, i) => {
      pip.classList.toggle('is-current', i === index);
      if (picks[i]) pip.dataset.light = cases[i].light;
      else delete pip.dataset.light;
    });
    choices.forEach((b) => {
      b.setAttribute('aria-pressed', 'false');
      b.removeAttribute('aria-disabled');
      b.classList.remove('is-answer');
    });
    delete play.dataset.light;
    verdict.hidden = true;
    advance.hidden = true;
    ask.hidden = false;
    end.hidden = true;
  }

  function choose(btn) {
    if (picks[index]) return;
    const c = cases[index];
    const pick = btn.dataset.light;
    picks[index] = pick;

    choices.forEach((b) => {
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-pressed', String(b === btn));
      b.classList.toggle('is-answer', b.dataset.light === c.light);
    });
    play.dataset.light = c.light;
    const pip = pips.children[index];
    pip.dataset.light = c.light;

    vDot.parentElement.dataset.light = c.light;
    vName.textContent = LIGHTS[c.light].name;
    vHint.textContent = LIGHTS[c.light].hint + '.';
    vNote.textContent = c.note;
    vNote.hidden = !c.note;
    vYou.textContent =
      pick === c.light ? 'Coincides.' : `Tú elegiste ${LIGHTS[pick].name.toLowerCase()}.`;
    verdict.hidden = false;

    advance.textContent = index < total - 1 ? 'Siguiente caso' : 'Ver resumen';
    advance.hidden = false;
    announce(`En el taller: ${LIGHTS[c.light].name}. ${c.note} ${vYou.textContent}`);
    advance.focus({ preventScroll: true });
  }

  function showEnd() {
    const hits = picks.filter((p, i) => p === cases[i].light).length;
    score.textContent = `Coincidiste en ${hits} de ${total} casos.`;
    recap.replaceChildren(
      ...cases.map((c, i) =>
        el(
          'li',
          { 'data-light': c.light },
          el('span', { class: 'dot', 'aria-hidden': 'true' }),
          el('span', {}, el('span', { class: 'sr-only', text: `${LIGHTS[c.light].name}: ` }), c.text),
          ...(picks[i] !== c.light
            ? [el('span', { class: 'recap__you', text: `En el taller: ${LIGHTS[c.light].name.toLowerCase()}. Tú elegiste ${LIGHTS[picks[i]].name.toLowerCase()}.` })]
            : []),
        ),
      ),
    );
    delete play.dataset.light;
    ask.hidden = true;
    end.hidden = false;
    score.focus({ preventScroll: true });
  }

  choices.forEach((b) => b.addEventListener('click', () => choose(b)));
  advance.addEventListener('click', () => {
    index += 1;
    if (index >= total) return showEnd();
    showCase();
    caseText.focus({ preventScroll: true });
  });
  restart.addEventListener('click', () => {
    index = 0;
    picks = [];
    showCase();
    caseText.focus({ preventScroll: true });
  });

  showCase();
}

/* ---------- 6 · Weekly challenges ---------- */

function initRetos(root) {
  const boxes = $$('[data-reto]', root);
  const count = $('[data-retos-count]', root);
  let saved = {};
  try {
    saved = JSON.parse(store.get(RETOS_KEY) || '{}') || {};
  } catch {
    saved = {};
  }

  const update = () => {
    const done = boxes.filter((b) => b.checked).length;
    count.textContent = `${done} de ${boxes.length} cumplidos`;
  };

  boxes.forEach((box) => {
    box.checked = Boolean(saved[box.dataset.reto]);
    box.addEventListener('change', () => {
      saved[box.dataset.reto] = box.checked;
      store.set(RETOS_KEY, JSON.stringify(saved));
      update();
    });
  });
  update();
}

/* ---------- Top bar: border when scrolled + current section ---------- */

function initBar() {
  const bar = $('#bar');
  const onScroll = () => bar.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = new Map($$('.bar__nav a').map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(entry.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  ['inicio', ...links.keys()].forEach((id) => {
    const section = document.getElementById(id);
    if (section) io.observe(section);
  });
}

/* ---------- Boot ---------- */

initTheme();
initAsk();
const tabsByRoot = new Map($$('[data-tabs]').map((root) => [root, initTabs(root)]));
const route = $('[data-route]');
if (route) initRoute(route, tabsByRoot.get(route));
const game = $('[data-game]');
if (game) initGame(game);
const retos = $('[data-retos]');
if (retos) initRetos(retos);
initBar();
