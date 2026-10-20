// /vibecoding/panel/ — presenter-only dashboard of the formulario de salida.
// Live: magic-link login → x10_is_admin() → initial load + realtime INSERTs on
// workshop_submissions (workshop 'vibecoding', form 'salida', ?s= session).
// Demo (no env vars): reads the rows the landing stored in this browser.

import { CHECKPOINTS, MESAS } from '../shared/content.js';
import {
  WORKSHOP, FORM, DEFAULT_SESSION, cleanSession, readSubmission, aggregate, groupForClase2, toCSV,
} from '../shared/salida.js';
import { isDemo, getClient, TABLE, demoRows, demoInsert, demoSessions, DEMO_EVENT } from '../shared/supabase.js';
import { KEYS } from '../shared/store.js';
import { esc, bindThemeToggle, toast, ICONS, readParam, downloadText } from '../shared/ui.js';

const $ = (id) => document.getElementById(id);
const view = $('view');
const statusEl = $('status');

const state = {
  session: cleanSession(readParam('s')),
  rows: [], // readSubmission() results, newest first
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
  offline: 'Sin tiempo real · actualiza cada 20 s',
  locked: 'Acceso restringido',
};

function setStatus(key) {
  statusEl.dataset.state = key;
  statusEl.querySelector('span').textContent = STATUS[key] ?? '';
}

// ── Formatting ──

const timeFmt = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

function ago(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '–';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 45) return 'ahora';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return dayFmt.format(new Date(t));
}

const clock = (iso) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '–' : timeFmt.format(new Date(t));
};

/** Short visible text for a link: host + path, no protocol. */
const shortUrl = (url) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

const link = (url, label) =>
  url
    ? `<a class="lnk" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow" title="${esc(url)}">${ICONS.link}${esc(label ?? shortUrl(url))}</a>`
    : '<span class="muted">–</span>';

const landingUrl = () =>
  `${location.host}/vibecoding/${state.session !== DEFAULT_SESSION ? `?s=${encodeURIComponent(state.session)}` : ''}#salida`;

// ── Cards ──

function totalCard(agg) {
  const last = state.rows[0];
  return `
    <section class="card card--total" aria-labelledby="h-total">
      <header class="card__head"><h2 id="h-total">Formularios recibidos</h2></header>
      <p class="total"><span class="total__n" id="total-n">${agg.total}</span><span class="total__unit">${agg.total === 1 ? 'estudiante' : 'estudiantes'}</span></p>
      <dl class="kv">
        <div><dt>Último</dt><dd data-ago="${esc(last?.created_at ?? '')}">${last ? ago(last.created_at) : '–'}</dd></div>
        <div><dt>Con app publicada (4–5)</dt><dd>${agg.byPunto[4] + agg.byPunto[5]}</dd></div>
        <div><dt>Formulario</dt><dd>${esc(landingUrl())}</dd></div>
      </dl>
    </section>`;
}

function distCard(agg) {
  const max = Math.max(...CHECKPOINTS.map((c) => agg.byPunto[c.n]), 1);
  const items = CHECKPOINTS.map((c) => {
    const n = agg.byPunto[c.n];
    const p = pct(n, agg.total);
    return `
      <li title="Punto ${c.n} · ${esc(c.name)}: ${n} (${p}%)">
        <span class="dist__n" aria-hidden="true">${c.n}</span>
        <span class="dist__label"><span class="sr-only">Punto ${c.n}: </span>${esc(c.name)}</span>
        <span class="dist__track" aria-hidden="true"><i style="--w:${(n / max) * 100}%"></i></span>
        <span class="dist__val"><b>${n}</b><small>${p}%</small></span>
      </li>`;
  }).join('');
  const key = MESAS.map((m) => `<span>${m.range[0] === m.range[1] ? m.range[0] : `${m.range[0]}–${m.range[1]}`} → <b>${esc(m.name)}</b></span>`).join('');
  return `
    <section class="card card--dist" aria-labelledby="h-dist">
      <header class="card__head"><h2 id="h-dist">Hasta dónde llegaron</h2><span class="card__note">Punto de control alcanzado</span></header>
      <ol class="dist">${items}</ol>
      <p class="dist__key">${key}</p>
    </section>`;
}

function mesasCard() {
  const groups = groupForClase2(state.rows);
  const byName = (a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  const rule = { 'no-funciona': 'Puntos 1 y 2', 'quiero-agregar': 'Puntos 3 y 4', 'abrir-caja': 'Punto 5 con repositorio' };
  const cols = MESAS.map((m) => {
    const people = [...groups[m.id]].sort(byName);
    const list = people.length
      ? `<ul class="people">${people
          .map(
            (r) => `<li>
              <span class="pchip" title="Punto de control ${r.punto}">${r.punto}</span>
              <span class="people__name">${esc(r.nombre || 'Sin nombre')}${r.note ? `<span class="people__note">${esc(r.note)}</span>` : ''}</span>
              <span class="people__links">${r.url_app ? link(r.url_app, 'App') : ''}${r.url_repo ? link(r.url_repo, 'Repo') : ''}</span>
            </li>`,
          )
          .join('')}</ul>`
      : '<p class="empty">Nadie todavía.</p>';
    return `
      <div class="mesa">
        <div class="mesa__head"><h3>${esc(m.name)}</h3><span class="mesa__count">${people.length}</span></div>
        <p class="mesa__rule"><b>${rule[m.id]}</b> · ${esc(m.desc)}</p>
        ${list}
      </div>`;
  }).join('');
  const sinPunto = groups['sin-punto'].length
    ? `<p class="card__note">${groups['sin-punto'].length} sin punto de control válido (no se agrupan).</p>`
    : '';
  return `
    <section class="card" aria-labelledby="h-mesas">
      <header class="card__head">
        <h2 id="h-mesas">Mesas para la clase 2</h2>
        <span class="sugg">Sugerencia automática · revísala antes de armar los grupos</span>
      </header>
      <div class="mesas">${cols}</div>
      ${sinPunto}
    </section>`;
}

function dudasCard() {
  const items = state.rows
    .filter((r) => r.duda)
    .map(
      (r) => `<li>
        <p>${esc(r.duda)}</p>
        <footer><span class="pchip">${r.punto ?? '?'}</span><span>${esc(r.nombre || 'Sin nombre')}</span></footer>
      </li>`,
    )
    .join('');
  return `
    <section class="card card--dudas" aria-labelledby="h-dudas">
      <header class="card__head"><h2 id="h-dudas">Dudas</h2><span class="card__note">Para leer en voz alta · la más reciente primero</span></header>
      ${items ? `<ul class="dudas">${items}</ul>` : '<p class="empty">Todavía no hay dudas.</p>'}
    </section>`;
}

function tableCard() {
  const rows = state.rows
    .map(
      (r) => `<tr class="${r.id === state.freshId ? 'is-new' : ''}">
        <td class="td-time"><time datetime="${esc(r.created_at)}">${clock(r.created_at)}</time></td>
        <td class="td-name">${esc(r.nombre || 'Sin nombre')}</td>
        <td><span class="pchip" title="${esc(CHECKPOINTS.find((c) => c.n === r.punto)?.name ?? 'Sin punto')}">${r.punto ?? '?'}</span></td>
        <td>${link(r.url_app)}</td>
        <td>${link(r.url_repo)}</td>
        <td class="td-duda">${esc(r.duda) || '<span class="muted">–</span>'}</td>
      </tr>`,
    )
    .join('');
  return `
    <section class="card" aria-labelledby="h-table">
      <header class="card__head"><h2 id="h-table">Todos los formularios</h2><span class="card__note">${state.rows.length} en la sesión «${esc(state.session)}»</span></header>
      ${
        rows
          ? `<div class="tablewrap"><table>
              <thead><tr><th scope="col">Hora</th><th scope="col">Nombre</th><th scope="col">Punto</th><th scope="col">App</th><th scope="col">Repositorio</th><th scope="col">Duda</th></tr></thead>
              <tbody>${rows}</tbody>
            </table></div>`
          : '<p class="empty">Esperando el primer formulario…</p>'
      }
    </section>`;
}

function demoBar() {
  return `
    <div class="demo-bar">
      <p><b>Modo demo.</b> Sin Supabase: el panel lee los formularios que la landing guardó en este navegador.</p>
      <div>
        <button class="btn btn--ghost btn--sm" type="button" data-action="sample">Agregar 12 formularios de ejemplo</button>
        <a class="btn btn--ghost btn--sm" href="/vibecoding/${state.session !== DEFAULT_SESSION ? `?s=${encodeURIComponent(state.session)}` : ''}#salida" target="_blank" rel="noopener">Abrir el formulario ${ICONS.arrow}</a>
      </div>
    </div>`;
}

function renderDashboard() {
  const agg = aggregate(state.rows);
  view.innerHTML = `
    ${isDemo ? demoBar() : ''}
    <div class="grid">
      ${totalCard(agg)}
      ${distCard(agg)}
      ${mesasCard()}
      ${dudasCard()}
      ${tableCard()}
    </div>`;
  state.freshId = null;
}

function bumpTotal() {
  const el = $('total-n');
  if (!el) return;
  el.classList.remove('is-bump');
  void el.offsetWidth;
  el.classList.add('is-bump');
}

function setRows(raw) {
  state.rows = raw
    .map(readSubmission)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function addRow(raw) {
  if (!raw || raw.workshop !== WORKSHOP || raw.form !== FORM || raw.session !== state.session) return;
  const row = readSubmission(raw);
  if (state.rows.some((r) => r.id === row.id)) return;
  state.rows = [row, ...state.rows];
  state.freshId = row.id;
  renderDashboard();
  bumpTotal();
}

// Keep "hace 2 min" fresh without re-rendering.
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
  if (!state.rows.length) return toast('No hay formularios para exportar.');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  downloadText(`vibecoding-salida-${state.session}-${stamp}.csv`, toCSV(state.rows), 'text/csv;charset=utf-8');
});

// ── Big type for projection ──

function syncBig() {
  $('big').setAttribute('aria-pressed', String(document.documentElement.classList.contains('is-big')));
}

$('big').addEventListener('click', () => {
  const on = document.documentElement.classList.toggle('is-big');
  try {
    localStorage.setItem(KEYS.panelBig, on ? '1' : '0');
  } catch {
    /* storage blocked: applies for this visit */
  }
  syncBig();
});

// ── Demo mode ──

const SAMPLE_NAMES = ['Valentina', 'Santiago', 'Mariana', 'Juan David', 'Laura', 'Andrés', 'Camila', 'Sebastián', 'Daniela', 'Mateo', 'Sara', 'Felipe'];
const SAMPLE_DUDAS = [
  '¿Cómo vuelvo a una versión anterior sin perder lo que funcionaba?',
  'La app no guarda los datos cuando cierro la pestaña.',
  '¿Cómo agrego un filtro por estado?',
  '¿Qué pasa si se me acaban los créditos?',
  '¿Cómo abro el repositorio en mi computador?',
  'No entendí la diferencia entre front y lógica.',
];

/** Clearly fake rows for rehearsing the panel (demo mode only). */
function sampleRows(n) {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const punto = 1 + ((i * 7 + 3) % 5);
    const nombre = `${SAMPLE_NAMES[i % SAMPLE_NAMES.length]} (ejemplo)`;
    const slug = SAMPLE_NAMES[i % SAMPLE_NAMES.length].toLowerCase().replace(/[^a-z]+/g, '-');
    return {
      workshop: WORKSHOP,
      form: FORM,
      session: state.session,
      created_at: new Date(now - (n - i) * 47_000).toISOString(),
      consent_at: new Date(now - (n - i) * 47_000).toISOString(),
      payload: {
        nombre,
        url_app: punto >= 4 ? `https://${slug}-ejemplo.lovable.app` : null,
        url_repo: punto === 5 && i % 4 !== 0 ? `https://github.com/${slug}-ejemplo/app` : null,
        duda: SAMPLE_DUDAS[i % SAMPLE_DUDAS.length],
        punto_control: punto,
      },
    };
  });
}

function loadDemo() {
  setRows(demoRows({ session: state.session }));
  fillSessions(demoSessions());
  renderDashboard();
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

function bootDemo() {
  setStatus('demo');
  showChrome(true);
  loadDemo();
  // New rows from the landing in another tab (storage) or this tab (custom event).
  window.addEventListener('storage', (e) => e.key === KEYS.demo && refreshDemo());
  window.addEventListener(DEMO_EVENT, refreshDemo);
  view.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="sample"]')) {
      demoInsert(sampleRows(12));
      toast('12 formularios de ejemplo agregados.');
    }
  });
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
      <h1>Panel del formulario de salida</h1>
      <p class="gate__lead">Te enviamos un enlace de acceso a tu correo. No necesitas contraseña.</p>
      <form class="gate__form" id="login-form" novalidate>
        <label for="email">Correo del expositor</label>
        <input class="input" id="email" name="email" type="email" autocomplete="email" inputmode="email" required />
        <button class="btn btn--primary" type="submit">Enviarme el enlace</button>
      </form>
      <p class="gate__msg" id="login-msg" role="status">${esc(message)}</p>
    </section>`;
  $('login-form').addEventListener('submit', sendLink);
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
    // Signups are disabled: only the existing presenter account can log in.
    options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/vibecoding/panel/` },
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

function renderLoading(text = 'Cargando formularios…') {
  view.innerHTML = `<p class="loading" role="status">${esc(text)}</p>`;
}

async function fetchRows() {
  const { data, error } = await state.supabase
    .from(TABLE)
    .select('id, created_at, workshop, form, session, payload, consent_at')
    .eq('workshop', WORKSHOP)
    .eq('form', FORM)
    .eq('session', state.session)
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return data ?? [];
}

async function fetchSessions() {
  const { data } = await state.supabase
    .from(TABLE)
    .select('session')
    .eq('workshop', WORKSHOP)
    .eq('form', FORM)
    .order('created_at', { ascending: false })
    .limit(5000);
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
      setRows(await fetchRows());
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
    setRows(await fetchRows());
  } catch (err) {
    view.innerHTML = `<p class="loading" role="alert">No se pudieron cargar los formularios: ${esc(err.message)}</p>`;
    return;
  }
  renderDashboard();
  fetchSessions();
  const session = state.session;
  // One filter per subscription: workshop on the server, form and session here.
  state.channel = state.supabase
    .channel(`vc-panel-${session}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TABLE, filter: `workshop=eq.${WORKSHOP}` },
      (payload) => addRow(payload.new),
    )
    .subscribe((status) => {
      if (session !== state.session) return;
      if (status === 'SUBSCRIBED') {
        clearInterval(state.pollTimer);
        state.pollTimer = null;
        setStatus('live');
        // Catch rows inserted between the initial load and the subscription.
        fetchRows().then(
          (rows) => {
            setRows(rows);
            renderDashboard();
          },
          () => {},
        );
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        startPolling();
      }
    });
}

// undefined = no auth event yet, null = signed out, string = user id.
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
