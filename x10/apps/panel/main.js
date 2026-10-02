// /panel — presenter-only realtime dashboard.
// Live: magic-link login → x10_is_admin() check → initial load + realtime INSERTs.
// Demo (no env vars): reads the localStorage rows written by /test in this browser.

import '../shared/app.css';
import './panel.css';
import {
  DEFAULT_SESSION, USAGE, ROLES, QUESTIONS, FEAR_LABELS, labelOf, optionLabel, resolveTitle,
} from '../shared/questions.js';
import { LEVELS, LEVEL_ORDER } from '../shared/diagnosis.js';
import { aggregate, ranked, toCSV, cleanSession, makeSampleRows } from '../shared/data.js';
import {
  isDemo, getClient, TABLE, demoRows, demoInsert, demoClear, demoSessions, DEMO_EVENT,
} from '../shared/supabase.js';
import { esc, bindThemeToggle, toast, ICONS, readParam } from '../shared/ui.js';

const $ = (id) => document.getElementById(id);
const view = $('view');
const statusEl = $('status');

const state = {
  session: cleanSession(readParam('s')),
  rows: [],
  supabase: null,
  channel: null,
  pollTimer: null,
  admin: false,
  freshId: null,
};

// ── Status pill ──

const STATUS = {
  idle: '',
  demo: 'Modo demo · datos de este navegador',
  connecting: 'Conectando…',
  live: 'En vivo',
  offline: 'Sin tiempo real · actualizando cada 20 s',
  locked: 'Acceso restringido',
};

function setStatus(key) {
  statusEl.dataset.state = key;
  statusEl.querySelector('span').textContent = STATUS[key] ?? '';
}

// ── Formatting ──

const nf = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function ago(iso) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 45) return 'ahora';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return timeFmt.format(new Date(iso));
}

const testUrl = () =>
  `${location.host}/test/${state.session !== DEFAULT_SESSION ? `?s=${encodeURIComponent(state.session)}` : ''}`;

// ── Chart pieces (plain HTML/CSS; one hue, values always labelled) ──

function bars(entries, total, { empty = 'Sin datos todavía' } = {}) {
  if (!entries.length) return `<p class="empty">${empty}</p>`;
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return `<ul class="bars">${entries
    .map(([label, n]) => {
      const p = pct(n, total);
      return `
      <li title="${esc(label)}: ${n} (${p}%)">
        <span class="bars__label">${esc(label)}</span>
        <span class="bars__track" aria-hidden="true"><i style="--w:${(n / max) * 100}%"></i></span>
        <span class="bars__val"><b>${n}</b><small>${p}%</small></span>
      </li>`;
    })
    .join('')}</ul>`;
}

function card(id, title, body, { span = 1, note = '' } = {}) {
  return `
    <section class="card card--span${span}" aria-labelledby="h-${id}">
      <header class="card__head"><h2 id="h-${id}">${title}</h2>${note ? `<span class="card__note">${note}</span>` : ''}</header>
      ${body}
    </section>`;
}

function totalCard(agg) {
  const last = agg.latest[0];
  return `
    <section class="card card--total" aria-labelledby="h-total">
      <header class="card__head"><h2 id="h-total">Respuestas</h2></header>
      <p class="total"><span class="total__n" id="total-n">${agg.total}</span></p>
      <dl class="kv">
        <div><dt>Puntaje promedio</dt><dd>${agg.scoreAvg === null ? '–' : nf.format(agg.scoreAvg)}</dd></div>
        <div><dt>Última</dt><dd data-ago="${last?.created_at ?? ''}">${last ? ago(last.created_at) : '–'}</dd></div>
      </dl>
      <p class="total__url">Responde en <b>${esc(testUrl())}</b></p>
    </section>`;
}

function levelsCard(agg) {
  const max = Math.max(...LEVEL_ORDER.map((k) => agg.levels[k]), 1);
  const cols = LEVEL_ORDER.map((k) => {
    const n = agg.levels[k];
    const p = pct(n, agg.total);
    return `
      <li title="${LEVELS[k].mult} ${LEVELS[k].name}: ${n} (${p}%)">
        <span class="lv__val"><b>${n}</b><small>${p}%</small></span>
        <span class="lv__track" aria-hidden="true"><i style="--h:${(n / max) * 100}%"></i></span>
        <span class="lv__mult">${LEVELS[k].mult}</span>
        <span class="lv__name">${LEVELS[k].name}</span>
      </li>`;
  }).join('');
  return card('levels', 'Niveles', `<ol class="lv">${cols}</ol>`, { span: 2 });
}

function fearCard(agg) {
  const total = Object.values(agg.fear).reduce((s, n) => s + n, 0);
  const max = Math.max(...Object.values(agg.fear), 1);
  const cols = [1, 2, 3, 4, 5]
    .map((n) => {
      const c = agg.fear[n];
      return `
      <li title="${n} · ${FEAR_LABELS[n]}: ${c} (${pct(c, total)}%)">
        <span class="fc__val">${c}</span>
        <span class="fc__track" aria-hidden="true"><i style="--h:${(c / max) * 100}%"></i></span>
        <span class="fc__n">${n}</span>
        <span class="fc__word">${FEAR_LABELS[n]}</span>
      </li>`;
    })
    .join('');
  return card(
    'fear',
    'Temor',
    `<div class="fear-wrap">
      <p class="avg"><span class="avg__n">${agg.fearAvg === null ? '–' : nf.format(agg.fearAvg)}</span><span class="avg__of">promedio de 5</span></p>
      <ol class="fc">${cols}</ol>
    </div>`,
  );
}

function knowledgeCard(agg) {
  const rows = agg.knowledge.map((k) => [k.short, k.correct, k.answered]);
  const body = agg.total
    ? `<ul class="bars bars--pct">${rows
        .map(([label, ok, n]) => {
          const p = pct(ok, n);
          return `
          <li title="${esc(label)}: ${ok} de ${n} correctas (${p}%)">
            <span class="bars__label">${esc(label)}</span>
            <span class="bars__track" aria-hidden="true"><i style="--w:${p}%"></i></span>
            <span class="bars__val"><b>${p}%</b><small>${ok}/${n}</small></span>
          </li>`;
        })
        .join('')}</ul>`
    : '<p class="empty">Sin datos todavía</p>';
  return card('know', 'Fundamentos', body, { note: '% de respuestas correctas' });
}

function contextsCard(agg) {
  const blocks = QUESTIONS.filter((q) => q.id.startsWith('ctx_') && agg.contexts[q.id])
    .map((q) => {
      const role = ROLES.find((r) => q.when({ role: r.value }));
      const top = ranked(agg.contexts[q.id], 3)
        .map(([v, n]) => `<li><span>${esc(optionLabel(q.id, v))}</span><b>${n}</b></li>`)
        .join('');
      return `<div class="ctx"><h3>${esc(role?.label ?? '')}</h3><ul>${top}</ul></div>`;
    })
    .join('');
  return card('ctx', 'Contexto por rol', blocks ? `<div class="ctxs">${blocks}</div>` : '<p class="empty">Sin datos todavía</p>', { span: 2 });
}

function feedCard(agg) {
  const items = agg.latest
    .map(
      (r) => `
      <li class="${r.id === state.freshId ? 'is-new' : ''}">
        <span class="feed__lvl feed__lvl--${esc(r.level)}">${LEVELS[r.level]?.mult ?? '?'}</span>
        <span class="feed__who"><b>${r.alias ? esc(r.alias) : 'Anónimo'}</b><small>${esc(labelOf.role(r.role))}</small></span>
        <time class="feed__time" datetime="${esc(r.created_at)}" data-ago="${esc(r.created_at)}">${ago(r.created_at)}</time>
      </li>`,
    )
    .join('');
  return card('feed', 'Últimas respuestas', items ? `<ol class="feed">${items}</ol>` : '<p class="empty">Esperando la primera respuesta…</p>', { span: 2 });
}

// ── Dashboard ──

function renderDashboard() {
  const agg = aggregate(state.rows);
  const t = agg.total;
  const usage = USAGE.map((u) => [u.label, agg.usage[u.value] ?? 0]).filter(([, n]) => n > 0);
  const label = (fn) => ([k, n]) => [fn(k), n];
  view.innerHTML = `
    ${isDemo ? demoToolbar() : ''}
    <div class="grid">
      ${totalCard(agg)}
      ${levelsCard(agg)}
      ${fearCard(agg)}
      ${feedCard(agg)}
      ${card('roles', 'Roles', bars(ranked(agg.roles).map(label(labelOf.role)), t))}
      ${card('usage', 'Frecuencia de uso', bars(usage, t))}
      ${knowledgeCard(agg)}
      ${card('worries', 'Lo que más preocupa', bars(ranked(agg.worries, 7).map(label(labelOf.worry)), t), { note: '% de personas' })}
      ${card('areas', 'Dónde la usarían', bars(ranked(agg.areas, 8).map(label(labelOf.area)), t), { note: 'top 8' })}
      ${card('industry', 'Sectores', bars(ranked(agg.industries, 8).map(label(labelOf.industry)), t), { note: 'top 8' })}
      ${card('tools', 'Herramientas que ya usan', bars(ranked(agg.tools, 8).map(label((v) => optionLabel('tools', v))), t))}
      ${card('goals', 'Lo que quieren lograr', bars(ranked(agg.goals).map(label((v) => optionLabel('goal', v))), t))}
      ${contextsCard(agg)}
    </div>`;
  state.freshId = null;
}

function demoToolbar() {
  return `
    <div class="demo-bar">
      <p><b>Modo demo.</b> Sin Supabase: el panel lee las respuestas guardadas por /test en este navegador.</p>
      <div>
        <button class="btn btn--ghost btn--sm" type="button" data-action="sample">Agregar 30 respuestas de ejemplo</button>
        <a class="btn btn--ghost btn--sm" href="/test/${state.session !== DEFAULT_SESSION ? `?s=${encodeURIComponent(state.session)}` : ''}" target="_blank" rel="noopener">Abrir /test ${ICONS.arrow}</a>
      </div>
    </div>`;
}

function bumpTotal() {
  const el = $('total-n');
  if (!el) return;
  el.classList.remove('is-bump');
  void el.offsetWidth;
  el.classList.add('is-bump');
}

function addRow(row) {
  if (!row || row.session !== state.session || state.rows.some((r) => r.id === row.id)) return;
  state.rows = [row, ...state.rows];
  state.freshId = row.id;
  renderDashboard();
  bumpTotal();
}

// Keep "hace 2 min" labels fresh without re-rendering.
setInterval(() => {
  document.querySelectorAll('[data-ago]').forEach((el) => {
    if (el.dataset.ago) el.textContent = ago(el.dataset.ago);
  });
}, 15000);

// ── Session selector ──

function setSession(next) {
  const s = cleanSession(next);
  state.session = s;
  $('sess-input').value = s;
  const url = new URL(location.href);
  if (s === DEFAULT_SESSION) url.searchParams.delete('s');
  else url.searchParams.set('s', s);
  history.replaceState(null, '', url);
  return s;
}

function fillSessions(list) {
  $('sess-list').innerHTML = [...new Set([DEFAULT_SESSION, ...list])].map((s) => `<option value="${esc(s)}"></option>`).join('');
}

$('sess-form').addEventListener('submit', (e) => {
  e.preventDefault();
  setSession($('sess-input').value);
  if (isDemo) loadDemo();
  else if (state.admin) startLive();
});

// ── CSV ──

$('csv').addEventListener('click', () => {
  if (!state.rows.length) return toast('No hay respuestas para exportar.');
  const blob = new Blob([toCSV(state.rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  a.href = URL.createObjectURL(blob);
  a.download = `x10-${state.session}-${stamp}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ── Clear session (in-page confirmation, no confirm()) ──

const confirmBox = $('confirm');

function openConfirm() {
  $('confirm-session').textContent = `«${state.session}»`;
  $('confirm-body').textContent = state.rows.length
    ? `Se eliminarán ${state.rows.length} respuestas de forma permanente. Exporta el CSV antes si las necesitas.`
    : 'Esta sesión no tiene respuestas cargadas.';
  $('confirm-yes').disabled = !state.rows.length;
  confirmBox.hidden = false;
  $('confirm-no').focus();
}

function closeConfirm() {
  confirmBox.hidden = true;
  $('clear').focus();
}

$('clear').addEventListener('click', openConfirm);
$('confirm-no').addEventListener('click', closeConfirm);
confirmBox.addEventListener('click', (e) => e.target === confirmBox && closeConfirm());
document.addEventListener('keydown', (e) => e.key === 'Escape' && !confirmBox.hidden && closeConfirm());

$('confirm-yes').addEventListener('click', async () => {
  const btn = $('confirm-yes');
  btn.disabled = true;
  if (isDemo) {
    demoClear(state.session);
    state.rows = [];
    toast('Respuestas de la sesión borradas.');
  } else {
    const { data, error } = await state.supabase.from(TABLE).delete().eq('session', state.session).select('id');
    if (error) {
      btn.disabled = false;
      return toast(`No se pudo borrar: ${error.message}`);
    }
    state.rows = [];
    toast(`Se borraron ${data?.length ?? 0} respuestas.`);
  }
  confirmBox.hidden = true;
  renderDashboard();
});

// ── Big type for projection ──

function syncBig() {
  const on = document.documentElement.classList.contains('is-big');
  $('big').setAttribute('aria-pressed', String(on));
}

$('big').addEventListener('click', () => {
  const on = document.documentElement.classList.toggle('is-big');
  try {
    localStorage.setItem('x10-panel-big', on ? '1' : '0');
  } catch {
    /* ignore */
  }
  syncBig();
});

// ── Demo mode ──

function loadDemo() {
  state.rows = demoRows(state.session).sort((a, b) => b.created_at.localeCompare(a.created_at));
  fillSessions(demoSessions());
  renderDashboard();
}

function bootDemo() {
  setStatus('demo');
  showChrome(true);
  loadDemo();
  // New rows from /test in another tab (storage) or this tab (custom event).
  window.addEventListener('storage', (e) => e.key === 'x10-demo-responses' && refreshDemo());
  window.addEventListener(DEMO_EVENT, refreshDemo);
  view.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="sample"]')) {
      demoInsert(makeSampleRows(30, { seed: Date.now() % 100000, session: state.session }));
      toast('30 respuestas de ejemplo agregadas.');
    }
  });
}

function refreshDemo() {
  const before = new Set(state.rows.map((r) => r.id));
  loadDemo();
  const fresh = state.rows.find((r) => !before.has(r.id));
  if (fresh && before.size) {
    state.freshId = fresh.id;
    renderDashboard();
    bumpTotal();
  }
}

// ── Live mode ──

function showChrome(on) {
  $('sess-form').hidden = !on;
  $('tools').hidden = !on;
}

function renderLogin(message = '') {
  showChrome(false);
  setStatus('locked');
  view.innerHTML = `
    <section class="gate surface">
      <p class="eyebrow">Solo para el expositor</p>
      <h1>Panel en vivo</h1>
      <p class="gate__lead">Te enviamos un enlace de acceso a tu correo. No necesitas contraseña.</p>
      <form class="gate__form" id="login-form" novalidate>
        <label for="email">Correo del expositor</label>
        <input id="email" name="email" type="email" autocomplete="email" inputmode="email" required />
        <button class="btn btn--gold" type="submit">Enviarme el enlace</button>
      </form>
      <p class="gate__msg" id="login-msg" role="status">${esc(message)}</p>
    </section>`;
  $('login-form').addEventListener('submit', sendLink);
  $('email').focus();
}

async function sendLink(e) {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const msg = $('login-msg');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Escribe un correo válido.';
    return;
  }
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  msg.textContent = 'Enviando…';
  const { error } = await state.supabase.auth.signInWithOtp({
    email,
    // Signups are disabled; only the existing presenter account can log in.
    options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/panel/${location.search}` },
  });
  btn.disabled = false;
  if (!error) {
    msg.textContent = `Listo. Revisa ${email} y abre el enlace en este mismo navegador.`;
    return;
  }
  const status = Number(error.status);
  msg.textContent =
    status === 429 || /rate|seconds/i.test(error.message)
      ? 'Se enviaron demasiados correos. Espera un minuto e inténtalo de nuevo.'
      : 'No pudimos enviar el enlace a ese correo. Verifica que sea el del expositor.';
}

function renderDenied(email) {
  showChrome(false);
  setStatus('locked');
  view.innerHTML = `
    <section class="gate surface">
      <p class="eyebrow">Sin acceso</p>
      <h1>Esta cuenta no tiene acceso al panel</h1>
      <p class="gate__lead">Entraste como <b>${esc(email ?? '')}</b>. El panel es solo para el expositor.</p>
      <button class="btn btn--ghost" type="button" id="denied-out">Cerrar sesión</button>
    </section>`;
  $('denied-out').addEventListener('click', () => state.supabase.auth.signOut());
}

function renderLoading(text = 'Cargando respuestas…') {
  view.innerHTML = `<p class="loading" role="status">${esc(text)}</p>`;
}

async function fetchRows() {
  const { data, error } = await state.supabase
    .from(TABLE)
    .select('*')
    .eq('session', state.session)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

async function fetchSessions() {
  const { data } = await state.supabase.from(TABLE).select('session').order('created_at', { ascending: false }).limit(5000);
  fillSessions((data ?? []).map((r) => r.session));
}

function stopRealtime() {
  if (state.channel) state.supabase.removeChannel(state.channel);
  state.channel = null;
  clearInterval(state.pollTimer);
  state.pollTimer = null;
}

function startPolling() {
  if (state.pollTimer) return;
  setStatus('offline');
  state.pollTimer = setInterval(async () => {
    try {
      state.rows = await fetchRows();
      renderDashboard();
    } catch {
      /* keep the last data on screen */
    }
  }, 20000);
}

async function startLive() {
  stopRealtime();
  showChrome(true);
  setStatus('connecting');
  renderLoading();
  try {
    state.rows = await fetchRows();
  } catch (err) {
    view.innerHTML = `<p class="loading" role="alert">No se pudieron cargar las respuestas: ${esc(err.message)}</p>`;
    return;
  }
  renderDashboard();
  fetchSessions();
  const session = state.session;
  state.channel = state.supabase
    .channel(`x10-panel-${session}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TABLE, filter: `session=eq.${session}` },
      (payload) => addRow(payload.new),
    )
    .subscribe((status) => {
      if (session !== state.session) return;
      if (status === 'SUBSCRIBED') {
        clearInterval(state.pollTimer);
        state.pollTimer = null;
        setStatus('live');
        // Catch rows inserted between the initial load and the subscription.
        fetchRows().then((rows) => {
          state.rows = rows;
          renderDashboard();
        }, () => {});
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        startPolling();
      }
    });
}

// undefined = no auth event seen yet, null = signed out, string = user id.
let authUser;

async function onSession(session) {
  const userId = session?.user?.id ?? null;
  if (userId === authUser) return;
  authUser = userId;
  state.admin = false;
  if (!session) {
    stopRealtime();
    $('logout').hidden = true;
    return renderLogin(hashError());
  }
  renderLoading('Verificando acceso…');
  const { data: isAdmin, error } = await state.supabase.rpc('x10_is_admin');
  if (userId !== authUser) return; // another auth event arrived meanwhile
  if (error || isAdmin !== true) return renderDenied(session.user.email);
  state.admin = true;
  $('logout').hidden = false;
  startLive();
}

/** Magic-link errors come back in the URL hash (e.g. an expired link). */
function hashError() {
  const p = new URLSearchParams(location.hash.slice(1));
  const code = p.get('error_code');
  if (!code) return '';
  history.replaceState(null, '', location.pathname + location.search);
  return code === 'otp_expired' ? 'El enlace expiró o ya se usó. Pide uno nuevo.' : 'No pudimos validar el enlace. Pide uno nuevo.';
}

async function bootLive() {
  setStatus('connecting');
  renderLoading('Conectando…');
  state.supabase = await getClient({ auth: true });
  $('logout').innerHTML = ICONS.logout;
  $('logout').addEventListener('click', () => state.supabase.auth.signOut());
  // Supabase warns against awaiting its own calls inside this callback.
  state.supabase.auth.onAuthStateChange((_event, session) => setTimeout(() => onSession(session), 0));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.admin && !state.channel) startLive();
  });
}

// ── Boot ──

bindThemeToggle($('theme'));
syncBig();
setSession(state.session);
if (isDemo) bootDemo();
else bootLive();
