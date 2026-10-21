// Profile → the six files of the cerebro jurídico (plan §4.2, §6.3, §6.4, §6.10).
// Deterministic templates, no dates, no randomness: the same profile always gives
// byte-identical files. Pure ES module, shared by the landing, the vault and tests.

import {
  AREAS, CONFIDENCIALIDAD, DISCLAIMER, FUENTES_OFICIALES, HERRAMIENTAS, INSTALAR_SKILL,
  INTRO_CARGA, MARCO_COLOMBIANO, MAX_TAREAS, PRIVACIDAD, PRIVACIDAD_VERIFICADA, ROLES,
  RUTAS_CARGA, RUTAS_VERIFICADAS, TAREAS, TONOS,
} from './catalog.js';

export const ARCHIVOS = [
  'README.md',
  '00_ADN.md',
  '01_LINEAS_ROJAS.md',
  '02_PLAYBOOK.md',
  '03_FUENTES.md',
  '04_VERIFICACION.md',
];

// The five files that go to the AI (§4.4); the README is for the lawyer.
export const ARCHIVOS_CEREBRO = ARCHIVOS.slice(1);

// §6.4: which files each profile field feeds. The name also signs the verified
// entry in 03_FUENTES. A test checks this map against the generator.
export const CAMPOS = [
  { id: 'nombre', label: 'Nombre', archivos: ['00_ADN.md', 'README.md', '03_FUENTES.md'] },
  { id: 'rol', label: 'Rol', archivos: ['00_ADN.md', '01_LINEAS_ROJAS.md'] },
  { id: 'areas', label: 'Áreas', archivos: ['00_ADN.md', '03_FUENTES.md'] },
  { id: 'tareas', label: 'Tareas', archivos: ['00_ADN.md', '02_PLAYBOOK.md', 'README.md'] },
  { id: 'herramientas', label: 'IA que usas', archivos: ['00_ADN.md', 'README.md'] },
  { id: 'confidencialidad', label: 'Confidencialidad', archivos: ['00_ADN.md', '01_LINEAS_ROJAS.md'] },
  { id: 'tono', label: 'Tono', archivos: ['00_ADN.md'] },
  { id: 'nuncaDelego', label: 'Nunca delego', archivos: ['01_LINEAS_ROJAS.md'] },
];

export const FIJOS = {
  id: 'fijos',
  label: 'Bloques fijos',
  archivos: ['01_LINEAS_ROJAS.md', '03_FUENTES.md', '04_VERIFICACION.md'],
};

// Used when a single-choice field is empty, so the system block stays complete.
const DEFAULT_CONFIDENCIALIDAD = 'reservada';
const DEFAULT_TONO = 'didactico';

const byId = (list, id) => list.find((x) => x.id === id) || null;
const lcFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const ucFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const oneLine = (v, max) =>
  (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, max).trim();
/** "texto" → "Texto." (one sentence for a bullet). */
const sentence = (s) => ucFirst(s.replace(/[.\s]+$/, '')) + '.';
const key = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Keeps the first `max` known ids, once each, then puts them in catalog order. */
function pick(list, values, max = Infinity) {
  const ids = [];
  for (const v of Array.isArray(values) ? values : []) {
    if (typeof v === 'string' && byId(list, v) && !ids.includes(v) && ids.length < max) ids.push(v);
  }
  return list.filter((x) => ids.includes(x.id)).map((x) => x.id);
}

const one = (list, value) => (typeof value === 'string' && byId(list, value) ? value : null);

/** Any input (stored JSON, form state, partial object) → a clean profile. */
export function normalizeProfile(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  let herramientas = pick(HERRAMIENTAS, p.herramientas);
  if (herramientas.length > 1) herramientas = herramientas.filter((h) => h !== 'ninguna');
  return {
    nombre: oneLine(p.nombre, 60).replace(/[.\s]+$/, ''),
    rol: one(ROLES, p.rol),
    areas: pick(AREAS, p.areas),
    tareas: pick(TAREAS, p.tareas, MAX_TAREAS),
    herramientas,
    confidencialidad: one(CONFIDENCIALIDAD, p.confidencialidad),
    tono: one(TONOS, p.tono),
    nuncaDelego: oneLine(p.nuncaDelego, 280),
  };
}

export function resolve(raw) {
  const p = normalizeProfile(raw);
  return {
    p,
    rol: byId(ROLES, p.rol),
    areas: p.areas.map((id) => byId(AREAS, id)),
    tareas: p.tareas.map((id) => byId(TAREAS, id)),
    herramientas: p.herramientas.map((id) => byId(HERRAMIENTAS, id)),
    conf: byId(CONFIDENCIALIDAD, p.confidencialidad || DEFAULT_CONFIDENCIALIDAD),
    tono: byId(TONOS, p.tono || DEFAULT_TONO),
  };
}

const md = (blocks) => blocks.filter((b) => b !== null && b !== undefined && b !== '').join('\n\n') + '\n';
const list = (items) => items.map((i) => `- ${i}`).join('\n');
const fence = (text) => '```text\n' + text + '\n```';

// ── 00_ADN: system block (§6.10) ──

// Rules 2 and 3 ask a model that can search for the official link, instead of
// asking it to stop: Claude and ChatGPT search with citations on every plan
// (checked 20 Oct 2026). skills.js repeats them inside every skill.
export const REGLA_FUENTES =
  '2. Fuentes: primero revisa 03_FUENTES.md. Si la regla no está allí y puedes buscar en internet, búscala en la fuente oficial (relatorías de las altas cortes, SUIN-Juriscol, Secretaría del Senado). Si no la abriste en una fuente oficial, márcala [NO VERIFICADO].';
export const REGLA_CITAS =
  '3. Citas: cada sentencia, norma o artículo que cites lleva su enlace oficial. Nunca inventes sentencias, radicados, magistrados ponentes, fechas ni artículos; si no encuentras el dato exacto, dilo en lugar de completarlo.';

export function sistemaBlock(raw) {
  const { p, rol, areas, conf, tono } = resolve(raw);
  const como = rol ? rol.sistema : 'abogado/a';
  const practica = areas.length ? `, con práctica en ${areas.map((a) => a.sistema).join(', ')}` : '';
  const nombre = p.nombre ? ` Llámame ${p.nombre}.` : '';
  return [
    `Eres mi asistente jurídico. Trabajo en Colombia como ${como}${practica}.${nombre}`,
    '',
    'REGLAS',
    '1. Jurisdicción por defecto: Colombia. Si usas derecho comparado o doctrina extranjera, márcalo como tal.',
    REGLA_FUENTES,
    REGLA_CITAS,
    `4. Confidencialidad: ${lcFirst(conf.sistema)}`,
    `5. Tono: ${lcFirst(tono.instruccion)}. Formato: ${lcFirst(tono.formato)}.`,
    '6. Procedimientos y criterio: para las tareas de 02_PLAYBOOK.md sigue sus pasos, aplica mis posiciones antes que la práctica general y detente en cada punto marcado YO DECIDO.',
    '7. Cierre obligatorio: termina toda respuesta jurídica con una sección "Verificación pendiente" que liste lo que debo confirmar antes de usarla.',
    '8. Nunca presentes un borrador como definitivo. Yo firmo, radico y decido.',
  ].join('\n');
}

function adn(r) {
  const { p, rol, areas, tareas, herramientas, conf, tono } = r;
  const quien = [
    p.nombre ? `Cómo me llamas: ${p.nombre}` : null,
    `Rol: ${rol ? `${rol.label} (${rol.sistema})` : 'sin definir'}`,
    `Áreas de práctica: ${areas.length ? areas.map((a) => a.label).join(' · ') : 'sin definir'}`,
    tareas.length
      ? `Tareas que más tiempo me quitan: ${tareas.map((t) => t.label).join(' · ')}. Cada una tiene su skill en 02_PLAYBOOK.md`
      : 'Tareas que más tiempo me quitan: sin definir',
    `IA que uso hoy: ${herramientas.length ? herramientas.map((h) => h.label).join(' · ') : 'sin definir'}`,
    `Confidencialidad de lo que manejo: ${conf.label}${p.confidencialidad ? '' : ', por defecto'}. Reglas en 01_LINEAS_ROJAS.md`,
    `Cómo quiero que me respondas: ${tono.label}${p.tono ? '' : ', por defecto'}`,
  ].filter(Boolean);

  const bueno = rol
    ? rol.buenTrabajo.map(sentence)
    : ['[PENDIENTE: escribe aquí qué es un buen trabajo para ti; elige un rol y se llena solo]'];

  return md([
    '# 00_ADN · Quién soy y cómo trabajo',
    '> El centro del cerebro: quién soy, cómo trabajo, qué espero. Sin ADN, los otros cuatro archivos no tienen a quién servir. Aquí no van datos de clientes ni nada que cambie cada semana.',
    '## Quién soy',
    list(quien),
    '## Qué es un buen trabajo para mí',
    list(bueno),
    '## Instrucciones de sistema',
    'Copia este bloque en las instrucciones del Proyecto o de la Gem, o en el "system prompt" de tu modelo local. Va primero: es el marco que la IA sigue en cada respuesta.',
    fence(sistemaBlock(p)),
  ]);
}

// ── 01_LINEAS_ROJAS ──

const NUNCA_DELEGO_FIJO = [
  'Firmar, radicar o enviar algo que no leí completo.',
  'Aceptar una cita que no abrí en la fuente oficial.',
  'Contar un término sin el calendario oficial de festivos en la mano.',
];

const IA_NUNCA = [
  'Cita una sentencia, norma o artículo sin su enlace oficial, o completa un dato que no encontró (radicado, ponente, fecha, artículo).',
  'Afirma una regla jurídica que no abrió en una fuente oficial ni está en 03_FUENTES.md sin marcarla [NO VERIFICADO].',
  'Usa la práctica general cuando 02_PLAYBOOK.md tiene mi posición.',
  'Usa derecho comparado o doctrina extranjera sin marcarlo como tal.',
  'Se salta un punto YO DECIDO de 02_PLAYBOOK.md.',
  'Cierra una respuesta jurídica sin la sección "Verificación pendiente".',
  'Presenta un borrador como definitivo. Yo firmo, radico y decido.',
];

function nuncaDelego({ p, rol }) {
  const lines = [];
  if (p.nuncaDelego) lines.push(sentence(p.nuncaDelego));
  if (rol) lines.push(sentence(rol.nuncaDelego));
  for (const l of NUNCA_DELEGO_FIJO) lines.push(l);
  const seen = new Set();
  return lines.filter((l) => {
    const k = key(l);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function lineasRojas(r) {
  const { p, conf } = r;
  return md([
    '# 01_LINEAS_ROJAS · Lo que nunca pasa',
    '> Si la IA cruza una de estas líneas, corrige este archivo y la regla correspondiente en 00_ADN.md. Los procedimientos no van aquí: van en 02_PLAYBOOK.md.',
    `## Confidencialidad: ${conf.label}${p.confidencialidad ? '' : ' (por defecto)'}`,
    `Qué es: ${conf.que}.`,
    `Qué modelo: ${conf.modelo}.`,
    'Mis reglas:',
    list(conf.reglas.map(sentence)),
    `Regla 4 de mi sistema: "${conf.sistema}"`,
    '## Lo que nunca delego',
    list(nuncaDelego(r)),
    '## Lo que la IA nunca hace',
    list(IA_NUNCA),
    '## Marco colombiano',
    MARCO_COLOMBIANO.map((m) => `- ${m.instrumento}. ${sentence(m.fija)}\n  En mi cerebro: ${lcFirst(sentence(m.cerebro))}`).join('\n'),
    `> ${DISCLAIMER}`,
  ]);
}

// ── 02_PLAYBOOK ──

const ESTRUCTURA_SKILL = `## Skill: <nombre>
Cuándo: <situación que la activa>
1. YO entrego: <datos, siempre anonimizados>
2. IA hace: <pasos concretos y formato de salida>
3. YO DECIDO: <el punto donde se detiene>
4. VERIFICO: <qué compruebo y dónde>`;

const COMO_AGREGAR = [
  'Copia la estructura de arriba al final de este archivo y ponle un nombre.',
  'En "Cuándo", la situación que la activa.',
  'En "YO entrego", solo datos anonimizados (CLIENTE-01, CONTRAPARTE-01).',
  'En "IA hace", pasos concretos y el formato de salida que esperas.',
  'En "YO DECIDO", el punto exacto donde la IA se detiene y la decisión vuelve a ti.',
  'En "VERIFICO", qué compruebas y en qué fuente oficial.',
  'Cuando la IA se equivoque en un paso, agrega el paso o una advertencia a la skill, como la "Trampa conocida" de la skill de peticiones. Así crece el cerebro.',
];

function skill(t) {
  const { titulo, cuando, texto } = t.skill;
  return `## Skill: ${titulo}\n\n${cuando ? `Cuándo: ${cuando}\n` : ''}${texto}`;
}

function playbook({ tareas }) {
  return md([
    '# 02_PLAYBOOK · Cómo hago cada tarea',
    '> Mis skills: procedimientos para las tareas que más tiempo me quitan. Cada una dice qué entrego, qué hace la IA, dónde se detiene (YO DECIDO) y qué verifico. Las fuentes no van aquí: van en 03_FUENTES.md.',
    '## La estructura de toda skill',
    fence(ESTRUCTURA_SKILL),
    ...(tareas.length
      ? tareas.map(skill)
      : ['Todavía no hay skills. Elige hasta tres tareas en tu perfil, o escribe tu primera skill con la estructura de arriba.']),
    '## Cómo agregar una skill',
    COMO_AGREGAR.map((l, i) => `${i + 1}. ${l}`).join('\n'),
  ]);
}

// ── 03_FUENTES ──

const PLANTILLA_ENTRADA = `## Entrada verificada: <tema>
- Tipo: norma | sentencia
- Identificación:
- Regla extraída:
- Alerta de vigencia:
- Verificado por:   Fecha:   Enlace oficial:`;

function entradaPeticion(nombre) {
  return [
    '## Entrada verificada: derecho de petición',
    '',
    '- Tipo: norma',
    '- Identificación: art. 14 de la Ley 1437 de 2011 (CPACA), sustituido por el art. 1 de la Ley 1755 de 2015, que reemplazó el Título II del CPACA.',
    '- Regla extraída: término general de 15 días; peticiones de documentos e información, 10 días (si no hay respuesta, se entiende aceptada y las copias se entregan en los 3 días siguientes); consultas, 30 días. Si la autoridad no puede responder a tiempo, debe informarlo antes de que venza el término, y el nuevo plazo no puede exceder el doble. Días hábiles (art. 62 de la Ley 4 de 1913).',
    '- Alerta de vigencia: el art. 5 del Decreto Legislativo 491 de 2020 amplió estos términos durante la emergencia (30, 20 y 35 días). La Ley 2207 de 2022 derogó los arts. 5 y 6 del Decreto 491 y restableció los términos de la Ley 1755; rige desde el 18 de mayo de 2022. Una IA que responda con los términos ampliados está desactualizada.',
    `- Verificado por: ${nombre || '______'}   Fecha: ______   Enlace oficial: ______`,
    '',
    'Ábrela en SUIN-Juriscol, confirma la regla y llena Fecha y Enlace oficial. Mientras estén vacíos, trátala como pendiente de verificar.',
  ].join('\n');
}

function fuentes({ p, areas }) {
  const semilla = areas.length
    ? areas.map((a) => `### ${a.label}\n\nSemilla (verifica vigencia antes de confiar):\n\n${list(a.fuentes)}`).join('\n\n')
    : 'Todavía no elegiste áreas de práctica. Elígelas en tu perfil y aquí aparecen las normas semilla de cada una, para verificar antes de confiar.';
  return md([
    '# 03_FUENTES · Mi fuente de verdad',
    '> Regla: 03_FUENTES.md solo crece con lo que abriste y verificaste. Nunca con lo que la IA dijo.',
    'La IA puede buscar en internet; aquí va lo que tú ya abriste y verificaste, y las alertas que aprendiste. La IA lo consulta primero, antes de buscar.',
    '## Dónde verifico',
    list(FUENTES_OFICIALES.map((f) => `${f.label}: ${f.url}`)),
    '## Semilla por área',
    `${DISCLAIMER} Cuando abras y verifiques una norma, pásala a "Entradas verificadas" con la plantilla.`,
    semilla,
    '## Entradas verificadas',
    'Plantilla fija para cada entrada nueva:',
    fence(PLANTILLA_ENTRADA),
    entradaPeticion(p.nombre),
    '## Alertas de vigencia',
    list([
      'Derecho de petición: art. 5 del Decreto 491 de 2020 derogado por la Ley 2207 de 2022. Ese artículo (28 de marzo de 2020) amplió los términos durante la emergencia (30, 20 y 35 días) y no aplicaba a peticiones sobre otros derechos fundamentales. La Ley 2207 (17 de mayo de 2022) derogó los arts. 5 y 6 del decreto; desde el 18 de mayo de 2022 vuelven los 15, 10 y 30 días hábiles del art. 14 del CPACA. Una IA que responda con los términos ampliados está desactualizada.',
    ]),
  ]);
}

// ── 04_VERIFICACION (fixed: §8.1, §8.2, §8.3) ──

const PROTOCOLO = `Úsalo antes de usar cualquier salida de la IA en algo que firmo, radico o envío.
Tarda cinco minutos; una cita inventada cuesta una sanción.

## Para cada sentencia citada
- [ ] Existe: la abrí en la relatoría oficial de la corporación.
- [ ] Coinciden: número, fecha, sala o sección, magistrado(a) ponente y radicado.
- [ ] Dice lo que la IA dice: leí el aparte citado; es ratio decidendi, no obiter ni
      salvamento de voto.
- [ ] Sigue vigente: no fue modificada, unificada ni superada.

## Para cada norma
- [ ] Número, año y artículo correctos.
- [ ] Vigencia: no derogada, modificada ni declarada inexequible (SUIN-Juriscol).
- [ ] Aplica a mi caso: ámbito, sujetos y fechas.

## Para cada cálculo de términos
- [ ] Fecha de notificación confirmada en el expediente.
- [ ] Días hábiles contados con el calendario oficial de festivos; la IA no conoce los
      festivos de este año con certeza.
- [ ] Vacancia judicial y horario del despacho considerados.`;

const NIVELES = `Nivel A · ¿Existe?        → abrir la fuente oficial
 Nivel B · ¿Dice eso?      → leer el aparte; ratio vs. obiter; cita textual
 Nivel C · ¿Sigue vigente? → modificaciones, derogatorias, unificaciones, inexequibilidad`;

export const PROMPT_RED_TEAM = `Actúa como la contraparte. Encuentra errores, citas dudosas, normas posiblemente
derogadas y argumentos débiles en este texto. No lo reescribas; solo ataca. Marca cada
hallazgo como [CITA], [VIGENCIA], [LÓGICA] o [HECHOS].`;

function verificacion() {
  return md([
    '# 04_VERIFICACION · Antes de firmar, radicar o enviar',
    PROTOCOLO,
    '## Los tres niveles',
    fence(' ' + NIVELES),
    'Las sanciones documentadas en el mundo casi siempre fallaron en el nivel A. Los errores costosos sin sanción suelen fallar en el B o el C.',
    'Con una IA que busca en internet, el nivel A es rápido: exige el enlace oficial de cada cita y ábrelo. «Ya lo verifiqué» también es una respuesta de la IA: el enlace lo abres tú.',
    '## Red team con un segundo modelo',
    'Pega la respuesta del primer modelo en otro distinto con este mensaje:',
    fence(PROMPT_RED_TEAM),
    'Funciona porque los modelos tienen datos y sesgos distintos: lo que uno completa por patrón, otro a veces lo detecta. No reemplaza la verificación en la fuente; la hace más barata al señalar dónde mirar primero.',
    '## Registro',
    '| Fecha | Tarea | IA usada | Qué verifiqué | Resultado |\n|---|---|---|---|---|',
  ]);
}

// ── README ──

const ARBOL_MANTENIMIENTO = `La IA se equivocó
      │
      ├── ¿fue de procedimiento (hizo un paso mal, omitió una verificación)?
      │        └──▶ corrige 02_PLAYBOOK.md (agrega un paso o una advertencia a la skill)
      │
      ├── ¿fue de fuente (norma derogada, sentencia mal citada)?
      │        └──▶ corrige 03_FUENTES.md (agrega la entrada verificada o la alerta de vigencia)
      │
      └── ¿fue de límite (pidió datos que no debía, cruzó una línea)?
               └──▶ corrige 01_LINEAS_ROJAS.md y la regla correspondiente en 00_ADN.md`;

const NIVELES_MADUREZ = [
  'Nivel 0 · Chat en frío, sin contexto. Donde está la mayoría hoy.',
  'Nivel 1 · Los cinco archivos cargados en un Proyecto, Gem o chat, y tus skills instaladas. Aquí llegas hoy.',
  'Nivel 2 · Bóveda: Obsidian con casos, fuentes, plantillas y consultas de términos.',
  'Nivel 3 · Lector que no inventa: Gemini Notebook (antes NotebookLM) con las fuentes oficiales, cita al párrafo.',
  'Nivel 4 · IA con manos: lee y escribe en la bóveda vía MCP; consulta fuentes oficiales en vivo.',
  'Nivel 5 · Agentes multi-paso con supervisión (sistemas como GJD: agente de normatividad, agente decisor).',
];

const TRES_ACCIONES = [
  'Revisa tu cuenta: apaga el entrenamiento con tus datos (sección «Antes de pegar»). Dos minutos.',
  'Carga tu cerebro en un Proyecto de Claude o ChatGPT, o en Gemini, e instala tus skills en Claude. Diez minutos; dejas de pegarlo cada vez.',
  'Cuando la IA se equivoque, escribe la corrección en `02_PLAYBOOK.md` o `03_FUENTES.md`. Antes de firmar, radicar o enviar, abre `04_VERIFICACION.md`.',
];

/** Privacy rows with the tools the user chose first (catalog order otherwise). */
export function privacidadOrdenada(raw) {
  const { herramientas } = normalizeProfile(raw);
  const mine = PRIVACIDAD.filter((x) => x.herramienta && herramientas.includes(x.herramienta));
  return [...mine, ...PRIVACIDAD.filter((x) => !mine.includes(x))].map((x) => ({ ...x, mia: mine.includes(x) }));
}

function cuentaSection(p) {
  const rows = privacidadOrdenada(p).map((x) =>
    [
      `### ${x.label}${x.mia ? ' · la usas hoy' : ''}`,
      '',
      list([
        `¿Entrena con lo que subes? ${x.entrena}`,
        `Cómo apagarlo: ${x.apagar}`,
        x.sinRastro ? `Sin rastro: ${x.sinRastro}` : null,
        `Ojo: ${x.ojo}`,
        `Fuente: ${x.fuente}`,
      ].filter(Boolean)),
    ].join('\n'),
  );
  return [
    '## Antes de pegar: revisa tu cuenta',
    `Dos minutos. En las cuentas personales, lo que subes puede usarse para entrenar modelos: apágalo antes de pegar tu cerebro o un documento. ${PRIVACIDAD_VERIFICADA}`,
    rows.join('\n\n'),
  ];
}

function skillsSection(tareas) {
  if (!tareas.length) {
    return ['## Instala tus skills en Claude', 'Elige tareas en tu perfil y aquí aparecen sus skills: cada tarea de tu playbook sale también como un ZIP que Claude instala.'];
  }
  return [
    '## Instala tus skills en Claude',
    'Cada tarea de tu playbook sale también como skill: un ZIP que Claude instala una vez y usa solo cuando aparece la tarea, en cualquier chat. Descárgalas en la página del taller (x10.expert/cerebro, paso «Carga»).',
    list(tareas.map((t) => `\`${t.skill.slug}.zip\` · ${t.skill.titulo}`)),
    INSTALAR_SKILL.pasos.map((l, i) => `${i + 1}. ${l}`).join('\n'),
    INSTALAR_SKILL.nota,
  ];
}

/** Load routes with the tools the user chose first (catalog order otherwise). */
export function rutasOrdenadas(raw) {
  const { herramientas } = normalizeProfile(raw);
  const mine = RUTAS_CARGA.filter((r) => r.herramienta && herramientas.includes(r.herramienta));
  return [...mine, ...RUTAS_CARGA.filter((r) => !mine.includes(r))].map((r) => ({ ...r, mia: mine.includes(r) }));
}

const PREGUNTAS = {
  '00_ADN.md': '¿Quién soy y qué es un buen trabajo para mí?',
  '01_LINEAS_ROJAS.md': '¿Qué nunca pasa?',
  '02_PLAYBOOK.md': '¿Cómo hago cada tarea?',
  '03_FUENTES.md': '¿Con qué razona la IA?',
  '04_VERIFICACION.md': '¿Cómo sé que puedo usarlo?',
};

export function buildReadme(raw, { extra = [] } = {}) {
  const { p } = resolve(raw);
  const rutas = rutasOrdenadas(p)
    .map(
      (r) =>
        `### ${r.label}${r.mia ? ' · la usas hoy' : ''}\n\n${r.pasos.map((s, i) => `${i + 1}. ${s}`).join('\n')}${r.nota ? `\n\n${r.nota}` : ''}`,
    )
    .join('\n\n');
  return md([
    `# ${p.nombre ? `Cerebro jurídico de ${p.nombre}` : 'Mi cerebro jurídico'}`,
    '> La IA no es tu abogado junior; es tu sistema. Y los sistemas se diseñan.',
    ...extra,
    '## Qué es esto',
    'Cinco archivos de texto que le dicen a cualquier IA quién eres, cómo trabajas, qué nunca hace y cómo se verifica. El activo no es la herramienta: es este paquete, que vive fuera de cualquier proveedor.',
    list([
      'Portable. El mismo paquete se carga en Claude, ChatGPT, Gemini, Copilot o un modelo local.',
      'Auditable. Es texto. Lo lees, lo corriges y sabes exactamente qué sabe tu IA.',
      'Acumulativo. Cada error de la IA se convierte en una línea nueva del playbook o de las fuentes. El cerebro mejora con el uso; el chat no.',
    ]),
    '| Archivo | Responde a |\n|---|---|\n' + ARCHIVOS_CEREBRO.map((n) => `| ${n} | ${PREGUNTAS[n]} |`).join('\n'),
    ...cuentaSection(p),
    '## Cómo cargarlo',
    '### Camino universal (cualquier IA, cualquier plan)',
    'Abre un chat nuevo y pega como primer mensaje este texto, seguido de los cinco archivos. El botón "Copiar todo para pegar en un chat" de la página del taller lo arma por ti.',
    `> ${INTRO_CARGA}`,
    'Si funcionó, la IA te confirma en tres líneas quién eres, cuáles son tus líneas rojas y cómo va a verificar sus respuestas. Esa confirmación es deliberada: obliga al modelo a procesar el paquete antes de la primera pregunta y te muestra en diez segundos si la carga funcionó.',
    `Para dejarlo fijo y no pegarlo cada vez, usa un Proyecto, Gemini o tu modelo local. El bloque de instrucciones de sistema está al final de 00_ADN.md. ${RUTAS_VERIFICADAS}`,
    rutas,
    ...skillsSection(resolve(p).tareas),
    '## Cómo mantenerlo',
    fence(ARBOL_MANTENIMIENTO),
    'Regla: 03_FUENTES.md solo crece con lo que abriste y verificaste. Nunca con lo que la IA dijo.',
    '## Niveles de madurez',
    list(NIVELES_MADUREZ),
    '## Tres acciones para mañana',
    TRES_ACCIONES.map((l, i) => `${i + 1}. ${l}`).join('\n'),
    `---\n\n${DISCLAIMER}\n\nTaller Cerebro Jurídico · Fabián Zapata — Fundador de Zeta Innovation · Director de Innovación de GLab · x10.expert/cerebro`,
  ]);
}

// ── Public API ──

export function buildFiles(raw) {
  const r = resolve(raw);
  return {
    'README.md': buildReadme(r.p),
    '00_ADN.md': adn(r),
    '01_LINEAS_ROJAS.md': lineasRojas(r),
    '02_PLAYBOOK.md': playbook(r),
    '03_FUENTES.md': fuentes(r),
    '04_VERIFICACION.md': verificacion(),
  };
}

/** §4.4 universal load path: intro, then the five files. */
export function buildPaste(raw) {
  const files = buildFiles(raw);
  return `${INTRO_CARGA}\n\n${ARCHIVOS_CEREBRO.map((n) => `===== ${n} =====\n${files[n].trimEnd()}`).join('\n\n')}\n`;
}
