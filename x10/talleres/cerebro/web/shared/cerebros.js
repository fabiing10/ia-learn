// The registry /cerebro/ reads (CEREBRO-GENERAL.md, B): four cerebros as tabs of
// «Construir». Each entry says how its form looks, which files its profile writes,
// what «Cargar» copies and downloads, and what «Prueba» compares. The landing never
// asks which cerebro is active beyond the flags here (rutas, cuenta, boveda) and the
// optional hooks (descargasHabilitadas, pruebaLarga, ejemplo.del).
// Pure ES module, no DOM: cerebros.test.mjs checks every entry.

import {
  ESPERADO, HERRAMIENTAS, PERFIL_LAURA, PERFIL_VACIO, TAREAS,
} from './catalog.js';
import { ARCHIVOS, CAMPOS, FIJOS, buildFiles, buildPaste, normalizeProfile } from './generator.js';
import { buildSkills, skillZip } from './skills.js';
import {
  ARCHIVOS_SKILL, CAMPOS_SKILL, EJEMPLO_SKILL, NOTA_PRUEBA, TONOS_SKILL, VACIO_SKILL, buildSkillGeneral,
  normalizeSkill, pasteSkillGeneral, pruebaSkillGeneral, slugSkill, zipSkillGeneral, zipTodoSkillGeneral,
} from './skill-general.js';
import {
  ARCHIVOS_IDEACION, CAMPOS_IDEACION, CONSTRUYE, EJEMPLO_IDEACION, HERRAMIENTAS_CONSTRUCCION, NIVELES, SECTORES,
  SLUG_IDEACION, TONOS_IDEACION, VACIO_IDEACION, buildIdeacion, normalizeIdeacion, pasteIdeacion, pruebaIdeacion,
  zipIdeacion, zipTodoIdeacion,
} from './ideacion.js';
import {
  ARCHIVOS_MVP, CAMPOS_MVP, CONFIRM3_MVP, EJEMPLO_MVP, HERRAMIENTAS_MVP, NIVELES_MVP, SECTORES_MVP, SLUG_MVP, TIEMPOS,
  TONOS_MVP, VACIO_MVP, buildMvp, descargasHabilitadas, normalizeMvp, pasteMvp, pruebaMvp, zipMvp, zipTodoMvp,
} from './brief-a-mvp.js';
import { zip } from './zip.js';

export const CEREBRO_INICIAL = 'skill';

// ── Shared pieces ──

const EYEBROW = 'Paso 1 · Construye';

// Copy bank of CEREBRO-GENERAL.md, verbatim.
const CARGAR_LEAD_SKILL =
  'Un botón copia la skill con una instrucción al inicio. Abre un chat nuevo, pega y envía. Para dejarla fija, el README trae la ruta de cada herramienta.';

const sameBy = (normalize) => (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

/**
 * The map nodes whose fields differ between two profiles, in form order. `pares`
 * is [profile key, map node] (two form fields can feed one node: «Ejemplo»).
 */
const cambiosBy = (normalize, pares) => (a, b) => {
  const x = normalize(a);
  const y = normalize(b);
  const out = [];
  for (const [key, nodo] of pares) {
    if (JSON.stringify(x[key]) !== JSON.stringify(y[key]) && !out.includes(nodo)) out.push(nodo);
  }
  return out;
};

const tonos = (list) => list.map((t) => ({ id: t.id, label: t.label, desc: `${t.instruccion}.` }));
const herramientasCampo = (n, hint) => ({
  id: 'herramientas', tipo: 'checkbox', n, label: 'La IA que usas hoy', opciones: HERRAMIENTAS, hint,
});
const tonoCampo = (n, list) => ({ id: 'tono', tipo: 'cards', n, label: 'Cómo quieres que te responda', opciones: tonos(list) });

// The three confirmation lines of the paste header of skill-general.js (INSTRUCCION_PEGAR).
const confirmSkill = (cierre) => [
  ['Cómo se llama la skill', ' y cuándo se activa.'],
  ['Qué te va a pedir', ' antes de empezar.'],
  ['Con qué sección cierra', ` cada respuesta: ${cierre}.`],
];

const LLEVAS_SKILL = {
  'SKILL.md': 'La skill, para Claude',
  'INSTRUCCIONES_GPT.md': 'La misma skill para ChatGPT y Gemini',
  'README.md': 'Cómo instalarla y probarla',
};

// ── Skill general ──

const CAMPOS_FORM_SKILL = [
  { id: 'skillNombre', tipo: 'text', n: 1, label: '¿Cómo se llama tu skill?', max: 60, placeholder: 'Ej.: Resumen de reunión', hint: 'El nombre de la tarea. También nombra la carpeta y el ZIP de la skill.' },
  { id: 'queHace', tipo: 'text', n: 2, label: 'Qué hace, en una frase', max: 300, placeholder: 'Ej.: Convierte las notas de una reunión en un resumen con compromisos.', hint: 'Va en la descripción que Claude lee para decidir cuándo usarla.' },
  { id: 'cuando', tipo: 'lines', n: 3, label: 'Cuándo debe usarla', rows: 3, placeholder: 'Te pego notas de una reunión', hint: 'Una situación o frase por línea: lo que dices o pegas cuando aparece la tarea. Las tres primeras van a la descripción.' },
  { id: 'entradas', tipo: 'lines', n: 4, label: 'Qué le entregas', rows: 3, placeholder: 'Las notas completas', hint: 'Uno por línea. Si falta algo, la IA te lo pide antes de empezar.' },
  { id: 'pasos', tipo: 'lines', n: 5, label: 'Los pasos', rows: 5, placeholder: 'Lee todo antes de escribir', hint: 'Uno por línea, en orden.' },
  { id: 'reglas', tipo: 'lines', n: 6, label: 'Reglas que siempre aplican', rows: 4, placeholder: 'No agregues compromisos que nadie dijo', hint: 'Una por línea: lo que siempre hace y lo que nunca pasa. La regla de no inventar datos ya va incluida.' },
  { id: 'formato', tipo: 'textarea', n: 7, label: 'Formato de la salida', rows: 6, max: 2000, placeholder: '# Reunión: nombre · fecha\n\n## Decisiones\n- …', hint: 'La plantilla de lo que entrega: títulos, tabla o lista. Puedes pegar una que ya uses.' },
  { id: 'ejemploEntrada', mapa: 'ejemplo', tipo: 'textarea', n: 8, label: 'Ejemplo: una entrada real', rows: 3, max: 2000, opcional: true, hint: 'También es la prueba del paso 3.' },
  { id: 'ejemploSalida', mapa: 'ejemplo', tipo: 'textarea', n: 9, label: 'Ejemplo: la salida que esperas', rows: 3, max: 2000, opcional: true, hint: 'Un ejemplo enseña más que cualquier regla.' },
  { id: 'verifico', tipo: 'lines', n: 10, label: 'Cómo sabes que quedó bien', rows: 3, placeholder: 'Cada compromiso tiene responsable y fecha', hint: 'Uno por línea: lo que revisas antes de usar la salida.' },
  { id: 'material', tipo: 'textarea', n: 11, label: 'Material de referencia', rows: 4, max: 20000, opcional: true, hint: 'Pega aquí una guía, una plantilla o un criterio que la IA deba leer antes de empezar. Va a references/material.md' },
  { id: 'quienSoy', tipo: 'text', n: 12, label: '¿Quién eres?', max: 160, placeholder: 'Ej.: coordinador de proyectos en una ONG de educación', hint: 'Tu rol, en una línea. La IA lo usa para hablarte en tu contexto.' },
  { id: 'nombre', tipo: 'text', n: 13, label: '¿Cómo quieres que la IA te llame?', max: 60, opcional: true, placeholder: 'Ej.: Daniel', autocomplete: 'given-name', hint: 'Va en la presentación de la skill.' },
  tonoCampo(14, TONOS_SKILL),
  herramientasCampo(15, 'Sus rutas de instalación salen primero en el README.'),
];

const skill = {
  id: 'skill',
  label: 'Skill general',
  corto: 'Skill',
  sub: 'Una skill para cualquier tarea',
  eyebrow: EYEBROW,
  titulo: 'Tu perfil escribe tu skill',
  lead: 'Una skill es un procedimiento escrito que la IA aplica sola cuando aparece la tarea. Llena los campos como se los explicarías a alguien nuevo en tu equipo; al lado se escribe tu SKILL.md.',
  ejemplo: { nombre: 'Daniel', descripcion: 'Daniel, coordinador de proyectos. Cámbialo por lo tuyo.' },
  vacio: { estado: 'Empieza por el nombre de la tarea.', toast: 'Skill en blanco. Llénala con tu tarea.' },
  mio: 'Tu skill',
  formLabel: 'Tu skill',
  storeKey: 'cj-perfil-skill',
  campos: CAMPOS_FORM_SKILL,
  mapa: CAMPOS_SKILL,
  fijos: null,
  archivos: ARCHIVOS_SKILL,
  principal: 'SKILL.md',
  perfilEjemplo: EJEMPLO_SKILL,
  perfilVacio: VACIO_SKILL,
  normalize: normalizeSkill,
  same: sameBy(normalizeSkill),
  cambios: cambiosBy(normalizeSkill, CAMPOS_FORM_SKILL.map((f) => [f.id, f.mapa ?? f.id])),
  build: buildSkillGeneral,
  paste: pasteSkillGeneral,
  descargas(profile) {
    const slug = slugSkill(profile);
    return [
      { id: 'skill', tipo: 'skill', archivo: `${slug}.zip`, titulo: 'Skill para Claude', nota: 'Súbela sin descomprimir', aviso: 'Súbelo a Claude sin descomprimirlo.', bytes: () => zipSkillGeneral(profile) },
      { id: 'todo', tipo: 'todo', archivo: `${slug}-kit.zip`, titulo: 'Todo (.zip)', nota: 'README, instrucciones para ChatGPT y Gemini, y la skill', aviso: 'Descomprímelo: el README trae los pasos.', bytes: () => zipTodoSkillGeneral(profile) },
    ];
  },
  prueba: pruebaSkillGeneral,
  rutas: false,
  cuenta: true,
  boveda: false,
  confirm3: confirmSkill('«Para revisar»'),
  cargarLead: CARGAR_LEAD_SKILL,
  dlLead: 'El ZIP de la skill va a Claude tal cual: súbelo sin descomprimirlo. El kit trae además el README con la ruta de cada herramienta y las instrucciones para ChatGPT y Gemini.',
  pruebaLead: NOTA_PRUEBA,
  comparar: { sin: 'Sin la skill', con: 'Con la skill' },
  copiar: { titulo: 'Tu skill, para pegar en un chat', prueba: 'Prueba copiada. Hazla en el chat con tu skill.' },
  llevas: {
    titulo: 'Te llevas',
    items: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'].map((archivo) => ({ archivo, que: LLEVAS_SKILL[archivo] })),
  },
};

// ── Ideación ──

const CAMPOS_FORM_IDEACION = [
  { id: 'frase', tipo: 'textarea', n: 1, label: 'Tu idea, en una frase', rows: 3, max: 300, placeholder: 'Quiero una app que ___ para ___', hint: 'Quién la usa y qué le resuelve. Si no la tienes clara, la skill te ayuda a escribirla.' },
  { id: 'sector', tipo: 'radio', n: 2, label: 'Dónde trabajas o estudias', opciones: SECTORES },
  { id: 'construye', tipo: 'checkbox', n: 3, label: 'Qué quieres construir', opciones: CONSTRUYE, hint: 'Todas las que apliquen.' },
  { id: 'herramienta', tipo: 'radio', n: 4, label: 'Con qué vas a construir', opciones: HERRAMIENTAS_CONSTRUCCION, hint: 'Caja cerrada (Lovable, Base44): todo armado, sin instalar nada. Caja abierta (Claude Code, Codex): tú eliges cada pieza. Si no sabes, la skill te recomienda una.' },
  { id: 'nivel', tipo: 'radio', n: 5, label: 'Tu experiencia construyendo', opciones: NIVELES },
  { id: 'restricciones', tipo: 'lines', n: 6, label: 'Tus límites', rows: 3, opcional: true, placeholder: 'No usa datos reales de los residentes', hint: 'Lo que tu producto nunca hace o lo que nunca pegas. Uno por línea.' },
  { id: 'nombre', tipo: 'text', n: 7, label: '¿Cómo quieres que la IA te llame?', max: 60, opcional: true, placeholder: 'Ej.: Sofía', autocomplete: 'given-name', hint: 'Va en la presentación de la skill y en el README.' },
  tonoCampo(8, TONOS_IDEACION),
  herramientasCampo(9, 'Donde instalas la skill. Sus rutas salen primero en el README.'),
];

const ideacion = {
  id: 'ideacion',
  label: 'Ideación',
  corto: 'Ideación',
  sub: 'De la idea a la spec y al primer prompt',
  eyebrow: EYEBROW,
  titulo: 'Tu idea escribe tu skill de ideación',
  lead: 'La skill del curso de vibe coding: convierte una idea en una spec de una página y en el primer mensaje para la herramienta. Pasa la prueba del adivino antes de construir.',
  ejemplo: { nombre: 'Sofía', descripcion: 'Sofía, estudiante. Cámbialo por tu idea.' },
  vacio: { estado: 'Empieza por tu frase.', toast: 'En blanco. Empieza por tu frase.' },
  mio: 'Tu idea',
  formLabel: 'Tu idea',
  storeKey: 'cj-perfil-ideacion',
  campos: CAMPOS_FORM_IDEACION,
  mapa: CAMPOS_IDEACION,
  fijos: null,
  archivos: ARCHIVOS_IDEACION,
  principal: 'SKILL.md',
  perfilEjemplo: EJEMPLO_IDEACION,
  perfilVacio: VACIO_IDEACION,
  normalize: normalizeIdeacion,
  same: sameBy(normalizeIdeacion),
  cambios: cambiosBy(normalizeIdeacion, CAMPOS_FORM_IDEACION.map((f) => [f.id, f.mapa ?? f.id])),
  build: buildIdeacion,
  paste: pasteIdeacion,
  descargas(profile) {
    return [
      { id: 'skill', tipo: 'skill', archivo: `${SLUG_IDEACION}.zip`, titulo: 'Skill para Claude', nota: 'Súbela sin descomprimir', aviso: 'Súbelo a Claude sin descomprimirlo.', bytes: () => zipIdeacion(profile) },
      { id: 'todo', tipo: 'todo', archivo: 'ideacion-kit.zip', titulo: 'Todo (.zip)', nota: 'README, instrucciones, primer mensaje y la skill', aviso: 'Descomprímelo: el README trae los pasos.', bytes: () => zipTodoIdeacion(profile) },
    ];
  },
  prueba: pruebaIdeacion,
  rutas: false,
  cuenta: true,
  boveda: false,
  confirm3: confirmSkill('«Lo que aún adivinaría»'),
  cargarLead: CARGAR_LEAD_SKILL,
  dlLead: 'El ZIP de la skill va a Claude tal cual, con la plantilla de la spec y las reglas de mesa: súbelo sin descomprimirlo. El kit trae además el README, las instrucciones para ChatGPT y Gemini y tu primer mensaje.',
  pruebaLead: NOTA_PRUEBA,
  comparar: { sin: 'Sin la skill', con: 'Con la skill' },
  copiar: { titulo: 'Tu skill de ideación, para pegar en un chat', prueba: 'Prueba copiada. Hazla en el chat con tu skill.' },
  llevas: {
    titulo: 'Te llevas',
    items: [
      { archivo: 'SKILL.md', que: LLEVAS_SKILL['SKILL.md'] },
      { archivo: 'INSTRUCCIONES_GPT.md', que: LLEVAS_SKILL['INSTRUCCIONES_GPT.md'] },
      { archivo: 'PRIMER_MENSAJE.md', que: 'Lo que envías primero' },
      { archivo: 'references/plantilla-spec.md', que: 'Plantilla de la spec' },
      { archivo: 'references/reglas-de-mesa.md', que: 'Reglas de mesa' },
      { archivo: 'README.md', que: LLEVAS_SKILL['README.md'] },
    ],
  },
};

// ── De brief a MVP (encargo 05): the brief-a-mvp skill of the workshop ──

// The switch above field 01 (unnumbered: the brief stays «campo 01»): off, the skill is
// general and the brief goes in the chat; on, the skill carries it (decision of 5 Nov 2026).
const CAMPOS_FORM_MVP = [
  { id: 'incluirBrief', tipo: 'switch', label: 'Incluir mi brief dentro de la skill', hint: 'Apagado (recomendado): la skill es general y recibe el brief en el chat, como el PRIMER_MENSAJE. Encendido: la skill lleva este brief como punto de partida.' },
  { id: 'brief', tipo: 'textarea', n: 1, label: 'Tu brief o tu idea', rows: 10, max: 12000, placeholder: 'Pega aquí tu brief completo, o tu idea en una frase: quién la usa y qué le resuelve.', hint: 'Pega el brief completo (nombre y entidad, usuario, problema, reto, solución, flujo, qué NO hará, datos, humano responsable, cómo sabremos que funciona) o, si no lo tienes, tu idea en una frase: quién la usa y qué le resuelve. Opcional mientras la skill no lleve el brief: va al PRIMER_MENSAJE y a la prueba.' },
  { id: 'sector', tipo: 'radio', n: 2, label: 'Sector', opciones: SECTORES_MVP },
  { id: 'herramienta', tipo: 'radio', n: 3, label: 'Con qué vas a construir', opciones: HERRAMIENTAS_MVP, hint: 'Caja cerrada (Lovable, AI Studio): todo armado, sin instalar nada. Artifact (Claude): una página con link para compartir. Caja abierta (Claude Code, Codex): archivos en tu computador. Si no sabes, la skill te recomienda una.' },
  { id: 'nivel', tipo: 'radio', n: 4, label: 'Tu experiencia construyendo', opciones: NIVELES_MVP, hint: 'Con «nunca» o «algo con IA», cada prompt trae «qué debe verse» y «si falla».' },
  { id: 'tiempo', tipo: 'radio', n: 5, label: 'Tiempo disponible', opciones: TIEMPOS, hint: 'Define cuántas capas entran en el MVP.' },
  { id: 'restricciones', tipo: 'lines', n: 6, label: 'Tus límites', rows: 3, opcional: true, placeholder: 'No usa datos reales de contratos ni contratistas', hint: 'Lo que tu producto nunca hace o lo que nunca pegas. Uno por línea. «No usa datos reales» y «no decide, firma ni radica» ya van incluidos.' },
  { id: 'nombre', tipo: 'text', n: 7, label: '¿Cómo quieres que la IA te llame?', max: 60, opcional: true, placeholder: 'Ej.: Fabián', autocomplete: 'given-name', hint: 'Va en la presentación de la skill y en el README.' },
  tonoCampo(8, TONOS_MVP),
  herramientasCampo(9, 'Donde instalas la skill. Sus rutas salen primero en el README.'),
];

const mvp = {
  id: 'mvp',
  label: 'De brief a MVP',
  corto: 'Brief→MVP',
  sub: 'Del brief a la spec, las capas y los prompts',
  eyebrow: EYEBROW,
  titulo: 'Tu brief escribe tu skill de construcción',
  lead: 'La skill del taller: pega tu brief o tu idea y recibe el recorte a MVP, la SPEC de una página y los prompts paso a paso para construirla hoy.',
  // `del` words the example button and toasts: «Volver al ejemplo del Grupo 7».
  ejemplo: { nombre: 'Grupo 7 · Semáforo de Liquidaciones', del: 'del Grupo 7', descripcion: 'Grupo 7, Semáforo de Liquidaciones. Cámbialo por tu brief.' },
  vacio: { estado: 'Empieza por tu brief o tu idea.', toast: 'En blanco. Pega tu brief o tu idea en el campo 01.' },
  mio: 'Tu brief',
  formLabel: 'Tu brief',
  storeKey: 'cj-perfil-mvp',
  campos: CAMPOS_FORM_MVP,
  mapa: CAMPOS_MVP,
  fijos: null,
  archivos: ARCHIVOS_MVP,
  principal: 'SKILL.md',
  perfilEjemplo: EJEMPLO_MVP,
  perfilVacio: VACIO_MVP,
  normalize: normalizeMvp,
  same: sameBy(normalizeMvp),
  cambios: cambiosBy(normalizeMvp, CAMPOS_FORM_MVP.map((f) => [f.id, f.mapa ?? f.id])),
  build: buildMvp,
  paste: pasteMvp,
  descargas(profile) {
    return [
      { id: 'skill', tipo: 'skill', archivo: `${SLUG_MVP}.zip`, titulo: 'Skill para Claude', nota: 'Súbela sin descomprimir', aviso: 'Súbelo a Claude sin descomprimirlo.', bytes: () => zipMvp(profile) },
      { id: 'todo', tipo: 'todo', archivo: `${SLUG_MVP}-kit.zip`, titulo: 'Todo', nota: 'README, instrucciones, primer mensaje y la skill', aviso: 'Descomprímelo: el README trae los pasos.', bytes: () => zipTodoMvp(profile) },
    ];
  },
  // A skill that carries the brief has nothing to build from without it: the ZIPs wait
  // (encargo, PROMPT 5). A general skill (the default) downloads whole.
  descargasHabilitadas,
  descargasAviso: 'Pega tu brief o tu idea en el campo 01 para descargar la skill.',
  prueba: pruebaMvp,
  pruebaLarga: true, // the test is the whole first message, brief table included
  rutas: false,
  cuenta: true,
  boveda: false,
  confirm3: CONFIRM3_MVP,
  cargarLead: CARGAR_LEAD_SKILL,
  dlLead: 'El ZIP de la skill va a Claude tal cual, con sus cinco referencias: súbelo sin descomprimirlo. El kit trae además el README, las instrucciones para ChatGPT y Gemini y tu primer mensaje.',
  pruebaLead: NOTA_PRUEBA,
  comparar: { sin: 'Sin la skill', con: 'Con la skill' },
  copiar: { titulo: 'Tu skill De brief a MVP, para pegar en un chat', prueba: 'Prueba copiada. Hazla en el chat con tu skill.' },
  llevas: {
    titulo: 'Te llevas',
    items: [
      { archivo: 'SKILL.md', que: LLEVAS_SKILL['SKILL.md'] },
      { archivo: 'INSTRUCCIONES_GPT.md', que: LLEVAS_SKILL['INSTRUCCIONES_GPT.md'] },
      { archivo: 'PRIMER_MENSAJE.md', que: 'Lo que envías primero, con tu brief' },
      { archivo: 'references/plantilla-spec-mvp.md', que: 'Plantilla de la SPEC de una página' },
      { archivo: 'references/tabla-de-recorte.md', que: 'Qué se recorta y con qué se sustituye' },
      { archivo: 'references/prompts-por-capa.md', que: 'Un prompt por capa' },
      { archivo: 'references/herramientas.md', que: 'Cada herramienta y su caja' },
      { archivo: 'references/reglas-de-mesa.md', que: 'Reglas de mesa' },
      { archivo: 'README.md', que: LLEVAS_SKILL['README.md'] },
    ],
  },
};

// ── Jurídico: the existing legal brain, unchanged ──

const SIN_TAREAS = 'No elegiste tareas: esta es la prueba de contratos, la del taller. Elige tus tareas y aparece la prueba de cada una.';

const juridico = {
  id: 'juridico',
  label: 'Jurídico',
  corto: 'Jurídico',
  sub: 'El cerebro de un abogado: cinco archivos y sus skills',
  eyebrow: EYEBROW,
  titulo: 'Tu perfil escribe tus archivos',
  lead: 'Diez campos, los dos últimos opcionales. Mientras respondes, tus archivos se reescriben al lado. Arranca con el ejemplo de Laura, litigante: cámbialo por lo tuyo.',
  ejemplo: { nombre: 'Laura', descripcion: 'Laura, litigante. Cámbialo por lo tuyo.' },
  vacio: { estado: 'Empieza por tu rol.', toast: 'Perfil en blanco. Llénalo con lo tuyo.' },
  mio: 'Tu perfil',
  formLabel: 'Tu perfil',
  storeKey: 'cj-perfil',
  campos: null, // the custom form of landing/form.js
  mapa: CAMPOS,
  fijos: FIJOS,
  archivos: ARCHIVOS,
  principal: '00_ADN.md',
  perfilEjemplo: PERFIL_LAURA,
  perfilVacio: PERFIL_VACIO,
  normalize: normalizeProfile,
  same: sameBy(normalizeProfile),
  cambios: cambiosBy(normalizeProfile, CAMPOS.map((c) => [c.id, c.id])),
  build: buildFiles,
  paste: buildPaste,
  /** The brain ZIP (six files, «No es una skill») and one ZIP per chosen task («Estos sí son skills»). */
  descargas(profile) {
    return [
      {
        id: 'cerebro',
        tipo: 'cerebro',
        archivo: 'cerebro-juridico.zip',
        titulo: 'Descargar todo (.zip)',
        nota: 'No es una skill: estos cinco archivos van a la base de conocimiento del Proyecto.',
        aviso: '',
        bytes: () => {
          const files = buildFiles(profile);
          return zip(Object.fromEntries(ARCHIVOS.map((n) => [`cerebro-juridico/${n}`, files[n]])));
        },
      },
      ...buildSkills(profile).map((k) => ({
        id: k.tarea,
        tipo: 'skill',
        archivo: `${k.carpeta}.zip`,
        titulo: k.titulo,
        nota: 'Estos sí son skills: súbela sin descomprimir',
        aviso: 'Súbelo a Claude sin descomprimirlo.',
        bytes: () => skillZip(k),
      })),
    ];
  },
  /** One tab per chosen task; the contracts test, the workshop one, when none is chosen. */
  prueba(profile) {
    const { tareas } = normalizeProfile(profile);
    const mine = TAREAS.filter((t) => tareas.includes(t.id));
    const list = mine.length ? mine : TAREAS.filter((t) => t.id === 'contratos');
    return {
      tabs: list.map((t) => ({ id: t.id, label: t.label, pregunta: t.prueba })),
      pregunta: list[0].prueba,
      esperado: ESPERADO,
      aviso: mine.length ? '' : SIN_TAREAS,
    };
  },
  rutas: true,
  cuenta: true,
  boveda: true,
  confirm3: [
    ['Quién eres', ': tu rol, tus áreas, cómo te llama.'],
    ['Tus líneas rojas', ': confidencialidad y lo que nunca delegas.'],
    ['Cómo va a verificar', ': fuentes con enlace oficial, [NO VERIFICADO] y el cierre "Verificación pendiente".'],
  ],
  cargarLead: 'Un botón copia los cinco archivos con una instrucción al inicio. Abre un chat nuevo, pega y envía.',
  dlLead: '',
  pruebaLead: 'Copia la prueba de una de tus tareas. Hazla en el chat donde pegaste tu cerebro y, si te da tiempo, en un chat temporal o incógnito, sin cerebro. Compara el proceso, no solo la respuesta.',
  comparar: { sin: 'Sin cerebro', con: 'Con cerebro' },
  copiar: { titulo: 'Tu cerebro jurídico, para pegar en un chat', prueba: 'Prueba copiada. Hazla en el chat con tu cerebro.' },
  llevas: {
    titulo: 'Te llevas cinco archivos',
    items: [
      { archivo: '00_ADN.md', que: 'Quién soy y qué es un buen trabajo para mí' },
      { archivo: '01_LINEAS_ROJAS.md', que: 'Lo que nunca pasa' },
      { archivo: '02_PLAYBOOK.md', que: 'Cómo hago cada tarea' },
      { archivo: '03_FUENTES.md', que: 'Con qué razona la IA' },
      { archivo: '04_VERIFICACION.md', que: 'Cómo sé que puedo usarlo' },
    ],
    foot: 'Más un `README.md` para cargarlo y mantenerlo, y una skill por tarea para instalar en Claude. Los archivos sirven en Claude, ChatGPT, Gemini, Copilot o un modelo local.',
  },
};

export const CEREBROS = [skill, ideacion, mvp, juridico];

export const cerebroById = (id) => CEREBROS.find((c) => c.id === id) ?? null;

/** The tab to open: a deep link (#ideacion), then ?c=, then the saved choice, then skill. */
export function elegirCerebro({ hash = '', search = '', guardado = null } = {}) {
  const valido = (id) => (typeof id === 'string' && cerebroById(id) ? id : null);
  let c = null;
  try {
    c = new URLSearchParams(search).get('c');
  } catch {
    c = null;
  }
  return valido(String(hash).replace(/^#/, '')) ?? valido(c) ?? valido(guardado) ?? CEREBRO_INICIAL;
}

/** 'references/plantilla-spec.md' → 'plantilla-spec'; '00_ADN.md' → '00_ADN'. */
export const nombreCorto = (file) => file.replace(/^references\//, '').replace(/\.md$/, '');

const dosLetras = (file) => (file === 'README.md' ? 'R' : nombreCorto(file).slice(0, 2).toUpperCase());
/** 'PRIMER_MENSAJE.md' → 'PM', 'references/prompts-por-capa.md' → 'PC': first and last word. */
const extremos = (file) => {
  const w = nombreCorto(file).split(/[-_\s]+/).filter(Boolean);
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
};

/**
 * The two letters of a file in the phone dock; the README keeps its single R. With
 * the cerebro's file list, two files that would share their letters (PRIMER_MENSAJE
 * and prompts-por-capa) use the initials of their first and last words instead.
 */
export function inicialDock(file, lista = []) {
  const base = dosLetras(file);
  return lista.some((f) => f !== file && dosLetras(f) === base) ? extremos(file) : base;
}
