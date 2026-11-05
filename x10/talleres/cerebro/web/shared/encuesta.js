// Intro survey: who is in the room before the Cerebro class (generative AI and
// skills), for any profession. Pure data and logic shared by /cerebro/encuesta/
// and the deck's live slide (presentacion/js/sala.js). Name and email are
// collected for follow-up and stay in the row; they never enter the aggregates
// the deck reads.
//
// Supabase: rows go to workshop_submissions (workshop 'cerebro', form 'intro');
// the public function cj_intro_summary(session) returns { total, counts } where
// counts[question][option] = how many people chose it. summarize() below does
// the same in JS for demo mode and tests: keep the two in step. The function
// only knows question ids (single: rol, favorita, plan, frecuencia, proyectos,
// skill, entrena, alucino; multi: herramientas, usos), never option ids, so
// options, titles and help texts can change freely; question ids and kinds
// cannot without a new migration.

export const WORKSHOP = 'cerebro';
export const FORM = 'intro';
export const SESSION_DEFAULT = 'cerebro-skills';

const o = (id, text, hint = '') => ({ id, text, hint });

export const CONTACTO = {
  id: 'contacto',
  titulo: '¿Quién eres?',
  ayuda: 'Para enviarte el kit de la clase y el playbook. Solo tú y el expositor ven estos datos; la sala ve porcentajes.',
  campos: [
    { id: 'nombre', label: 'Nombre y apellido', placeholder: 'Sofía Ruiz', max: 80, autocomplete: 'name' },
    { id: 'email', label: 'Correo', placeholder: 'sofia@correo.co', max: 254, autocomplete: 'email', type: 'email' },
  ],
};

export const PREGUNTAS = [
  {
    id: 'rol',
    tipo: 'una',
    titulo: '¿Qué haces hoy?',
    ayuda: 'Lo más cercano a tu día a día.',
    opciones: [
      o('estudiante', 'Estudiante'),
      o('emprendedor', 'Emprendedor/a'),
      o('empresa', 'Profesional en una empresa'),
      o('independiente', 'Independiente o freelance'),
      o('docente', 'Docente o investigador/a'),
      o('publico', 'Sector público', 'Una entidad u órgano público'),
      o('otro', 'Otro'),
    ],
  },
  {
    id: 'herramientas',
    tipo: 'varias',
    titulo: '¿Qué IA usas?',
    ayuda: 'Marca todas las que uses.',
    exclusivo: 'ninguna',
    opciones: [
      o('chatgpt', 'ChatGPT'),
      o('claude', 'Claude'),
      o('gemini', 'Gemini'),
      o('copilot', 'Microsoft Copilot'),
      o('perplexity', 'Perplexity'),
      o('notebooklm', 'Gemini Notebook (NotebookLM)'),
      o('otra', 'Otra'),
      o('ninguna', 'Ninguna todavía'),
    ],
  },
  {
    id: 'favorita',
    tipo: 'una',
    titulo: '¿Y cuál usas más?',
    ayuda: 'Tu asistente de cabecera.',
    desde: 'herramientas',
  },
  {
    id: 'plan',
    tipo: 'una',
    titulo: '¿Qué tipo de cuenta tienes?',
    ayuda: 'En la IA que más usas.',
    opciones: [
      o('gratis', 'Gratuita'),
      o('pago', 'De pago, personal', 'Plus, Pro, Max…'),
      o('empresa', 'Empresarial o de tu organización', 'Team, Business, Enterprise'),
      o('nose', 'No sé'),
    ],
  },
  {
    id: 'frecuencia',
    tipo: 'una',
    titulo: '¿Cada cuánto la usas para trabajar o estudiar?',
    opciones: [
      o('diario', 'Todos los días'),
      o('semanal', 'Varias veces por semana'),
      o('mensual', 'Algunas veces al mes'),
      o('casi-nunca', 'Casi nunca o nunca'),
    ],
  },
  {
    id: 'usos',
    tipo: 'varias',
    titulo: '¿Para qué la usas?',
    ayuda: 'Marca todo lo que hayas hecho al menos una vez.',
    exclusivo: 'nada',
    opciones: [
      o('escribir', 'Escribir o redactar'),
      o('resumir', 'Resumir o estudiar'),
      o('construir', 'Programar o construir apps'),
      o('datos', 'Analizar datos o tablas'),
      o('buscar', 'Buscar información'),
      o('imagenes', 'Imágenes, diseño o video'),
      o('ideas', 'Pensar ideas o decidir'),
      o('nada', 'Nada aún'),
    ],
  },
  {
    id: 'proyectos',
    tipo: 'una',
    titulo: '¿Usas Proyectos (ChatGPT, Claude) o Gems (Gemini)?',
    ayuda: 'Un espacio con instrucciones y archivos que cada chat ya conoce.',
    opciones: [
      o('uso', 'Sí, los uso'),
      o('conozco', 'Los conozco, no los uso'),
      o('no', 'No sé qué son'),
    ],
  },
  {
    id: 'skill',
    tipo: 'una',
    titulo: '¿Has creado una skill, un GPT personalizado o una Gem?',
    ayuda: 'Un asistente con tus instrucciones, hecho por ti.',
    opciones: [
      o('si', 'Sí, al menos una'),
      o('no', 'No, nunca'),
      o('nose', 'No sé qué es'),
    ],
  },
  {
    id: 'entrena',
    tipo: 'una',
    titulo: '¿Tu cuenta entrena con lo que subes?',
    ayuda: 'Las cuentas personales de ChatGPT, Claude y Gemini lo hacen salvo que lo apagues.',
    opciones: [
      o('apagado', 'Sí, y lo apagué'),
      o('activo', 'Sí, y sigue activo'),
      o('nose', 'No sé'),
    ],
  },
  {
    id: 'alucino',
    tipo: 'una',
    titulo: '¿La IA te ha dado un dato, una cita o una fuente que no existía?',
    ayuda: 'Sin pena: nadie ve tu respuesta, solo el total de la sala.',
    opciones: [
      o('si', 'Sí, me pasó'),
      o('no', 'No, siempre existían'),
      o('noverifique', 'No lo verifiqué'),
    ],
  },
];

const SINGLE = PREGUNTAS.filter((p) => p.tipo !== 'varias').map((p) => p.id);
const MULTI = PREGUNTAS.filter((p) => p.tipo === 'varias').map((p) => p.id);

export const pregunta = (id) => PREGUNTAS.find((p) => p.id === id);

/** Options of a question; the favourite borrows the tool list. */
function allOptions(id) {
  const p = pregunta(id);
  if (!p) return [];
  if (p.desde) {
    const from = pregunta(p.desde);
    return from.opciones.filter((x) => x.id !== from.exclusivo);
  }
  return p.opciones;
}

const realTools = (answers) => (Array.isArray(answers?.herramientas) ? answers.herramientas : []).filter((t) => t !== 'ninguna');

/** Options to show for a question given the answers so far. */
export function opcionesDe(id, answers = {}) {
  if (id === 'favorita') {
    const marked = new Set(realTools(answers));
    return allOptions('favorita').filter((x) => marked.has(x.id));
  }
  return allOptions(id);
}

/**
 * Screen ids to ask, in order: the contact screen first, then the questions.
 * The favourite only makes sense with two or more tools; until the tools are
 * answered it counts, so the total never grows.
 */
export function pasos(answers = {}) {
  const asked = Array.isArray(answers.herramientas) && answers.herramientas.length > 0;
  const qs = PREGUNTAS.map((p) => p.id).filter((id) => id !== 'favorita' || !asked || realTools(answers).length >= 2);
  return [CONTACTO.id, ...qs];
}

/** Toggles an option of a multi-select; its "none" option excludes the rest. */
export function elegir(id, current = [], option) {
  const { exclusivo } = pregunta(id);
  if (current.includes(option)) return current.filter((x) => x !== option);
  if (option === exclusivo) return [option];
  return [...current.filter((x) => x !== exclusivo), option];
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const str = (v) => (typeof v === 'string' ? v : '');

/** Session id from the URL (?s=): lowercase slug, else the default. */
export function cleanSession(raw) {
  const s = str(raw).trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,39}$/.test(s) ? s : SESSION_DEFAULT;
}

/** Contact fields cleaned, with their errors (Spanish, shown under the field). */
export function validarContacto(answers = {}) {
  const errores = {};
  const nombre = str(answers.nombre).replace(/\s+/g, ' ').trim().slice(0, 80);
  const email = str(answers.email).trim().toLowerCase().slice(0, 254);
  if (nombre.length < 2) errores.nombre = 'Escribe tu nombre.';
  if (!EMAIL.test(email)) errores.email = 'Escribe un correo válido.';
  return { errores, nombre, email };
}

/** Clean payload plus per-screen errors. The contact goes in the payload too. */
export function validar(answers = {}) {
  const contacto = validarContacto(answers);
  const errores = { ...contacto.errores };
  if (Object.keys(contacto.errores).length) errores[CONTACTO.id] = Object.values(contacto.errores)[0];
  const payload = { nombre: contacto.nombre, email: contacto.email };
  for (const p of PREGUNTAS) {
    if (p.id === 'favorita') continue;
    const ids = allOptions(p.id).map((x) => x.id);
    const v = answers[p.id];
    if (p.tipo === 'varias') {
      let list = [...new Set((Array.isArray(v) ? v : []).map(String))].filter((x) => ids.includes(x));
      if (list.length > 1) list = list.filter((x) => x !== p.exclusivo);
      if (!list.length) errores[p.id] = 'Marca al menos una opción.';
      payload[p.id] = list;
    } else {
      if (!ids.includes(String(v ?? ''))) errores[p.id] = 'Elige una opción.';
      else payload[p.id] = String(v);
    }
  }
  const tools = realTools(payload);
  if (tools.length === 0) payload.favorita = '';
  else if (tools.length === 1) payload.favorita = tools[0];
  else if (tools.includes(answers.favorita)) payload.favorita = answers.favorita;
  else errores.favorita = 'Elige una de las que marcaste.';
  return { errores, payload };
}

/** The row inserted into workshop_submissions; consent is the act of sending. */
export const buildRow = (payload, session, now = new Date()) => ({
  workshop: WORKSHOP,
  form: FORM,
  session,
  payload,
  consent_at: now.toISOString(),
});

/** Same aggregation as the SQL function cj_intro_summary: { total, counts }. Never name or email. */
export function summarize(payloads = []) {
  const counts = {};
  const bump = (k, v) => {
    if (v === '' || v == null) return;
    const key = String(v);
    if (key.length > 40) return;
    counts[k] ??= {};
    counts[k][key] = (counts[k][key] ?? 0) + 1;
  };
  for (const p of payloads) {
    if (!p || typeof p !== 'object') continue;
    for (const k of SINGLE) if (typeof p[k] === 'string') bump(k, p[k]);
    for (const k of MULTI) if (Array.isArray(p[k])) new Set(p[k].map(String)).forEach((v) => bump(k, v));
  }
  return { total: payloads.length, counts };
}

export function label(id, option) {
  return allOptions(id).find((x) => x.id === String(option))?.text ?? '';
}

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

/** What the room looks like: the numbers the slide and the survey's last screen show. */
export function kpis(summary) {
  const total = Number(summary?.total) || 0;
  const counts = summary?.counts ?? {};
  const n = (q, id) => Number(counts[q]?.[id]) || 0;

  const top = (q, limit = 3) => {
    const p = pregunta(q);
    return allOptions(q)
      .filter((x) => x.id !== p.exclusivo)
      .map((x) => ({ id: x.id, label: x.text, n: n(q, x.id), pct: pct(n(q, x.id), total) }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, limit);
  };

  const activos = n('frecuencia', 'diario') + n('frecuencia', 'semanal');
  const proyectos = n('proyectos', 'uso');
  const skill = n('skill', 'si');
  const entrenaRiesgo = n('entrena', 'activo') + n('entrena', 'nose');
  const alucino = n('alucino', 'si');
  const noVerifica = n('alucino', 'noverifique');
  const personales = n('plan', 'gratis') + n('plan', 'pago');

  return {
    total,
    activos,
    activosPct: pct(activos, total),
    // "Otra" is a bucket, not a tool: the headline names a specific one.
    favorita: top('favorita', 2).find((x) => x.id !== 'otra') ?? null,
    proyectosPct: pct(proyectos, total),
    skillPct: pct(skill, total),
    entrenaRiesgoPct: pct(entrenaRiesgo, total),
    personalesPct: pct(personales, total),
    alucinoPct: pct(alucino, total),
    noVerificaPct: pct(noVerifica, total),
    top,
  };
}
