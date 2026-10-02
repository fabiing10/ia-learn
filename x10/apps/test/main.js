// /test — public profiling questionnaire + personal diagnosis.
// One question per screen, branching from shared/questions.js, scoring from
// shared/diagnosis.js, persistence through shared/supabase.js (or demo mode).

import '../shared/app.css';
import './test.css';
import {
  DEFAULT_SESSION, FEAR_LABELS, getPath, resolveTitle, isAnswered, pruneAnswers,
} from '../shared/questions.js';
import { diagnose, LEVELS, LEVEL_ORDER, DIMENSION_LABELS } from '../shared/diagnosis.js';
import { buildRow, cleanSession, validateAlias } from '../shared/data.js';
import { isDemo, submitResponse, flushQueue } from '../shared/supabase.js';
import { esc, bindThemeToggle, toast, ICONS, reducedMotion, readParam } from '../shared/ui.js';

const session = cleanSession(readParam('s'));
const PROGRESS_KEY = `x10-test-progress:${session}`;
const RESULT_KEY = `x10-test-result:${session}`;
const ADVANCE_MS = 260;

const SECTION = {
  perfil: 'Tu perfil',
  uso: 'Tu uso hoy',
  fundamentos: 'Fundamentos',
  aplicacion: 'Aplicación',
  discernimiento: 'Discernimiento',
  temor: 'Temores',
  meta: 'Tu meta',
};

const SAVE_COPY = {
  pending: 'Enviando tus respuestas…',
  saved: 'Respuestas enviadas. ¡Gracias!',
  demo: 'Modo demo: guardado solo en este dispositivo.',
  queued: 'Sin conexión: las enviaremos cuando vuelvas a abrir esta página.',
  error: 'No pudimos guardar tus respuestas, pero tu resultado es válido.',
};

const screen = document.getElementById('screen');
const announcer = document.getElementById('announce');

const state = {
  view: 'intro',
  index: 0,
  answers: {},
  alias: '',
  startedAt: 0,
  result: null,
  save: null,
  busy: false,
};

// ── Storage (best effort; the test works without it) ──

const store = {
  get(area, key) {
    try {
      return JSON.parse(area.getItem(key));
    } catch {
      return null;
    }
  },
  set(area, key, value) {
    try {
      area.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  del(area, key) {
    try {
      area.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

const saveProgress = () =>
  store.set(sessionStorage, PROGRESS_KEY, {
    index: state.index,
    answers: state.answers,
    alias: state.alias,
    startedAt: state.startedAt,
  });

// ── Path helpers ──

const path = () => getPath(state.answers);
const current = () => path()[state.index];

// Until role and usage are known, count the longest path so progress never jumps back.
const plannedTotal = () => getPath({ role: 'empleado', usage: 'diario', ...state.answers }).length;

// ── Rendering ──

function swap(html, { focus = 'h1' } = {}) {
  const apply = () => {
    screen.innerHTML = html;
    screen.classList.remove('is-leaving');
    if (!reducedMotion()) {
      screen.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.remove('is-entering')));
    }
    const target = focus && screen.querySelector(focus);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  if (reducedMotion() || !screen.firstElementChild) return apply();
  screen.classList.add('is-leaving');
  setTimeout(apply, 140);
}

function xProgress(done, total) {
  return Array.from({ length: total }, (_, i) => {
    const cls = i < done ? 'is-done' : i === done ? 'is-now' : '';
    return `<li class="xs__i ${cls}">×</li>`;
  }).join('');
}

function optionButton(o, i, { pressed, kind }) {
  const key = String.fromCharCode(65 + i);
  return `
    <button type="button" class="opt opt--${kind}${pressed ? ' is-on' : ''}" aria-pressed="${pressed}"
      data-action="pick" data-value="${esc(o.value)}">
      ${kind === 'chip' ? '' : `<span class="opt__key" aria-hidden="true">${key}</span>`}
      <span class="opt__text">
        <span class="opt__label">${esc(o.label)}</span>
        ${o.hint ? `<span class="opt__hint">${esc(o.hint)}</span>` : ''}
      </span>
      <span class="opt__tick" aria-hidden="true">${ICONS.check}</span>
    </button>`;
}

function renderBody(q) {
  const a = state.answers;
  switch (q.type) {
    case 'cards':
      return `<div class="opts opts--cards" role="group" aria-labelledby="qt">${q.options
        .map((o, i) => optionButton(o, i, { pressed: a[q.id] === o.value, kind: 'card' }))
        .join('')}</div>`;
    case 'chips':
      return `<div class="opts opts--chips" role="group" aria-labelledby="qt">${q.options
        .map((o, i) => optionButton(o, i, { pressed: a[q.id] === o.value, kind: 'chip' }))
        .join('')}</div>`;
    case 'binary':
      return `<div class="opts opts--binary" role="group" aria-labelledby="qt">${q.options
        .map((o, i) => optionButton(o, i, { pressed: a[q.id] === o.value, kind: 'tile' }))
        .join('')}</div>`;
    case 'multi': {
      const picks = a[q.id] ?? [];
      return `<div class="opts opts--chips" role="group" aria-labelledby="qt">${q.options
        .map((o, i) => optionButton(o, i, { pressed: picks.includes(o.value), kind: 'chip' }))
        .join('')}</div>`;
    }
    case 'semaforo':
      return `
        <figure class="case">
          <figcaption class="eyebrow">El caso</figcaption>
          <p class="case__text">${esc(q.case)}</p>
        </figure>
        <div class="opts opts--lights" role="group" aria-labelledby="qt">${q.options
          .map(
            (o) => `
            <button type="button" class="light light--${o.value}${a[q.id] === o.value ? ' is-on' : ''}"
              aria-pressed="${a[q.id] === o.value}" data-action="pick" data-value="${o.value}">
              <span class="light__lamp" aria-hidden="true"></span>
              <span class="opt__text"><span class="opt__label">${esc(o.label)}</span>
              <span class="opt__hint">${esc(o.hint)}</span></span>
            </button>`,
          )
          .join('')}</div>`;
    case 'fear': {
      const v = a.fear_level;
      const picks = a.worries ?? [];
      return `
        <div class="fear${v ? '' : ' is-untouched'}" style="--v:${v ?? 3}">
          <output class="fear__out" for="fear" aria-hidden="true">
            <span class="fear__num">${v ?? '–'}</span>
            <span class="fear__word">${v ? FEAR_LABELS[v] : 'Desliza para responder'}</span>
          </output>
          <input id="fear" class="fear__range" type="range" min="1" max="5" step="1" value="${v ?? 3}"
            aria-labelledby="qt" aria-valuetext="${v ? `${v}, ${FEAR_LABELS[v]}` : 'Sin responder'}" />
          <div class="fear__scale" aria-hidden="true">${[1, 2, 3, 4, 5]
            .map((n) => `<span class="${v === n ? 'is-on' : ''}">${n}<small>${FEAR_LABELS[n]}</small></span>`)
            .join('')}</div>
        </div>
        <div class="extra">
          <h2 class="extra__title" id="qx">${esc(q.extra.title)}</h2>
          <p class="q__hint">${esc(q.extra.hint)}</p>
          <div class="opts opts--chips" role="group" aria-labelledby="qx">${q.extra.options
            .map((o, i) => optionButton(o, i, { pressed: picks.includes(o.value), kind: 'chip' }).replace(
              'data-action="pick"',
              'data-action="pick-extra"',
            ))
            .join('')}</div>
        </div>`;
    }
    default:
      return '';
  }
}

const needsNext = (q) => q.type === 'multi' || q.type === 'fear';

function renderQuestion() {
  const q = current();
  const total = plannedTotal();
  const n = state.index + 1;
  const title = resolveTitle(q, state.answers);
  const isLast = state.index === path().length - 1;
  swap(`
    <section class="q q--${q.type}" data-q="${q.id}">
      <div class="q__progress">
        <button type="button" class="icon-btn q__back" data-action="back"
          aria-label="${state.index === 0 ? 'Volver al inicio' : 'Pregunta anterior'}">${ICONS.back}</button>
        <ol class="xs" aria-hidden="true" style="--n:${total}">${xProgress(state.index, total)}</ol>
        <span class="q__count"><span class="sr-only">Pregunta </span>${n}<span aria-hidden="true">/</span><span class="sr-only"> de </span>${total}</span>
      </div>
      <p class="eyebrow">${SECTION[q.dim] ?? ''}</p>
      <h1 class="q__title" id="qt">${esc(title)}</h1>
      ${q.hint ? `<p class="q__hint">${esc(q.hint)}</p>` : ''}
      <div class="q__body">${renderBody(q)}</div>
      ${
        needsNext(q)
          ? `<div class="q__actions">
              ${q.max ? `<span class="q__meter" aria-live="polite">${(state.answers[q.id] ?? []).length} de ${q.max}</span>` : '<span></span>'}
              <button type="button" class="btn btn--gold" data-action="next" ${isAnswered(q, state.answers) ? '' : 'disabled'}>
                ${isLast ? 'Ver mi nivel' : 'Siguiente'} ${ICONS.next}
              </button>
            </div>`
          : ''
      }
    </section>`);
  announcer.textContent = `Pregunta ${n} de ${total}`;
}

/** Updates pressed states in place (no re-render) after a tap. */
function syncPressed(q) {
  const a = state.answers;
  screen.querySelectorAll('[data-action="pick"]').forEach((b) => {
    const v = b.dataset.value;
    const on = q.type === 'multi' ? (a[q.id] ?? []).includes(v) : a[q.id] === v;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  screen.querySelectorAll('[data-action="pick-extra"]').forEach((b) => {
    const on = (a.worries ?? []).includes(b.dataset.value);
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
  if (q.max) {
    const count = (a[q.id] ?? []).length;
    const meter = screen.querySelector('.q__meter');
    if (meter) meter.textContent = `${count} de ${q.max}`;
    screen.querySelectorAll('[data-action="pick"]').forEach((b) => {
      const blocked = count >= q.max && !b.classList.contains('is-on');
      b.toggleAttribute('data-blocked', blocked);
    });
  }
  const next = screen.querySelector('[data-action="next"]');
  if (next) next.disabled = !isAnswered(q, a);
}

function toggleIn(list = [], value, { max = Infinity, exclusive = [] } = {}) {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (exclusive.includes(value)) return [value];
  const rest = list.filter((v) => !exclusive.includes(v));
  return rest.length >= max ? rest : [...rest, value];
}

function pick(value) {
  const q = current();
  if (!q || state.busy || state.view !== 'question') return;
  if (q.type === 'multi') {
    const before = state.answers[q.id] ?? [];
    const after = toggleIn(before, value, { max: q.max, exclusive: q.exclusive });
    if (after.length === before.length && !before.includes(value) && q.max) toast(`Máximo ${q.max}. Quita una para cambiar.`);
    state.answers[q.id] = after;
    syncPressed(q);
    saveProgress();
    return;
  }
  state.answers[q.id] = value;
  syncPressed(q);
  saveProgress();
  state.busy = true;
  setTimeout(() => {
    state.busy = false;
    next();
  }, reducedMotion() ? 120 : ADVANCE_MS);
}

function pickExtra(value) {
  const q = current();
  state.answers.worries = toggleIn(state.answers.worries, value, { max: q.extra.max, exclusive: q.extra.exclusive });
  syncPressed(q);
  saveProgress();
}

function setFear(v) {
  const n = Math.max(1, Math.min(5, Number(v)));
  state.answers.fear_level = n;
  const box = screen.querySelector('.fear');
  box.classList.remove('is-untouched');
  box.style.setProperty('--v', n);
  box.querySelector('.fear__num').textContent = n;
  box.querySelector('.fear__word').textContent = FEAR_LABELS[n];
  box.querySelector('.fear__range').setAttribute('aria-valuetext', `${n}, ${FEAR_LABELS[n]}`);
  box.querySelectorAll('.fear__scale span').forEach((s, i) => s.classList.toggle('is-on', i + 1 === n));
  syncPressed(current());
  saveProgress();
}

function next() {
  const q = current();
  if (state.view !== 'question' || !q || !isAnswered(q, state.answers)) return;
  if (state.index >= path().length - 1) return finish();
  state.index += 1;
  saveProgress();
  renderQuestion();
}

function back() {
  if (state.index === 0) {
    state.view = 'intro';
    return renderIntro();
  }
  state.index -= 1;
  saveProgress();
  renderQuestion();
}

// ── Intro ──

function renderIntro() {
  state.view = 'intro';
  swap(`
    <section class="intro">
      <div class="intro__hero">
        <p class="eyebrow">Taller x10 · Convención MCI 2026</p>
        <h1 class="intro__title">¿Qué tan <span class="gold">multiplicador</span> eres con la IA?</h1>
        <p class="intro__lead">Entre 12 y 14 preguntas rápidas, unos 3 minutos. Al final recibes tu nivel y tres pasos concretos para esta semana.</p>
      </div>
      <ol class="ladder" aria-label="Niveles posibles">
        ${LEVEL_ORDER.map((k) => `<li><b>${LEVELS[k].mult}</b><span>${LEVELS[k].name}</span></li>`).join('')}
      </ol>
      <form class="intro__form" data-form="start" novalidate>
        <label class="field" for="alias">
          <span class="field__label">¿Cómo te llamamos? <small>Opcional</small></span>
          <input id="alias" name="alias" type="text" maxlength="40" autocomplete="nickname" autocapitalize="words"
            enterkeyhint="go" placeholder="Tu nombre o apodo" value="${esc(state.alias)}" aria-describedby="alias-err" />
          <span class="field__error" id="alias-err" role="alert"></span>
        </label>
        <button class="btn btn--gold btn--block" type="submit">Empezar ${ICONS.arrow}</button>
      </form>
      <p class="privacy">${ICONS.shield}<span>Anónimo. Solo para conocer al público del taller (Ley 1581 de 2012).</span></p>
    </section>`, { focus: null });
}

function start(form) {
  const { value, error } = validateAlias(form.alias.value);
  const err = form.querySelector('.field__error');
  if (error) {
    err.textContent = error;
    form.alias.setAttribute('aria-invalid', 'true');
    form.alias.focus();
    return;
  }
  state.alias = value;
  if (!state.startedAt || !Object.keys(state.answers).length) state.startedAt = Date.now();
  state.view = 'question';
  state.index = Math.min(state.index, path().length - 1);
  saveProgress();
  renderQuestion();
}

// ── Finish, save, diagnosis ──

async function finish() {
  const answers = pruneAnswers(state.answers);
  const row = buildRow({ answers, alias: state.alias, session, durationMs: Date.now() - state.startedAt });
  state.result = { answers, alias: row.alias, level: row.level };
  state.save = 'pending';
  state.view = 'result';
  store.del(sessionStorage, PROGRESS_KEY);

  const saving = submitResponse(row).then(({ status }) => {
    state.save = status;
    store.set(localStorage, RESULT_KEY, { ...state.result, save: status, at: Date.now() });
    const pill = screen.querySelector('.save');
    if (pill) setSavePill(pill, status);
  });

  await countUp(row.level);
  renderResult();
  return saving;
}

function countUp(level) {
  if (reducedMotion()) return Promise.resolve();
  const steps = LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(level) + 1);
  swap(`
    <section class="calc" aria-live="polite">
      <p class="calc__x" aria-hidden="true">×1</p>
      <p class="calc__label">Calculando tu nivel…</p>
    </section>`, { focus: null });
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      const el = screen.querySelector('.calc__x');
      if (el) {
        el.textContent = LEVELS[steps[i]].mult;
        el.classList.remove('is-pop');
        void el.offsetWidth;
        el.classList.add('is-pop');
      }
      i += 1;
      if (i < steps.length) setTimeout(tick, 320);
      else setTimeout(resolve, 520);
    };
    setTimeout(tick, 260);
  });
}

function setSavePill(pill, status) {
  pill.dataset.status = status;
  pill.querySelector('span').textContent = SAVE_COPY[status] ?? '';
}

function renderResult() {
  const { answers, alias } = state.result;
  const d = diagnose(answers);
  const L = d.levelInfo;
  const dims = Object.entries(d.scores)
    .map(
      ([k, v]) => `
      <li><span class="dim__label">${DIMENSION_LABELS[k]}</span>
        <span class="dim__bar" aria-hidden="true"><i style="--w:${v}%"></i></span>
        <span class="dim__val">${v}</span></li>`,
    )
    .join('');
  const knowledge = d.knowledge
    .map((k) => {
      const verdict = k.correct ? 'right' : k.credit > 0 ? 'close' : 'wrong';
      const verdictText = { right: 'Correcta', close: 'Casi', wrong: 'Repasa esta' }[verdict];
      return `
      <li class="kq kq--${verdict}">
        <div class="kq__head">
          <span class="kq__icon" aria-hidden="true">${k.correct ? ICONS.check : ICONS.cross}</span>
          <span class="kq__short">${esc(k.short)}</span>
          <span class="kq__verdict">${verdictText}</span>
        </div>
        <p class="kq__q">${esc(typeof k.title === 'string' ? k.title : '')}</p>
        ${k.correct ? '' : `<p class="kq__line"><span>Tu respuesta</span>${esc(k.yours.join(', ') || 'Sin responder')}</p>`}
        <p class="kq__line kq__line--right"><span>Respuesta</span>${esc(k.right.join(' · '))}</p>
        <p class="kq__why">${esc(k.why)}</p>
        <a class="kq__link" href="${k.link.href}">${ICONS.book}${esc(k.link.label)}</a>
      </li>`;
    })
    .join('');
  const steps = d.steps
    .map(
      (s, i) => `
      <li class="step">
        <span class="step__n" aria-hidden="true">${i + 1}</span>
        <div>
          <h3 class="step__title">${esc(s.title)}</h3>
          <p class="step__body">${esc(s.body)}</p>
          <p class="step__links">${s.links
            .map((l) => `<a href="${l.href}">${esc(l.label)} ${ICONS.arrow}</a>`)
            .join('')}</p>
        </div>
      </li>`,
    )
    .join('');
  const fear = d.fearNote
    ? `
      <section class="block block--care" aria-labelledby="h-care">
        <h2 id="h-care" class="block__title">${ICONS.shield}${esc(d.fearNote.title)}</h2>
        <p class="block__lead">${esc(d.fearNote.lead)}</p>
        <ul class="care">${d.fearNote.items
          .map((i) => `<li><p>${esc(i.text)}</p><a href="${i.link.href}">${esc(i.link.label)} ${ICONS.arrow}</a></li>`)
          .join('')}</ul>
      </section>`
    : '';
  const date = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  swap(`
    <section class="result">
      <article class="lvl lvl--${L.key}" aria-labelledby="lvl-name">
        <header class="lvl__top">
          <span class="mark"><span class="mark__x">×</span>10</span>
          <span class="lvl__event">Taller IA · ${esc(date)}</span>
        </header>
        <p class="lvl__who">${alias ? `${esc(alias)}, tu nivel es` : 'Tu nivel es'}</p>
        <p class="lvl__mult" aria-hidden="true">${L.mult}</p>
        <h1 class="lvl__name" id="lvl-name"><span class="sr-only">${L.mult} </span>${L.name}</h1>
        <p class="lvl__meaning">${esc(L.meaning)}</p>
        <ol class="lvl__ladder" aria-hidden="true">${LEVEL_ORDER.map(
          (k) => `<li class="${k === L.key ? 'is-on' : ''}">${LEVELS[k].mult}</li>`,
        ).join('')}</ol>
        <ul class="dims">${dims}</ul>
        <footer class="lvl__foot">
          <span>Puntaje <b>${d.score}</b>/100</span>
          <span>La IA acelera. Tú decides.</span>
        </footer>
      </article>

      <div class="result__actions">
        <button type="button" class="btn btn--gold" data-action="share">${ICONS.share} Compartir mi nivel</button>
        <p class="save" data-status="${state.save}" role="status"><i aria-hidden="true"></i><span>${SAVE_COPY[state.save] ?? ''}</span></p>
      </div>

      <section class="block" aria-labelledby="h-str">
        <h2 id="h-str" class="block__title">Tus fortalezas</h2>
        <ul class="xlist">${d.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </section>

      <section class="block" aria-labelledby="h-steps">
        <h2 id="h-steps" class="block__title">Tus 3 próximos pasos</h2>
        <ol class="steps">${steps}</ol>
      </section>

      ${fear}

      <section class="block" aria-labelledby="h-k">
        <h2 id="h-k" class="block__title">Repasemos las respuestas</h2>
        <ul class="kqs">${knowledge}</ul>
      </section>

      <footer class="result__end">
        <a class="btn btn--ghost btn--block" href="/playbook/">${ICONS.book} Abrir el playbook completo</a>
        <button type="button" class="btn btn--quiet" data-action="restart">Hacer el test otra vez</button>
      </footer>
    </section>`, { focus: '#lvl-name' });
  announcer.textContent = `Tu nivel: ${L.mult} ${L.name}`;
}

async function share() {
  const L = LEVELS[state.result.level];
  const who = state.result.alias ? `${state.result.alias}: mi` : 'Mi';
  const text = `${who} nivel con la IA es ${L.mult} ${L.name}. ¿Y el tuyo? Haz el test del taller x10.`;
  const url = `${location.origin}/test/${session !== DEFAULT_SESSION ? `?s=${encodeURIComponent(session)}` : ''}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Mi nivel x10', text, url });
    } catch {
      /* user closed the share sheet */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast('Copiado. Pégalo donde quieras.');
  } catch {
    toast('Toma un pantallazo de tu tarjeta para compartirla.');
  }
}

function restart() {
  store.del(localStorage, RESULT_KEY);
  store.del(sessionStorage, PROGRESS_KEY);
  Object.assign(state, { view: 'intro', index: 0, answers: {}, startedAt: 0, result: null, save: null });
  renderIntro();
}

// ── Events ──

screen.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const action = el.dataset.action;
  if (action === 'pick') pick(el.dataset.value);
  else if (action === 'pick-extra') pickExtra(el.dataset.value);
  else if (action === 'next') next();
  else if (action === 'back') back();
  else if (action === 'share') share();
  else if (action === 'restart') restart();
});

screen.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form="start"]');
  if (!form) return;
  e.preventDefault();
  start(form);
});

screen.addEventListener('input', (e) => {
  if (e.target.matches('.fear__range')) setFear(e.target.value);
  if (e.target.id === 'alias') {
    e.target.removeAttribute('aria-invalid');
    screen.querySelector('.field__error').textContent = '';
  }
});

// A tap on the thumb without dragging still counts as an answer.
screen.addEventListener('change', (e) => {
  if (e.target.matches('.fear__range')) setFear(e.target.value);
});

document.addEventListener('keydown', (e) => {
  if (state.view !== 'question' || e.target.matches('input[type="text"]')) return;
  if (e.key === 'Enter' && needsNext(current()) && e.target.tagName !== 'BUTTON') next();
});

// ── Boot ──

function boot() {
  bindThemeToggle(document.getElementById('theme'));
  if (isDemo) document.getElementById('demo-badge').hidden = false;
  flushQueue().then((n) => {
    if (!n) return;
    toast('Enviamos tus respuestas pendientes.');
    const saved = store.get(localStorage, RESULT_KEY);
    if (saved?.save === 'queued') store.set(localStorage, RESULT_KEY, { ...saved, save: 'saved' });
    const pill = screen.querySelector('.save');
    if (pill?.dataset.status === 'queued') setSavePill(pill, (state.save = 'saved'));
  });

  const done = store.get(localStorage, RESULT_KEY);
  if (done?.answers && done.level) {
    state.result = { answers: done.answers, alias: done.alias, level: done.level };
    state.save = done.save === 'pending' ? 'queued' : done.save;
    state.view = 'result';
    return renderResult();
  }
  const saved = store.get(sessionStorage, PROGRESS_KEY);
  if (saved?.answers && Object.keys(saved.answers).length) {
    Object.assign(state, saved, { view: 'question' });
    state.index = Math.max(0, Math.min(state.index, path().length - 1));
    return renderQuestion();
  }
  renderIntro();
}

boot();
