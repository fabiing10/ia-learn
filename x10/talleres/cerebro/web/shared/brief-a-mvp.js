// The brief-a-mvp skill of the workshop (encargo 05, PROMPTS 1–4): a brief or an
// idea in, the cut to an MVP, the one-page SPEC, the layer plan and one prompt per
// layer out. The texts are the workshop draft, fixed, in brief-a-mvp.content.js;
// this module only parametrises them by structure (rules A–G of PROMPT 2), so the
// draft can be pasted there without touching this file. Deterministic and pure like
// ideacion.js, whose catalogs it reuses; the paste header is the draft's own.

import { zip } from './zip.js';
import { HERRAMIENTAS } from './catalog.js';
import {
  CABECERA_GPT, CAJAS, EJEMPLO_BRIEF, EJEMPLO_NOMBRE_BORRADOR, README_BORRADOR, REF_HERRAMIENTAS,
  REF_PLANTILLA_SPEC_MVP, REF_PROMPTS_POR_CAPA, REF_REGLAS_DE_MESA, REF_TABLA_DE_RECORTE, SKILL_CUERPO,
  SKILL_FRONTMATTER,
} from './brief-a-mvp.content.js';
import { NIVELES, SECTORES, TONOS_IDEACION } from './ideacion.js';
import {
  NOTA_PRUEBA, herramientasDe, lcFirst, lineas, md, oneLine, probarlaMd, sentence, texto,
} from './skill-general.js';

export const SLUG_MVP = 'brief-a-mvp';

const REFS = ['plantilla-spec-mvp.md', 'tabla-de-recorte.md', 'prompts-por-capa.md', 'herramientas.md', 'reglas-de-mesa.md'];
// INSTRUCCIONES_GPT.md keeps the draft's order: step 8 reads herramientas, then prompts-por-capa.
const REFS_GPT = ['plantilla-spec-mvp.md', 'tabla-de-recorte.md', 'herramientas.md', 'prompts-por-capa.md', 'reglas-de-mesa.md'];

export const ARCHIVOS_MVP = ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', ...REFS.map((r) => `references/${r}`)];

// Ideación's six sectors and three levels, with the phrases of PROMPT 2 (A): the
// presentation line says «una entidad del sector público», «nunca he construido
// software». `corto` is the «Sector:» of PRIMER_MENSAJE.md.
const FRASE_SECTOR = { publico: 'una entidad del sector público', empresa: 'una empresa privada' };
export const SECTORES_MVP = SECTORES.map((s) => ({
  ...s,
  sistema: FRASE_SECTOR[s.id] ?? s.sistema,
  corto: s.id === 'publico' ? 'público' : lcFirst(s.label),
}));

const FRASE_NIVEL = { cero: 'nunca he construido software', algo: 'ya hice algo con IA', programo: 'programo' };
export const NIVELES_MVP = NIVELES.map((n) => ({ ...n, sistema: FRASE_NIVEL[n.id] }));

// `caja` keys CAJAS of the content module; «No sé aún» has none: the skill recommends one.
export const HERRAMIENTAS_MVP = [
  { id: 'lovable', label: 'Lovable', caja: 'cerrada' },
  { id: 'claude-artifact', label: 'Claude (artifact)', caja: 'artifact' },
  { id: 'claude-code', label: 'Claude Code', caja: 'abierta' },
  { id: 'codex', label: 'Codex', caja: 'abierta' },
  { id: 'ai-studio', label: 'Gemini AI Studio', caja: 'cerrada' },
  { id: 'nose', label: 'No sé aún', caja: null },
];

export const TIEMPOS = [
  { id: 'sesion', label: 'Una sesión (90 minutos)', sistema: 'una sesión de 90 minutos' },
  { id: 'dia', label: 'Un día', sistema: 'un día' },
  { id: 'semana', label: 'Una semana', sistema: 'una semana' },
];

export const TONOS_MVP = TONOS_IDEACION;

// Which files each form field rewrites («Alimenta» of PROMPT 1); brief-a-mvp.test.mjs
// checks it against the generator. The brief reaches SKILL.md and INSTRUCCIONES_GPT.md
// only while `incluirBrief` is on; off (the default), PRIMER_MENSAJE.md and the README.
export const CAMPOS_MVP = [
  { id: 'incluirBrief', label: 'Brief en la skill', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'brief', label: 'Brief', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'README.md'] },
  { id: 'sector', label: 'Sector', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'references/tabla-de-recorte.md'] },
  { id: 'herramienta', label: 'Herramienta', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'references/herramientas.md', 'README.md'] },
  { id: 'nivel', label: 'Nivel', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'] },
  { id: 'tiempo', label: 'Tiempo', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'] },
  { id: 'restricciones', label: 'Límites', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'nombre', label: 'Nombre', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'tono', label: 'Tono', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramientas', label: 'IA que usas', archivos: ['README.md'] },
];

const MAX_BRIEF = 12000;

/** Any input (stored JSON, form state, partial object) → a clean profile. */
export function normalizeMvp(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    incluirBrief: p.incluirBrief === true,
    brief: texto(p.brief, MAX_BRIEF),
    sector: one(SECTORES_MVP, p.sector),
    herramienta: one(HERRAMIENTAS_MVP, p.herramienta),
    nivel: one(NIVELES_MVP, p.nivel),
    tiempo: one(TIEMPOS, p.tiempo),
    restricciones: lineas(p.restricciones),
    nombre: oneLine(p.nombre, 60).replace(/[.\s]+$/u, ''),
    tono: one(TONOS_MVP, p.tono) || 'directo',
    herramientas: herramientasDe(p.herramientas),
  };
}

// Grupo 7 · Semáforo de Liquidaciones (PROMPT 1): the brief is the table of the eval.
// The skill stays general (user decision, 5 Nov 2026): the brief goes in the chat.
export const EJEMPLO_MVP = Object.freeze({
  incluirBrief: false,
  brief: texto(EJEMPLO_BRIEF, MAX_BRIEF),
  sector: 'publico',
  herramienta: 'claude-code',
  nivel: 'cero',
  tiempo: 'sesion',
  restricciones: Object.freeze(['No usa datos reales de contratos ni contratistas', 'No calcula días hábiles; solo calendario']),
  nombre: 'Fabián',
  tono: 'directo',
  herramientas: Object.freeze(['claude']),
});

export const VACIO_MVP = Object.freeze({
  incluirBrief: false,
  brief: '',
  sector: null,
  herramienta: null,
  nivel: null,
  tiempo: null,
  restricciones: Object.freeze([]),
  nombre: '',
  tono: 'directo',
  herramientas: Object.freeze([]),
});

const TITULO = 'De brief a MVP';
export const AVISO_SIN_BRIEF = '[Pega tu brief o tu idea en el campo 01 para generar la skill.]';
/** PRIMER_MENSAJE.md without a brief: the line the person fills in the chat. */
export const HUECO_BRIEF = '[Pega aquí tu brief completo o tu idea en una frase]';
/** The last section of SKILL.md when the skill carries the brief: the brief, quoted whole. */
export const MI_BRIEF = Object.freeze({ titulo: 'Mi brief', entrada: 'Si en el chat no te pego otro brief, parte de este.' });
/** The README line under the opening: does the skill carry the brief? */
export const MODO_README = Object.freeze({
  general: 'Esta skill es general: pégale tu brief en el chat.',
  conBrief: 'Esta skill lleva tu brief adentro; para otro proyecto, genera otra.',
});
export const REGLA_SECTOR_PUBLICO =
  'Sector público: nunca datos reales ni información reservada; la herramienta nunca decide, firma, radica ni notifica; siempre hay un humano responsable que valida.';
const SECCION_PUBLICA = 'Sustituciones propias del sector público colombiano';
const TONO_BORRADOR = 'Responde claro y directo.';

// ── Profile ──

const byId = (list, id) => list.find((x) => x.id === id) || null;
const one = (list, v) => (typeof v === 'string' && byId(list, v) ? v : null);

function resolve(raw) {
  const p = normalizeMvp(raw);
  const h = byId(HERRAMIENTAS_MVP, p.herramienta);
  const sector = byId(SECTORES_MVP, p.sector);
  return {
    p,
    sector,
    // «Otro» has no useful sentence («Soy de mi contexto»): the presentation drops it.
    sectorFrase: sector && sector.id !== 'otro' ? sector : null,
    nivel: byId(NIVELES_MVP, p.nivel),
    tiempo: byId(TIEMPOS, p.tiempo),
    herramienta: h && h.caja ? h : null,
    nose: p.herramienta === 'nose',
    tono: byId(TONOS_MVP, p.tono),
  };
}

/**
 * A general skill (the default) is whole without a brief; one that carries the brief
 * waits for it before its ZIPs (PROMPT 5, point 2).
 */
export function descargasHabilitadas(raw) {
  const p = normalizeMvp(raw);
  return !p.incluirBrief || p.brief !== '';
}

// ── The brief: its fields, and the example's name (PROMPT 2, A, «Ejemplo») ──

/** The ten fields of a brief, as the field 01 hint names them. */
export const CAMPOS_BRIEF = [
  'Nombre y entidad', 'Usuario', 'Problema', 'Reto', 'Solución', 'Flujo', 'Qué NO hará', 'Datos',
  'Humano responsable', 'Cómo sabremos que funciona',
];

const fold = (s) => s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
const CAMPOS_FOLD = CAMPOS_BRIEF.map((n) => [n, fold(n)]);
/** «**1. ¿Usuario principal?**» → the brief field it names, or null. */
function campoDe(etiqueta) {
  const e = fold(etiqueta.replace(/<[^>]*>/g, ' ').replace(/[*_`#¿?]/g, '').replace(/^\s*\d+[.)]?\s*/, ''));
  if (!e) return null;
  const hit = CAMPOS_FOLD.find(([, f]) => e === f) ?? CAMPOS_FOLD.find(([, f]) => e.startsWith(`${f} `));
  return hit ? hit[0] : null;
}
const limpiaValor = (v) => v.replace(/^[\s*_]+|[\s*_]+$/g, '');

/**
 * The brief fields found in a text, in order of appearance (first one wins): table
 * rows «| Campo | Valor |», lines «Campo: valor» (bold or bulleted too) and headings
 * «### Campo» with the value on the next line. A word inside a sentence is no field.
 */
export function camposDelBrief(text) {
  const out = new Map();
  const lines = String(text ?? '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let etiqueta = null;
    let valor = '';
    const fila = line.match(/^\s*\|(.*)\|\s*$/);
    const titulo = line.match(/^\s*#{1,6}\s+(.+)$/);
    const par = line.match(/^\s*(?:[-*•]\s+)?([^:|]{2,80}):(.*)$/u);
    if (fila) {
      const celdas = fila[1].split('|').map((c) => c.trim());
      if (celdas.length >= 3 && /^\d+[.)]?$/.test(celdas[0])) celdas.shift();
      if (celdas.length < 2) continue;
      [etiqueta] = celdas;
      valor = celdas.slice(1).join(' | ');
    } else if (titulo) {
      etiqueta = titulo[1];
      valor = lines.slice(i + 1).find((l) => l.trim()) ?? '';
      if (/^\s*#/.test(valor)) valor = '';
    } else if (par) {
      [, etiqueta, valor] = par;
    }
    const campo = etiqueta === null ? null : campoDe(etiqueta);
    if (campo && !out.has(campo)) out.set(campo, limpiaValor(valor));
  }
  return out;
}

const MAX_FRASE = 160;
/** Cuts at a word boundary to ≤ max characters, ending with … */
function cortar(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/u, '')}…`;
}

/**
 * What names the example of SKILL.md: a brief (four or more of the ten fields) by
 * the first line of «Nombre y entidad», and of that line its first sentence (a table
 * cell holds «Nombre. Entidad.» on one line); any other text by the phrase itself.
 * Null when there is no brief, or a brief without «Nombre y entidad» (the draft's stays).
 */
export function nombreDelEjemplo(brief) {
  const text = typeof brief === 'string' ? brief : '';
  if (!text.trim()) return null;
  const campos = camposDelBrief(text);
  if (campos.size < 4) return cortar(oneLine(text, 4000), MAX_FRASE);
  const primera = (campos.get('Nombre y entidad') ?? '').split(/<br\s*\/?>|\n/i).map(limpiaValor).find(Boolean);
  const nombre = primera?.split(/\.\s+(?=\p{Lu})/u)[0].replace(/\.$/u, '').trim();
  return nombre ? cortar(nombre, MAX_FRASE) : null;
}

// ── Markdown surgery on the draft (fence-aware) ──

const FENCE = /^\s*(```|~~~)/;
const ITEM = /^(\s*)([-*]|\d+[.)])\s+(.*)$/;

/** [line, level, text] of every heading outside code fences. */
function titulos(lines) {
  const out = [];
  let fence = false;
  lines.forEach((l, i) => {
    if (FENCE.test(l)) fence = !fence;
    else if (!fence) {
      const m = l.match(/^(#{1,6})\s+(.*)$/);
      if (m) out.push([i, m[1].length, m[2]]);
    }
  });
  return out;
}

/** [start, end) of the section titled `heading` (exact title first, then a prefix), or null. */
function seccion(lines, heading, { nivel = null } = {}) {
  const h = fold(heading);
  const ts = titulos(lines).filter(([, n]) => nivel === null || n === nivel);
  const k = ts.findIndex(([, , t]) => fold(t) === h) >= 0 ? ts.findIndex(([, , t]) => fold(t) === h) : ts.findIndex(([, , t]) => fold(t).startsWith(h));
  if (k < 0) return null;
  const [start, level] = ts[k];
  const next = titulos(lines).find(([i, n]) => i > start && n <= level);
  return [start, next ? next[0] : lines.length];
}

/** Rewrites the body of a `## heading` section with fn(lines without trailing blanks). */
function editar(text, heading, fn) {
  const lines = text.split('\n');
  const r = seccion(lines, heading, { nivel: 2 });
  if (!r) return text;
  const [a, b] = r;
  const body = lines.slice(a + 1, b);
  let end = body.length;
  while (end > 0 && !body[end - 1].trim()) end--;
  return [...lines.slice(0, a + 1), ...fn(body.slice(0, end)), ...body.slice(end), ...lines.slice(b)].join('\n');
}

function quitarSeccion(text, heading) {
  const lines = text.split('\n');
  const r = seccion(lines, heading);
  if (!r) return text;
  return [...lines.slice(0, r[0]), ...lines.slice(r[1])].join('\n').trimEnd();
}

const archivo = (text) => `${text.trimEnd()}\n`;
const ucFirst = (s) => (s ? s[0].toLocaleUpperCase('es') + s.slice(1) : s);

// ── SKILL.md ──

function quienSoy({ sectorFrase, nivel }) {
  if (sectorFrase && nivel) return `Soy de ${sectorFrase.sistema}, ${nivel.sistema}.`;
  if (sectorFrase) return `Soy de ${sectorFrase.sistema}.`;
  if (nivel) return sentence(nivel.sistema);
  return null;
}

const SIN_HERRAMIENTA = 'Todavía no elegí herramienta: recomiéndame una.';

function construyo({ herramienta, nose }) {
  if (herramienta) return `Construyo con ${herramienta.label} (${CAJAS[herramienta.caja]}).`;
  return nose ? SIN_HERRAMIENTA : null;
}

/** The presentation line of PROMPT 2 (A), after the title. */
function presentacion(r) {
  return [
    'Skill de mi cerebro.',
    r.p.nombre ? `Llámame ${r.p.nombre}.` : null,
    quienSoy(r),
    construyo(r),
    r.tiempo ? `Tengo ${r.tiempo.sistema}.` : null,
  ].filter(Boolean).join(' ');
}

function trasTitulo(text, r) {
  const intro = [presentacion(r), ...(r.p.incluirBrief && !r.p.brief ? [AVISO_SIN_BRIEF] : [])];
  const lines = text.split('\n');
  const t = titulos(lines).find(([, n]) => n === 1);
  if (!t) return [...intro, '', ...lines].join('\n');
  return [...lines.slice(0, t[0] + 1), '', ...intro, ...lines.slice(t[0] + 1)].join('\n');
}

/**
 * «Qué necesito antes de empezar»: the item that names the tool, the experience or
 * the time (one of them only, never the brief's) becomes a statement when the form
 * answers it; its indented continuation goes with it.
 */
function necesito(r) {
  const afirmaciones = {
    herramienta: r.herramienta ? `Construyo con ${r.herramienta.label}.` : r.nose ? SIN_HERRAMIENTA : null,
    experiencia: r.nivel ? sentence(r.nivel.sistema) : null,
    tiempo: r.tiempo ? `Tengo ${r.tiempo.sistema}.` : null,
  };
  const claves = {
    herramienta: /herramienta|con que (?:vas a )?construi/,
    experiencia: /experiencia/,
    tiempo: /tiempo/,
  };
  return (body) => {
    const out = [];
    const hechas = new Set();
    for (let i = 0; i < body.length; i++) {
      const m = body[i].match(ITEM);
      const f = m ? fold(m[3]) : '';
      const tipos = m && !f.includes('brief') ? Object.keys(claves).filter((k) => claves[k].test(f)) : [];
      const tipo = tipos.length === 1 && afirmaciones[tipos[0]] && !hechas.has(tipos[0]) ? tipos[0] : null;
      if (!tipo) {
        out.push(body[i]);
        continue;
      }
      hechas.add(tipo);
      out.push(`${m[1]}${m[2]} ${afirmaciones[tipo]}`);
      while (i + 1 < body.length && body[i + 1].trim() && body[i + 1].search(/\S/) > m[1].length) i++;
    }
    return out;
  };
}

function reglas(r) {
  const limites = r.p.restricciones.map((s) => `- Límite: ${lcFirst(sentence(s))}`);
  const publico = r.p.sector === 'publico' ? [`- ${REGLA_SECTOR_PUBLICO}`] : [];
  return (body) => [...body, ...limites, ...publico];
}

function formato(r) {
  const tono = `${r.tono.instruccion}.`;
  return (body) => {
    const joined = body.join('\n');
    return joined.includes(TONO_BORRADOR) ? joined.replace(TONO_BORRADOR, tono).split('\n') : [...body, tono];
  };
}

function ejemplo(r) {
  const nombre = nombreDelEjemplo(r.p.brief);
  return (body) => (nombre ? body.join('\n').split(EJEMPLO_NOMBRE_BORRADOR).join(nombre).split('\n') : body);
}

/** A text as a Markdown quote: its headings and fences can never open a section of the skill. */
const cita = (text) => text.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');

/**
 * Only a skill that carries the brief (`incluirBrief`) depends on field 01: the notice
 * when it is empty, the example's name and, last, «Mi brief». A general skill is the
 * draft's, whatever the brief says.
 */
function skillCuerpo(r) {
  const conBrief = r.p.incluirBrief;
  let s = trasTitulo(SKILL_CUERPO.trim(), r);
  s = editar(s, 'Qué necesito antes de empezar', necesito(r));
  s = editar(s, 'Reglas que siempre aplican', reglas(r));
  s = editar(s, 'Formato de salida', formato(r));
  if (conBrief) s = editar(s, 'Ejemplo', ejemplo(r));
  s = s.trimEnd();
  return conBrief && r.p.brief ? [s, `## ${MI_BRIEF.titulo}`, MI_BRIEF.entrada, cita(r.p.brief)].join('\n\n') : s;
}

const skillMd = (cuerpo) => md([SKILL_FRONTMATTER, cuerpo]);

// ── References ──

const palabras = (s) => fold(s).match(/[a-z0-9]+/g) ?? [];

/**
 * Tool blocks (`## …`): the first block whose title holds every word of the tool's
 * label («Claude Code o Codex (caja abierta, local)» serves both) is marked
 * «(la mía)» and moved first, right after the file's opening.
 */
function herramientasMd(r) {
  const h = r.herramienta;
  if (!h) return archivo(REF_HERRAMIENTAS);
  const lines = REF_HERRAMIENTAS.trimEnd().split('\n');
  const heads = titulos(lines).filter(([, n]) => n === 2).map(([i]) => i);
  const label = palabras(h.label);
  const k = heads.findIndex((i) => {
    const t = palabras(lines[i]);
    return label.every((w) => t.includes(w));
  });
  if (k < 0) return archivo(REF_HERRAMIENTAS);
  const sinBlancos = (ls) => {
    let e = ls.length;
    while (e > 0 && !ls[e - 1].trim()) e--;
    return ls.slice(0, e);
  };
  const bloques = heads.map((s, j) => sinBlancos(lines.slice(s, heads[j + 1] ?? lines.length)));
  const [mio] = bloques.splice(k, 1);
  mio[0] = `${mio[0].trimEnd()} (la mía)`;
  const pre = sinBlancos(lines.slice(0, heads[0]));
  return archivo([...(pre.length ? [...pre, ''] : []), ...[mio, ...bloques].flatMap((b, j) => (j ? ['', ...b] : b))].join('\n'));
}

function tablaMd(r) {
  return archivo(r.p.sector === 'publico' ? REF_TABLA_DE_RECORTE : quitarSeccion(REF_TABLA_DE_RECORTE, SECCION_PUBLICA));
}

function referencias(r) {
  return {
    'plantilla-spec-mvp.md': archivo(REF_PLANTILLA_SPEC_MVP),
    'tabla-de-recorte.md': tablaMd(r),
    'prompts-por-capa.md': archivo(REF_PROMPTS_POR_CAPA),
    'herramientas.md': herramientasMd(r),
    'reglas-de-mesa.md': archivo(REF_REGLAS_DE_MESA),
  };
}

// ── INSTRUCCIONES_GPT.md (F): the draft header, the skill without YAML, the references ──

const SEPARADOR = '\n\n---\n\n';

function gptMd(cuerpo, refs) {
  return md([
    CABECERA_GPT,
    '---',
    cuerpo,
    ...REFS_GPT.flatMap((n) => ['---', `<!-- references/${n} -->`, refs[n].trimEnd()]),
  ]);
}

// ── PRIMER_MENSAJE.md (E) ──

const PEDIDO =
  'Aplica la skill brief-a-mvp: dime qué entendiste, hazme máximo tres preguntas si hacen falta, y luego el recorte, la SPEC de una página, el plan de capas y los prompts.';

function primerMensajeMd(r) {
  const clausulas = [
    r.herramienta ? `voy a construir en ${r.herramienta.label}` : r.nose ? 'todavía no sé con qué voy a construir' : null,
    r.nivel?.sistema,
    r.tiempo ? `tengo ${r.tiempo.sistema}` : null,
  ].filter(Boolean);
  const contexto = [clausulas.length ? sentence(clausulas.join('; ')) : null, r.sector ? `Sector: ${r.sector.corto}.` : null]
    .filter(Boolean)
    .join(' ');
  return md([
    '# Primer mensaje',
    'Pégalo en un chat con la skill instalada (o después de pegar INSTRUCCIONES_GPT.md).',
    '---',
    'Este es mi brief:',
    r.p.brief || HUECO_BRIEF,
    [contexto, PEDIDO].filter(Boolean).join('\n'),
  ]);
}

/** Everything below the --- rule of PRIMER_MENSAJE.md: the test of Paso 3. */
const cuerpoPrimer = (pm) => pm.slice(pm.indexOf(SEPARADOR) + SEPARADOR.length).trimEnd();

// ── README.md (G) ──

// The draft README read by structure: its opening (between the title and the first
// `## `), its «Instalar» routes (one `**Etiqueta:** texto` paragraph each) and the
// check that closes «Probar» (its first paragraph gives way to the test with the brief).
const parrafos = (text) => text.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
function parrafosDeSeccion(heading) {
  const lines = README_BORRADOR.split('\n');
  const r = seccion(lines, heading, { nivel: 2 });
  return r ? parrafos(lines.slice(r[0] + 1, r[1]).join('\n')) : [];
}

/** The draft README's opening paragraph. */
export const README_BASE = (() => {
  const lines = README_BORRADOR.split('\n');
  const ts = titulos(lines);
  const desde = ts.length && ts[0][1] === 1 ? ts[0][0] + 1 : 0;
  const hasta = ts.find(([i, n]) => i >= desde && n === 2)?.[0] ?? lines.length;
  return parrafos(lines.slice(desde, hasta).join('\n')).join('\n\n');
})();

/** The check after the test: the last paragraph of the draft's «Probar». */
export const README_PROBAR = parrafosDeSeccion('Probar').at(-1) ?? '';

/** The draft's test without a brief: «Probar» before its check. */
export const README_PROBAR_GENERAL = parrafosDeSeccion('Probar').slice(0, -1).join('\n\n');

// «La IA que usas hoy» (catalog HERRAMIENTAS) a route serves: the ones its title names.
const IA_RUTAS = HERRAMIENTAS.filter((h) => h.id !== 'ninguna');

/** The draft's install routes, in its order: { id, titulo, texto, ia: [HERRAMIENTAS ids] }. */
export const RUTAS_README = parrafosDeSeccion('Instalar')
  .map((x) => x.match(/^\*\*(.+?):\*\* ([\s\S]+)$/))
  .filter(Boolean)
  .map(([, titulo, texto]) => ({
    id: palabras(titulo).join('-'),
    titulo,
    texto,
    ia: IA_RUTAS.filter((h) => palabras(titulo).includes(palabras(h.label)[0])).map((h) => h.id),
  }));

const numerados = (items) => items.map((s, i) => `${i + 1}. ${s}`).join('\n');

// Copy bank of CEREBRO-GENERAL.md («Pegar, Proyecto o skill»), verbatim, as in the other READMEs.
const PEGAR_PROYECTO_SKILL =
  'Pegar: vale para este chat. Proyecto: vale para todos los chats del proyecto. Skill: la IA la aplica sola, en cualquier chat, cuando aparece la tarea.';

/** The draft's install routes, ideación's order: yours first («· la usas hoy»), the rest under «Otras rutas». */
function rutasReadme(herramientas) {
  // The draft's «**Etiqueta:** texto» becomes a heading and its paragraph, which starts with a capital.
  const bloque = (x, mia) => `### ${x.titulo}${mia ? ' · la usas hoy' : ''}\n\n${ucFirst(x.texto)}`;
  const mias = RUTAS_README.filter((x) => x.ia.some((id) => herramientas.includes(id)));
  const otras = RUTAS_README.filter((x) => !mias.includes(x));
  if (!mias.length) return ['## Instalar', PEGAR_PROYECTO_SKILL, ...otras.map((x) => bloque(x, false))];
  return [
    '## Instalar',
    PEGAR_PROYECTO_SKILL,
    ...mias.map((x) => bloque(x, true)),
    '## Otras rutas',
    'Por si cambias de herramienta o quieres probarla en otra.',
    ...otras.map((x) => bloque(x, false)),
  ];
}

function readmeMd(r) {
  const { p } = r;
  const filas = [
    [`${SLUG_MVP}/SKILL.md`, 'La skill para Claude. Sube la carpeta como ZIP (ver «Instalar»).'],
    [`${SLUG_MVP}/references/plantilla-spec-mvp.md`, 'La plantilla de la SPEC de una página.'],
    [`${SLUG_MVP}/references/tabla-de-recorte.md`, 'Qué se recorta para el MVP y con qué se sustituye.'],
    [`${SLUG_MVP}/references/prompts-por-capa.md`, 'Un prompt por capa, para construir en orden.'],
    [`${SLUG_MVP}/references/herramientas.md`, 'Cada herramienta y su caja.'],
    [`${SLUG_MVP}/references/reglas-de-mesa.md`, 'Las reglas de mesa del taller.'],
    ['INSTRUCCIONES_GPT.md', 'La misma skill, con las cinco referencias adentro, para ChatGPT, Gemini, Copilot o cualquier chat.'],
    ['PRIMER_MENSAJE.md', 'Lo que envías primero, con tu brief.'],
    ['README.md', 'Esta guía.'],
  ];
  const destino = r.herramienta ? r.herramienta.label : 'la herramienta que elijas';
  return md([
    `# ${TITULO} · tu skill`,
    p.nombre ? `${p.nombre}, ${lcFirst(README_BASE)}` : README_BASE,
    p.incluirBrief ? MODO_README.conBrief : MODO_README.general,
    ['| Archivo | Para qué |', '|---|---|', ...filas.map(([a, b]) => `| \`${a}\` | ${b} |`)].join('\n'),
    ...rutasReadme(p.herramientas),
    '## Usarla',
    numerados([
      'Instala la skill con la ruta de tu herramienta (arriba), o pega `INSTRUCCIONES_GPT.md` en un chat nuevo.',
      'Pega `PRIMER_MENSAJE.md` en ese chat y responde sus preguntas (máximo tres).',
      `Pega en ${destino} un prompt por capa, en orden; prueba cada capa antes de pegar la siguiente.`,
    ]),
    // «Probar» with the brief itself (the README follows field 01, not the context line);
    // without one, the draft's own test.
    ...probarlaMd({ ...pruebaMvp(p), pregunta: p.brief || README_PROBAR_GENERAL }, [README_PROBAR]),
  ]);
}

// ── Public API ──

export function buildMvp(raw) {
  const r = resolve(raw);
  const cuerpo = skillCuerpo(r);
  const refs = referencias(r);
  return {
    'README.md': readmeMd(r),
    'SKILL.md': skillMd(cuerpo),
    'INSTRUCCIONES_GPT.md': gptMd(cuerpo, refs),
    'PRIMER_MENSAJE.md': primerMensajeMd(r),
    ...Object.fromEntries(REFS.map((n) => [`references/${n}`, refs[n]])),
  };
}

/** «Copiar todo para pegar en un chat»: the draft's header, then everything below its rule. */
export function pasteMvp(raw) {
  const r = resolve(raw);
  const gpt = gptMd(skillCuerpo(r), referencias(r));
  return `${CABECERA_GPT}\n\n${gpt.slice(CABECERA_GPT.length + SEPARADOR.length)}`;
}

const SKILL_FILES = ['SKILL.md', ...REFS.map((r) => `references/${r}`)];

/** The skill as Claude uploads it: `brief-a-mvp/` with SKILL.md and the five references. */
export function zipMvp(raw, { date = new Date() } = {}) {
  const files = buildMvp(raw);
  return zip(SKILL_FILES.map((n) => ({ name: `${SLUG_MVP}/${n}`, data: files[n] })), { date });
}

/** Everything: `brief-a-mvp-kit/` with README, instructions, first message and the skill folder. */
export function zipTodoMvp(raw, { date = new Date() } = {}) {
  const files = buildMvp(raw);
  const kit = `${SLUG_MVP}-kit`;
  return zip(
    [
      ...['README.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'].map((n) => ({ name: `${kit}/${n}`, data: files[n] })),
      ...SKILL_FILES.map((n) => ({ name: `${kit}/${SLUG_MVP}/${n}`, data: files[n] })),
    ],
    { date },
  );
}

/** Paso 2: the three lines the AI confirms after the paste (PROMPT 4). */
export const CONFIRM3_MVP = [
  ['Cómo se llama la skill', ' y cuándo se activa.'],
  ['Qué te va a pedir', ' antes de empezar: el brief y, si faltan, herramienta, experiencia y tiempo.'],
  ['Con qué sección cierra', ' cada respuesta: «Lo que aún adivinaría».'],
];

/** Paso 3: the generated first message is the test; five rows to compare (PROMPT 4). */
export function pruebaMvp(raw) {
  return {
    pregunta: cuerpoPrimer(primerMensajeMd(resolve(raw))),
    esperado: {
      con: [
        'Lee el brief, lo mapea y pregunta máximo tres cosas que falten',
        'Recorta: diez registros de ejemplo, semáforo, un solo documento; da el sustituto de cada cosa',
        'SPEC con reglas numeradas con ejemplo, diez datos ficticios y casos con resultado esperado',
        'Un prompt por capa, en bloque de código, adaptado a la herramienta, con «qué debe verse»',
        'Cierra con «Lo que aún adivinaría» y las reglas de mesa',
      ],
      sin: [
        'Vuelve a preguntar lo que el brief ya dice',
        'Propone conectar SECOP, correo y base de datos',
        'Una lista de funciones sin reglas',
        'Un prompt largo para construir todo',
        'Todo parece listo',
      ],
    },
    nota: NOTA_PRUEBA,
  };
}
