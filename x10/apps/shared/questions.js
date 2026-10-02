// Declarative questionnaire for /test. Pure data + pure helpers: no DOM, no
// Vite APIs, so node (diagnosis.test.mjs) and the panel can import it too.
//
// Question shape:
//   id        answer key (answers[id]); unique
//   type      'cards' | 'chips' | 'binary' | 'multi' | 'semaforo' | 'fear'
//   dim       which diagnosis dimension or dashboard field it feeds
//   title     string or (answers) => string
//   hint      optional helper line
//   options   [{ value, label, hint? }]
//   when      optional (answers) => boolean; may only read BRANCH_KEYS
//   max       multi only: maximum picks
//   exclusive multi only: option values that clear the rest
//   column    optional x10_responses column this answer fills
//
// Branching: `when` decides visibility from earlier answers. Only questions
// listed in BRANCH_KEYS may drive it; the test enumerates every combination.

export const DEFAULT_SESSION = 'mci-2026';

export const ROLES = [
  { value: 'empresario', label: 'Empresario o independiente', hint: 'Tienes negocio o trabajas por tu cuenta' },
  { value: 'empleado', label: 'Empleado', hint: 'Trabajas para una empresa o entidad' },
  { value: 'lider', label: 'Líder de iglesia o ministerio', hint: 'Sirves liderando personas' },
  { value: 'estudiante', label: 'Estudiante', hint: 'Colegio, universidad o cursos' },
  { value: 'otro', label: 'Otro', hint: 'Buscando trabajo, pensionado, hogar…' },
];

export const INDUSTRIES = [
  { value: 'comercio', label: 'Comercio y ventas' },
  { value: 'servicios', label: 'Servicios profesionales' },
  { value: 'construccion', label: 'Construcción y talleres' },
  { value: 'manufactura', label: 'Manufactura e industria' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educación' },
  { value: 'transporte', label: 'Transporte y logística' },
  { value: 'finanzas', label: 'Finanzas y contabilidad' },
  { value: 'marketing', label: 'Marketing, medios y diseño' },
  { value: 'alimentos', label: 'Alimentos y restaurantes' },
  { value: 'agro', label: 'Agro y campo' },
  { value: 'publico', label: 'Sector público' },
  { value: 'iglesia', label: 'Iglesia o ministerio' },
  { value: 'otro', label: 'Otro' },
];

export const USAGE = [
  { value: 'nunca', label: 'Nunca la he usado', hint: 'O no estoy seguro' },
  { value: 'probado', label: 'La probé alguna vez' },
  { value: 'mensual', label: 'Algunas veces al mes' },
  { value: 'semanal', label: 'Cada semana' },
  { value: 'diario', label: 'Todos los días' },
];

// Global catalog so the panel can label use_areas from any role branch.
export const USE_AREAS = {
  ventas: 'Ventas y cotizaciones',
  marketing: 'Redes y contenido',
  clientes: 'Atención al cliente',
  finanzas: 'Finanzas y cuentas',
  documentos: 'Documentos y contratos',
  operaciones: 'Inventario y operaciones',
  web: 'Página web o app',
  correos: 'Correos e informes',
  reuniones: 'Reuniones y actas',
  datos: 'Excel y datos',
  presentaciones: 'Presentaciones',
  aprender: 'Aprender cosas nuevas',
  empleo: 'Hoja de vida y empleo',
  procesos: 'Tareas repetitivas',
  ensenanzas: 'Esquema de enseñanzas',
  biblia: 'Estudio bíblico',
  comunicacion: 'Mensajes a mi grupo',
  eventos: 'Reuniones y eventos',
  diseno: 'Diseño y medios',
  discusion: 'Preguntas de discusión',
  estudiar: 'Entender temas difíciles',
  resumenes: 'Resúmenes para estudiar',
  idiomas: 'Practicar idiomas',
  programar: 'Programar',
  hogar: 'Finanzas del hogar',
  emprender: 'Emprender una idea',
  tramites: 'Trámites y documentos',
};

const areas = (...keys) => keys.map((value) => ({ value, label: USE_AREAS[value] }));

// Traffic-light rating of each "delegate first" option (brief §S22 logic).
// 'ninguna' = not ready to delegate yet; neutral, not wrong.
const delegate = (value, label, light) => ({ value, label, light });

export const WORRIES = [
  { value: 'voz', label: 'Voz clonada y estafas' },
  { value: 'empleo', label: 'Perder mi empleo' },
  { value: 'privacidad', label: 'Privacidad de mis datos' },
  { value: 'engano', label: 'Que me engañe con datos falsos' },
  { value: 'hijos', label: 'Que afecte a mis hijos' },
  { value: 'espiritual', label: 'Lo espiritual' },
  { value: 'ninguno', label: 'Ninguna en especial' },
];

export const FEAR_LABELS = { 1: 'Ninguno', 2: 'Poco', 3: 'Algo', 4: 'Bastante', 5: 'Mucho' };

export const SEMAFORO = [
  { value: 'verde', label: 'Verde', hint: 'Úsala con confianza' },
  { value: 'amarillo', label: 'Amarillo', hint: 'Úsala, pero revisa y complementa' },
  { value: 'rojo', label: 'Rojo', hint: 'No la uses para esto' },
];

const is = (key, ...values) => (a) => values.includes(a[key]);

export const BRANCH_KEYS = ['role', 'usage'];

export const QUESTIONS = [
  // ── Perfil ───────────────────────────────────────────────
  {
    id: 'role',
    type: 'cards',
    dim: 'perfil',
    column: 'role',
    title: '¿Qué te describe mejor hoy?',
    options: ROLES,
  },
  {
    id: 'industry',
    type: 'chips',
    dim: 'perfil',
    column: 'industry',
    title: (a) =>
      ({
        estudiante: '¿Qué área estudias o te interesa?',
        lider: '¿En qué sector trabajas entre semana?',
        empresario: '¿En qué sector está tu negocio?',
      })[a.role] ?? '¿En qué sector te mueves?',
    options: INDUSTRIES,
  },
  {
    id: 'ctx_negocio',
    type: 'cards',
    dim: 'perfil',
    when: is('role', 'empresario'),
    title: '¿Cuántas personas trabajan en tu negocio?',
    options: [
      { value: 'solo', label: 'Solo yo' },
      { value: '2_10', label: 'De 2 a 10' },
      { value: '11_50', label: 'De 11 a 50' },
      { value: '50_mas', label: 'Más de 50' },
    ],
  },
  {
    id: 'ctx_trabajo',
    type: 'cards',
    dim: 'perfil',
    when: is('role', 'empleado'),
    title: '¿Cómo es tu trabajo?',
    options: [
      { value: 'campo', label: 'Operativo o de campo' },
      { value: 'oficina', label: 'Administrativo o de oficina' },
      { value: 'comercial', label: 'Comercial o ventas' },
      { value: 'direccion', label: 'Dirijo un equipo' },
      { value: 'tecnico', label: 'Técnico o profesional especializado' },
    ],
  },
  {
    id: 'ctx_ministerio',
    type: 'cards',
    dim: 'perfil',
    when: is('role', 'lider'),
    title: '¿Qué lideras?',
    options: [
      { value: 'celula', label: 'Una célula o grupo pequeño' },
      { value: 'red', label: 'Un equipo o red de líderes' },
      { value: 'jovenes', label: 'Niños o jóvenes' },
      { value: 'creativo', label: 'Alabanza, medios o creativos' },
      { value: 'ensenanza', label: 'Enseñanza o pastoral' },
    ],
  },
  {
    id: 'ctx_estudio',
    type: 'cards',
    dim: 'perfil',
    when: is('role', 'estudiante'),
    title: '¿Qué estás estudiando?',
    options: [
      { value: 'colegio', label: 'Colegio' },
      { value: 'tecnico', label: 'Técnico o tecnólogo' },
      { value: 'universidad', label: 'Universidad' },
      { value: 'posgrado', label: 'Posgrado' },
      { value: 'cursos', label: 'Cursos por mi cuenta' },
    ],
  },
  {
    id: 'ctx_otro',
    type: 'cards',
    dim: 'perfil',
    when: is('role', 'otro'),
    title: '¿Cuál es tu situación hoy?',
    options: [
      { value: 'buscando', label: 'Buscando trabajo' },
      { value: 'emprendiendo', label: 'Arrancando un emprendimiento' },
      { value: 'pensionado', label: 'Pensionado' },
      { value: 'hogar', label: 'Dedicado al hogar' },
      { value: 'otra', label: 'Otra' },
    ],
  },

  // ── Uso actual ───────────────────────────────────────────
  {
    id: 'usage',
    type: 'cards',
    dim: 'uso',
    column: 'usage_frequency',
    title: '¿Con qué frecuencia usas inteligencia artificial?',
    hint: 'ChatGPT, Meta AI en WhatsApp, Gemini… cualquiera cuenta.',
    options: USAGE,
  },
  {
    id: 'tools',
    type: 'multi',
    dim: 'uso',
    when: (a) => Boolean(a.usage) && a.usage !== 'nunca',
    title: '¿Cuáles has usado?',
    hint: 'Marca todas las que apliquen.',
    options: [
      { value: 'chatgpt', label: 'ChatGPT' },
      { value: 'meta_ai', label: 'Meta AI (WhatsApp)' },
      { value: 'gemini', label: 'Gemini' },
      { value: 'copilot', label: 'Copilot' },
      { value: 'claude', label: 'Claude' },
      { value: 'perplexity', label: 'Perplexity' },
      { value: 'notebooklm', label: 'NotebookLM' },
      { value: 'canva_gamma', label: 'Canva o Gamma' },
      { value: 'apps', label: 'Lovable, Bolt o v0' },
      { value: 'voz_imagen', label: 'Voz o imagen con IA' },
      { value: 'otra', label: 'Otra' },
    ],
  },
  {
    id: 'usos_hoy',
    type: 'multi',
    dim: 'uso',
    when: is('usage', 'mensual', 'semanal', 'diario'),
    title: '¿Para qué la usas hoy?',
    hint: 'Marca todo lo que ya haces.',
    options: [
      { value: 'preguntar', label: 'Resolver dudas' },
      { value: 'escribir', label: 'Escribir mensajes y correos' },
      { value: 'resumir', label: 'Resumir textos' },
      { value: 'contenido', label: 'Contenido para redes' },
      { value: 'biblia', label: 'Estudiar la Biblia' },
      { value: 'traducir', label: 'Traducir' },
      { value: 'imagenes', label: 'Crear imágenes' },
      { value: 'datos', label: 'Analizar datos o Excel' },
      { value: 'programar', label: 'Programar o automatizar' },
      { value: 'agentes', label: 'Agentes que ejecutan tareas' },
    ],
  },

  // ── Fundamentos (knowledge checks, graded in diagnosis.js) ─
  {
    id: 'k_predice',
    type: 'binary',
    dim: 'fundamentos',
    title: 'En esencia, ¿qué hace un chat de IA cuando te responde?',
    options: [
      { value: 'busca', label: 'Busca la respuesta correcta en una gran base de datos' },
      { value: 'predice', label: 'Calcula la siguiente palabra más probable' },
    ],
  },
  {
    id: 'k_alucina',
    type: 'cards',
    dim: 'fundamentos',
    title: 'En IA, ¿qué es una «alucinación»?',
    options: [
      { value: 'falla', label: 'Cuando se bloquea y deja de responder' },
      { value: 'inventa', label: 'Cuando inventa algo y lo dice con total seguridad' },
      { value: 'imagina', label: 'Cuando crea imágenes de fantasía a propósito' },
      { value: 'virus', label: 'Un virus que se mete en el celular' },
    ],
  },
  {
    id: 'k_prompt',
    type: 'multi',
    dim: 'fundamentos',
    title: '¿Qué debe incluir un buen prompt?',
    hint: 'Un prompt es la instrucción que le das. Marca lo que aplique.',
    options: [
      { value: 'rol', label: 'Rol' },
      { value: 'corto', label: 'Ser lo más corto posible' },
      { value: 'contexto', label: 'Contexto' },
      { value: 'ingles', label: 'Palabras en inglés' },
      { value: 'tarea', label: 'Tarea' },
      { value: 'datos', label: 'Mis datos personales (cédula, claves)' },
      { value: 'formato', label: 'Formato' },
    ],
  },

  // ── Aplicación (branched by role) ────────────────────────
  {
    id: 'areas_negocio',
    type: 'multi',
    dim: 'aplicacion',
    column: 'use_areas',
    max: 4,
    when: is('role', 'empresario'),
    title: '¿Dónde usarías la IA en tu negocio?',
    hint: 'Elige hasta 4.',
    options: areas('ventas', 'marketing', 'clientes', 'finanzas', 'documentos', 'operaciones', 'web', 'biblia'),
  },
  {
    id: 'areas_trabajo',
    type: 'multi',
    dim: 'aplicacion',
    column: 'use_areas',
    max: 4,
    when: is('role', 'empleado'),
    title: '¿Dónde usarías la IA en tu trabajo?',
    hint: 'Elige hasta 4.',
    options: areas('correos', 'reuniones', 'datos', 'presentaciones', 'procesos', 'clientes', 'aprender', 'biblia'),
  },
  {
    id: 'areas_ministerio',
    type: 'multi',
    dim: 'aplicacion',
    column: 'use_areas',
    max: 4,
    when: is('role', 'lider'),
    title: '¿Dónde usarías la IA en tu ministerio?',
    hint: 'Elige hasta 4.',
    options: areas('biblia', 'ensenanzas', 'discusion', 'comunicacion', 'eventos', 'diseno', 'aprender', 'finanzas'),
  },
  {
    id: 'areas_estudio',
    type: 'multi',
    dim: 'aplicacion',
    column: 'use_areas',
    max: 4,
    when: is('role', 'estudiante'),
    title: '¿Dónde usarías la IA en tus estudios?',
    hint: 'Elige hasta 4.',
    options: areas('estudiar', 'resumenes', 'idiomas', 'programar', 'presentaciones', 'empleo', 'emprender', 'biblia'),
  },
  {
    id: 'areas_otro',
    type: 'multi',
    dim: 'aplicacion',
    column: 'use_areas',
    max: 4,
    when: is('role', 'otro'),
    title: '¿Dónde usarías la IA en tu día a día?',
    hint: 'Elige hasta 4.',
    options: areas('hogar', 'aprender', 'empleo', 'emprender', 'tramites', 'idiomas', 'biblia', 'web'),
  },
  {
    id: 'delegar_negocio',
    type: 'cards',
    dim: 'aplicacion',
    when: is('role', 'empresario'),
    title: '¿Qué tarea le delegarías primero?',
    options: [
      delegate('cotizaciones', 'Redactar cotizaciones y mensajes a clientes', 'verde'),
      delegate('contenido', 'Un mes de ideas para mis redes', 'verde'),
      delegate('contrato', 'Resumir un contrato y sacar preguntas para mi abogado', 'verde'),
      delegate('personal', 'Decidir a quién contrato o despido', 'rojo'),
      delegate('todavia', 'Nada todavía: primero quiero entenderla', 'ninguna'),
    ],
  },
  {
    id: 'delegar_trabajo',
    type: 'cards',
    dim: 'aplicacion',
    when: is('role', 'empleado'),
    title: '¿Qué tarea le delegarías primero?',
    options: [
      delegate('correos', 'Redactar correos e informes', 'verde'),
      delegate('resumir', 'Resumir documentos largos', 'verde'),
      delegate('excel', 'Ordenar datos y fórmulas de Excel', 'verde'),
      delegate('sin_revisar', 'Que haga mi trabajo y entregarlo sin revisar', 'rojo'),
      delegate('todavia', 'Nada todavía: primero quiero entenderla', 'ninguna'),
    ],
  },
  {
    id: 'delegar_ministerio',
    type: 'cards',
    dim: 'aplicacion',
    when: is('role', 'lider'),
    title: '¿Qué tarea le delegarías primero?',
    options: [
      delegate('contexto', 'Investigar el contexto histórico de un pasaje', 'verde'),
      delegate('logistica', 'Organizar el calendario y los anuncios del grupo', 'verde'),
      delegate('esquema', 'Armar el esquema de una enseñanza', 'amarillo'),
      delegate('devocional', 'Escribir mi devocional y compartirlo como mío', 'rojo'),
      delegate('todavia', 'Nada todavía: primero quiero entenderla', 'ninguna'),
    ],
  },
  {
    id: 'delegar_estudio',
    type: 'cards',
    dim: 'aplicacion',
    when: is('role', 'estudiante'),
    title: '¿Qué tarea le delegarías primero?',
    options: [
      delegate('explicar', 'Que me explique temas difíciles', 'verde'),
      delegate('resumenes', 'Hacer resúmenes para estudiar', 'verde'),
      delegate('idiomas', 'Practicar un idioma conversando', 'verde'),
      delegate('tareas', 'Hacer mis trabajos y entregarlos como míos', 'rojo'),
      delegate('todavia', 'Nada todavía: primero quiero entenderla', 'ninguna'),
    ],
  },
  {
    id: 'delegar_otro',
    type: 'cards',
    dim: 'aplicacion',
    when: is('role', 'otro'),
    title: '¿Qué tarea le delegarías primero?',
    options: [
      delegate('presupuesto', 'Organizar el presupuesto del hogar', 'verde'),
      delegate('hoja_vida', 'Mejorar mi hoja de vida', 'verde'),
      delegate('aprender', 'Aprender algo nuevo paso a paso', 'verde'),
      delegate('claves', 'Pasarle cédulas y claves para que haga mis trámites', 'rojo'),
      delegate('todavia', 'Nada todavía: primero quiero entenderla', 'ninguna'),
    ],
  },

  // ── Discernimiento ───────────────────────────────────────
  {
    id: 'semaforo',
    type: 'semaforo',
    dim: 'discernimiento',
    title: '¿Qué color le pones?',
    case: 'Pedirle a la IA orientación sobre un tema médico o legal',
    options: SEMAFORO,
  },

  // ── Temores ──────────────────────────────────────────────
  {
    id: 'fear_level',
    type: 'fear',
    dim: 'temor',
    column: 'fear_level',
    title: '¿Cuánto temor o desconfianza te genera la IA?',
    extra: {
      id: 'worries',
      title: '¿Qué te preocupa más?',
      hint: 'Opcional. Elige hasta 3.',
      max: 3,
      exclusive: ['ninguno'],
      options: WORRIES,
    },
  },

  // ── Meta ─────────────────────────────────────────────────
  {
    id: 'goal',
    type: 'cards',
    dim: 'meta',
    title: '¿Qué quieres lograr con la IA?',
    hint: 'Elige lo principal.',
    options: [
      { value: 'tiempo', label: 'Ahorrar tiempo en mi trabajo' },
      { value: 'negocio', label: 'Hacer crecer mi negocio' },
      { value: 'ministerio', label: 'Servir mejor en mi iglesia' },
      { value: 'crear', label: 'Crear algo nuevo: contenido, una app, un proyecto' },
      { value: 'entender', label: 'Entenderla y no quedarme atrás' },
      { value: 'familia', label: 'Proteger a mi familia de estafas y riesgos' },
    ],
  },
];

export const MAX_QUESTIONS = 15;

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id) {
  return byId.get(id);
}

/** Questions visible for the given answers, in order. */
export function getPath(answers = {}) {
  return QUESTIONS.filter((q) => !q.when || q.when(answers));
}

export function resolveTitle(q, answers = {}) {
  return typeof q.title === 'function' ? q.title(answers) : q.title;
}

/** Answer keys a question writes (the fear screen writes two). */
export function answerKeys(q) {
  return q.extra ? [q.id, q.extra.id] : [q.id];
}

/** True when the question has a usable answer. */
export function isAnswered(q, answers) {
  const v = answers[q.id];
  if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
  if (q.type === 'fear') return Number.isInteger(v) && v >= 1 && v <= 5;
  return typeof v === 'string' && q.options.some((o) => o.value === v);
}

/** Drops answers that belong to questions no longer on the path (role changed, etc.). */
export function pruneAnswers(answers) {
  const keep = new Set(getPath(answers).flatMap(answerKeys));
  return Object.fromEntries(Object.entries(answers).filter(([k]) => keep.has(k)));
}

/** Label for a stored option value of a question (falls back to the raw value). */
export function optionLabel(qid, value) {
  const q = byId.get(qid) ?? QUESTIONS.find((x) => x.extra?.id === qid);
  const opts = q?.extra?.id === qid ? q.extra.options : q?.options;
  return opts?.find((o) => o.value === value)?.label ?? value;
}

/** The role-specific question answered for a given column (use_areas, delegate). */
export function branchAnswer(answers, prefix) {
  const q = getPath(answers).find((x) => x.id.startsWith(prefix));
  return q ? { question: q, value: answers[q.id] } : { question: null, value: undefined };
}

export const labelOf = {
  role: (v) => ROLES.find((o) => o.value === v)?.label ?? v,
  industry: (v) => INDUSTRIES.find((o) => o.value === v)?.label ?? v,
  usage: (v) => USAGE.find((o) => o.value === v)?.label ?? v,
  area: (v) => USE_AREAS[v] ?? v,
  worry: (v) => WORRIES.find((o) => o.value === v)?.label ?? v,
};
