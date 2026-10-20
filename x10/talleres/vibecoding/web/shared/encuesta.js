// Encuesta de entrada: where each person stands with AI before class 1.
// Pure data and logic shared by /vibecoding/encuesta/ and the deck's live slide
// (presentacion/js/sala.js). Anonymous by design: no name, no email.
//
// Supabase: rows go to workshop_submissions (workshop 'vibecoding', form 'intro');
// the public function vc_intro_summary(session) returns { total, counts } where
// counts[question][option] = how many people chose it. summarize() below does
// the same in JS for demo mode and tests: keep the two in step.

export const WORKSHOP = 'vibecoding';
export const FORM = 'intro';

const o = (id, text, hint = '') => ({ id, text, hint });

export const PREGUNTAS = [
  {
    id: 'entidad',
    tipo: 'una',
    titulo: '¿Dónde trabajas?',
    ayuda: 'El tipo de entidad u organización.',
    opciones: [
      o('nacional', 'Gobierno nacional', 'Ministerio, departamento administrativo, agencia, superintendencia'),
      o('territorial', 'Gobierno territorial', 'Gobernación, alcaldía, secretaría'),
      o('judicial', 'Rama judicial', 'Juzgado, tribunal, Fiscalía'),
      o('legislativa', 'Corporación pública', 'Congreso, asamblea, concejo'),
      o('control', 'Órgano de control', 'Procuraduría, Contraloría, Personería, Defensoría'),
      o('descentralizada', 'Entidad descentralizada', 'Hospital, universidad pública, empresa de servicios'),
      o('autonomo', 'Organismo autónomo o electoral', 'Registraduría, Banco de la República, CAR'),
      o('privado', 'Sector privado u ONG', 'Empresa, consultora, fundación'),
      o('otro', 'Otro'),
    ],
  },
  {
    id: 'sector',
    tipo: 'una',
    titulo: '¿En qué sector?',
    ayuda: 'El tema principal de tu entidad o de tu trabajo.',
    opciones: [
      o('salud', 'Salud'),
      o('educacion', 'Educación'),
      o('justicia', 'Justicia y seguridad'),
      o('hacienda', 'Hacienda y finanzas'),
      o('planeacion', 'Planeación y gobierno'),
      o('social', 'Desarrollo social'),
      o('ambiente', 'Ambiente y agro'),
      o('infraestructura', 'Infraestructura y transporte'),
      o('tic', 'TIC y tecnología'),
      o('cultura', 'Cultura y deporte'),
      o('otro', 'Otro'),
    ],
  },
  {
    id: 'rol',
    tipo: 'una',
    titulo: '¿Cuál es tu rol?',
    ayuda: 'El más cercano a lo que haces.',
    opciones: [
      o('directivo', 'Directivo', 'Director, secretario, jefe de oficina'),
      o('asesor', 'Asesor'),
      o('profesional', 'Profesional'),
      o('tecnico', 'Técnico'),
      o('asistencial', 'Asistencial'),
      o('contratista', 'Contratista', 'Prestación de servicios'),
      o('otro', 'Otro'),
    ],
  },
  {
    id: 'nivel',
    tipo: 'escala',
    titulo: '¿Qué tanto sabes de IA?',
    ayuda: 'Sin pena: nadie ve tu respuesta, solo el total de la sala.',
    opciones: [
      o('0', 'Nada', 'Casi no la he usado'),
      o('1', 'Lo básico', 'Le hago preguntas a un chat'),
      o('2', 'Intermedio', 'La uso con método en mi trabajo'),
      o('3', 'Avanzado', 'Armo asistentes o automatizaciones'),
      o('4', 'Experto', 'Construyo apps o conecto IA con datos'),
    ],
  },
  {
    id: 'frecuencia',
    tipo: 'una',
    titulo: '¿Cada cuánto usas IA?',
    opciones: [
      o('diario', 'Todos los días'),
      o('semanal', 'Varias veces por semana'),
      o('mensual', 'Algunas veces al mes'),
      o('casi-nunca', 'Casi nunca'),
      o('nunca', 'Nunca'),
    ],
  },
  {
    id: 'herramientas',
    tipo: 'varias',
    titulo: '¿Qué asistentes de IA usas?',
    ayuda: 'Marca todos los que uses.',
    exclusivo: 'ninguna',
    opciones: [
      o('chatgpt', 'ChatGPT'),
      o('gemini', 'Gemini'),
      o('copilot', 'Microsoft Copilot'),
      o('claude', 'Claude'),
      o('meta', 'Meta AI'),
      o('perplexity', 'Perplexity'),
      o('deepseek', 'DeepSeek'),
      o('grok', 'Grok'),
      o('notebooklm', 'NotebookLM'),
      o('ninguna', 'Ninguno todavía'),
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
    id: 'construido',
    tipo: 'varias',
    titulo: '¿Qué has hecho con IA?',
    ayuda: 'Marca todo lo que hayas hecho al menos una vez.',
    exclusivo: 'nada',
    opciones: [
      o('textos', 'Textos y documentos', 'Oficios, informes, resúmenes'),
      o('analisis', 'Análisis de datos', 'Tablas, cifras, Excel'),
      o('imagenes', 'Imágenes o presentaciones'),
      o('asistentes', 'Asistentes propios', 'GPTs, Gems, proyectos'),
      o('automatizaciones', 'Automatizaciones', 'Power Automate, Zapier, Make, n8n'),
      o('apps', 'Una app o página web'),
      o('agentes', 'Agentes de IA'),
      o('nada', 'Nada todavía'),
    ],
  },
  {
    id: 'creadores',
    tipo: 'varias',
    titulo: '¿Has probado herramientas para crear apps?',
    ayuda: 'Las que construyen una app a partir de lo que escribes.',
    exclusivo: 'ninguna',
    opciones: [
      o('lovable', 'Lovable'),
      o('base44', 'Base44'),
      o('bolt', 'Bolt'),
      o('v0', 'v0'),
      o('replit', 'Replit'),
      o('ai-studio', 'Google AI Studio'),
      o('cursor', 'Cursor'),
      o('claude-code', 'Claude Code'),
      o('codex', 'Codex'),
      o('powerapps', 'Power Apps o AppSheet'),
      o('ninguna', 'Ninguna todavía'),
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
 * Question ids to ask, in order. The favourite only makes sense with two or more
 * tools; until the tools are answered it counts, so the total never grows.
 */
export function pasos(answers = {}) {
  const asked = Array.isArray(answers.herramientas) && answers.herramientas.length > 0;
  return PREGUNTAS.map((p) => p.id).filter((id) => id !== 'favorita' || !asked || realTools(answers).length >= 2);
}

/** Toggles an option of a multi-select; its "none" option excludes the rest. */
export function elegir(id, current = [], option) {
  const { exclusivo } = pregunta(id);
  if (current.includes(option)) return current.filter((x) => x !== option);
  if (option === exclusivo) return [option];
  return [...current.filter((x) => x !== exclusivo), option];
}

/** Clean payload plus per-question errors (Spanish, shown under the question). */
export function validar(answers = {}) {
  const errores = {};
  const payload = {};
  for (const p of PREGUNTAS) {
    if (p.id === 'favorita') continue;
    const ids = allOptions(p.id).map((x) => x.id);
    const v = answers[p.id];
    if (p.tipo === 'varias') {
      let list = [...new Set((Array.isArray(v) ? v : []).map(String))].filter((x) => ids.includes(x));
      if (list.length > 1) list = list.filter((x) => x !== p.exclusivo);
      if (!list.length) errores[p.id] = 'Marca al menos una opción.';
      payload[p.id] = list;
    } else if (p.tipo === 'escala') {
      const n = Number(v);
      if (v === '' || v == null || !Number.isInteger(n) || !ids.includes(String(n))) errores[p.id] = 'Elige un nivel.';
      else payload[p.id] = n;
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

/** The anonymous row inserted into workshop_submissions. */
export const buildRow = (payload, session) => ({ workshop: WORKSHOP, form: FORM, session, payload });

/** Same aggregation as the SQL function vc_intro_summary: { total, counts }. */
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
    for (const k of SINGLE) if (typeof p[k] === 'string' || typeof p[k] === 'number') bump(k, p[k]);
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
  const nivel = allOptions('nivel').map((x) => ({ id: x.id, label: x.text, hint: x.hint, n: n('nivel', x.id), pct: pct(n('nivel', x.id), total) }));
  const answered = nivel.reduce((s, x) => s + x.n, 0);
  const nivelProm = answered ? Math.round((nivel.reduce((s, x) => s + Number(x.id) * x.n, 0) / answered) * 10) / 10 : null;
  const ninguno = n('creadores', 'ninguna');
  const probaron = total ? Math.max(0, total - ninguno) : 0;

  return {
    total,
    activos,
    activosPct: pct(activos, total),
    favorita: top('favorita', 1)[0] ?? null,
    creadores: probaron,
    creadoresPct: pct(probaron, total),
    nivel,
    nivelProm,
    top,
  };
}
