// Fact-check corrections verified by the coordinator against primary sources
// (19–20 Oct 2026). They supersede the plan's wording where the two differ.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as catalog from './catalog.js';
import { buildFiles } from './generator.js';
import { buildVault } from './vault.js';

const { PERFIL_LAURA, PERFIL_VACIO, RUTAS_CARGA, MARCO_COLOMBIANO, PRIVACIDAD, INSTALAR_SKILL } = catalog;

const PROFILES = [
  PERFIL_LAURA,
  PERFIL_VACIO,
  { ...PERFIL_LAURA, rol: 'publico', areas: ['administrativo', 'constitucional'], tareas: ['peticiones', 'terminos', 'conceptos'], herramientas: ['gemini'] },
  { ...PERFIL_LAURA, herramientas: ['ninguna'], confidencialidad: 'sensible' },
];

/** Every text the attendee can see or download, labelled by origin. */
function allTexts() {
  const out = [['catalog', JSON.stringify(catalog)]];
  for (const p of PROFILES) for (const [n, t] of Object.entries(buildFiles(p))) out.push([n, t]);
  for (const [n, t] of Object.entries(buildVault(PERFIL_LAURA, { today: '2026-10-20' }))) out.push([`vault/${n}`, t]);
  return out;
}

const T323_PRINCIPIOS = [
  'transparencia', 'responsabilidad', 'privacidad', 'no sustitución de la racionalidad humana',
  'seriedad y verificación', 'prevención de riesgos', 'igualdad y equidad', 'control humano',
  'regulación ética', 'adecuación a buenas prácticas', 'seguimiento continuo', 'idoneidad',
];

test('the landing tells the brain ZIP and the skill ZIPs apart (a lawyer uploaded the brain as a skill)', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const brain = html.slice(html.indexOf('id="bajar-zip"') - 600, html.indexOf('id="bajar-zip"'));
  const skills = html.slice(html.indexOf('id="skills-t"'), html.indexOf('id="bajar-skills"'));
  assert.ok(brain.includes('No es una skill'), 'brain card says it is not a skill');
  assert.ok(skills.includes('Estos sí son skills'), 'skills card says these are the skills');
});

test('never "sin vigencia" for the Decreto 491; the repeal is art. 5 (and 6) by the Ley 2207', () => {
  for (const [where, text] of allTexts()) {
    assert.doesNotMatch(text, /sin vigencia/i, where);
  }
  const fuentes = buildFiles(PERFIL_LAURA)['03_FUENTES.md'];
  assert.ok(fuentes.includes('La Ley 2207 de 2022 derogó los arts. 5 y 6 del Decreto 491 y restableció los términos de la Ley 1755'));
  assert.ok(fuentes.includes('art. 5 del Decreto 491 de 2020 derogado por la Ley 2207 de 2022'));
});

test('art. 14 CPACA as substituted by the Ley 1755, with the extension rule and días hábiles', () => {
  const fuentes = buildFiles(PERFIL_LAURA)['03_FUENTES.md'];
  for (const s of [
    'art. 14 de la Ley 1437 de 2011 (CPACA), sustituido por el art. 1 de la Ley 1755 de 2015',
    'las copias se entregan en los 3 días siguientes',
    'el nuevo plazo no puede exceder el doble',
    'art. 62 de la Ley 4 de 1913',
  ]) {
    assert.ok(fuentes.includes(s), s);
  }
  const ley = buildVault(PERFIL_LAURA, { today: '2026-10-20' })['20_FUENTES/Normas/Ley 1755 de 2015.md'];
  for (const s of ['dentro de los 5 días siguientes si es escrita', 'de inmediato si es verbal', 'art. 158 de la Ley 142 de 1994', 'art. 33']) {
    assert.ok(ley.includes(s), s);
  }
});

test('T-323 de 2024 lists its twelve principles wherever it lists them', () => {
  const t323 = MARCO_COLOMBIANO.find((m) => m.instrumento.includes('T-323'));
  const nota = buildVault(PERFIL_LAURA, { today: '2026-10-20' })['20_FUENTES/Sentencias/T-323 de 2024.md'];
  for (const p of T323_PRINCIPIOS) {
    assert.ok(t323.fija.includes(p), `marco: ${p}`);
    assert.ok(nota.includes(p), `vault: ${p}`);
  }
  assert.match(nota, /magistrado_ponente: "Juan Carlos Cortés González"/);
  assert.match(nota, /fecha: "2024-08-02"/);
});

test('PCSJA24-12243: who it binds and what it requires', () => {
  const acuerdo = MARCO_COLOMBIANO.find((m) => m.instrumento.includes('PCSJA24-12243'));
  for (const s of ['magistrados, jueces y empleados', 'verificación humana', 'herramienta, modelo, fecha y propósito', 'versiones gratuitas', 'retengan o reentrenen']) {
    assert.ok(acuerdo.fija.includes(s), s);
  }
});

test('tools: no new Custom GPTs on personal accounts, Gems retire in November, Gemini Notebook', () => {
  for (const [where, text] of allTexts()) {
    assert.doesNotMatch(text, /requiere plan de pago|ilimitado en Pro/, where);
    assert.doesNotMatch(text, /(?<!antes )NotebookLM/, where);
    assert.doesNotMatch(text, /un Proyecto, una Gem o un GPT/, where);
  }
  const ruta = (id) => RUTAS_CARGA.find((r) => r.id === id);
  assert.ok(ruta('claude').pasos.join(' ').includes('«+ Nuevo proyecto»'));
  assert.ok(ruta('claude').pasos.join(' ').includes('«Establecer instrucciones del proyecto»'));
  assert.ok(ruta('claude').nota.includes('5 proyectos'));
  assert.ok(ruta('chatgpt').nota.includes('ya no pueden crear GPT personalizados'));
  assert.ok(ruta('chatgpt').pasos.join(' ').includes('hasta 5 archivos'));
  assert.ok(ruta('gemini').pasos.join(' ').includes('Conocimiento → Agregar archivos'));
  assert.ok(ruta('gemini').nota.includes('noviembre de 2026') && ruta('gemini').nota.includes('automáticamente'));
  assert.ok(ruta('chatgpt').nota.includes('11 de diciembre de 2026'));
  const readme = buildFiles(PERFIL_LAURA)['README.md'];
  assert.ok(readme.includes('Gemini Notebook (antes NotebookLM)'));
  for (const [where, text] of allTexts()) assert.doesNotMatch(text, /\{\{VERIFICAR_GEMS_2026\}\}/, where);
});

// Frontier models search the web with citations on every Claude and ChatGPT plan
// (support.claude.com 10684626, help.openai.com 9237897, checked 20 Oct 2026), and
// GPT-6 Astra answered the old reserve question right (verified in the relatoría).
test('no claim that models never search or almost always invent a citation', () => {
  for (const [where, text] of allTexts()) {
    assert.doesNotMatch(text, /no busca nada|biblioteca cerró|casi siempre producen al menos un dato inventado|no tengo la fuente exacta/i, where);
  }
  assert.ok(!('PREGUNTA_RESERVA' in catalog) && !('COMPARACION_PRUEBA' in catalog), 'the trap questions are gone');
});

// Data use per plan, from the official privacy pages (checked 20 Oct 2026).
test('privacy: what each account does with your data and the exact switch', () => {
  const by = (id) => PRIVACIDAD.find((x) => x.id === id);
  assert.deepEqual(PRIVACIDAD.map((x) => x.id), ['claude', 'chatgpt', 'gemini', 'empresa']);
  assert.ok(by('claude').apagar.includes('Configuración → Privacidad → «Help improve our AI models»'));
  assert.ok(by('claude').ojo.includes('5 años'));
  assert.ok(by('claude').sinRastro.includes('incógnito'));
  assert.ok(by('chatgpt').apagar.includes('Configuración → Controles de datos → «Improve the model for everyone»'));
  assert.ok(by('chatgpt').sinRastro.includes('temporal'));
  assert.ok(by('gemini').apagar.includes('myactivity.google.com/product/gemini') && by('gemini').apagar.includes('«Keep Activity»'));
  assert.ok(by('gemini').ojo.includes('3 años'));
  assert.ok(by('empresa').entrena.startsWith('No'));
  for (const x of PRIVACIDAD) {
    assert.match(x.fuente, /^https:\/\/(privacy\.claude\.com|help\.openai\.com|support\.google\.com)\//, x.id);
    assert.ok(x.label && x.entrena && x.apagar && x.ojo, x.id);
  }
  assert.ok(catalog.PRIVACIDAD_VERIFICADA.includes('20 de octubre de 2026'));
});

test('skills install path is the one on support.claude.com (12512180)', () => {
  const pasos = INSTALAR_SKILL.pasos.join(' ');
  for (const s of ['Configuración → Capacidades', '«Code execution and file creation»', 'Skills', '«+»', '«Upload a skill»', 'sin descomprimirlo']) {
    assert.ok(pasos.includes(s), s);
  }
  assert.ok(INSTALAR_SKILL.nota.includes('también el gratuito'));
});

test('vault README: Obsidian free for commercial use, Templater warning, Filesystem extension first', () => {
  const r = buildVault(PERFIL_LAURA, { today: '2026-10-20' })['README.md'];
  for (const s of [
    'también para uso comercial',
    'Templater puede ejecutar JavaScript y comandos del sistema',
    'lista oficial de complementos comunitarios',
    'Configuración → Extensiones → Filesystem',
    '@modelcontextprotocol/server-filesystem@1.0.0',
    'Node 24',
  ]) {
    assert.ok(r.includes(s), s);
  }
  assert.ok(r.indexOf('Filesystem') < r.indexOf('server-filesystem'), 'the extension is the recommended route');
});
