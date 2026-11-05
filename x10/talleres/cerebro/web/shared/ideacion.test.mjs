// node --test talleres/cerebro/web/shared/ideacion.test.mjs
// The ideation skill of the Vibe Coding course (CEREBRO-GENERAL.md, A2): fixed
// principles, personalised by who the student is, their phrase, tool and limits.
// The references are checked verbatim against the course plan (read as text only;
// the module itself imports nothing from vibecoding/).

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ARCHIVOS_IDEACION, CAMPOS_IDEACION, CONSTRUYE, EJEMPLO_IDEACION, HERRAMIENTAS_CONSTRUCCION,
  NIVELES, SECTORES, SLUG_IDEACION, TONOS_IDEACION, VACIO_IDEACION,
  buildIdeacion, normalizeIdeacion, pasteIdeacion, pruebaIdeacion, zipIdeacion, zipTodoIdeacion,
} from './ideacion.js';
import { INSTRUCCION_PEGAR, TONOS_SKILL } from './skill-general.js';
import { INSTALAR_SKILL } from './catalog.js';

const sofia = () => structuredClone(EJEMPLO_IDEACION);
const BAD = /undefined|null|NaN|\[object Object\]/;
const FIXED = new Date(2026, 10, 5, 9, 0, 0);
const SLUG = 'ideacion-de-producto';
const FRASE = 'Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador';

const PLAN_VC = readFileSync(new URL('../../../vibecoding/plan-clase-1.md', import.meta.url), 'utf8');
function after(marker) {
  const i = PLAN_VC.indexOf(marker);
  assert.ok(i >= 0, `plan marker: ${marker}`);
  return PLAN_VC.slice(i + marker.length);
}
const fencedAfter = (marker) => after(marker).match(/```[a-z]*\n([\s\S]*?)\n```/)[1];
function itemsAfter(marker) {
  const out = [];
  for (const line of after(marker).split('\n').slice(1)) {
    if (/^(- |\d+\. )/.test(line)) out.push(line);
    else if (out.length && !line.trim()) break;
    else if (out.length) break;
  }
  assert.ok(out.length, `items after ${marker}`);
  return out;
}

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
    if (!fence && line.startsWith('## ')) {
      if (on) break;
      on = line === `## ${heading}` || line.startsWith(`## ${heading} `);
    }
    if (on) out.push(line);
  }
  assert.ok(out.length, `missing section "## ${heading}"`);
  return out.join('\n');
}
function frontmatter(md) {
  const m = md.match(/^---\nname: (.+)\ndescription: (.+)\n---\n\n/);
  assert.ok(m, 'frontmatter with name and description first');
  return { name: m[1], description: JSON.parse(m[2]) };
}
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
  const dir = mkdtempSync(join(tmpdir(), 'cj-ideacion-'));
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

const PASOS_FIJOS = [
  '1. La frase. Si no la tengo, ayúdame a escribirla: «Quiero una app que ___ para ___». Si traigo una lista de funciones, primero la frase.',
  '2. Prueba del adivino. Antes de proponer nada, lista lo que tendrías que adivinar para construir eso. Hazme máximo tres preguntas, las que más cambian el producto, y espera mis respuestas.',
  '3. Las cinco piezas. Ubica la idea en el mapa: front (lo que la persona ve y toca), lógica (lo que pasa cuando toca algo), base de datos (lo que recuerda cuando cierra la pestaña), dominio (dónde vive) y repositorio (de quién es y cómo se deshace un cambio). En la V1, dominio y repositorio los resuelve la herramienta: dilo y sigue.',
  '4. La spec de una página, con los siete bloques de references/plantilla-spec.md y sus límites: 1 para quién y qué problema (un párrafo); 2 qué hace (tres a cinco acciones con verbo, «[Rol] puede [acción]»); 3 qué guarda (las cosas y sus datos); 4 quién puede hacer qué (máximo dos roles); 5 qué NO hace (mínimo tres cosas, van a «después»); 6 cómo sé que funciona (tres escenarios «Cuando [rol] hace [acción], pasa [resultado]», uno por acción principal); 7 pantallas (opcional, una frase cada una).',
  '5. El recorte. V1 = un tipo de usuario principal, tres acciones y una cosa que se guarda. Si hay más de cinco acciones o más de dos roles, lo que sobra baja al bloque 5. Correos y notificaciones, pagos, inicio de sesión con Google, «que tenga IA» y «que sea bonita» van a «después», salvo que sean la acción principal. Propón el recorte; YO DECIDO qué se queda.',
  '6. Prueba del adivino, segunda vuelta. Lee la spec como si fueras la herramienta y escribe tres cosas que aún tendrías que adivinar. Corrígelas en la spec antes de entregar.',
];
const PASO_7 = (caja) =>
  `7. La entrega, en este orden: (a) la spec completa en markdown; (b) el primer mensaje listo para pegar en la herramienta: la instrucción de cabecera de references/plantilla-spec.md y la spec debajo, todo en un solo bloque de código; (c) la caja: ${caja}; (d) las reglas de mesa y el protocolo de error de references/reglas-de-mesa.md, en cinco líneas.`;
const CAJA = {
  lovable: 'construyo en Lovable, caja cerrada: todo armado, sin instalar nada',
  'claude-code': 'construyo en Claude Code, caja abierta: yo elijo cada pieza',
  ninguna: 'recomiéndame caja cerrada (Lovable, Base44: todo armado, sin instalar nada) o abierta (Claude Code, Codex: yo elijo cada pieza), con una razón',
};
const REGLAS_FIJAS = [
  '- Pregunta en vez de adivinar; máximo tres preguntas por turno.',
  '- No agregues funciones que no pedí. Si crees que falta algo, va al bloque 5 como propuesta.',
  '- Acciones con verbo, nunca pantallas: «una página con un formulario» no dice qué pasa al enviar.',
  '- Nunca uses datos reales de personas ni de empresas en los ejemplos: inventa nombres.',
  '- Cuando iteremos la spec, un cambio por mensaje.',
];
const CIERRE = '- Termina cada entrega con una sección «Lo que aún adivinaría», aunque quede vacía.';
const SIETE = [
  '## 1. Para quién y qué problema',
  '## 2. Qué hace (3 a 5 acciones, con verbo)',
  '## 3. Qué guarda',
  '## 4. Quién puede hacer qué (máximo dos roles)',
  '## 5. Qué NO hace (mínimo tres cosas, van a "después")',
  '## 6. Cómo sé que funciona (tres escenarios)',
  '## 7. Pantallas (opcional, una frase cada una)',
];

test('constants: files in tab order, slug and the option lists of the contract', () => {
  assert.deepEqual(ARCHIVOS_IDEACION, ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'references/plantilla-spec.md', 'references/reglas-de-mesa.md']);
  assert.equal(SLUG_IDEACION, SLUG);
  assert.deepEqual(SECTORES.map((s) => [s.id, s.label, s.sistema]), [
    ['publico', 'Sector público', 'una entidad pública'],
    ['empresa', 'Empresa privada', 'una empresa'],
    ['emprendimiento', 'Emprendimiento propio', 'mi propio emprendimiento'],
    ['academia', 'Universidad o colegio', 'una institución educativa'],
    ['social', 'Organización social', 'una organización social'],
    ['otro', 'Otro', 'mi contexto'],
  ]);
  assert.deepEqual(CONSTRUYE.map((c) => [c.id, c.label]), [
    ['web', 'App web'], ['movil', 'App móvil'], ['automatizacion', 'Automatización o flujo'],
    ['servicio', 'Servicio o experiencia'], ['contenido', 'Contenido o comunidad'],
  ]);
  assert.deepEqual(HERRAMIENTAS_CONSTRUCCION.map((h) => [h.id, h.label, h.caja]), [
    ['lovable', 'Lovable', 'cerrada'], ['base44', 'Base44', 'cerrada'], ['claude-code', 'Claude Code', 'abierta'],
    ['codex', 'Codex', 'abierta'], ['nose', 'No sé aún', null],
  ]);
  assert.deepEqual(NIVELES.map((n) => [n.id, n.label, n.sistema]), [
    ['cero', 'Nunca he construido nada', 'nunca he construido software'],
    ['algo', 'Ya hice algo con IA', 'ya construí algo pequeño con IA'],
    ['programo', 'Programo', 'sé programar'],
  ]);
  assert.deepEqual(TONOS_IDEACION, TONOS_SKILL, 'same tones as the general skill');
  assert.notEqual(TONOS_IDEACION, TONOS_SKILL, 'a copy, not an import');
  assert.deepEqual({ ...VACIO_IDEACION }, { nombre: '', sector: null, construye: [], frase: '', herramienta: null, nivel: null, restricciones: [], tono: 'directo', herramientas: [] });
  assert.deepEqual({ ...sofia() }, {
    nombre: 'Sofía', sector: 'academia', construye: ['web'], frase: FRASE, herramienta: 'lovable', nivel: 'cero',
    restricciones: ['No usa datos reales de los residentes', 'No tiene pagos'], tono: 'didactico', herramientas: ['chatgpt'],
  });
  assert.deepEqual(normalizeIdeacion(sofia()), sofia(), 'the example is already normal');
});

test('buildIdeacion: the six files in tab order, deterministic, each ending with one newline', () => {
  const files = buildIdeacion(sofia());
  assert.deepEqual(Object.keys(files), ARCHIVOS_IDEACION);
  assert.deepEqual(buildIdeacion(sofia()), files);
  assert.deepEqual(buildIdeacion({ ...sofia(), construye: ['movil', 'web'] }), buildIdeacion({ ...sofia(), construye: ['web', 'movil', 'web'] }));
  assert.equal(pasteIdeacion(sofia()), pasteIdeacion(sofia()));
  assert.deepEqual(zipIdeacion(sofia(), { date: FIXED }), zipIdeacion(sofia(), { date: FIXED }));
  for (const [name, text] of Object.entries(files)) {
    assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), `${name} ending`);
    assert.doesNotMatch(text, BAD, name);
    assertNoEmptyHeading(text, name);
  }
});

test('SKILL.md: YAML name = slug and a description Claude accepts (≤ 200)', () => {
  const s = buildIdeacion(sofia())['SKILL.md'];
  const fm = frontmatter(s);
  assert.equal(fm.name, SLUG);
  assert.ok(fm.description.length <= 200, `${fm.description.length} characters`);
  assert.ok(fm.description.startsWith('Convierte una idea'));
  assert.ok(fm.description.includes('primer mensaje para construirla con IA'));
  assert.ok(fm.description.endsWith('aunque no diga «spec».'));
  assert.equal(frontmatter(buildIdeacion(VACIO_IDEACION)['SKILL.md']).description, fm.description, 'fixed');
});

test('SKILL.md: sections in order; principle, seven steps and fixed rules verbatim', () => {
  const s = buildIdeacion(sofia())['SKILL.md'];
  assert.ok(s.includes('\n\n# Ideación de producto\n\n'));
  assert.deepEqual(h2s(s), ['## Cuándo usarla', '## Principio', '## Pasos', '## Reglas que siempre aplican', '## Formato', '## Ejemplo']);
  assert.ok(section(s, 'Cuándo usarla').includes(
    'Cuando te cuente una idea («quiero una app que… para…»), cuando te pida aterrizar, recortar o explicar un proyecto, o cuando te pegue una lista de funciones. No la uses para escribir código: esta skill termina en la spec y en el primer mensaje para la herramienta.',
  ));
  assert.ok(section(s, 'Principio').includes(
    'Vibe coding no es pedir una app. Es describirla tan bien que la IA no tenga que adivinar. Todo lo que la IA tendría que adivinar es lo que falta en la spec.',
  ));
  const pasos = section(s, 'Pasos');
  for (const p of PASOS_FIJOS) assert.ok(pasos.includes(`\n${p}\n`), p.slice(0, 30));
  assert.ok(pasos.includes(`\n${PASO_7(CAJA.lovable)}\n`), 'step 7 with the fixed tool');
  assert.ok(section(s, 'Reglas que siempre aplican').includes(REGLAS_FIJAS.join('\n')));
  assert.ok(section(s, 'Formato').includes(
    '\n\nExplica cada paso y por qué, con un ejemplo cuando ayude. La spec siempre con los títulos de la plantilla, en ese orden. El primer mensaje en un bloque de código, para copiarlo entero.\n',
  ));
  assert.ok(section(s, 'Ejemplo').includes(
    'Entrada: «Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador».\nSalida: tres preguntas (¿quién registra, los residentes o solo el administrador?; ¿qué estados tiene una solicitud?; ¿hace falta ver el historial?), luego la spec de siete bloques con tres acciones, dos roles, cuatro cosas en «qué NO hace» y tres escenarios, y el primer mensaje con la cabecera.',
  ));
});

test('SKILL.md header: name, sector, level, what and where they build, and the phrase', () => {
  const s = buildIdeacion(sofia())['SKILL.md'];
  assert.ok(s.includes(
    `\n\nSkill de mi cerebro. Llámame Sofía. Soy de una institución educativa y nunca he construido software. Construyo app web con Lovable (caja cerrada: entrega todo armado y esconde las piezas).\nMi idea de partida: «${FRASE}».\n\n`,
  ));
  const head = (p) => buildIdeacion(p)['SKILL.md'].split('\n## Cuándo usarla')[0];
  assert.ok(head({ ...sofia(), herramienta: 'claude-code', construye: ['web', 'movil', 'automatizacion'] })
    .includes('Construyo app web, app móvil y automatización o flujo con Claude Code (caja abierta: muestra todo y me hace responsable).'));
  assert.ok(head({ ...sofia(), construye: ['web', 'movil'] }).includes('Construyo app web y app móvil con Lovable'));
  const anon = head({ ...sofia(), nombre: '', sector: null, nivel: 'programo' });
  assert.ok(anon.includes('Skill de mi cerebro. Sé programar. Construyo app web con Lovable'), anon);
  assert.ok(!anon.includes('Llámame'));
  assert.ok(head({ ...sofia(), nivel: null }).includes('Soy de una institución educativa. Construyo'));
  assert.ok(!head({ ...sofia(), sector: 'otro' }).includes('mi contexto'), '«Otro» drops the sector clause');
  assert.ok(head({ ...sofia(), frase: '' }).includes('Todavía no tengo la frase de mi idea: empieza por el paso 1.'));
  assert.ok(head({ ...sofia(), frase: '  «Quiero una app que ordene turnos.»  ' }).includes('Mi idea de partida: «Quiero una app que ordene turnos».'));
});

test('tool branch: a fixed tool names its box; no tool asks for a recommendation', () => {
  for (const [herramienta, caja] of [['lovable', CAJA.lovable], ['claude-code', CAJA['claude-code']], ['nose', CAJA.ninguna], [null, CAJA.ninguna]]) {
    const f = buildIdeacion({ ...sofia(), herramienta });
    assert.ok(section(f['SKILL.md'], 'Pasos').includes(PASO_7(caja)), String(herramienta));
  }
  const nose = buildIdeacion({ ...sofia(), herramienta: 'nose' });
  assert.ok(nose['SKILL.md'].includes('Construyo app web. Todavía no elegí herramienta: recomiéndame una al final.\n'));
  assert.ok(nose['PRIMER_MENSAJE.md'].includes('. Todavía no elegí herramienta.\n'));
  assert.ok(!nose['SKILL.md'].includes('(caja cerrada:'));
  const vacia = buildIdeacion({ ...sofia(), herramienta: null, construye: [] })['SKILL.md'];
  assert.ok(vacia.includes('nunca he construido software. Todavía no elegí herramienta: recomiéndame una al final.\n'));
  const base44 = buildIdeacion({ ...sofia(), herramienta: 'base44' });
  assert.ok(base44['SKILL.md'].includes('con Base44 (caja cerrada:'));
  assert.ok(base44['PRIMER_MENSAJE.md'].includes('Construiré en Base44.'));
  assert.ok(buildIdeacion({ ...sofia(), herramienta: 'codex' })['SKILL.md'].includes('construyo en Codex, caja abierta: yo elijo cada pieza'));
});

test('restricciones: bullets between the fixed rules and the closing rule; none when empty', () => {
  const reglas = section(buildIdeacion(sofia())['SKILL.md'], 'Reglas que siempre aplican');
  assert.ok(reglas.includes(`${REGLAS_FIJAS.join('\n')}\n- Límite: no usa datos reales de los residentes.\n- Límite: no tiene pagos.\n${CIERRE}`));
  const sin = section(buildIdeacion({ ...sofia(), restricciones: [] })['SKILL.md'], 'Reglas que siempre aplican');
  assert.ok(sin.includes(`${REGLAS_FIJAS.join('\n')}\n${CIERRE}`));
});

test('PRIMER_MENSAJE.md: with the phrase, and with the blank sentence when there is none', () => {
  assert.equal(buildIdeacion(sofia())['PRIMER_MENSAJE.md'], [
    '# Primer mensaje',
    '',
    'Pégalo en un chat con la skill instalada (o después de pegar INSTRUCCIONES_GPT.md).',
    '',
    '---',
    '',
    `Tengo una idea: «${FRASE}».`,
    'Contexto: una institución educativa; nunca he construido software. Construiré en Lovable.',
    'Aplica la skill de ideación de producto: hazme máximo tres preguntas, luego la spec de una página y el primer mensaje para la herramienta.',
    '',
  ].join('\n'));
  const sin = buildIdeacion({ ...sofia(), frase: '' })['PRIMER_MENSAJE.md'];
  assert.ok(sin.includes('\nTengo una idea: «Quiero una app que ___ para ___».\n'));
  const vacio = buildIdeacion(VACIO_IDEACION)['PRIMER_MENSAJE.md'];
  assert.ok(vacio.includes('\nTengo una idea: «Quiero una app que ___ para ___».\nTodavía no elegí herramienta.\nAplica la skill'), vacio);
});

test('references: template, cabecera, traps, table rules, error protocol and safety, verbatim from the course plan', () => {
  const f = buildIdeacion(sofia());
  const spec = f['references/plantilla-spec.md'];
  const plantilla = fencedAfter('### Plantilla: spec de una página');
  const cabecera = fencedAfter('### Instrucción de cabecera para el primer mensaje');
  assert.ok(spec.includes('```markdown\n' + cabecera + '\n```'), 'cabecera block');
  assert.ok(cabecera.endsWith('\n\n[pegar aquí la spec completa]'));
  assert.ok(spec.includes('```markdown\n' + plantilla + '\n```'), 'template block');
  assert.ok(spec.indexOf(cabecera) < spec.indexOf(plantilla), 'cabecera first');
  const trampas = itemsAfter('**Trampas frecuentes y qué responder:**');
  assert.equal(trampas.length, 5);
  for (const t of trampas) assert.ok(spec.includes(`\n${t}\n`) || spec.endsWith(`\n${t}\n`), t);
  assert.ok(spec.indexOf(trampas[0]) > spec.indexOf(plantilla), 'traps last');
  for (const h of SIETE) assert.ok(spec.includes(h), h);

  const mesa = f['references/reglas-de-mesa.md'];
  const reglas = itemsAfter('### Reglas de mesa');
  const protocolo = itemsAfter('### Protocolo de error');
  const noHacer = itemsAfter('### Qué no hacer');
  assert.deepEqual([reglas.length, protocolo.length, noHacer.length], [5, 4, 4]);
  assert.ok(mesa.includes(reglas.join('\n')));
  assert.ok(mesa.includes(protocolo.join('\n')));
  assert.ok(mesa.includes(noHacer.join('\n')));
  assert.equal(buildIdeacion(VACIO_IDEACION)['references/plantilla-spec.md'], spec, 'fixed');
  assert.equal(buildIdeacion(VACIO_IDEACION)['references/reglas-de-mesa.md'], mesa, 'fixed');
});

test('INSTRUCCIONES_GPT.md: A1 intro, the skill body without YAML, both references inlined, ≤ 7 500', () => {
  const f = buildIdeacion(sofia());
  const g = f['INSTRUCCIONES_GPT.md'];
  assert.ok(g.startsWith(
    '# Instrucciones · Ideación de producto\n\nPégalas en las instrucciones de un Proyecto de ChatGPT, de un GPT personalizado o de una Gem de Gemini.\n\n---\n\nGuarda esta skill y actívala sola cuando aparezca la tarea; no esperes a que la nombre.\n\n',
  ));
  assert.ok(!g.includes('name: '), 'no YAML');
  assert.ok(!g.includes('references/'), 'no folder in a pasted text');
  assert.ok(g.includes('Mi idea de partida: «'));
  const titles = ['CUÁNDO USARLA', 'PRINCIPIO', 'PASOS', 'REGLAS QUE SIEMPRE APLICAN', 'FORMATO', 'EJEMPLO', 'PLANTILLA DE LA SPEC', 'REGLAS DE MESA Y PROTOCOLO DE ERROR']
    .map((t) => g.indexOf(`\n\n${t}\n`));
  assert.ok(titles.every((i) => i > 0), `all titles: ${titles}`);
  assert.deepEqual([...titles].sort((a, b) => a - b), titles);
  assert.doesNotMatch(outsideFences(g.slice(g.indexOf('\n---\n'))).join('\n'), /^#/m, 'no # outside fences after the rule');
  for (const h of SIETE) assert.ok(g.includes(h), h);
  assert.ok(g.includes(fencedAfter('### Instrucción de cabecera para el primer mensaje')));
  for (const r of [...itemsAfter('### Reglas de mesa'), ...itemsAfter('### Protocolo de error')]) assert.ok(g.includes(r), r);
  for (const t of itemsAfter('**Trampas frecuentes y qué responder:**')) assert.ok(g.includes(t), t);
  // Size budget: the safety lines no step uses live only in reglas-de-mesa.md (uploaded with the project).
  for (const r of itemsAfter('### Qué no hacer')) assert.ok(!g.includes(r) && f['references/reglas-de-mesa.md'].includes(r), r);
  assert.ok(g.includes('\nSKILL: Ideación de producto\n'), 'the paste header asks for the name');
  for (const r of REGLAS_FIJAS) assert.ok(g.includes(r), r);
  assert.ok(g.includes('- Límite: no usa datos reales de los residentes.'));
  assert.ok(g.length <= 7500, `${g.length} characters`);
  // The longest profile still fits.
  const big = { ...sofia(), restricciones: Array.from({ length: 12 }, (_, i) => `Límite ${i + 1}`), construye: CONSTRUYE.map((c) => c.id) };
  assert.ok(buildIdeacion(big)['INSTRUCCIONES_GPT.md'].length <= 8000, 'under the 8 000 limit of ChatGPT instructions');
});

test('pasteIdeacion: the A1 header, a blank line, then the instructions below the --- rule', () => {
  const g = buildIdeacion(sofia())['INSTRUCCIONES_GPT.md'];
  const paste = pasteIdeacion(sofia());
  assert.equal(paste, `${INSTRUCCION_PEGAR}\n\n${g.slice(g.indexOf('\n---\n\n') + 6)}`);
  assert.ok(paste.startsWith(INSTRUCCION_PEGAR + '\n\nGuarda esta skill'));
});

test('README: what it does, files, install (my tools first), use, test, after building', () => {
  const rm = buildIdeacion(sofia())['README.md'];
  assert.ok(rm.startsWith('# Ideación de producto · tu skill\n'));
  assert.ok(rm.includes('Sofía, esta skill convierte una idea suelta en una spec de una página y en el primer mensaje para construirla con IA.'));
  assert.ok(buildIdeacion({ ...sofia(), nombre: '' })['README.md'].includes('\nEsta skill convierte una idea suelta'));
  for (const p of [`${SLUG}/SKILL.md`, `${SLUG}/references/plantilla-spec.md`, `${SLUG}/references/reglas-de-mesa.md`, 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md']) {
    assert.ok(rm.includes(`| \`${p}\` |`), p);
  }
  const inst = section(rm, 'Instalar');
  assert.ok(inst.indexOf('### ChatGPT') > 0 && !inst.includes('### Claude'), 'Sofía uses ChatGPT');
  assert.ok(inst.includes('· la usas hoy'));
  assert.ok(inst.includes('`plantilla-spec.md` y `reglas-de-mesa.md`'), 'upload the references to the project');
  const otras = section(rm, 'Otras rutas');
  INSTALAR_SKILL.pasos.forEach((p, i) => assert.ok(otras.includes(`${i + 1}. ${p}`), p));
  assert.ok(otras.includes(`\`${SLUG}.zip\``));
  assert.ok(otras.indexOf('### Claude') < otras.indexOf('### Gemini'));
  const usar = section(rm, 'Usarla');
  assert.match(usar, /\n1\. .+\n2\. .*`PRIMER_MENSAJE\.md`.*responde sus preguntas.*\n3\. .*Lovable/);
  assert.ok(section(buildIdeacion({ ...sofia(), herramienta: 'nose' })['README.md'], 'Usarla').includes('3. '));
  const prueba = pruebaIdeacion(sofia());
  const pr = section(rm, 'Probarla');
  assert.ok(pr.includes(`> ${FRASE}`));
  assert.ok(pr.includes(prueba.nota));
  for (const x of [...prueba.esperado.con, ...prueba.esperado.sin]) assert.ok(pr.includes(x), x);
  const despues = section(rm, 'Después de construir');
  assert.ok(despues.includes(
    'Reglas de mesa: un cambio por mensaje; describe lo que ves, no lo que crees que falla; prueba antes de pedir lo siguiente; si se rompió, vuelve a la versión anterior antes de arreglar; nunca pegues datos reales.',
  ));
  assert.ok(despues.includes('La spec es el documento al que vuelven todos los mensajes.'));
  assert.ok(rm.indexOf('## Instalar') < rm.indexOf('## Usarla'));
  assert.ok(rm.indexOf('## Usarla') < rm.indexOf('## Probarla'));
  assert.ok(rm.indexOf('## Probarla') < rm.indexOf('## Después de construir'));
});

test('pruebaIdeacion: the phrase or the blank sentence, fixed expectations', () => {
  const p = pruebaIdeacion(sofia());
  assert.equal(p.pregunta, FRASE);
  assert.equal(pruebaIdeacion(VACIO_IDEACION).pregunta, 'Quiero una app que ___ para ___');
  assert.deepEqual(p.esperado, {
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
  });
  assert.equal(p.nota, 'Hazla en un chat con la skill y en otro sin ella. Compara el proceso, no solo la respuesta.');
});

test('zipIdeacion: the skill folder with SKILL.md and both references, checked with unzip', () => {
  const files = buildIdeacion(sofia());
  unzipped(zipIdeacion(sofia(), { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(listing, [`${SLUG}/`, `${SLUG}/SKILL.md`, `${SLUG}/references/`, `${SLUG}/references/plantilla-spec.md`, `${SLUG}/references/reglas-de-mesa.md`].sort());
    assert.equal(read(`${SLUG}/SKILL.md`), files['SKILL.md']);
    assert.equal(read(`${SLUG}/references/plantilla-spec.md`), files['references/plantilla-spec.md']);
    assert.equal(read(`${SLUG}/references/reglas-de-mesa.md`), files['references/reglas-de-mesa.md']);
  });
});

test('zipTodoIdeacion: ideacion-kit with README, instructions, first message and the skill folder', () => {
  const files = buildIdeacion(sofia());
  const kit = 'ideacion-kit';
  unzipped(zipTodoIdeacion(sofia(), { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(listing, [
      `${kit}/`, `${kit}/README.md`, `${kit}/INSTRUCCIONES_GPT.md`, `${kit}/PRIMER_MENSAJE.md`,
      `${kit}/${SLUG}/`, `${kit}/${SLUG}/SKILL.md`, `${kit}/${SLUG}/references/`,
      `${kit}/${SLUG}/references/plantilla-spec.md`, `${kit}/${SLUG}/references/reglas-de-mesa.md`,
    ].sort());
    for (const n of ['README.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md']) assert.equal(read(`${kit}/${n}`), files[n], n);
    assert.equal(read(`${kit}/${SLUG}/SKILL.md`), files['SKILL.md']);
  });
});

test('normalizeIdeacion repairs anything read back from storage', () => {
  const p = normalizeIdeacion({
    nombre: '  Sofía. ',
    sector: 'marte',
    construye: ['contenido', 'nope', 'web', 'web'],
    frase: '  Quiero\nuna app  ',
    herramienta: 'cursor',
    nivel: 'algo',
    restricciones: '- No guarda fotos\n\n* Sin pagos',
    tono: 7,
    herramientas: ['ninguna', 'claude'],
    extra: true,
  });
  assert.deepEqual(p, {
    nombre: 'Sofía', sector: null, construye: ['web', 'contenido'], frase: 'Quiero una app', herramienta: null,
    nivel: 'algo', restricciones: ['No guarda fotos', 'Sin pagos'], tono: 'directo', herramientas: ['claude'],
  });
  assert.deepEqual(Object.keys(normalizeIdeacion({})), Object.keys(VACIO_IDEACION));
  for (const junk of [null, undefined, 3, 'x', []]) assert.deepEqual(normalizeIdeacion(junk), normalizeIdeacion({}));
  assert.equal(normalizeIdeacion({ restricciones: Array.from({ length: 30 }, () => 'z'.repeat(400)) }).restricciones.length, 12);
  assert.equal(normalizeIdeacion({ restricciones: ['z'.repeat(400)] }).restricciones[0].length, 200);
});

test('empty and partial profiles still produce six valid files', () => {
  const partials = [
    VACIO_IDEACION, {}, null,
    { frase: 'Quiero una app que ordene turnos para la recepción' },
    { sector: 'otro' }, { nivel: 'programo' }, { herramienta: 'codex' }, { construye: ['servicio'] },
    { nombre: 'Luz', tono: 'esencial', herramientas: ['gemini', 'copilot'] },
    { sector: 'nope', construye: [42], herramienta: {}, nivel: [], restricciones: null },
  ];
  for (const p of partials) {
    const files = buildIdeacion(p);
    assert.deepEqual(Object.keys(files), ARCHIVOS_IDEACION);
    for (const [name, text] of Object.entries(files)) {
      assert.doesNotMatch(text, BAD, `${name} for ${JSON.stringify(p)}`);
      assertNoEmptyHeading(text, `${name} for ${JSON.stringify(p)}`);
      assert.doesNotMatch(text, /[^\S\n]\.(?!\.)/, `${name}: no space before a period for ${JSON.stringify(p)}`);
    }
    assert.doesNotMatch(pasteIdeacion(p), BAD);
    assert.ok(zipTodoIdeacion(p, { date: FIXED }).length > 100);
  }
});

test('field → file map is truthful: each field rewrites exactly the files it points to', () => {
  const changes = {
    frase: { frase: 'Quiero una app que registre préstamos de equipos para mi colegio' },
    sector: { sector: 'publico' },
    construye: { construye: ['web', 'movil'] },
    herramienta: { herramienta: 'claude-code' },
    nivel: { nivel: 'programo' },
    restricciones: { restricciones: ['No guarda fotos'] },
    nombre: { nombre: 'Andrés' },
    tono: { tono: 'esencial' },
    herramientas: { herramientas: ['claude'] },
  };
  assert.deepEqual(CAMPOS_IDEACION.map((c) => c.id).sort(), Object.keys(changes).sort());
  assert.deepEqual(Object.keys(changes).sort(), Object.keys(VACIO_IDEACION).sort(), 'every profile key is a field');
  const base = buildIdeacion(sofia());
  for (const campo of CAMPOS_IDEACION) {
    assert.ok(campo.label, campo.id);
    const next = buildIdeacion({ ...sofia(), ...changes[campo.id] });
    const changed = ARCHIVOS_IDEACION.filter((n) => next[n] !== base[n]);
    assert.deepEqual(changed.sort(), [...campo.archivos].sort(), campo.id);
  }
});
