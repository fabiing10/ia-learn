// The ideation skill of the Vibe Coding course (CEREBRO-GENERAL.md, A2): turns an
// idea into a one-page spec and the first message for the building tool. The
// principles are fixed; the profile only says who the student is, their phrase,
// their tool and their limits. The course materials (vibecoding/plan-clase-1.md,
// «Materiales») are copied here verbatim, so this module stays inside cerebro/.
// Deterministic and pure like skill-general.js, which it reuses for the paste
// header and the install routes.

import { zip } from './zip.js';
import {
  INSTRUCCION_PEGAR, NOTA_PRUEBA, cabeceraGpt, cuerpoGpt, fence, herramientasDe, instalarRutas,
  joinY, lcFirst, lineas, md, oneLine, probarlaMd, sentence,
} from './skill-general.js';

export const ARCHIVOS_IDEACION = [
  'README.md',
  'SKILL.md',
  'INSTRUCCIONES_GPT.md',
  'PRIMER_MENSAJE.md',
  'references/plantilla-spec.md',
  'references/reglas-de-mesa.md',
];

export const SLUG_IDEACION = 'ideacion-de-producto';

export const SECTORES = [
  { id: 'publico', label: 'Sector público', sistema: 'una entidad pública' },
  { id: 'empresa', label: 'Empresa privada', sistema: 'una empresa' },
  { id: 'emprendimiento', label: 'Emprendimiento propio', sistema: 'mi propio emprendimiento' },
  { id: 'academia', label: 'Universidad o colegio', sistema: 'una institución educativa' },
  { id: 'social', label: 'Organización social', sistema: 'una organización social' },
  { id: 'otro', label: 'Otro', sistema: 'mi contexto' },
];

// Multiple choice.
export const CONSTRUYE = [
  { id: 'web', label: 'App web' },
  { id: 'movil', label: 'App móvil' },
  { id: 'automatizacion', label: 'Automatización o flujo' },
  { id: 'servicio', label: 'Servicio o experiencia' },
  { id: 'contenido', label: 'Contenido o comunidad' },
];

export const HERRAMIENTAS_CONSTRUCCION = [
  { id: 'lovable', label: 'Lovable', caja: 'cerrada' },
  { id: 'base44', label: 'Base44', caja: 'cerrada' },
  { id: 'claude-code', label: 'Claude Code', caja: 'abierta' },
  { id: 'codex', label: 'Codex', caja: 'abierta' },
  { id: 'nose', label: 'No sé aún', caja: null },
];

export const NIVELES = [
  { id: 'cero', label: 'Nunca he construido nada', sistema: 'nunca he construido software' },
  { id: 'algo', label: 'Ya hice algo con IA', sistema: 'ya construí algo pequeño con IA' },
  { id: 'programo', label: 'Programo', sistema: 'sé programar' },
];

// Same ids and texts as TONOS_SKILL, declared here on purpose (the contract asks for a copy).
export const TONOS_IDEACION = [
  { id: 'directo', label: 'Claro y directo', instruccion: 'Responde claro y directo, en párrafos cortos' },
  { id: 'didactico', label: 'Didáctico, explícame', instruccion: 'Explica cada paso y por qué, con un ejemplo cuando ayude' },
  { id: 'esencial', label: 'Solo lo esencial', instruccion: 'Entrega solo el resultado, en listas, sin preámbulos' },
];

// Which files each form field rewrites; ideacion.test.mjs checks it against the
// generator. The README quotes the phrase (test question), the tool (where the
// first message goes) and the name.
export const CAMPOS_IDEACION = [
  { id: 'frase', label: 'Tu frase', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'README.md'] },
  { id: 'sector', label: 'Sector', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'] },
  { id: 'construye', label: 'Qué construyes', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramienta', label: 'Herramienta', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'README.md'] },
  { id: 'nivel', label: 'Nivel', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'] },
  { id: 'restricciones', label: 'Límites', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'nombre', label: 'Nombre', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'tono', label: 'Tono', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramientas', label: 'IA que usas', archivos: ['README.md'] },
];

// Sofía, estudiante (CEREBRO-GENERAL.md, A2).
export const EJEMPLO_IDEACION = Object.freeze({
  nombre: 'Sofía',
  sector: 'academia',
  construye: Object.freeze(['web']),
  frase: 'Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador',
  herramienta: 'lovable',
  nivel: 'cero',
  restricciones: Object.freeze(['No usa datos reales de los residentes', 'No tiene pagos']),
  tono: 'didactico',
  herramientas: Object.freeze(['chatgpt']),
});

export const VACIO_IDEACION = Object.freeze({
  nombre: '',
  sector: null,
  construye: Object.freeze([]),
  frase: '',
  herramienta: null,
  nivel: null,
  restricciones: Object.freeze([]),
  tono: 'directo',
  herramientas: Object.freeze([]),
});

const TITULO = 'Ideación de producto';
// ≤ 200 characters: Claude rejects longer skill descriptions.
const DESCRIPCION =
  'Convierte una idea en una spec de una página y en el primer mensaje para construirla con IA. Úsala cuando diga que tengo una idea, quiero una app o pida aterrizar un proyecto, aunque no diga «spec».';
const FRASE_VACIA = 'Quiero una app que ___ para ___';

// ── Course materials, verbatim from vibecoding/plan-clase-1.md («Materiales») ──

const CABECERA = [
  'Construye la versión 1 de esta app exactamente como está descrita abajo.',
  'No agregues funciones que no estén en la spec. Si algo no está claro, pregúntame antes de construir.',
  'Los datos deben guardarse en una base de datos, no en la memoria del navegador.',
  'Cuando termines, dime cómo pruebo cada uno de los tres escenarios de la sección 6.',
  '',
  '[pegar aquí la spec completa]',
].join('\n');
const CABECERA_NOTA = 'Se pega encima de la spec. Le dice a la herramienta que pregunte en vez de adivinar.';

const PLANTILLA_SPEC = `# [Nombre de la app] — Spec V1

## 1. Para quién y qué problema
[Un párrafo. Quién la usa y qué le resuelve. Ej.: "El equipo de mantenimiento recibe solicitudes por WhatsApp y las pierde. Esta app las recibe en un solo lugar y muestra en qué estado van."]

## 2. Qué hace (3 a 5 acciones, con verbo)
- [Rol] puede [acción]. Ej.: "Cualquier persona puede registrar una solicitud con título, descripción y área."
- [Rol] puede [acción]. Ej.: "El responsable puede cambiar el estado: nueva, en proceso, resuelta."
- [Rol] puede [acción]. Ej.: "Cualquier persona puede ver la lista de solicitudes y su estado."

## 3. Qué guarda
- [Cosa]: [sus datos]. Ej.: "Solicitud: título, descripción, área, fecha de creación, estado, nombre de quien la pidió."

## 4. Quién puede hacer qué (máximo dos roles)
- [Rol 1]: [qué ve y qué puede hacer]
- [Rol 2]: [qué ve y qué puede hacer]

## 5. Qué NO hace (mínimo tres cosas, van a "después")
- [Ej.: no envía correos ni notificaciones]
- [Ej.: no tiene inicio de sesión; el responsable entra por una URL aparte]
- [Ej.: no adjunta archivos]

## 6. Cómo sé que funciona (tres escenarios)
- Cuando [rol] hace [acción], pasa [resultado]. Ej.: "Cuando una persona registra una solicitud, aparece en la lista con estado Nueva y la fecha de hoy."
- Cuando ... , pasa ...
- Cuando ... , pasa ...

## 7. Pantallas (opcional, una frase cada una)
- [Pantalla]: [qué muestra]. Ej.: "Lista: todas las solicitudes, la más reciente arriba, con filtro por estado."`;

const TRAMPAS = [
  '"Que sea bonita" → no es una acción; va a pantallas, y la herramienta ya la hace razonable.',
  '"Y que tenga IA" → va a "después", salvo que sea la acción principal. Hoy se construye la base.',
  '"Que mande correos" → integración; va a "después". En 40 minutos no cabe.',
  'Sin roles → "¿quién llena y quién decide?". Si es la misma persona, un rol basta, y lo escriben.',
  'Sin "qué NO hace" → la spec no está lista. Es el bloque que más se salta y el que más cuesta saltarse.',
];

const REGLAS_MESA = [
  'Un cambio por mensaje.',
  'Describe lo que ves, no lo que crees que falla.',
  'Prueba antes de pedir lo siguiente.',
  'Si se rompió, vuelve a la versión anterior antes de arreglar.',
  'Nunca pegues datos reales.',
];

const PROTOCOLO_ERROR = [
  'Lee lo que dice la herramienta. Casi siempre dice qué pasó.',
  'Copia el mensaje de error tal cual y pídele que lo arregle. Sin interpretarlo.',
  'Si en dos intentos no lo arregla, vuelve a la versión anterior y pide el mismo cambio de otra forma, más pequeño.',
  'Si vuelve a fallar, anótalo para la clase 2 y sigue con el siguiente punto de control.',
];

const QUE_NO_HACER = [
  'No pegar datos reales de personas, clientes ni de la empresa. Inventar nombres.',
  'No publicar una app con información sensible sin inicio de sesión. V1 no lo tiene; por eso V1 no lleva datos sensibles.',
  'No pegar contraseñas ni llaves de otros servicios en un mensaje a la herramienta.',
  'No conectar la app a cuentas reales (correo, pagos, bases de datos de la empresa) en esta etapa.',
];

// "Caja cerrada / caja abierta" (plan, bloque 3): what each box is, and the one-line reason to pick it.
const CAJAS = {
  cerrada: { que: 'entrega todo armado y esconde las piezas', razon: 'todo armado, sin instalar nada' },
  abierta: { que: 'muestra todo y me hace responsable', razon: 'yo elijo cada pieza' },
};

// ── The skill text (CEREBRO-GENERAL.md, A2), fixed ──

const CUANDO =
  'Cuando te cuente una idea («quiero una app que… para…»), cuando te pida aterrizar, recortar o explicar un proyecto, o cuando te pegue una lista de funciones. No la uses para escribir código: esta skill termina en la spec y en el primer mensaje para la herramienta.';

const PRINCIPIO =
  'Vibe coding no es pedir una app. Es describirla tan bien que la IA no tenga que adivinar. Todo lo que la IA tendría que adivinar es lo que falta en la spec.';

const PASOS = [
  'La frase. Si no la tengo, ayúdame a escribirla: «Quiero una app que ___ para ___». Si traigo una lista de funciones, primero la frase.',
  'Prueba del adivino. Antes de proponer nada, lista lo que tendrías que adivinar para construir eso. Hazme máximo tres preguntas, las que más cambian el producto, y espera mis respuestas.',
  'Las cinco piezas. Ubica la idea en el mapa: front (lo que la persona ve y toca), lógica (lo que pasa cuando toca algo), base de datos (lo que recuerda cuando cierra la pestaña), dominio (dónde vive) y repositorio (de quién es y cómo se deshace un cambio). En la V1, dominio y repositorio los resuelve la herramienta: dilo y sigue.',
  'La spec de una página, con los siete bloques de references/plantilla-spec.md y sus límites: 1 para quién y qué problema (un párrafo); 2 qué hace (tres a cinco acciones con verbo, «[Rol] puede [acción]»); 3 qué guarda (las cosas y sus datos); 4 quién puede hacer qué (máximo dos roles); 5 qué NO hace (mínimo tres cosas, van a «después»); 6 cómo sé que funciona (tres escenarios «Cuando [rol] hace [acción], pasa [resultado]», uno por acción principal); 7 pantallas (opcional, una frase cada una).',
  'El recorte. V1 = un tipo de usuario principal, tres acciones y una cosa que se guarda. Si hay más de cinco acciones o más de dos roles, lo que sobra baja al bloque 5. Correos y notificaciones, pagos, inicio de sesión con Google, «que tenga IA» y «que sea bonita» van a «después», salvo que sean la acción principal. Propón el recorte; YO DECIDO qué se queda.',
  'Prueba del adivino, segunda vuelta. Lee la spec como si fueras la herramienta y escribe tres cosas que aún tendrías que adivinar. Corrígelas en la spec antes de entregar.',
];
const paso7 = (caja) =>
  `La entrega, en este orden: (a) la spec completa en markdown; (b) el primer mensaje listo para pegar en la herramienta: la instrucción de cabecera de references/plantilla-spec.md y la spec debajo, todo en un solo bloque de código; (c) la caja: ${caja}; (d) las reglas de mesa y el protocolo de error de references/reglas-de-mesa.md, en cinco líneas.`;
const CAJA_SIN_HERRAMIENTA =
  'recomiéndame caja cerrada (Lovable, Base44: todo armado, sin instalar nada) o abierta (Claude Code, Codex: yo elijo cada pieza), con una razón';

const REGLAS_FIJAS = [
  'Pregunta en vez de adivinar; máximo tres preguntas por turno.',
  'No agregues funciones que no pedí. Si crees que falta algo, va al bloque 5 como propuesta.',
  'Acciones con verbo, nunca pantallas: «una página con un formulario» no dice qué pasa al enviar.',
  'Nunca uses datos reales de personas ni de empresas en los ejemplos: inventa nombres.',
  'Cuando iteremos la spec, un cambio por mensaje.',
];
const REGLA_CIERRE = 'Termina cada entrega con una sección «Lo que aún adivinaría», aunque quede vacía.';

const FORMATO_FIJO = 'La spec siempre con los títulos de la plantilla, en ese orden. El primer mensaje en un bloque de código, para copiarlo entero.';

const EJEMPLO = [
  'Entrada: «Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador».',
  'Salida: tres preguntas (¿quién registra, los residentes o solo el administrador?; ¿qué estados tiene una solicitud?; ¿hace falta ver el historial?), luego la spec de siete bloques con tres acciones, dos roles, cuatro cosas en «qué NO hace» y tres escenarios, y el primer mensaje con la cabecera.',
].join('\n');

// ── Profile ──

const byId = (list, id) => list.find((x) => x.id === id) || null;
const one = (list, v) => (typeof v === 'string' && byId(list, v) ? v : null);
const pick = (list, values) => {
  const ids = new Set(Array.isArray(values) ? values.filter((v) => typeof v === 'string') : []);
  return list.filter((x) => ids.has(x.id)).map((x) => x.id);
};
/** The phrase without the quotes or the final period the student may have typed. */
const limpiaFrase = (v) =>
  oneLine(v, 300).replace(/^[«"“'\s]+/u, '').replace(/[»"”'.\s]+$/u, '');

/** Any input (stored JSON, form state, partial object) → a clean profile. */
export function normalizeIdeacion(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    nombre: oneLine(p.nombre, 60).replace(/[.\s]+$/u, ''),
    sector: one(SECTORES, p.sector),
    construye: pick(CONSTRUYE, p.construye),
    frase: limpiaFrase(p.frase),
    herramienta: one(HERRAMIENTAS_CONSTRUCCION, p.herramienta),
    nivel: one(NIVELES, p.nivel),
    restricciones: lineas(p.restricciones),
    tono: one(TONOS_IDEACION, p.tono) || 'directo',
    herramientas: herramientasDe(p.herramientas),
  };
}

function resolve(raw) {
  const p = normalizeIdeacion(raw);
  const h = byId(HERRAMIENTAS_CONSTRUCCION, p.herramienta);
  return {
    p,
    // «Otro» has no useful sentence («Soy de mi contexto»): it drops the clause.
    sector: p.sector && p.sector !== 'otro' ? byId(SECTORES, p.sector) : null,
    nivel: byId(NIVELES, p.nivel),
    herramienta: h && h.caja ? h : null, // «No sé aún» = no tool yet
    construye: p.construye.map((id) => lcFirst(byId(CONSTRUYE, id).label)),
    tono: byId(TONOS_IDEACION, p.tono),
  };
}

// ── SKILL.md ──

function quienSoy({ sector, nivel }) {
  if (sector && nivel) return `Soy de ${sector.sistema} y ${nivel.sistema}.`;
  if (sector) return `Soy de ${sector.sistema}.`;
  if (nivel) return sentence(nivel.sistema);
  return null;
}

function construyo({ construye, herramienta }) {
  const que = construye.length ? ` ${joinY(construye)}` : '';
  if (herramienta) return `Construyo${que} con ${herramienta.label} (caja ${herramienta.caja}: ${CAJAS[herramienta.caja].que}).`;
  return [que ? `Construyo${que}.` : null, 'Todavía no elegí herramienta: recomiéndame una al final.'].filter(Boolean).join(' ');
}

function encabezado(r) {
  const { p } = r;
  const intro = ['Skill de mi cerebro.', p.nombre ? `Llámame ${p.nombre}.` : null, quienSoy(r), construyo(r)].filter(Boolean).join(' ');
  const frase = p.frase ? `Mi idea de partida: «${p.frase}».` : 'Todavía no tengo la frase de mi idea: empieza por el paso 1.';
  return `${intro}\n${frase}`;
}

function secciones(r) {
  const h = r.herramienta;
  const caja = h ? `construyo en ${h.label}, caja ${h.caja}: ${CAJAS[h.caja].razon}` : CAJA_SIN_HERRAMIENTA;
  const pasos = [...PASOS, paso7(caja)].map((s, i) => `${i + 1}. ${s}`).join('\n');
  // The student's limits are about the product («No tiene pagos») or about them («Nunca pego…»):
  // «Límite:» keeps them apart from the imperatives addressed to the AI.
  const limites = r.p.restricciones.map((s) => `Límite: ${lcFirst(sentence(s))}`);
  const reglas = [...REGLAS_FIJAS, ...limites, REGLA_CIERRE].map((s) => `- ${s}`).join('\n');
  return [
    ['Cuándo usarla', CUANDO],
    ['Principio', PRINCIPIO],
    ['Pasos', pasos],
    ['Reglas que siempre aplican', reglas],
    ['Formato', `${r.tono.instruccion}. ${FORMATO_FIJO}`],
    ['Ejemplo', EJEMPLO],
  ];
}

function skillMd(r) {
  return md([
    // A JSON string is a valid YAML double-quoted scalar.
    ['---', `name: ${SLUG_IDEACION}`, `description: ${JSON.stringify(DESCRIPCION)}`, '---'].join('\n'),
    `# ${TITULO}`,
    encabezado(r),
    ...secciones(r).flatMap(([titulo, cuerpo]) => [`## ${titulo}`, cuerpo]),
  ]);
}

// ── References ──

const numerados = (items) => items.map((s, i) => `${i + 1}. ${s}`).join('\n');
const vinetas = (items) => items.map((s) => `- ${s}`).join('\n');

function plantillaMd() {
  return md([
    '# Plantilla de la spec',
    'La usan los pasos 4 y 7 de la skill. La cabecera va encima de la spec en el primer mensaje; la plantilla tiene los siete bloques, en este orden.',
    '## Instrucción de cabecera para el primer mensaje',
    CABECERA_NOTA,
    fence(CABECERA, 'markdown'),
    '## Plantilla: spec de una página',
    fence(PLANTILLA_SPEC, 'markdown'),
    '## Trampas frecuentes',
    vinetas(TRAMPAS),
  ]);
}

function reglasMesaMd() {
  return md([
    '# Reglas de mesa y protocolo de error',
    'Las usa el paso 7 de la skill. Son para cuando ya estás construyendo: cómo pedir cambios, qué hacer cuando algo se rompe y qué no hacer.',
    '## Reglas de mesa',
    numerados(REGLAS_MESA),
    '## Protocolo de error',
    numerados(PROTOCOLO_ERROR),
    '## Qué no hacer (seguridad)',
    vinetas(QUE_NO_HACER),
  ]);
}

// ── INSTRUCCIONES_GPT.md: the skill body as plain instructions, references inlined ──

const PLANTILLA_GPT = 'PLANTILLA DE LA SPEC';
const REGLAS_GPT = 'REGLAS DE MESA Y PROTOCOLO DE ERROR';
/** A pasted text has no folder: point to the inlined sections instead. */
const sinCarpeta = (s) =>
  s.replaceAll('references/plantilla-spec.md', `la sección ${PLANTILLA_GPT}`).replaceAll('references/reglas-de-mesa.md', `la sección ${REGLAS_GPT}`);

// ≤ 7 500 characters (ChatGPT caps instructions at 8 000). The fixed steps and the
// verbatim template already take most of it, so this version leaves out what no
// step uses: the «Qué no hacer» safety lines (they stay in reglas-de-mesa.md, which
// the README asks to upload to the project). The paste header asks for the skill's
// name, so the SKILL line stays.
function gptMd(r) {
  return md([
    ...cabeceraGpt(TITULO),
    `SKILL: ${TITULO}`,
    encabezado(r),
    ...secciones(r).map(([titulo, cuerpo]) => `${titulo.toLocaleUpperCase('es')}\n${sinCarpeta(cuerpo)}`),
    [
      PLANTILLA_GPT,
      'Cabecera del primer mensaje (va encima de la spec):',
      fence(CABECERA, 'markdown'),
      'Plantilla: spec de una página.',
      fence(PLANTILLA_SPEC, 'markdown'),
      'Trampas frecuentes:',
      vinetas(TRAMPAS),
    ].join('\n'),
    [REGLAS_GPT, 'Reglas de mesa:', numerados(REGLAS_MESA), 'Protocolo de error:', numerados(PROTOCOLO_ERROR)].join('\n'),
  ]);
}

// ── PRIMER_MENSAJE.md ──

function primerMensajeMd(r) {
  const contexto = [r.sector?.sistema, r.nivel?.sistema].filter(Boolean);
  const linea = [
    contexto.length ? `Contexto: ${contexto.join('; ')}.` : null,
    r.herramienta ? `Construiré en ${r.herramienta.label}.` : 'Todavía no elegí herramienta.',
  ].filter(Boolean).join(' ');
  return md([
    '# Primer mensaje',
    'Pégalo en un chat con la skill instalada (o después de pegar INSTRUCCIONES_GPT.md).',
    '---',
    [
      `Tengo una idea: «${r.p.frase || FRASE_VACIA}».`,
      linea,
      'Aplica la skill de ideación de producto: hazme máximo tres preguntas, luego la spec de una página y el primer mensaje para la herramienta.',
    ].join('\n'),
  ]);
}

// ── README.md ──

function readmeMd(r) {
  const { p } = r;
  const filas = [
    [`${SLUG_IDEACION}/SKILL.md`, 'La skill para Claude. Sube la carpeta como ZIP (ver «Instalar»).'],
    [`${SLUG_IDEACION}/references/plantilla-spec.md`, 'Plantilla de la spec: la cabecera del primer mensaje, los siete bloques y las trampas frecuentes.'],
    [`${SLUG_IDEACION}/references/reglas-de-mesa.md`, 'Reglas de mesa, protocolo de error y qué no hacer.'],
    ['INSTRUCCIONES_GPT.md', 'La misma skill, con las dos referencias adentro, para ChatGPT, Gemini, Copilot o cualquier chat.'],
    ['PRIMER_MENSAJE.md', 'Lo que envías primero, con tu idea.'],
    ['README.md', 'Esta guía.'],
  ];
  const destino = r.herramienta ? r.herramienta.label : 'la herramienta que elijas';
  return md([
    `# ${TITULO} · tu skill`,
    [
      `${p.nombre ? `${p.nombre}, esta` : 'Esta'} skill convierte una idea suelta en una spec de una página y en el primer mensaje para construirla con IA.`,
      'Antes de construir, pasa la prueba del adivino: todo lo que la IA tendría que adivinar es lo que falta en la spec.',
    ].join('\n'),
    ['| Archivo | Para qué |', '|---|---|', ...filas.map(([a, b]) => `| \`${a}\` | ${b} |`)].join('\n'),
    ...instalarRutas({
      herramientas: p.herramientas,
      slug: SLUG_IDEACION,
      nombre: TITULO,
      subir: ['plantilla-spec.md', 'reglas-de-mesa.md'],
      carpeta: `${SLUG_IDEACION}/references`,
    }),
    '## Usarla',
    numerados([
      'Instala la skill con la ruta de tu herramienta (arriba), o pega `INSTRUCCIONES_GPT.md` en un chat nuevo.',
      'Pega `PRIMER_MENSAJE.md` en ese chat y responde sus preguntas.',
      `Copia el primer mensaje que te entrega y pégalo en ${destino}.`,
    ]),
    ...probarlaMd(pruebaIdeacion(p)),
    '## Después de construir',
    `Reglas de mesa: ${REGLAS_MESA.map((s) => lcFirst(s).replace(/\.$/u, '')).join('; ')}.`,
    'La spec es el documento al que vuelven todos los mensajes.',
  ]);
}

// ── Public API ──

export function buildIdeacion(raw) {
  const r = resolve(raw);
  return {
    'README.md': readmeMd(r),
    'SKILL.md': skillMd(r),
    'INSTRUCCIONES_GPT.md': gptMd(r),
    'PRIMER_MENSAJE.md': primerMensajeMd(r),
    'references/plantilla-spec.md': plantillaMd(),
    'references/reglas-de-mesa.md': reglasMesaMd(),
  };
}

/** «Copiar todo para pegar en un chat»: the paste header of A1, then the instructions. */
export function pasteIdeacion(raw) {
  return `${INSTRUCCION_PEGAR}\n\n${cuerpoGpt(gptMd(resolve(raw)))}`;
}

const SKILL_FILES = ['SKILL.md', 'references/plantilla-spec.md', 'references/reglas-de-mesa.md'];

/** The skill as Claude uploads it: `ideacion-de-producto/` with SKILL.md and both references. */
export function zipIdeacion(raw, { date = new Date() } = {}) {
  const files = buildIdeacion(raw);
  return zip(SKILL_FILES.map((n) => ({ name: `${SLUG_IDEACION}/${n}`, data: files[n] })), { date });
}

/** Everything: `ideacion-kit/` with README, instructions, first message and the skill folder. */
export function zipTodoIdeacion(raw, { date = new Date() } = {}) {
  const files = buildIdeacion(raw);
  const kit = 'ideacion-kit';
  return zip(
    [
      ...['README.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'].map((n) => ({ name: `${kit}/${n}`, data: files[n] })),
      ...SKILL_FILES.map((n) => ({ name: `${kit}/${SLUG_IDEACION}/${n}`, data: files[n] })),
    ],
    { date },
  );
}

/** The with/without test: the student's phrase, and what to compare. */
export function pruebaIdeacion(raw) {
  const p = normalizeIdeacion(raw);
  return {
    pregunta: p.frase || FRASE_VACIA,
    esperado: {
      con: [
        'Hace máximo tres preguntas antes de proponer',
        'Spec de siete bloques: tres a cinco acciones con verbo, máximo dos roles',
        'Mínimo tres cosas en «Qué NO hace»',
        'Tres escenarios «Cuando… pasa…» y el primer mensaje con la cabecera',
        'Cierra con «Lo que aún adivinaría»',
      ],
      sin: [
        'Propone una lista larga de funciones sin preguntar',
        'Pantallas en vez de acciones',
        'Sin «Qué NO hace»: intenta construir una empresa',
        'Sin escenarios: no hay cómo probarla',
        'Un prompt suelto, no un primer mensaje con cabecera',
      ],
    },
    nota: NOTA_PRUEBA,
  };
}
