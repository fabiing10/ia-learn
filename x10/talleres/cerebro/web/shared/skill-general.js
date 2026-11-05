// Profile → one installable skill for any task (CEREBRO-GENERAL.md, A1): SKILL.md in
// the Agent Skills format for Claude, the same skill as plain instructions for
// ChatGPT, Gemini or any chat, and a README to install, test and maintain it.
// Deterministic like generator.js: no dates, no randomness, same profile → same
// bytes. Pure ES module, no DOM. ideacion.js reuses the paste header and the
// install routes from here.

import { zip } from './zip.js';
import { HERRAMIENTAS, INSTALAR_SKILL, RUTAS_CARGA } from './catalog.js';

export const ARCHIVOS_SKILL = ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md'];

export const TONOS_SKILL = [
  { id: 'directo', label: 'Claro y directo', instruccion: 'Responde claro y directo, en párrafos cortos' },
  { id: 'didactico', label: 'Didáctico, explícame', instruccion: 'Explica cada paso y por qué, con un ejemplo cuando ayude' },
  { id: 'esencial', label: 'Solo lo esencial', instruccion: 'Entrega solo el resultado, en listas, sin preámbulos' },
];

// Which files each form field rewrites; skill-general.test.mjs checks it against
// the generator. The README quotes the description (what it does + the first
// triggers) and the test question (the example entry).
export const CAMPOS_SKILL = [
  { id: 'skillNombre', label: 'Nombre', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'queHace', label: 'Qué hace', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'cuando', label: 'Cuándo', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'entradas', label: 'Qué entrego', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'pasos', label: 'Pasos', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'reglas', label: 'Reglas', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'formato', label: 'Formato', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'ejemplo', label: 'Ejemplo', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'verifico', label: 'Verifico', archivos: ['SKILL.md', 'README.md'] },
  { id: 'material', label: 'Material', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'quienSoy', label: 'Quién soy', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'nombre', label: 'Tu nombre', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'tono', label: 'Tono', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramientas', label: 'IA que usas', archivos: ['README.md'] },
];

// Daniel, coordinador de proyectos (CEREBRO-GENERAL.md, A1). Tools in catalog order.
export const EJEMPLO_SKILL = Object.freeze({
  nombre: 'Daniel',
  quienSoy: 'coordinador de proyectos en una ONG de educación',
  skillNombre: 'Resumen de reunión',
  // Short enough that the description keeps one trigger and its closing within 200 characters.
  queHace: 'Convierte notas de reunión en decisiones, compromisos con responsable y fecha, y pendientes.',
  cuando: Object.freeze([
    'Te pego notas o la transcripción de una reunión',
    'Digo «resume la reunión» o «saca los compromisos»',
    'Te paso un audio transcrito con varias personas hablando',
  ]),
  entradas: Object.freeze([
    'Las notas o la transcripción completa',
    'La fecha y el nombre de la reunión',
    'Quiénes asistieron, si no está en las notas',
  ]),
  pasos: Object.freeze([
    'Lee todo antes de escribir; identifica a cada persona por su nombre o su rol',
    'Separa decisiones (lo que ya se acordó) de compromisos (alguien hace algo para una fecha) y de pendientes (sin dueño o sin fecha)',
    'Escribe cada compromiso con responsable y fecha; si falta uno de los dos, déjalo en pendientes y márcalo',
    'Redacta el resumen en el formato de abajo',
    'Lista al final lo que no quedó claro en las notas',
  ]),
  reglas: Object.freeze([
    'No agregues compromisos que nadie dijo',
    'Si dos personas dijeron cosas distintas, anota las dos; no elijas',
    'Nombres propios solo si están en las notas; nada de cargos inventados',
    'Nunca asumas una fecha: si no está, va a pendientes',
  ]),
  formato: '# Reunión: {nombre} · {fecha}\n\n## Decisiones\n- …\n\n## Compromisos\n| Qué | Quién | Para cuándo |\n\n## Pendientes\n- …\n\n## Para revisar\n- …',
  ejemploEntrada: 'Notas del comité del 3 de noviembre: Ana propone mover el taller al 20; Luis dice que confirma el salón el viernes; nadie definió quién avisa a los colegios.',
  // Obeys its own rules: no assumed date or month, a proposal is not a decision.
  ejemploSalida: 'Decisiones: ninguna; mover el taller al 20 quedó como propuesta de Ana. Compromisos: Luis confirma el salón · el viernes. Pendientes: avisar a los colegios, sin responsable. Para revisar: ¿se aprobó mover el taller al 20?; ¿de qué mes es el 20 y qué fecha es el viernes?',
  verifico: Object.freeze([
    'Cada compromiso tiene responsable y fecha, o está en pendientes',
    'No hay nada en el resumen que no esté en las notas',
    'Lo ambiguo quedó en «Para revisar», no resuelto por la IA',
  ]),
  material: '',
  tono: 'directo',
  herramientas: Object.freeze(['claude', 'chatgpt']),
});

export const VACIO_SKILL = Object.freeze({
  nombre: '',
  quienSoy: '',
  skillNombre: '',
  queHace: '',
  cuando: Object.freeze([]),
  entradas: Object.freeze([]),
  pasos: Object.freeze([]),
  reglas: Object.freeze([]),
  formato: '',
  ejemploEntrada: '',
  ejemploSalida: '',
  verifico: Object.freeze([]),
  material: '',
  tono: 'directo',
  herramientas: Object.freeze([]),
});

/** First message of the universal load path: the AI confirms in three lines that it read the skill. */
export const INSTRUCCION_PEGAR =
  'Guarda estas instrucciones como una skill para este chat. Cuando termines de leerlas, confírmame en tres líneas: (1) cómo se llama la skill y cuándo se activa, (2) qué me vas a pedir antes de empezar, (3) con qué sección vas a cerrar cada respuesta. No hagas nada más todavía.';

export const NOTA_PRUEBA = 'Hazla en un chat con la skill y en otro sin ella. Compara el proceso, no solo la respuesta.';

// The intro of every INSTRUCCIONES_GPT.md, above its --- rule.
export const PEGALAS = 'Pégalas en las instrucciones de un Proyecto de ChatGPT, de un GPT personalizado o de una Gem de Gemini.';
export const GUARDA_SKILL = 'Guarda esta skill y actívala sola cuando aparezca la tarea; no esperes a que la nombre.';

const MAX_DESCRIPCION = 200; // Claude rejects longer skill descriptions (support.claude.com, checked 20 Oct 2026).
const MAX_ITEMS = 12;
const MAX_ITEM = 200;

// ── Text helpers (shared with ideacion.js) ──

const byId = (list, id) => list.find((x) => x.id === id) || null;
export const oneLine = (v, max) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, max).trim();
const ucFirst = (s) => (s ? s[0].toLocaleUpperCase('es') + s.slice(1) : s);
/** Lowercases the first letter unless the word looks like an acronym (ONG, IA). */
export const lcFirst = (s) => (s && !(s.length > 1 && /\p{Lu}/u.test(s[1])) ? s[0].toLocaleLowerCase('es') + s.slice(1) : s);
/** "texto" → "Texto." — one sentence for a bullet; keeps ? ! … endings. */
export const sentence = (s) => {
  const t = ucFirst(s.replace(/[\s,;:]+$/u, ''));
  return /[.!?…]$/u.test(t) ? t : `${t}.`;
};
/** "a", "a y b", "a, b y c". */
export const joinY = (items, y = 'y') =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${y} ${items[items.length - 1]}`;

/** Multiline text: unix newlines, no trailing spaces, at most one blank line in a row. */
export function texto(v, max) {
  return (typeof v === 'string' ? v : '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/u, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max)
    .trimEnd();
}

/** One item per line: trimmed, bullet or number markers removed, empties dropped, capped. */
export function lineas(v, { max = MAX_ITEMS, len = MAX_ITEM } = {}) {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\r?\n/) : [];
  const out = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const s = oneLine(item.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/u, ''), len);
    if (s && out.length < max) out.push(s);
  }
  return out;
}

/** Keeps known tool ids once, in catalog order; «ninguna» only when alone. */
export function herramientasDe(values) {
  const ids = new Set(Array.isArray(values) ? values.filter((v) => typeof v === 'string') : []);
  const out = HERRAMIENTAS.filter((h) => ids.has(h.id)).map((h) => h.id);
  return out.length > 1 ? out.filter((h) => h !== 'ninguna') : out;
}

export const md = (blocks) => blocks.filter((b) => b !== null && b !== undefined && b !== '').join('\n\n') + '\n';
const bullets = (items) => items.map((i) => `- ${sentence(i)}`).join('\n');
const numbered = (items) => items.map((i, n) => `${n + 1}. ${sentence(i)}`).join('\n');
/** A fence longer than any backtick run inside, so a pasted template never breaks it. */
export function fence(text, lang = '') {
  const run = Math.max(2, ...(text.match(/`+/g) || []).map((m) => m.length));
  const f = '`'.repeat(run + 1);
  return `${f}${lang}\n${text}\n${f}`;
}
const quote = (text) => text.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');

// ── Profile ──

/** Any input (stored JSON, form state, partial object) → a clean profile. */
export function normalizeSkill(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const sinPunto = (s) => s.replace(/[.\s]+$/u, '');
  return {
    nombre: sinPunto(oneLine(p.nombre, 60)),
    quienSoy: sinPunto(oneLine(p.quienSoy, 160)),
    skillNombre: sinPunto(oneLine(p.skillNombre, 60)),
    queHace: oneLine(p.queHace, 300),
    cuando: lineas(p.cuando),
    entradas: lineas(p.entradas),
    pasos: lineas(p.pasos),
    reglas: lineas(p.reglas),
    formato: texto(p.formato, 2000),
    ejemploEntrada: texto(p.ejemploEntrada, 2000),
    ejemploSalida: texto(p.ejemploSalida, 2000),
    verifico: lineas(p.verifico),
    material: texto(p.material, 20000),
    tono: typeof p.tono === 'string' && byId(TONOS_SKILL, p.tono) ? p.tono : 'directo',
    herramientas: herramientasDe(p.herramientas),
  };
}

const titulo = (p) => p.skillNombre || 'Mi skill';

/** skillNombre → 'resumen-de-reunion': lowercase ASCII and hyphens, ≤ 40, 'mi-skill' when empty. */
export function slugSkill(raw) {
  const slug = normalizeSkill(raw).skillNombre
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug || 'mi-skill';
}

const COLGANTES = /\s+(?:de|del|la|las|el|los|un|una|y|o|en|con|para|por|a|al|que|se|su|sus)$/iu;

/** Cuts at a word boundary to ≤ max characters, ending with … */
function recortar(text, max) {
  if (text.length <= max) return text;
  let cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  if (space > 0) cut = cut.slice(0, space);
  for (let i = 0; i < 3; i++) cut = cut.replace(/[\s,;:.«(—-]+$/u, '').replace(COLGANTES, '');
  return `${cut}…`;
}

/**
 * The YAML description Claude reads to decide when to apply the skill: what it does
 * plus the first triggers. "Pushy" on purpose (Claude undertriggers skills). Tries
 * three triggers, then two, then one, so the closing survives; cuts with … only
 * when even one trigger does not fit.
 */
export function descripcionSkill(raw) {
  const p = normalizeSkill(raw);
  const que = sentence(p.queHace || titulo(p));
  const cuando = p.cuando.slice(0, 3).map((c) => lcFirst(c).replace(/[\s.,;:]+$/u, ''));
  if (!cuando.length) return recortar(`${que} Úsala siempre que aparezca esta tarea, aunque no la nombre.`, MAX_DESCRIPCION);
  const frase = (n) => `${que} Úsala cuando ${joinY(cuando.slice(0, n), 'o')}, aunque no lo pida con esas palabras.`;
  for (let n = cuando.length; n >= 1; n--) if (frase(n).length <= MAX_DESCRIPCION) return frase(n);
  return recortar(frase(1), MAX_DESCRIPCION);
}

// ── SKILL.md ──

const PENDIENTE = {
  cuando: '[PENDIENTE: las situaciones o frases que activan la skill, una por línea]',
  entradas: '[PENDIENTE: lo que le entregas a la IA para esta tarea, uno por línea]',
  pasos: '[PENDIENTE: los pasos de la tarea, uno por línea y en orden]',
  reglas: '[PENDIENTE: lo que siempre aplica o nunca pasa en esta tarea, una por línea]',
  formato: '[PENDIENTE: la plantilla o la forma de la salida]',
  verifico: '[PENDIENTE: cómo sabes que la salida quedó bien, uno por línea]',
  queHace: '[PENDIENTE: qué hace la skill, en una frase]',
  entrada: '[PENDIENTE: una entrada real de la tarea]',
  salida: '[PENDIENTE: la salida que esperas para esa entrada]',
  ejemplo: '[Opcional: una entrada real de la tarea y la salida que esperas. Un ejemplo enseña más que cualquier regla.]',
};

const REGLAS_FIJAS_SKILL = [
  '- No inventes datos que no te di; si falta un dato, dilo en lugar de completarlo.',
  '- Termina con una sección «Para revisar» con lo que debo confirmar antes de usar la salida.',
];
const REGLAS_FIJAS_GPT = [
  '- No inventes datos que no te di; si falta un dato, dilo.',
  '- Termina con «Para revisar»: lo que debo confirmar antes de usar la salida.',
];

const lista = (items, ph) => (items.length ? bullets(items) : ph);
const pasosDe = (p) => (p.pasos.length ? numbered(p.pasos) : PENDIENTE.pasos);
const reglasDe = (p, fijas) => [p.reglas.length ? bullets(p.reglas) : PENDIENTE.reglas, ...fijas].join('\n');

/** A multi-line or markdown-looking format is a template: it goes in a fence so its headings stay inside it. */
function formatoDe(p) {
  if (!p.formato) return PENDIENTE.formato;
  const plantilla = p.formato.includes('\n') || /^\s*(?:#|\||[-*>] |\d+[.)] )/u.test(p.formato);
  return plantilla ? fence(p.formato, 'markdown') : p.formato;
}

/** "Entrada: x" on one line, or the label and a fence when the text has several lines. */
const etiqueta = (label, text, ph) => (!text ? `${label}: ${ph}` : text.includes('\n') ? `${label}:\n${fence(text)}` : `${label}: ${text}`);

function ejemploDe(p) {
  if (!p.ejemploEntrada && !p.ejemploSalida) return PENDIENTE.ejemplo;
  return `${etiqueta('Entrada', p.ejemploEntrada, PENDIENTE.entrada)}\n${etiqueta('Salida', p.ejemploSalida, PENDIENTE.salida)}`;
}

const tonoDe = (p) => `${byId(TONOS_SKILL, p.tono).instruccion}.`;

function skillMd(p) {
  const intro = [
    'Skill de mi cerebro.',
    p.quienSoy ? `Soy ${lcFirst(p.quienSoy)}.` : null,
    p.nombre ? `Llámame ${p.nombre}.` : null,
    p.material ? 'Antes de empezar, lee references/material.md.' : null,
  ].filter(Boolean).join(' ');
  return md([
    // A JSON string is a valid YAML double-quoted scalar: colons and quotes stay safe.
    ['---', `name: ${slugSkill(p)}`, `description: ${JSON.stringify(descripcionSkill(p))}`, '---'].join('\n'),
    `# ${titulo(p)}`,
    intro,
    '## Cuándo usarla',
    lista(p.cuando, PENDIENTE.cuando),
    'Si dudas, pregúntame si quieres que la use.',
    '## Qué te entrego',
    lista(p.entradas, PENDIENTE.entradas),
    'Si falta algo de esta lista, pídemelo antes de empezar.',
    '## Pasos',
    pasosDe(p),
    '## Reglas que siempre aplican',
    reglasDe(p, REGLAS_FIJAS_SKILL),
    '## Formato de salida',
    formatoDe(p),
    tonoDe(p),
    '## Ejemplo',
    ejemploDe(p),
    '## Cómo sé que quedó bien',
    lista(p.verifico, PENDIENTE.verifico),
  ]);
}

// ── INSTRUCCIONES_GPT.md ──

/** The intro every INSTRUCCIONES_GPT.md shares: title, where to paste it, the rule. */
export const cabeceraGpt = (nombre) => [`# Instrucciones · ${nombre}`, PEGALAS, '---', GUARDA_SKILL];

function gptMd(p) {
  const quien = [p.quienSoy ? `${p.quienSoy}.` : null, p.nombre ? `Llámame ${p.nombre}.` : null].filter(Boolean).join(' ');
  return md([
    ...cabeceraGpt(titulo(p)),
    [`SKILL: ${titulo(p)}`, `QUÉ HACE: ${p.queHace ? sentence(p.queHace) : PENDIENTE.queHace}`, quien ? `QUIÉN SOY: ${quien}` : null].filter(Boolean).join('\n'),
    ['CUÁNDO USARLA', lista(p.cuando, PENDIENTE.cuando)].join('\n'),
    ['QUÉ TE ENTREGO', lista(p.entradas, PENDIENTE.entradas), 'Si falta algo, pídemelo antes de empezar.'].join('\n'),
    ['PASOS', pasosDe(p)].join('\n'),
    ['REGLAS QUE SIEMPRE APLICAN', reglasDe(p, REGLAS_FIJAS_GPT)].join('\n'),
    ['FORMATO DE SALIDA', formatoDe(p), tonoDe(p)].join('\n'),
    ['EJEMPLO', ejemploDe(p)].join('\n'),
    `Si te pido otra cosa, no apliques esta skill.${p.material ? ' Material de referencia: está en el archivo material.md de este Proyecto; léelo antes del paso 1.' : ''}`,
  ]);
}

/** The body of an INSTRUCCIONES_GPT.md: everything below its --- rule. */
export const cuerpoGpt = (gpt) => gpt.slice(gpt.indexOf('\n---\n\n') + 6);

// ── README.md: install routes (shared with ideacion.js) ──

const RUTA_CHATGPT = RUTAS_CARGA.find((r) => r.id === 'chatgpt');
// Copy bank of CEREBRO-GENERAL.md («Pegar, Proyecto o skill»), verbatim.
const PEGAR_PROYECTO_SKILL =
  'Pegar: vale para este chat. Proyecto: vale para todos los chats del proyecto. Skill: la IA la aplica sola, en cualquier chat, cuando aparece la tarea.';
const NOTA_GEMINI =
  'Desde noviembre de 2026 Google retira las Gems de las cuentas personales y las convierte automáticamente en skills (para mayores de 18 años). Tu Gem pasa sola; las instrucciones siguen sirviendo.';

const pasosMd = (pasos) => (pasos.length === 1 ? pasos[0] : pasos.map((s, i) => `${i + 1}. ${s}`).join('\n'));
const archivosMd = (subir) => joinY(subir.map((f) => `\`${f}\``));

/**
 * The «Instalar» blocks of a README: one per tool, the person's tools first (catalog
 * order), the rest under «Otras rutas», and the paste-in-any-chat route last.
 * `subir` lists the reference files a ChatGPT project or a Gem also needs.
 */
export function instalarRutas({ herramientas, slug, nombre, subir = [], carpeta = '' }) {
  const donde = carpeta ? ` (carpeta \`${carpeta}\`)` : '';
  const archivos = subir.length ? archivosMd(subir) : '';
  const rutas = {
    claude: {
      label: 'Claude (skill)',
      texto: [
        `Sube \`${slug}.zip\`, el ZIP de la skill que descargaste en x10.expert/cerebro (paso «Carga»). Si solo tienes esta carpeta, comprime la carpeta \`${slug}\` y sube ese ZIP.`,
        pasosMd(INSTALAR_SKILL.pasos),
        INSTALAR_SKILL.nota,
      ],
    },
    chatgpt: {
      label: 'ChatGPT (Proyectos)',
      texto: [
        pasosMd([
          `Proyectos → Nuevo proyecto → «${nombre}».`,
          'Instrucciones: menú ••• del proyecto → «Project settings»; pega `INSTRUCCIONES_GPT.md`. {{VERIFICAR_MENUS_CHATGPT}}',
          ...(archivos ? [`Archivos: sube también ${archivos}${donde}.`] : []),
        ]),
        RUTA_CHATGPT.nota,
      ],
    },
    gemini: {
      label: 'Gemini (Gems)',
      texto: [
        pasosMd([
          `Gems → Nueva Gem → «${nombre}».`,
          'Instrucciones: pega `INSTRUCCIONES_GPT.md`. {{VERIFICAR_MENUS_GEMINI}}',
          ...(archivos ? [`Conocimiento → Agregar archivos: sube ${archivos}${donde}.`] : []),
        ]),
        NOTA_GEMINI,
      ],
    },
    copilot: {
      label: 'Copilot',
      texto: ['Pega `INSTRUCCIONES_GPT.md` al inicio del chat; Copilot no guarda skills en cuentas personales. {{VERIFICAR_COPILOT}}'],
    },
  };
  const bloque = (id, mia) => [`### ${rutas[id].label}${mia ? ' · la usas hoy' : ''}`, ...rutas[id].texto].join('\n\n');
  const universal = [
    '### Cualquier IA (pegar en un chat)',
    'Chat nuevo → pega `INSTRUCCIONES_GPT.md` → envía. Te confirma en tres líneas (ver abajo).',
    'Escribe esta instrucción antes de pegar; el botón «Copiar todo para pegar en un chat» de la página del taller ya la incluye:',
    quote(INSTRUCCION_PEGAR),
    'Si te confirma cómo se llama la skill, qué te va a pedir y con qué sección va a cerrar, quedó cargada. Vale solo para ese chat.',
  ].join('\n\n');

  const ids = Object.keys(rutas);
  const mias = ids.filter((id) => herramientas.includes(id));
  const otras = ids.filter((id) => !mias.includes(id));
  const instalar = ['## Instalar', PEGAR_PROYECTO_SKILL];
  if (!mias.length) return [...instalar, ...otras.map((id) => bloque(id, false)), universal];
  return [
    ...instalar,
    ...mias.map((id) => bloque(id, true)),
    '## Otras rutas',
    'Por si cambias de herramienta o quieres probarla en otra.',
    ...otras.map((id) => bloque(id, false)),
    universal,
  ];
}

/** «Probarla»: the note, the question to ask in both chats and the two columns. */
export function probarlaMd(prueba, extra = []) {
  const { con, sin } = prueba.esperado;
  const filas = Array.from({ length: Math.max(con.length, sin.length) }, (_, i) => `| ${con[i] || ''} | ${sin[i] || ''} |`);
  return [
    '## Probarla',
    prueba.nota,
    'Pídele esto en los dos chats:',
    quote(prueba.pregunta),
    ['| Con la skill | Sin la skill |', '|---|---|', ...filas].join('\n'),
    ...extra,
  ];
}

function readmeMd(p) {
  const slug = slugSkill(p);
  const filas = [
    ['`' + slug + '/SKILL.md`', 'La skill para Claude. Sube la carpeta como ZIP (ver «Instalar»).'],
    p.material ? ['`' + slug + '/references/material.md`', 'Tu material de referencia: la IA lo lee antes de empezar.'] : null,
    ['`INSTRUCCIONES_GPT.md`', 'La misma skill como instrucciones para ChatGPT, Gemini, Copilot o cualquier chat.'],
    ['`README.md`', 'Esta guía.'],
  ].filter(Boolean);
  return md([
    `# ${titulo(p)} · tu skill`,
    p.queHace ? quote(sentence(p.queHace)) : null,
    'Una skill es un procedimiento escrito que la IA aplica sola cuando aparece la tarea. Esta carpeta trae la misma skill en dos formatos.',
    ['| Archivo | Para qué |', '|---|---|', ...filas.map(([a, b]) => `| ${a} | ${b} |`)].join('\n'),
    ...instalarRutas({
      herramientas: p.herramientas,
      slug,
      nombre: titulo(p),
      subir: p.material ? ['material.md'] : [],
      carpeta: p.material ? `${slug}/references` : '',
    }),
    ...probarlaMd(pruebaSkillGeneral(p), [
      'Y revisa tus criterios de «Cómo sé que quedó bien»:',
      lista(p.verifico, PENDIENTE.verifico),
    ]),
    '## Mantenerla',
    'Cuando la IA se equivoque, no corrijas el chat: corrige la skill (un paso, una regla o el formato) y vuelve a subirla.',
    'Claude decide cuándo usarla por la descripción que va al inicio de SKILL.md (máximo 200 caracteres):',
    quote(descripcionSkill(p)),
    'Si no la usa cuando esperas, escribe primero en «Cuándo» la frase con la que se lo pides.',
  ]);
}

// ── Public API ──

export function buildSkillGeneral(raw) {
  const p = normalizeSkill(raw);
  const files = {
    'README.md': readmeMd(p),
    'SKILL.md': skillMd(p),
    'INSTRUCCIONES_GPT.md': gptMd(p),
  };
  if (p.material) files['references/material.md'] = md([`# Material de referencia · ${titulo(p)}`, p.material]);
  return files;
}

/** «Copiar todo para pegar en un chat»: the header, then the instructions (and the material, which a chat has no file for). */
export function pasteSkillGeneral(raw) {
  const p = normalizeSkill(raw);
  const body = cuerpoGpt(gptMd(p));
  return p.material ? `${INSTRUCCION_PEGAR}\n\n${body}\n===== material.md =====\n${p.material}\n` : `${INSTRUCCION_PEGAR}\n\n${body}`;
}

/** The skill as Claude uploads it: a ZIP whose root is `<slug>/` with SKILL.md (+ references). */
export function zipSkillGeneral(raw, { date = new Date() } = {}) {
  const slug = slugSkill(raw);
  const files = buildSkillGeneral(raw);
  const entries = [{ name: `${slug}/SKILL.md`, data: files['SKILL.md'] }];
  if (files['references/material.md']) entries.push({ name: `${slug}/references/material.md`, data: files['references/material.md'] });
  return zip(entries, { date });
}

/** Everything: `<slug>-kit/` with the README, the GPT instructions and the skill folder. */
export function zipTodoSkillGeneral(raw, { date = new Date() } = {}) {
  const slug = slugSkill(raw);
  const kit = `${slug}-kit`;
  const files = buildSkillGeneral(raw);
  const entries = [
    { name: `${kit}/README.md`, data: files['README.md'] },
    { name: `${kit}/INSTRUCCIONES_GPT.md`, data: files['INSTRUCCIONES_GPT.md'] },
    { name: `${kit}/${slug}/SKILL.md`, data: files['SKILL.md'] },
  ];
  if (files['references/material.md']) entries.push({ name: `${kit}/${slug}/references/material.md`, data: files['references/material.md'] });
  return zip(entries, { date });
}

/** The with/without test: the example entry as the question, and what to compare. */
export function pruebaSkillGeneral(raw) {
  const p = normalizeSkill(raw);
  return {
    pregunta: p.ejemploEntrada || 'Pega aquí una entrada real de la tarea: lo mismo que le darías a un colega',
    esperado: {
      con: [
        'Sigue tus pasos en orden y pide lo que falta de «Qué te entrego»',
        'Respeta tus reglas: no inventa, se detiene donde dijiste',
        'Entrega en tu formato, con el tono que elegiste',
        'Cierra con «Para revisar»',
      ],
      sin: [
        'Formato distinto cada vez',
        'Rellena lo que falta con supuestos',
        'No sabe qué nunca debe hacer',
        'Sin cierre de revisión: todo parece listo',
      ],
    },
    nota: NOTA_PRUEBA,
  };
}
