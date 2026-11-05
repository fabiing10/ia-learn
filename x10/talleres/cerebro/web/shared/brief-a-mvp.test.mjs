// node --test talleres/cerebro/web/shared/brief-a-mvp.test.mjs
// The brief-a-mvp skill (encargo 05, PROMPTS 1–4): the draft's fixed texts
// (brief-a-mvp.content.js, kept equal to the insumo files by brief-a-mvp.content.test.mjs)
// parametrised by the form. These tests assert structure and the parametrised lines
// only, never the draft's wording, so they keep passing when the draft changes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as C from './brief-a-mvp.content.js';
import {
  ARCHIVOS_MVP, AVISO_SIN_BRIEF, CAMPOS_BRIEF, CAMPOS_MVP, CONFIRM3_MVP, EJEMPLO_MVP, HERRAMIENTAS_MVP, HUECO_BRIEF, MI_BRIEF,
  MODO_README, NIVELES_MVP, README_BASE, README_PROBAR, README_PROBAR_GENERAL, REGLA_SECTOR_PUBLICO, RUTAS_README, SECTORES_MVP,
  SLUG_MVP, TIEMPOS, TONOS_MVP, VACIO_MVP, buildMvp, camposDelBrief, descargasHabilitadas, nombreDelEjemplo, normalizeMvp,
  pasteMvp, pruebaMvp, zipMvp, zipTodoMvp,
} from './brief-a-mvp.js';
import { HERRAMIENTAS } from './catalog.js';
import { NIVELES, SECTORES, TONOS_IDEACION } from './ideacion.js';
import { lcFirst, sentence } from './skill-general.js';

const grupo7 = () => structuredClone(EJEMPLO_MVP);
/** The example with its brief inside the skill (the switch above field 01, on). */
const conBrief = () => ({ ...grupo7(), incluirBrief: true });
const BAD = /undefined|null|NaN|\[object Object\]/;
const FIXED = new Date(2026, 10, 5, 9, 0, 0);
const SLUG = 'brief-a-mvp';
const REFS = ['plantilla-spec-mvp.md', 'tabla-de-recorte.md', 'prompts-por-capa.md', 'herramientas.md', 'reglas-de-mesa.md'];
// INSTRUCCIONES_GPT.md follows the draft's order: herramientas before prompts (step 8 reads them so).
const REFS_GPT = ['plantilla-spec-mvp.md', 'tabla-de-recorte.md', 'herramientas.md', 'prompts-por-capa.md', 'reglas-de-mesa.md'];
const palabras = (s) => s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
/** The draft's `## ` block of a tool: the first whose title holds every word of the label. */
const bloqueDe = (md, label) => h2s(md).find((h) => palabras(label).every((w) => palabras(h).includes(w)));
const PUBLICA = 'Sustituciones propias del sector público colombiano';

// Test data only: two fictitious briefs, one per format the detector reads.
const BRIEF_TABLA = `| Campo | Contenido |
|---|---|
| Nombre y entidad | Agenda de Préstamos<br>Biblioteca del Colegio Los Pinos |
| Usuario | La bibliotecaria |
| Problema | Los préstamos se anotan en un cuaderno y se pierden |
| Reto | Saber qué libro está prestado y a quién |
| Solución | Una lista de préstamos con su estado |
| Flujo | Registrar un préstamo y marcar la devolución |
| Qué NO hará | No envía correos |
| Datos | Diez préstamos ficticios |
| Humano responsable | La bibliotecaria |
| Cómo sabremos que funciona | Un préstamo registrado aparece en la lista |`;
const BRIEF_LINEAS = `**Nombre y entidad:** Turnos Ya — Alcaldía de Villa Ejemplo
**Usuario:** la recepcionista
- Problema: la fila se desordena
¿Cómo sabremos que funciona?: cada turno sale una sola vez`;
const FRASE = 'Quiero una app que ordene los turnos de la recepción para la alcaldía';

// ── Markdown helpers (fence-aware, like ideacion.test.mjs) ──

function outsideFences(md) {
  let fence = false;
  return md.split('\n').filter((l) => {
    if (/^(```|~~~)/.test(l)) {
      fence = !fence;
      return false;
    }
    return !fence;
  });
}
const h2s = (md) => outsideFences(md).filter((l) => l.startsWith('## '));
function section(md, heading) {
  let fence = false;
  let on = false;
  const out = [];
  for (const line of md.split('\n')) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    if (!fence && /^#{1,2} /.test(line)) {
      if (on) break;
      on = line === `## ${heading}` || line.startsWith(`## ${heading} `);
    }
    if (on) out.push(line);
  }
  assert.ok(out.length, `missing section "## ${heading}"`);
  return out.join('\n').trimEnd();
}
const items = (text) => text.split('\n').filter((l) => /^\s*(?:[-*]|\d+[.)])\s+/.test(l));
const sinMarca = (l) => l.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '');
function assertNoEmptyHeading(md, label) {
  const lines = md.split('\n');
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^(```|~~~)/.test(lines[i])) fence = !fence;
    if (fence || !/^#{1,6} /.test(lines[i])) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    assert.ok(j < lines.length && !/^#{1,6} /.test(lines[j]), `${label}: empty heading "${lines[i]}"`);
  }
}
function unzipped(bytes, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'cj-mvp-'));
  try {
    const file = join(dir, 'x.zip');
    writeFileSync(file, bytes);
    const listing = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n').sort();
    execFileSync('unzip', ['-q', file, '-d', join(dir, 'out')]);
    return fn({ listing, read: (name) => readFileSync(join(dir, 'out', name), 'utf8') });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
/** The text of the draft's SKILL body for a section, as the content module has it. */
const borrador = (heading) => section(`${C.SKILL_CUERPO}\n`, heading);
const cuerpoPrimer = (pm) => pm.slice(pm.indexOf('\n---\n\n') + 6).trimEnd();
/** A text as a Markdown quote, line by line (how the README and «Mi brief» show a brief). */
const cita = (text) => text.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
/** The presentation line: two lines below the SKILL title. */
const presentacionDe = (skill) => {
  const ls = skill.split('\n');
  return ls[ls.findIndex((l) => l.startsWith('# ')) + 2];
};

// ── Content anchors: what the generator relies on in the draft ──

test('content: the anchors the parametrisation reads are in the fixed texts', () => {
  assert.match(C.SKILL_FRONTMATTER, /^---\nname: brief-a-mvp\ndescription: .+\n---$/);
  assert.match(C.SKILL_CUERPO, /^# \S/, 'SKILL body starts with its title');
  for (const h of ['Qué necesito antes de empezar', 'Reglas que siempre aplican', 'Formato de salida', 'Ejemplo']) borrador(h);
  const necesito = items(borrador('Qué necesito antes de empezar')).map((l) => l.toLowerCase());
  assert.ok(necesito.some((l) => l.includes('brief')), 'an item for the brief');
  for (const k of ['herramienta', 'experiencia', 'tiempo']) {
    assert.equal(necesito.filter((l) => l.includes(k) && !l.includes('brief')).length, 1, k);
  }
  assert.ok(borrador('Formato de salida').includes('Responde claro y directo.'));
  assert.ok(borrador('Ejemplo').includes(C.EJEMPLO_NOMBRE_BORRADOR));
  assert.ok(C.REF_TABLA_DE_RECORTE.split('\n').some((l) => /^#{2,3} /.test(l) && l.includes(PUBLICA)));
  for (const h of HERRAMIENTAS_MVP.filter((x) => x.caja)) assert.ok(bloqueDe(C.REF_HERRAMIENTAS, h.label), h.label);
  for (const r of RUTAS_README) assert.ok(r.titulo && r.texto && r.ia.length, r.id);
});

test('README pieces come from the draft README by structure: opening, «Instalar» routes, «Probar» check', () => {
  const draft = `${C.README_BORRADOR}\n`;
  const parrafos = (text) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const [titulo, apertura] = parrafos(C.README_BORRADOR);
  assert.match(titulo, /^# /);
  assert.equal(README_BASE, apertura, 'the paragraph after the title');
  const instalar = parrafos(section(draft, 'Instalar')).slice(1).filter((p) => p.startsWith('**'));
  assert.equal(RUTAS_README.length, instalar.length, 'one route per «**Etiqueta:**» paragraph');
  RUTAS_README.forEach((r, i) => {
    assert.equal(`**${r.titulo}:** ${r.texto}`, instalar[i], r.id);
    const ias = HERRAMIENTAS.filter((h) => h.id !== 'ninguna' && palabras(r.titulo).includes(palabras(h.label)[0])).map((h) => h.id);
    assert.deepEqual(r.ia, ias, `${r.id}: the AIs its title names`);
  });
  assert.equal(new Set(RUTAS_README.map((r) => r.id)).size, RUTAS_README.length, 'unique ids');
  const probar = parrafos(section(draft, 'Probar')).slice(1);
  assert.ok(probar.length >= 2, 'the draft test and its check');
  assert.equal(README_PROBAR, probar.at(-1), 'the check is the last paragraph of «Probar»');
  assert.equal(README_PROBAR_GENERAL, probar.slice(0, -1).join('\n\n'), 'the draft test: «Probar» before its check');
  for (const k of ['cerrada', 'artifact', 'abierta']) assert.ok(C.CAJAS[k], k);
});

// ── Constants ──

test('constants: files in tab order, slug, catalogs shared with ideación, the field map of PROMPT 1', () => {
  assert.equal(SLUG_MVP, SLUG);
  assert.deepEqual(ARCHIVOS_MVP, ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', ...REFS.map((r) => `references/${r}`)]);
  assert.deepEqual(SECTORES_MVP.map((s) => [s.id, s.label]), SECTORES.map((s) => [s.id, s.label]));
  assert.deepEqual(NIVELES_MVP.map((s) => [s.id, s.label]), NIVELES.map((s) => [s.id, s.label]));
  assert.deepEqual(TONOS_MVP, TONOS_IDEACION);
  assert.deepEqual(HERRAMIENTAS_MVP.map((h) => [h.id, h.label, h.caja]), [
    ['lovable', 'Lovable', 'cerrada'],
    ['claude-artifact', 'Claude (artifact)', 'artifact'],
    ['claude-code', 'Claude Code', 'abierta'],
    ['codex', 'Codex', 'abierta'],
    ['ai-studio', 'Gemini AI Studio', 'cerrada'],
    ['nose', 'No sé aún', null],
  ]);
  assert.deepEqual(TIEMPOS.map((t) => [t.id, t.label]), [['sesion', 'Una sesión (90 minutos)'], ['dia', 'Un día'], ['semana', 'Una semana']]);
  const S = 'SKILL.md';
  const G = 'INSTRUCCIONES_GPT.md';
  const P = 'PRIMER_MENSAJE.md';
  const R = 'README.md';
  assert.deepEqual(Object.fromEntries(CAMPOS_MVP.map((c) => [c.id, c.archivos])), {
    incluirBrief: [S, G, R],
    brief: [S, G, P, R],
    sector: [S, G, P, 'references/tabla-de-recorte.md'],
    herramienta: [S, G, P, 'references/herramientas.md', R],
    nivel: [S, G, P],
    tiempo: [S, G, P],
    restricciones: [S, G],
    nombre: [S, G, R],
    tono: [S, G],
    herramientas: [R],
  });
  assert.deepEqual(CAMPOS_MVP.map((c) => c.label), ['Brief en la skill', 'Brief', 'Sector', 'Herramienta', 'Nivel', 'Tiempo', 'Límites', 'Nombre', 'Tono', 'IA que usas']);
  assert.deepEqual(Object.keys(VACIO_MVP), CAMPOS_MVP.map((c) => c.id));
  assert.equal(CAMPOS_BRIEF.length, 10);
});

test('the Grupo 7 example of PROMPT 1', () => {
  const g = EJEMPLO_MVP;
  assert.equal(g.brief, normalizeMvp({ brief: C.EJEMPLO_BRIEF }).brief, 'the eval table, normalized');
  assert.ok(g.brief);
  assert.deepEqual(
    [g.sector, g.herramienta, g.nivel, g.tiempo, g.nombre, g.tono, g.herramientas],
    ['publico', 'claude-code', 'cero', 'sesion', 'Fabián', 'directo', ['claude']],
  );
  assert.deepEqual(g.restricciones, ['No usa datos reales de contratos ni contratistas', 'No calcula días hábiles; solo calendario']);
  assert.deepEqual(normalizeMvp(g), { ...g, restricciones: [...g.restricciones], herramientas: [...g.herramientas] });
  // The skill is general by default: the brief goes in the chat, not inside the skill.
  assert.equal(g.incluirBrief, false);
  assert.equal(VACIO_MVP.incluirBrief, false);
  assert.equal(normalizeMvp({}).incluirBrief, false);
  assert.equal(normalizeMvp({ incluirBrief: true }).incluirBrief, true);
});

// ── buildMvp ──

test('buildMvp: the nine files in tab order, deterministic, one final newline, nothing undefined', () => {
  const a = buildMvp(grupo7());
  assert.deepEqual(Object.keys(a), ARCHIVOS_MVP);
  assert.deepEqual(buildMvp(grupo7()), a);
  for (const [n, t] of Object.entries(a)) {
    assert.ok(t.endsWith('\n') && !t.endsWith('\n\n'), `${n} ends with one newline`);
    assert.doesNotMatch(t, BAD, n);
  }
});

test('A · SKILL.md: the frontmatter is the draft one, first line, whatever the profile', () => {
  for (const p of [grupo7(), VACIO_MVP, { ...grupo7(), nombre: 'Otra', sector: 'empresa', herramienta: 'codex', brief: FRASE }]) {
    const s = buildMvp(p)['SKILL.md'];
    assert.ok(s.startsWith(`${C.SKILL_FRONTMATTER}\n\n`), JSON.stringify(p.sector));
  }
});

test('A · presentation line after the title: name, sector, experience, tool with its box, time', () => {
  const lines = buildMvp(grupo7())['SKILL.md'].split('\n');
  const t = lines.findIndex((l) => l.startsWith('# '));
  assert.equal(lines[t], C.SKILL_CUERPO.split('\n')[0], 'the draft title');
  assert.equal(
    lines[t + 2],
    `Skill de mi cerebro. Llámame Fabián. Soy de una entidad del sector público, nunca he construido software. Construyo con Claude Code (${C.CAJAS.abierta}). Tengo una sesión de 90 minutos.`,
  );
  const linea = (p) => {
    const ls = buildMvp(p)['SKILL.md'].split('\n');
    return ls[ls.findIndex((l) => l.startsWith('# ')) + 2];
  };
  assert.ok(!linea({ ...grupo7(), nombre: '' }).includes('Llámame'));
  assert.ok(linea({ ...grupo7(), herramienta: 'lovable' }).includes(`Construyo con Lovable (${C.CAJAS.cerrada}).`));
  assert.ok(linea({ ...grupo7(), herramienta: 'claude-artifact' }).includes(`Construyo con Claude (artifact) (${C.CAJAS.artifact}).`));
  assert.ok(linea({ ...grupo7(), herramienta: 'nose' }).includes('Todavía no elegí herramienta: recomiéndame una.'));
  assert.ok(linea({ ...grupo7(), sector: 'empresa', nivel: 'algo' }).includes('Soy de una empresa privada, ya hice algo con IA.'));
  assert.ok(linea({ ...grupo7(), nivel: 'programo', tiempo: 'semana' }).includes('programo. Construyo con Claude Code'));
  assert.ok(linea({ ...grupo7(), tiempo: 'dia' }).endsWith('Tengo un día.'));
  assert.ok(!linea({ ...grupo7(), sector: 'otro' }).includes('Soy de'), '«Otro» drops the sector clause');
  assert.equal(linea({ brief: FRASE }), 'Skill de mi cerebro.');
});

test('A · «Qué necesito antes de empezar»: the form answers become statements, the brief stays', () => {
  const draft = borrador('Qué necesito antes de empezar');
  const g = section(buildMvp(grupo7())['SKILL.md'], 'Qué necesito antes de empezar');
  assert.equal(items(g).length, items(draft).length);
  const briefItem = items(draft).find((l) => l.toLowerCase().includes('brief'));
  assert.ok(items(g).includes(briefItem), 'the brief item is untouched');
  const textos = items(g).map(sinMarca);
  for (const s of ['Construyo con Claude Code.', 'Nunca he construido software.', 'Tengo una sesión de 90 minutos.']) assert.ok(textos.includes(s), s);
  for (const k of ['herramienta', 'experiencia', 'tiempo']) {
    assert.ok(!items(g).some((l) => l.toLowerCase().includes(k) && items(draft).includes(l)), `${k} no longer asked`);
  }
  // Unanswered fields keep the draft's question.
  assert.equal(section(buildMvp({ brief: FRASE })['SKILL.md'], 'Qué necesito antes de empezar'), draft);
  const soloTool = items(section(buildMvp({ brief: FRASE, herramienta: 'nose' })['SKILL.md'], 'Qué necesito antes de empezar'));
  assert.ok(soloTool.map(sinMarca).includes('Todavía no elegí herramienta: recomiéndame una.'));
  assert.ok(soloTool.some((l) => l.toLowerCase().includes('experiencia')) && soloTool.some((l) => l.toLowerCase().includes('tiempo')));
});

test('A · «Reglas que siempre aplican»: one «- Límite:» per line, then the public-sector rule, at the end', () => {
  const draft = borrador('Reglas que siempre aplican');
  const g = section(buildMvp(grupo7())['SKILL.md'], 'Reglas que siempre aplican');
  const limites = EJEMPLO_MVP.restricciones.map((l) => `- Límite: ${lcFirst(sentence(l))}`);
  assert.equal(g, [draft, ...limites, `- ${REGLA_SECTOR_PUBLICO}`].join('\n'));
  assert.equal(
    REGLA_SECTOR_PUBLICO,
    'Sector público: nunca datos reales ni información reservada; la herramienta nunca decide, firma, radica ni notifica; siempre hay un humano responsable que valida.',
  );
  assert.equal(section(buildMvp({ ...grupo7(), sector: 'empresa' })['SKILL.md'], 'Reglas que siempre aplican'), [draft, ...limites].join('\n'));
  assert.equal(section(buildMvp({ ...grupo7(), sector: 'academia', restricciones: [] })['SKILL.md'], 'Reglas que siempre aplican'), draft);
  const tres = section(buildMvp({ ...grupo7(), restricciones: 'Uno\nDos\n\nTres' })['SKILL.md'], 'Reglas que siempre aplican');
  assert.equal(items(tres).filter((l) => l.startsWith('- Límite: ')).length, 3);
});

test('A · «Formato de salida»: the tone sentence replaces «Responde claro y directo.»', () => {
  const draft = borrador('Formato de salida');
  for (const t of TONOS_MVP) {
    const g = section(buildMvp({ ...grupo7(), tono: t.id })['SKILL.md'], 'Formato de salida');
    assert.equal(g, draft.replace('Responde claro y directo.', `${t.instruccion}.`), t.id);
  }
});

test('A · «Ejemplo»: a brief (≥ 4 of the ten fields) names it by «Nombre y entidad»; anything else by the phrase', () => {
  assert.deepEqual([...camposDelBrief(BRIEF_TABLA).keys()], CAMPOS_BRIEF);
  assert.equal(camposDelBrief(BRIEF_TABLA).get('Nombre y entidad'), 'Agenda de Préstamos<br>Biblioteca del Colegio Los Pinos');
  assert.deepEqual([...camposDelBrief(BRIEF_LINEAS).keys()], ['Nombre y entidad', 'Usuario', 'Problema', 'Cómo sabremos que funciona']);
  assert.equal(nombreDelEjemplo(BRIEF_TABLA), 'Agenda de Préstamos');
  assert.equal(nombreDelEjemplo(BRIEF_LINEAS), 'Turnos Ya — Alcaldía de Villa Ejemplo');
  const tres = BRIEF_LINEAS.split('\n').slice(0, 3).join('\n');
  assert.equal(nombreDelEjemplo(tres), tres.replace(/\s+/g, ' '), 'three fields are not a brief');
  assert.equal(nombreDelEjemplo(FRASE), FRASE);
  const unaLinea = BRIEF_TABLA.replace('Agenda de Préstamos<br>Biblioteca del Colegio Los Pinos', 'Agenda de Préstamos. Biblioteca del Colegio Los Pinos.');
  assert.equal(nombreDelEjemplo(unaLinea), 'Agenda de Préstamos', 'name and entity on one line: the first sentence');
  assert.equal(nombreDelEjemplo('Quiero un problema resuelto con datos del usuario y su flujo'), 'Quiero un problema resuelto con datos del usuario y su flujo', 'words in a phrase are not fields');
  assert.ok(nombreDelEjemplo('palabra '.repeat(80)).length <= 160);
  const draft = borrador('Ejemplo');
  for (const [brief, nombre] of [[BRIEF_TABLA, 'Agenda de Préstamos'], [FRASE, FRASE]]) {
    const g = section(buildMvp({ ...conBrief(), brief })['SKILL.md'], 'Ejemplo');
    assert.equal(g, draft.split(C.EJEMPLO_NOMBRE_BORRADOR).join(nombre), 'only the name changes; the expected output stays');
    assert.equal(section(buildMvp({ ...grupo7(), brief })['SKILL.md'], 'Ejemplo'), draft, 'brief outside the skill: the draft example as is');
  }
  assert.equal(section(buildMvp({ ...VACIO_MVP, incluirBrief: true })['SKILL.md'], 'Ejemplo'), draft, 'no brief: the draft example as is');
});

test('C · tabla-de-recorte.md: the public-sector section only for the public sector', () => {
  const ref = 'references/tabla-de-recorte.md';
  assert.equal(buildMvp(grupo7())[ref], `${C.REF_TABLA_DE_RECORTE}\n`);
  for (const sector of ['empresa', 'emprendimiento', 'academia', 'social', 'otro', null]) {
    const t = buildMvp({ ...grupo7(), sector })[ref];
    assert.ok(!t.includes(PUBLICA), String(sector));
    assert.ok(t.startsWith(C.REF_TABLA_DE_RECORTE.split('\n')[0]), 'keeps the title');
    assertNoEmptyHeading(t, ref);
  }
  const sinPublica = buildMvp({ ...grupo7(), sector: 'empresa' })[ref];
  for (const l of sinPublica.split('\n')) assert.ok(C.REF_TABLA_DE_RECORTE.includes(l), `«${l}» comes from the draft`);
});

test('D · herramientas.md: the chosen tool first and marked «(la mía)»; «No sé aún» leaves it as is', () => {
  const ref = 'references/herramientas.md';
  const draftBlocks = h2s(C.REF_HERRAMIENTAS);
  for (const h of HERRAMIENTAS_MVP.filter((x) => x.caja)) {
    const t = buildMvp({ ...grupo7(), herramienta: h.id })[ref];
    const blocks = h2s(t);
    const suyo = bloqueDe(C.REF_HERRAMIENTAS, h.label);
    assert.equal(blocks[0], `${suyo} (la mía)`, h.id);
    assert.equal(blocks.length, draftBlocks.length);
    assert.deepEqual(blocks.slice(1), draftBlocks.filter((b) => b !== suyo), `${h.id}: the rest in draft order`);
    assert.equal(t.split('\n').filter((l) => l.includes('(la mía)')).length, 1);
    assert.ok(t.startsWith(C.REF_HERRAMIENTAS.slice(0, C.REF_HERRAMIENTAS.indexOf('\n## '))), 'the intro stays on top');
    const lleno = (x) => x.split('\n').filter((l) => l.trim()).map((l) => l.replace(' (la mía)', '')).sort();
    assert.deepEqual(lleno(t), lleno(C.REF_HERRAMIENTAS), 'nothing else added or lost');
  }
  assert.equal(buildMvp({ ...grupo7(), herramienta: 'nose' })[ref], `${C.REF_HERRAMIENTAS}\n`);
  assert.equal(buildMvp({ ...grupo7(), herramienta: null })[ref], `${C.REF_HERRAMIENTAS}\n`);
});

test('B · the other three references are the draft, fixed', () => {
  for (const p of [grupo7(), VACIO_MVP, { ...grupo7(), sector: 'empresa', herramienta: 'lovable' }]) {
    const f = buildMvp(p);
    assert.equal(f['references/plantilla-spec-mvp.md'], `${C.REF_PLANTILLA_SPEC_MVP}\n`);
    assert.equal(f['references/prompts-por-capa.md'], `${C.REF_PROMPTS_POR_CAPA}\n`);
    assert.equal(f['references/reglas-de-mesa.md'], `${C.REF_REGLAS_DE_MESA}\n`);
  }
});

test('E · PRIMER_MENSAJE.md: the brief in full, the context line and the request', () => {
  const brief = BRIEF_TABLA;
  const pm = buildMvp({ ...grupo7(), brief })['PRIMER_MENSAJE.md'];
  assert.equal(
    pm,
    [
      '# Primer mensaje',
      'Pégalo en un chat con la skill instalada (o después de pegar INSTRUCCIONES_GPT.md).',
      '---',
      'Este es mi brief:',
      brief,
      'Voy a construir en Claude Code; nunca he construido software; tengo una sesión de 90 minutos. Sector: público.\nAplica la skill brief-a-mvp: dime qué entendiste, hazme máximo tres preguntas si hacen falta, y luego el recorte, la SPEC de una página, el plan de capas y los prompts.',
    ].join('\n\n') + '\n',
  );
  const otro = buildMvp({ ...grupo7(), brief, herramienta: 'nose', nivel: null, sector: 'empresa' })['PRIMER_MENSAJE.md'];
  assert.ok(otro.includes('\nTodavía no sé con qué voy a construir; tengo una sesión de 90 minutos. Sector: empresa privada.\n'));
  const blanco = buildMvp({ brief })['PRIMER_MENSAJE.md'];
  assert.ok(blanco.includes(`${brief}\n\nAplica la skill brief-a-mvp:`), 'no context line when nothing is chosen');
  assert.equal(buildMvp({ ...conBrief(), brief })['PRIMER_MENSAJE.md'], pm, 'the switch never touches the first message');
});

test('F · INSTRUCCIONES_GPT.md: the draft header, SKILL.md without frontmatter, the five references with their comment', () => {
  const f = buildMvp(grupo7());
  const cuerpoSkill = f['SKILL.md'].slice(C.SKILL_FRONTMATTER.length + 2).trimEnd();
  const esperado = [C.CABECERA_GPT, '---', cuerpoSkill, ...REFS_GPT.flatMap((r) => ['---', `<!-- references/${r} -->`, f[`references/${r}`].trimEnd()])];
  assert.equal(f['INSTRUCCIONES_GPT.md'], `${esperado.join('\n\n')}\n`);
  assert.ok(!f['INSTRUCCIONES_GPT.md'].includes('name: brief-a-mvp'));
  const paste = pasteMvp(grupo7());
  assert.equal(paste, `${C.CABECERA_GPT}\n\n${esperado.slice(2).join('\n\n')}\n`, '«Copiar todo»: the header, then everything');
});

test('G · README.md: name, files, install routes in the order of «La IA que usas hoy», use, test with the brief', () => {
  const rm = buildMvp({ ...grupo7(), brief: BRIEF_TABLA })['README.md'];
  assert.ok(rm.startsWith('# De brief a MVP · tu skill\n'));
  assert.ok(rm.includes(`\n\nFabián, ${lcFirst(README_BASE)}\n`), 'the draft opening, addressed by name');
  assert.ok(buildMvp({ ...grupo7(), nombre: '' })['README.md'].includes(`\n\n${README_BASE}\n`));
  for (const p of [`${SLUG}/SKILL.md`, ...REFS.map((r) => `${SLUG}/references/${r}`), 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md']) {
    assert.ok(rm.includes(`| \`${p}\` |`), p);
  }
  // The draft's routes, «La IA que usas hoy» first (ideación's logic), the rest under «Otras rutas».
  for (const ia of [['claude'], ['chatgpt'], ['gemini', 'copilot'], [], ['ninguna']]) {
    const r = buildMvp({ ...grupo7(), herramientas: ia })['README.md'];
    const mias = RUTAS_README.filter((x) => x.ia.some((id) => ia.includes(id)));
    const inst = section(r, 'Instalar');
    for (const x of RUTAS_README) {
      const mia = mias.includes(x);
      const donde = mia || !mias.length ? inst : section(r, 'Otras rutas');
      // Under its own heading the draft's «**Etiqueta:** texto» starts with a capital.
      const texto = x.texto[0].toLocaleUpperCase('es') + x.texto.slice(1);
      assert.ok(donde.includes(`### ${x.titulo}${mia ? ' · la usas hoy' : ''}\n\n${texto}`), `${ia}: ${x.id}`);
    }
    assert.equal(r.includes('## Otras rutas'), mias.length > 0, `${ia}: «Otras rutas» only after your own`);
  }
  assert.match(section(rm, 'Usarla'), /\n3\. .*Claude Code/);
  assert.ok(section(buildMvp({ ...grupo7(), herramienta: 'nose' })['README.md'], 'Usarla').includes('la herramienta que elijas'));
  const pr = section(rm, 'Probarla');
  for (const l of BRIEF_TABLA.split('\n')) assert.ok(pr.includes(`> ${l}`), `the brief is the test: ${l}`);
  assert.ok(pr.includes(README_PROBAR), 'and the draft check');
  const prueba = pruebaMvp(grupo7());
  for (const x of [...prueba.esperado.con, ...prueba.esperado.sin]) assert.ok(pr.includes(x), x);
  assert.ok(rm.indexOf('## Instalar') < rm.indexOf('## Usarla') && rm.indexOf('## Usarla') < rm.indexOf('## Probarla'));
});

test('pruebaMvp: the PRIMER_MENSAJE body, the five rows of PROMPT 4; the three confirmation lines', () => {
  const p = pruebaMvp({ ...grupo7(), brief: BRIEF_TABLA });
  assert.equal(p.pregunta, cuerpoPrimer(buildMvp({ ...grupo7(), brief: BRIEF_TABLA })['PRIMER_MENSAJE.md']));
  assert.ok(p.pregunta.startsWith('Este es mi brief:\n\n| Campo | Contenido |'));
  assert.deepEqual(p.esperado.sin, [
    'Vuelve a preguntar lo que el brief ya dice',
    'Propone conectar SECOP, correo y base de datos',
    'Una lista de funciones sin reglas',
    'Un prompt largo para construir todo',
    'Todo parece listo',
  ]);
  assert.deepEqual(p.esperado.con, [
    'Lee el brief, lo mapea y pregunta máximo tres cosas que falten',
    'Recorta: diez registros de ejemplo, semáforo, un solo documento; da el sustituto de cada cosa',
    'SPEC con reglas numeradas con ejemplo, diez datos ficticios y casos con resultado esperado',
    'Un prompt por capa, en bloque de código, adaptado a la herramienta, con «qué debe verse»',
    'Cierra con «Lo que aún adivinaría» y las reglas de mesa',
  ]);
  assert.ok(p.nota);
  assert.deepEqual(CONFIRM3_MVP.map(([b, r]) => b + r), [
    'Cómo se llama la skill y cuándo se activa.',
    'Qué te va a pedir antes de empezar: el brief y, si faltan, herramienta, experiencia y tiempo.',
    'Con qué sección cierra cada respuesta: «Lo que aún adivinaría».',
  ]);
});

test('zipMvp: six files under brief-a-mvp/, SKILL.md in the first folder with the frontmatter on line one', () => {
  const files = buildMvp(grupo7());
  unzipped(zipMvp(grupo7(), { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(listing.filter((n) => !n.endsWith('/')), [`${SLUG}/SKILL.md`, ...REFS.map((r) => `${SLUG}/references/${r}`)].sort());
    assert.ok(listing.every((n) => n.startsWith(`${SLUG}/`)));
    assert.equal(read(`${SLUG}/SKILL.md`), files['SKILL.md']);
    assert.ok(read(`${SLUG}/SKILL.md`).startsWith('---\nname: brief-a-mvp\n'));
    for (const r of REFS) assert.equal(read(`${SLUG}/references/${r}`), files[`references/${r}`], r);
  });
});

test('zipMvp entry order: the folder brief-a-mvp/, then brief-a-mvp/SKILL.md as the first file, front matter on byte one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cj-mvp-'));
  try {
    const file = join(dir, 'skill.zip');
    writeFileSync(file, zipMvp(grupo7(), { date: FIXED }));
    const order = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n');
    assert.equal(order[0], `${SLUG}/`, 'zip.js writes the parent folder entry first');
    assert.equal(order.find((n) => !n.endsWith('/')), `${SLUG}/SKILL.md`, 'the first file entry');
    const skill = execFileSync('unzip', ['-p', file, `${SLUG}/SKILL.md`], { encoding: 'utf8' });
    assert.ok(skill.startsWith('---\nname: brief-a-mvp\n'));
    assert.ok(!order.some((n) => /README|INSTRUCCIONES_GPT|PRIMER_MENSAJE|evals/.test(n)), 'nothing but the skill');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zipTodoMvp: brief-a-mvp-kit with README, instructions, first message and the skill folder', () => {
  const files = buildMvp(grupo7());
  const kit = 'brief-a-mvp-kit';
  unzipped(zipTodoMvp(grupo7(), { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(
      listing.filter((n) => !n.endsWith('/')),
      [`${kit}/README.md`, `${kit}/INSTRUCCIONES_GPT.md`, `${kit}/PRIMER_MENSAJE.md`, `${kit}/${SLUG}/SKILL.md`, ...REFS.map((r) => `${kit}/${SLUG}/references/${r}`)].sort(),
    );
    for (const n of ['README.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md']) assert.equal(read(`${kit}/${n}`), files[n], n);
    assert.equal(read(`${kit}/${SLUG}/SKILL.md`), files['SKILL.md']);
  });
});

test('no brief, brief inside the skill: the notice in SKILL.md, the blank in PRIMER_MENSAJE.md, downloads disabled', () => {
  assert.equal(AVISO_SIN_BRIEF, '[Pega tu brief o tu idea en el campo 01 para generar la skill.]');
  for (const p of [{ ...VACIO_MVP, incluirBrief: true }, { ...conBrief(), brief: '  \n ' }]) {
    const f = buildMvp(p);
    assert.deepEqual(Object.keys(f), ARCHIVOS_MVP);
    assert.ok(f['SKILL.md'].includes(`\n${AVISO_SIN_BRIEF}\n`));
    assert.ok(f['INSTRUCCIONES_GPT.md'].includes(`\n${AVISO_SIN_BRIEF}\n`));
    assert.ok(!f['SKILL.md'].includes(`## ${MI_BRIEF.titulo}`), 'no empty «Mi brief»');
    assert.ok(cuerpoPrimer(f['PRIMER_MENSAJE.md']).startsWith(`Este es mi brief:\n\n${HUECO_BRIEF}\n`));
    assert.equal(descargasHabilitadas(p), false);
  }
  assert.ok(!buildMvp(conBrief())['SKILL.md'].includes(AVISO_SIN_BRIEF));
  assert.equal(descargasHabilitadas(conBrief()), true);
  assert.equal(descargasHabilitadas({ incluirBrief: true, brief: 'x' }), true);
});

test('no brief, general skill (the default): a whole skill, the blank in PRIMER_MENSAJE.md, the draft test in the README, downloads ready', () => {
  assert.equal(HUECO_BRIEF, '[Pega aquí tu brief completo o tu idea en una frase]');
  for (const p of [VACIO_MVP, {}, { ...grupo7(), brief: '  \n ' }]) {
    const f = buildMvp(p);
    for (const n of ARCHIVOS_MVP) assert.ok(!f[n].includes(AVISO_SIN_BRIEF), `${n}: no notice`);
    assert.ok(cuerpoPrimer(f['PRIMER_MENSAJE.md']).startsWith(`Este es mi brief:\n\n${HUECO_BRIEF}\n\n`));
    assert.equal(pruebaMvp(p).pregunta, cuerpoPrimer(f['PRIMER_MENSAJE.md']), 'the test is the first message, blank included');
    const pr = section(f['README.md'], 'Probarla');
    assert.ok(pr.includes(`\n\n${cita(README_PROBAR_GENERAL)}\n\n`), 'the draft test, quoted');
    assert.ok(pr.includes(README_PROBAR), 'and the draft check');
    assert.equal(descargasHabilitadas(p), true);
  }
  assert.equal(descargasHabilitadas({ brief: 'x' }), true);
});

test('incluirBrief off (the default): SKILL.md and INSTRUCCIONES_GPT.md never depend on the brief; PRIMER_MENSAJE.md carries it', () => {
  const sinBrief = buildMvp({ ...grupo7(), brief: '' });
  for (const brief of [BRIEF_TABLA, BRIEF_LINEAS, FRASE, C.EJEMPLO_BRIEF]) {
    const f = buildMvp({ ...grupo7(), brief });
    assert.equal(f['SKILL.md'], sinBrief['SKILL.md'], `SKILL.md: ${brief.slice(0, 30)}`);
    assert.equal(f['INSTRUCCIONES_GPT.md'], sinBrief['INSTRUCCIONES_GPT.md'], `INSTRUCCIONES_GPT.md: ${brief.slice(0, 30)}`);
    assert.equal(pasteMvp({ ...grupo7(), brief }), pasteMvp({ ...grupo7(), brief: '' }), 'the paste');
    assert.ok(cuerpoPrimer(f['PRIMER_MENSAJE.md']).startsWith(`Este es mi brief:\n\n${normalizeMvp({ brief }).brief}\n\n`));
  }
  const f = buildMvp({ ...grupo7(), brief: BRIEF_TABLA });
  // Below the table header, no line of the brief reaches the skill; all of them reach the first message.
  for (const l of BRIEF_TABLA.split('\n').slice(2)) {
    for (const n of ['SKILL.md', 'INSTRUCCIONES_GPT.md']) assert.ok(!f[n].includes(l), `${n}: ${l}`);
    assert.ok(f['PRIMER_MENSAJE.md'].includes(l), `PRIMER_MENSAJE.md: ${l}`);
  }
  const s = f['SKILL.md'];
  assert.ok(!s.includes(`## ${MI_BRIEF.titulo}`));
  assert.equal(section(s, 'Ejemplo'), borrador('Ejemplo'), 'the draft example, Semáforo included');
  assert.equal(
    presentacionDe(s),
    `Skill de mi cerebro. Llámame Fabián. Soy de una entidad del sector público, nunca he construido software. Construyo con Claude Code (${C.CAJAS.abierta}). Tengo una sesión de 90 minutos.`,
    'the presentation describes the person, not the project',
  );
});

test('incluirBrief on: SKILL.md ends with «Mi brief», the brief quoted whole; INSTRUCCIONES_GPT.md and the paste carry it too', () => {
  assert.deepEqual(MI_BRIEF, { titulo: 'Mi brief', entrada: 'Si en el chat no te pego otro brief, parte de este.' });
  const f = buildMvp({ ...conBrief(), brief: BRIEF_TABLA });
  const s = f['SKILL.md'];
  assert.equal(section(s, MI_BRIEF.titulo), [`## ${MI_BRIEF.titulo}`, '', MI_BRIEF.entrada, '', cita(BRIEF_TABLA)].join('\n'));
  assert.ok(s.endsWith(`\n${cita(BRIEF_TABLA)}\n`), 'the last section of the skill');
  for (const l of BRIEF_TABLA.split('\n')) {
    for (const n of ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md']) assert.ok(f[n].includes(l), `${n}: ${l}`);
  }
  assert.ok(pasteMvp({ ...conBrief(), brief: BRIEF_TABLA }).includes(cita(BRIEF_TABLA)), 'the paste');
  // INSTRUCCIONES_GPT.md embeds the SKILL body: «Mi brief» once, with the skill's own heading, before the references.
  const gpt = f['INSTRUCCIONES_GPT.md'];
  assert.equal((gpt.match(/^## Mi brief$/gm) ?? []).length, 1, 'one «Mi brief» in INSTRUCCIONES_GPT.md');
  assert.ok(gpt.indexOf(`## ${MI_BRIEF.titulo}\n\n${MI_BRIEF.entrada}\n\n${cita(BRIEF_TABLA)}\n\n---\n\n<!-- references/`) > 0, 'right before the references');
  assert.equal(presentacionDe(s), presentacionDe(buildMvp(grupo7())['SKILL.md']), 'the same presentation line');
  // A brief with its own headings and fences stays inside its quote: the skill keeps its sections.
  const raro = '## Problema\nNo hay orden\n```\ncódigo\n```\n# Otro título';
  const t = buildMvp({ ...conBrief(), brief: raro })['SKILL.md'];
  assert.deepEqual(h2s(t), [...h2s(`${C.SKILL_CUERPO}\n`), `## ${MI_BRIEF.titulo}`]);
  assert.equal(outsideFences(t).filter((l) => l.startsWith('# ')).length, 1, 'one title outside the fences');
  // The references and the first message do not follow the switch.
  const off = buildMvp({ ...grupo7(), brief: BRIEF_TABLA });
  for (const n of ARCHIVOS_MVP.filter((x) => x.startsWith('references/') || x === 'PRIMER_MENSAJE.md')) assert.equal(f[n], off[n], n);
});

test('G · README.md says whether the skill carries the brief, right under the opening', () => {
  assert.deepEqual(MODO_README, {
    general: 'Esta skill es general: pégale tu brief en el chat.',
    conBrief: 'Esta skill lleva tu brief adentro; para otro proyecto, genera otra.',
  });
  const off = buildMvp(grupo7())['README.md'];
  assert.ok(off.includes(`\n\nFabián, ${lcFirst(README_BASE)}\n\n${MODO_README.general}\n\n| Archivo |`));
  assert.ok(!off.includes(MODO_README.conBrief));
  const on = buildMvp(conBrief())['README.md'];
  assert.ok(on.includes(`\n\nFabián, ${lcFirst(README_BASE)}\n\n${MODO_README.conBrief}\n\n| Archivo |`));
  assert.ok(!on.includes(MODO_README.general));
  assert.ok(buildMvp(VACIO_MVP)['README.md'].includes(`\n\n${README_BASE}\n\n${MODO_README.general}\n\n`));
});

test('normalizeMvp repairs anything read back from storage', () => {
  const p = normalizeMvp({
    incluirBrief: 'sí',
    brief: '  | A | B |  \r\n\r\n\r\n\r\n| C | D |  ',
    sector: 'marte',
    herramienta: 'cursor',
    nivel: 'algo',
    tiempo: 'mes',
    restricciones: '- No guarda fotos\n\n* Sin pagos',
    nombre: '  Fabián. ',
    tono: 7,
    herramientas: ['ninguna', 'claude', 'nope'],
    extra: true,
  });
  assert.deepEqual(p, {
    incluirBrief: false, brief: '| A | B |\n\n| C | D |', sector: null, herramienta: null, nivel: 'algo', tiempo: null,
    restricciones: ['No guarda fotos', 'Sin pagos'], nombre: 'Fabián', tono: 'directo', herramientas: ['claude'],
  });
  assert.deepEqual(Object.keys(normalizeMvp({})), Object.keys(VACIO_MVP));
  for (const junk of [null, undefined, 3, 'x', []]) assert.deepEqual(normalizeMvp(junk), normalizeMvp({}));
  assert.deepEqual(normalizeMvp(VACIO_MVP), { ...VACIO_MVP, restricciones: [], herramientas: [] });
});

test('empty and partial profiles still produce nine valid files', () => {
  const partials = [
    VACIO_MVP, {}, null,
    { brief: FRASE }, { brief: BRIEF_LINEAS, sector: 'otro' }, { nivel: 'programo' }, { herramienta: 'codex' }, { tiempo: 'semana' },
    { nombre: 'Luz', tono: 'esencial', herramientas: ['gemini', 'copilot'] },
    { sector: 'nope', herramienta: {}, nivel: [], tiempo: 4, restricciones: null, brief: 7 },
    { incluirBrief: true }, { incluirBrief: true, brief: FRASE }, { incluirBrief: true, brief: BRIEF_LINEAS, sector: 'otro', nombre: 'Luz' },
    { incluirBrief: 'true', brief: BRIEF_TABLA },
  ];
  for (const p of partials) {
    const files = buildMvp(p);
    assert.deepEqual(Object.keys(files), ARCHIVOS_MVP);
    for (const [name, text] of Object.entries(files)) {
      assert.doesNotMatch(text, BAD, `${name} for ${JSON.stringify(p)}`);
      assertNoEmptyHeading(text, `${name} for ${JSON.stringify(p)}`);
      // A period after a space, unless it starts a file extension of the draft («Descargar .txt»).
      assert.doesNotMatch(text, /[^\S\n]\.(?![.\w])/, `${name}: no space before a period for ${JSON.stringify(p)}`);
    }
    assert.doesNotMatch(pasteMvp(p), BAD);
    assert.ok(zipTodoMvp(p, { date: FIXED }).length > 100);
  }
});

test('field → file map is truthful: each field rewrites exactly the files it points to', () => {
  const changes = {
    incluirBrief: { incluirBrief: true },
    brief: { brief: BRIEF_TABLA },
    sector: { sector: 'empresa' },
    herramienta: { herramienta: 'lovable' },
    nivel: { nivel: 'programo' },
    tiempo: { tiempo: 'semana' },
    restricciones: { restricciones: ['No guarda fotos'] },
    nombre: { nombre: 'Andrea' },
    tono: { tono: 'esencial' },
    herramientas: { herramientas: ['chatgpt'] },
  };
  assert.deepEqual(CAMPOS_MVP.map((c) => c.id).sort(), Object.keys(changes).sort());
  const cambiados = (desde, cambio) => {
    const base = buildMvp(desde);
    const next = buildMvp({ ...desde, ...cambio });
    return ARCHIVOS_MVP.filter((n) => next[n] !== base[n]).sort();
  };
  const mapa = (id) => [...CAMPOS_MVP.find((c) => c.id === id).archivos].sort();
  // The switch, from the example and from blank, either way.
  for (const desde of [grupo7(), VACIO_MVP]) {
    assert.deepEqual(cambiados(desde, { incluirBrief: true }), mapa('incluirBrief'), 'incluirBrief: off → on');
    assert.deepEqual(cambiados({ ...desde, incluirBrief: true }, { incluirBrief: false }), mapa('incluirBrief'), 'incluirBrief: on → off');
  }
  // Every field with the brief inside the skill, where the brief reaches the most files.
  for (const campo of CAMPOS_MVP.filter((c) => c.id !== 'incluirBrief')) {
    assert.deepEqual(cambiados(conBrief(), changes[campo.id]), mapa(campo.id), campo.id);
  }
  // With the switch off (the default) the brief reaches the first message and the README test only;
  // every other field rewrites the same files as with it on.
  assert.deepEqual(cambiados(grupo7(), changes.brief), ['PRIMER_MENSAJE.md', 'README.md'], 'brief (off)');
  for (const campo of CAMPOS_MVP.filter((c) => !['incluirBrief', 'brief'].includes(c.id))) {
    assert.deepEqual(cambiados(grupo7(), changes[campo.id]), mapa(campo.id), `${campo.id} (off)`);
  }
});
