// Encuesta de entrada: who is in the room before the Cerebro Jurídico class.
// Pure data and logic shared by /cerebro/encuesta/ and the deck's live slide
// (presentacion/js/sala.js). Name and email are collected for follow-up and
// stay in the row; they never enter the aggregates the deck reads.
//
// Supabase: rows go to workshop_submissions (workshop 'cerebro', form 'intro');
// the public function cj_intro_summary(session) returns { total, counts } where
// counts[question][option] = how many people chose it. summarize() below does
// the same in JS for demo mode and tests: keep the two in step.

export const WORKSHOP = 'cerebro';
export const FORM = 'intro';
export const SESSION_DEFAULT = 'javeriana-2026-10-21';

const o = (id, text, hint = '') => ({ id, text, hint });

export const CONTACTO = {
  id: 'contacto',
  titulo: '¿Quién eres?',
  ayuda: 'Para enviarte el playbook y el kit del taller. Solo tú y el expositor ven estos datos; la sala ve porcentajes.',
  campos: [
    { id: 'nombre', label: 'Nombre y apellido', placeholder: 'Laura Gómez', max: 80, autocomplete: 'name' },
    { id: 'email', label: 'Correo', placeholder: 'laura@despacho.co', max: 254, autocomplete: 'email', type: 'email' },
  ],
};

export const PREGUNTAS = [
  {
    id: 'rol',
    tipo: 'una',
    titulo: '¿Cómo ejerces?',
    ayuda: 'Lo más cercano a tu día a día.',
    opciones: [
      o('litigante', 'Litigante o práctica propia'),
      o('firma', 'Abogado/a de firma'),
      o('inhouse', 'In-house', 'Abogado/a de empresa'),
      o('publico', 'Sector público', 'Entidad, juzgado, órgano de control'),
      o('docente', 'Docente o investigador/a'),
      o('estudiante', 'Estudiante'),
      o('otro', 'Otro'),
    ],
  },
  {
    id: 'herramientas',
    tipo: 'varias',
    titulo: '¿Qué IA usas en tu trabajo?',
    ayuda: 'Marca todas las que uses.',
    exclusivo: 'ninguna',
    opciones: [
      o('chatgpt', 'ChatGPT'),
      o('claude', 'Claude'),
      o('gemini', 'Gemini'),
      o('copilot', 'Microsoft Copilot'),
      o('perplexity', 'Perplexity'),
      o('notebooklm', 'NotebookLM'),
      o('juridica', 'Una IA jurídica', 'Lexis+, vLex, Tirant, Harvey…'),
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
      o('empresa', 'Empresarial o del despacho', 'Team, Business, Enterprise'),
      o('nose', 'No sé'),
    ],
  },
  {
    id: 'frecuencia',
    tipo: 'una',
    titulo: '¿Cada cuánto la usas para trabajar?',
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
    titulo: '¿Para qué la usas más?',
    ayuda: 'Marca todo lo que hayas hecho al menos una vez.',
    exclusivo: 'nada',
    opciones: [
      o('redactar', 'Redactar escritos o conceptos'),
      o('jurisprudencia', 'Buscar jurisprudencia o normas'),
      o('contratos', 'Revisar contratos'),
      o('peticiones', 'Responder peticiones o PQRS'),
      o('expedientes', 'Resumir expedientes o documentos'),
      o('clientes', 'Explicarle algo a un cliente'),
      o('nada', 'Nada todavía'),
    ],
  },
  {
    id: 'proyectos',
    tipo: 'una',
    titulo: '¿Usas Proyectos o Gems?',
    ayuda: 'Un espacio con instrucciones y archivos que cada chat ya conoce (Proyectos en ChatGPT y Claude, Gems en Gemini).',
    opciones: [
      o('uso', 'Sí, los uso'),
      o('conozco', 'Los conozco, no los uso'),
      o('no', 'No sé qué son'),
    ],
  },
  {
    id: 'skill',
    tipo: 'una',
    titulo: '¿Has creado una skill, un GPT o una Gem propia?',
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
    titulo: '¿Alguna vez la IA te citó una sentencia que no existía?',
    ayuda: 'Sin pena: nadie ve tu respuesta, solo el total de la sala.',
    opciones: [
      o('si', 'Sí, me pasó'),
      o('no', 'No, siempre existían'),
      o('noverifique', 'No sé, no las verifico'),
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
    favorita: top('favorita', 1)[0] ?? null,
    proyectosPct: pct(proyectos, total),
    skillPct: pct(skill, total),
    entrenaRiesgoPct: pct(entrenaRiesgo, total),
    personalesPct: pct(personales, total),
    alucinoPct: pct(alucino, total),
    noVerificaPct: pct(noVerifica, total),
    top,
  };
}
