// node --test talleres/cerebro/web/shared/skill-general.test.mjs
// The general skill builder (CEREBRO-GENERAL.md, A1): one profile → SKILL.md for
// Claude (Agent Skills format), INSTRUCCIONES_GPT.md for ChatGPT / Gemini / any
// chat, and a README to install, test and maintain it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ARCHIVOS_SKILL, CAMPOS_SKILL, EJEMPLO_SKILL, INSTRUCCION_PEGAR, TONOS_SKILL, VACIO_SKILL,
  buildSkillGeneral, descripcionSkill, normalizeSkill, pasteSkillGeneral, pruebaSkillGeneral,
  slugSkill, zipSkillGeneral, zipTodoSkillGeneral,
} from './skill-general.js';
import { INSTALAR_SKILL, RUTAS_CARGA } from './catalog.js';

const daniel = () => structuredClone(EJEMPLO_SKILL);
const BAD = /undefined|null|NaN|\[object Object\]/;
const FIXED = new Date(2026, 10, 5, 9, 0, 0);
const SLUG = 'resumen-de-reunion';

const HEADER =
  'Guarda estas instrucciones como una skill para este chat. Cuando termines de leerlas, confírmame en tres líneas: (1) cómo se llama la skill y cuándo se activa, (2) qué me vas a pedir antes de empezar, (3) con qué sección vas a cerrar cada respuesta. No hagas nada más todavía.';

/** Lines outside code fences. */
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

/** The text of "## heading" up to the next h2 outside fences. */
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

/** YAML frontmatter → { name, description } (double-quoted scalars are JSON strings). */
function frontmatter(md) {
  const m = md.match(/^---\nname: (.+)\ndescription: (.+)\n---\n\n/);
  assert.ok(m, 'frontmatter with name and description first');
  return { name: m[1], description: JSON.parse(m[2]) };
}

/** Every heading (outside fences) is followed by content before the next heading. */
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
  const dir = mkdtempSync(join(tmpdir(), 'cj-skill-general-'));
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

test('constants: file tab order, the three tones, the empty profile', () => {
  assert.deepEqual(ARCHIVOS_SKILL, ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md']);
  assert.deepEqual(TONOS_SKILL, [
    { id: 'directo', label: 'Claro y directo', instruccion: 'Responde claro y directo, en párrafos cortos' },
    { id: 'didactico', label: 'Didáctico, explícame', instruccion: 'Explica cada paso y por qué, con un ejemplo cuando ayude' },
    { id: 'esencial', label: 'Solo lo esencial', instruccion: 'Entrega solo el resultado, en listas, sin preámbulos' },
  ]);
  assert.deepEqual({ ...VACIO_SKILL }, {
    nombre: '', quienSoy: '', skillNombre: '', queHace: '', cuando: [], entradas: [], pasos: [], reglas: [],
    formato: '', ejemploEntrada: '', ejemploSalida: '', verifico: [], material: '', tono: 'directo', herramientas: [],
  });
  assert.equal(INSTRUCCION_PEGAR, HEADER);
});

test('EJEMPLO_SKILL is Daniel, and already normal', () => {
  const d = daniel();
  assert.equal(d.nombre, 'Daniel');
  assert.equal(d.skillNombre, 'Resumen de reunión');
  assert.equal(d.quienSoy, 'coordinador de proyectos en una ONG de educación');
  assert.equal(d.cuando.length, 3);
  assert.equal(d.pasos.length, 5);
  assert.equal(d.reglas.length, 4);
  assert.equal(d.verifico.length, 3);
  assert.equal(d.material, '');
  assert.equal(d.tono, 'directo');
  assert.deepEqual([...d.herramientas].sort(), ['chatgpt', 'claude']);
  // The example obeys its own rules: no assumed date, a proposal is not a decision.
  assert.equal(d.ejemploSalida, 'Decisiones: ninguna; mover el taller al 20 quedó como propuesta de Ana. Compromisos: Luis confirma el salón · el viernes. Pendientes: avisar a los colegios, sin responsable. Para revisar: ¿se aprobó mover el taller al 20?; ¿de qué mes es el 20 y qué fecha es el viernes?');
  assert.ok(!d.ejemploSalida.includes('noviembre'), 'no month the notes do not give');
  assert.deepEqual(normalizeSkill(d), d);
  assert.deepEqual(normalizeSkill({}), { ...VACIO_SKILL, cuando: [], entradas: [], pasos: [], reglas: [], verifico: [], herramientas: [] });
});

test('buildSkillGeneral: the three files in tab order; material adds references/material.md', () => {
  const files = buildSkillGeneral(daniel());
  assert.deepEqual(Object.keys(files), ARCHIVOS_SKILL);
  for (const [name, text] of Object.entries(files)) {
    assert.ok(text.length > 300, `${name} too short`);
    assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), `${name} ending`);
    assert.doesNotMatch(text, BAD, name);
  }
  const con = buildSkillGeneral({ ...daniel(), material: 'Guía de actas: siempre en tercera persona.' });
  assert.deepEqual(Object.keys(con), [...ARCHIVOS_SKILL, 'references/material.md']);
  assert.ok(con['references/material.md'].includes('Guía de actas: siempre en tercera persona.'));
});

test('same profile gives byte-identical files, ZIPs and paste; tool click order does not matter', () => {
  assert.deepEqual(buildSkillGeneral(daniel()), buildSkillGeneral(daniel()));
  assert.deepEqual(
    buildSkillGeneral({ ...daniel(), herramientas: ['chatgpt', 'claude'] }),
    buildSkillGeneral({ ...daniel(), herramientas: ['claude', 'chatgpt', 'claude'] }),
  );
  assert.equal(pasteSkillGeneral(daniel()), pasteSkillGeneral(daniel()));
  assert.deepEqual(zipSkillGeneral(daniel(), { date: FIXED }), zipSkillGeneral(daniel(), { date: FIXED }));
  assert.deepEqual(zipTodoSkillGeneral(daniel(), { date: FIXED }), zipTodoSkillGeneral(daniel(), { date: FIXED }));
});

test('slugSkill: lowercase ASCII with hyphens, at most 40 characters, mi-skill as fallback', () => {
  assert.equal(slugSkill(daniel()), SLUG);
  assert.equal(slugSkill({ skillNombre: 'Ñandú & Acción!!' }), 'nandu-accion');
  assert.equal(slugSkill({ skillNombre: '¿Qué dice el contrato?' }), 'que-dice-el-contrato');
  assert.equal(slugSkill({ skillNombre: '   ' }), 'mi-skill');
  assert.equal(slugSkill({ skillNombre: '!!!' }), 'mi-skill');
  assert.equal(slugSkill({}), 'mi-skill');
  const long = slugSkill({ skillNombre: 'Revisión de propuestas de cooperación internacional para el comité' });
  assert.ok(long.length <= 40, long);
  assert.match(long, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test('descripcionSkill: what it does plus the first three triggers; ≤ 200, with … only when cut', () => {
  const short = descripcionSkill({
    queHace: 'Resume actas',
    cuando: ['Te paso un acta', 'Digo «resume»', 'Pego notas.', 'Cuarta frase que no entra'],
  });
  assert.equal(short, 'Resume actas. Úsala cuando te paso un acta, digo «resume» o pego notas, aunque no lo pida con esas palabras.');
  assert.ok(!short.includes('…'));

  const d = descripcionSkill(daniel());
  assert.ok(d.length <= 200, `example is ${d.length}`);
  assert.ok(d.startsWith(EJEMPLO_SKILL.queHace + ' Úsala cuando te pego notas'), d);
  assert.equal(d, 'Convierte notas de reunión en decisiones, compromisos con responsable y fecha, y pendientes. Úsala cuando te pego notas o la transcripción de una reunión, aunque no lo pida con esas palabras.');

  const big = { ...daniel(), queHace: 'Prepara '.concat('un informe muy detallado de cada reunión del comité '.repeat(8)).trim() };
  const full = `${normalizeSkill(big).queHace}`;
  const b = descripcionSkill(big);
  assert.ok(b.length <= 200, `long is ${b.length}`);
  assert.ok(b.endsWith('…'));
  const kept = b.slice(0, -1);
  assert.ok(full.startsWith(kept), 'a prefix of the full text');
  assert.match(full.slice(kept.length), /^[\s,.;:]/, 'cut at a word boundary');
  assert.doesNotMatch(b, /\n/);

  // Graceful without triggers or without what it does.
  assert.equal(descripcionSkill({ queHace: 'Resume actas.' }), 'Resume actas. Úsala siempre que aparezca esta tarea, aunque no la nombre.');
  assert.ok(descripcionSkill({}).length > 20);
  assert.doesNotMatch(descripcionSkill({}), BAD);
});

test('descripcionSkill: three triggers, then two, then one, and only then cut with …', () => {
  const cierre = ', aunque no lo pida con esas palabras.';
  const cuando = ['Te paso el acta de la reunión del comité', 'Digo «resume la reunión» o «saca acuerdos»', 'Te pego la transcripción de una llamada'];
  const [a, b, c] = cuando.map((x) => x[0].toLowerCase() + x.slice(1));
  const frase = (que, n) => `${que} Úsala cuando ${[`${a}`, `${a} o ${b}`, `${a}, ${b} o ${c}`][n - 1]}${cierre}`;
  const que = (len) => `${'Resume reuniones y acuerdos '.repeat(10).slice(0, len - 1).trimEnd()}.`;
  const at = (n, len) => ({ q: que(len), full: frase(que(len), n) });

  const tres = at(3, 20);
  assert.ok(tres.full.length <= 200, 'precondition: three fit');
  assert.equal(descripcionSkill({ queHace: tres.q, cuando }), tres.full);

  const dos = at(2, 50);
  assert.ok(frase(dos.q, 3).length > 200 && dos.full.length <= 200, 'precondition: only two fit');
  assert.equal(descripcionSkill({ queHace: dos.q, cuando }), dos.full);

  const uno = at(1, 90);
  assert.ok(frase(uno.q, 2).length > 200 && uno.full.length <= 200, 'precondition: only one fits');
  assert.equal(descripcionSkill({ queHace: uno.q, cuando }), uno.full);

  const ninguno = at(1, 150);
  assert.ok(ninguno.full.length > 200, 'precondition: not even one fits');
  const cut = descripcionSkill({ queHace: ninguno.q, cuando });
  assert.ok(cut.length <= 200 && cut.endsWith('…'), cut);
  assert.ok(ninguno.full.startsWith(cut.slice(0, -1)), 'a cut of the one-trigger sentence');

  // Daniel: two triggers do not fit, one does: the full sentence, no cut.
  const d = descripcionSkill(daniel());
  const unoDaniel = `${EJEMPLO_SKILL.queHace} Úsala cuando ${EJEMPLO_SKILL.cuando[0].toLowerCase()}${cierre}`;
  const dosDaniel = `${EJEMPLO_SKILL.queHace} Úsala cuando ${EJEMPLO_SKILL.cuando[0].toLowerCase()} o ${EJEMPLO_SKILL.cuando[1].toLowerCase()}${cierre}`;
  assert.ok(dosDaniel.length > 200, 'precondition: two triggers do not fit');
  assert.equal(d, unoDaniel);
  assert.ok(d.length <= 200 && d.endsWith('palabras.'), d);
});

test('SKILL.md: YAML first (name = slug, description = JSON string), then every section in order', () => {
  const s = buildSkillGeneral(daniel())['SKILL.md'];
  const fm = frontmatter(s);
  assert.equal(fm.name, SLUG);
  assert.equal(fm.description, descripcionSkill(daniel()));
  assert.ok(s.includes('\n\n# Resumen de reunión\n\nSkill de mi cerebro. Soy coordinador de proyectos en una ONG de educación. Llámame Daniel.\n\n'));
  assert.deepEqual(h2s(s), [
    '## Cuándo usarla',
    '## Qué te entrego',
    '## Pasos',
    '## Reglas que siempre aplican',
    '## Formato de salida',
    '## Ejemplo',
    '## Cómo sé que quedó bien',
  ]);
  const cuando = section(s, 'Cuándo usarla');
  for (const c of EJEMPLO_SKILL.cuando) assert.ok(cuando.includes(`\n- ${c}.`), c);
  assert.ok(cuando.includes('Si dudas, pregúntame si quieres que la use.'));
  const entrego = section(s, 'Qué te entrego');
  for (const e of EJEMPLO_SKILL.entradas) assert.ok(entrego.includes(`\n- ${e}.`), e);
  assert.ok(entrego.includes('Si falta algo de esta lista, pídemelo antes de empezar.'));
  const pasos = section(s, 'Pasos');
  EJEMPLO_SKILL.pasos.forEach((p, i) => assert.ok(pasos.includes(`\n${i + 1}. ${p}.`), p));
  const reglas = section(s, 'Reglas que siempre aplican');
  for (const r of EJEMPLO_SKILL.reglas) assert.ok(reglas.includes(`\n- ${r}.`), r);
  const fijas = [
    '- No inventes datos que no te di; si falta un dato, dilo en lugar de completarlo.',
    '- Termina con una sección «Para revisar» con lo que debo confirmar antes de usar la salida.',
  ];
  assert.ok(reglas.trimEnd().endsWith(fijas.join('\n')), 'the fixed rules close the section');
  assert.ok(reglas.indexOf(EJEMPLO_SKILL.reglas[3]) < reglas.indexOf(fijas[0]), 'my rules first');
  const formato = section(s, 'Formato de salida');
  assert.ok(formato.includes(EJEMPLO_SKILL.formato), 'template verbatim');
  assert.ok(formato.includes('```markdown\n# Reunión: {nombre} · {fecha}\n'), 'a template with headings goes in a fence');
  assert.ok(formato.trimEnd().endsWith('Responde claro y directo, en párrafos cortos.'));
  const ej = section(s, 'Ejemplo');
  assert.ok(ej.includes(`\n\nEntrada: ${EJEMPLO_SKILL.ejemploEntrada}\nSalida: ${EJEMPLO_SKILL.ejemploSalida}`));
  const verif = section(s, 'Cómo sé que quedó bien');
  for (const v of EJEMPLO_SKILL.verifico) assert.ok(verif.includes(`\n- ${v}.`), v);
  assert.ok(!s.includes('references/material.md'), 'no material, no reference');
  assertNoEmptyHeading(s, 'SKILL.md');
});

test('tone: each option writes its instruction in SKILL.md and INSTRUCCIONES_GPT.md; unknown → directo', () => {
  for (const t of TONOS_SKILL) {
    const f = buildSkillGeneral({ ...daniel(), tono: t.id });
    assert.ok(f['SKILL.md'].includes(`\n${t.instruccion}.\n`), `${t.id} SKILL`);
    assert.ok(f['INSTRUCCIONES_GPT.md'].includes(`\n${t.instruccion}.\n`), `${t.id} GPT`);
    for (const o of TONOS_SKILL.filter((x) => x.id !== t.id)) assert.ok(!f['SKILL.md'].includes(o.instruccion), `${t.id} leaks ${o.id}`);
  }
  assert.equal(normalizeSkill({ tono: 'formal' }).tono, 'directo');
});

test('empty lists write a bracketed placeholder, never an empty heading', () => {
  const vacio = buildSkillGeneral(VACIO_SKILL);
  for (const name of ARCHIVOS_SKILL) {
    assertNoEmptyHeading(vacio[name], name);
    assert.doesNotMatch(vacio[name], BAD, name);
  }
  const s = vacio['SKILL.md'];
  assert.equal(frontmatter(s).name, 'mi-skill');
  assert.ok(s.includes('\n# Mi skill\n'));
  for (const h of ['Cuándo usarla', 'Qué te entrego', 'Pasos', 'Reglas que siempre aplican', 'Formato de salida', 'Ejemplo', 'Cómo sé que quedó bien']) {
    assert.match(section(s, h), /\n\[[^\]\n]+\]/, `${h}: bracketed placeholder`);
  }
  assert.doesNotMatch(s, /^- *$/m, 'no empty bullet');
  assert.doesNotMatch(s, /^\d+\. *$/m, 'no empty step');
  assert.ok(!s.includes('Soy .'), 'no empty "who I am"');
  assert.ok(!s.includes('Llámame'));
  // Only one list empty: its placeholder, the rest untouched.
  const sinPasos = buildSkillGeneral({ ...daniel(), pasos: [] })['SKILL.md'];
  assert.match(section(sinPasos, 'Pasos'), /## Pasos\n\n\[[^\]]+\]\n?$/);
  assert.ok(!section(sinPasos, 'Cuándo usarla').includes('['));
  const gpt = vacio['INSTRUCCIONES_GPT.md'];
  for (const t of ['CUÁNDO USARLA', 'QUÉ TE ENTREGO', 'PASOS', 'REGLAS QUE SIEMPRE APLICAN', 'FORMATO DE SALIDA', 'EJEMPLO']) {
    assert.match(gpt, new RegExp(`\\n${t}\\n\\S`), `${t} has content`);
  }
});

test('material: references/material.md and the read-it line in SKILL.md and INSTRUCCIONES_GPT.md', () => {
  const material = 'Glosario del comité:\n\n- POA: plan operativo anual.\n- CTI: comité técnico.';
  const f = buildSkillGeneral({ ...daniel(), material });
  assert.ok(f['references/material.md'].startsWith('# '));
  assert.ok(f['references/material.md'].includes(material));
  assert.ok(f['SKILL.md'].includes('Llámame Daniel. Antes de empezar, lee references/material.md.\n'));
  assert.ok(f['INSTRUCCIONES_GPT.md'].trimEnd().endsWith(
    'Si te pido otra cosa, no apliques esta skill. Material de referencia: está en el archivo material.md de este Proyecto; léelo antes del paso 1.',
  ));
  assert.ok(f['README.md'].includes(`\`${SLUG}/references/material.md\``));
  const sin = buildSkillGeneral(daniel());
  assert.ok(!('references/material.md' in sin));
  assert.ok(!sin['INSTRUCCIONES_GPT.md'].includes('material.md'));
  assert.ok(!sin['README.md'].includes('material.md'));
  assert.ok(sin['INSTRUCCIONES_GPT.md'].trimEnd().endsWith('Si te pido otra cosa, no apliques esta skill.'));
});

test('INSTRUCCIONES_GPT.md: plain instructions, no YAML, sections in order, ≤ 7 000 characters', () => {
  const g = buildSkillGeneral(daniel())['INSTRUCCIONES_GPT.md'];
  assert.ok(g.startsWith(
    '# Instrucciones · Resumen de reunión\n\nPégalas en las instrucciones de un Proyecto de ChatGPT, de un GPT personalizado o de una Gem de Gemini.\n\n---\n\nGuarda esta skill y actívala sola cuando aparezca la tarea; no esperes a que la nombre.\n\n',
  ));
  assert.ok(!g.includes('name: '), 'no YAML');
  assert.ok(g.includes(`\nSKILL: Resumen de reunión\nQUÉ HACE: ${EJEMPLO_SKILL.queHace}\nQUIÉN SOY: coordinador de proyectos en una ONG de educación. Llámame Daniel.\n`));
  const order = ['\nCUÁNDO USARLA\n- ', '\nQUÉ TE ENTREGO\n- ', '\nPASOS\n1. ', '\nREGLAS QUE SIEMPRE APLICAN\n- ', '\nFORMATO DE SALIDA\n', '\nEJEMPLO\nEntrada: '].map((t) => g.indexOf(t));
  assert.ok(order.every((i) => i > 0), `all sections: ${order}`);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(g.includes('\nSi falta algo, pídemelo antes de empezar.\n'));
  assert.ok(g.includes('\n- No inventes datos que no te di; si falta un dato, dilo.\n- Termina con «Para revisar»: lo que debo confirmar antes de usar la salida.\n'));
  assert.ok(g.includes(EJEMPLO_SKILL.formato));
  assert.ok(g.length <= 7000, `${g.length} characters`);
});

test('pasteSkillGeneral: the header, a blank line, then the instructions below the --- rule', () => {
  const g = buildSkillGeneral(daniel())['INSTRUCCIONES_GPT.md'];
  const paste = pasteSkillGeneral(daniel());
  assert.ok(paste.startsWith(HEADER + '\n\nGuarda esta skill y actívala sola'));
  assert.equal(paste, `${HEADER}\n\n${g.slice(g.indexOf('\n---\n\n') + 6)}`);
  assert.ok(!paste.includes('# Instrucciones'), 'the title stays out of the chat');
  // With material, the chat gets the material too (there is no Project file to read).
  const material = 'Glosario: POA es el plan operativo anual.';
  const conMaterial = pasteSkillGeneral({ ...daniel(), material });
  assert.ok(conMaterial.startsWith(HEADER));
  assert.ok(conMaterial.trimEnd().endsWith(`===== material.md =====\n${material}`));
});

test('README: what a skill is, the files, install routes (my tools first), test and maintain', () => {
  const rm = buildSkillGeneral(daniel())['README.md'];
  assert.ok(rm.startsWith('# Resumen de reunión · tu skill\n'));
  assert.ok(rm.includes('Una skill es un procedimiento escrito que la IA aplica sola cuando aparece la tarea. Esta carpeta trae la misma skill en dos formatos.'));
  assert.ok(rm.includes(`| \`${SLUG}/SKILL.md\` |`));
  assert.ok(rm.includes('| `INSTRUCCIONES_GPT.md` |'));
  assertNoEmptyHeading(rm, 'README');

  // Daniel uses ChatGPT and Claude: those first, the rest under «Otras rutas».
  const inst = section(rm, 'Instalar');
  assert.ok(inst.indexOf('### Claude') > 0 && inst.indexOf('### Claude') < inst.indexOf('### ChatGPT'));
  assert.ok(inst.includes('· la usas hoy'));
  assert.ok(!inst.includes('### Gemini'));
  const otras = section(rm, 'Otras rutas');
  assert.ok(otras.indexOf('### Gemini') < otras.indexOf('### Copilot'));
  assert.ok(otras.indexOf('### Copilot') < otras.indexOf('### Cualquier IA'));
  assert.ok(!otras.includes('la usas hoy'));

  INSTALAR_SKILL.pasos.forEach((p, i) => assert.ok(inst.includes(`${i + 1}. ${p}`), p));
  assert.ok(inst.includes(INSTALAR_SKILL.nota));
  assert.ok(inst.includes(`\`${SLUG}.zip\``));
  assert.ok(inst.includes('pega `INSTRUCCIONES_GPT.md`'));
  assert.ok(inst.includes('{{VERIFICAR_MENUS_CHATGPT}}'));
  assert.ok(inst.includes(RUTAS_CARGA.find((r) => r.id === 'chatgpt').nota), 'the verified ChatGPT caveat');
  assert.ok(otras.includes('Gems → Nueva Gem'));
  assert.ok(otras.includes('{{VERIFICAR_MENUS_GEMINI}}'));
  assert.ok(otras.includes('Pega `INSTRUCCIONES_GPT.md` al inicio del chat; Copilot no guarda skills en cuentas personales.'));
  assert.ok(otras.includes('{{VERIFICAR_COPILOT}}'));
  assert.ok(otras.includes('Chat nuevo → pega `INSTRUCCIONES_GPT.md` → envía. Te confirma en tres líneas (ver abajo).'));
  assert.ok(otras.includes(`> ${HEADER}`));

  const gem = buildSkillGeneral({ ...daniel(), herramientas: ['gemini'] })['README.md'];
  assert.ok(section(gem, 'Instalar').includes('### Gemini'));
  assert.ok(gem.indexOf('### Gemini') < gem.indexOf('### Claude'));
  for (const h of [[], ['ninguna']]) {
    const r = buildSkillGeneral({ ...daniel(), herramientas: h })['README.md'];
    assert.ok(!r.includes('## Otras rutas'), `no split for ${JSON.stringify(h)}`);
    const all = section(r, 'Instalar');
    for (const t of ['### Claude', '### ChatGPT', '### Gemini', '### Copilot', '### Cualquier IA']) assert.ok(all.includes(t), t);
    assert.ok(!r.includes('la usas hoy'));
  }

  const prueba = pruebaSkillGeneral(daniel());
  const pr = section(rm, 'Probarla');
  assert.ok(pr.includes(prueba.nota));
  assert.ok(pr.includes(`> ${prueba.pregunta}`));
  for (const x of [...prueba.esperado.con, ...prueba.esperado.sin]) assert.ok(pr.includes(x), x);
  for (const v of EJEMPLO_SKILL.verifico) assert.ok(pr.includes(v), v);

  const mant = section(rm, 'Mantenerla');
  assert.ok(mant.includes('Cuando la IA se equivoque, no corrijas el chat: corrige la skill (un paso, una regla o el formato) y vuelve a subirla.'));
  assert.ok(mant.includes(`> ${descripcionSkill(daniel())}`), 'the description that triggers it');
});

test('pruebaSkillGeneral: the example entry as the question, the fallback, fixed expectations', () => {
  const p = pruebaSkillGeneral(daniel());
  assert.equal(p.pregunta, EJEMPLO_SKILL.ejemploEntrada);
  assert.equal(pruebaSkillGeneral({ ...daniel(), ejemploEntrada: '' }).pregunta, 'Pega aquí una entrada real de la tarea: lo mismo que le darías a un colega');
  assert.deepEqual(p.esperado, {
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
  });
  assert.equal(p.nota, 'Hazla en un chat con la skill y en otro sin ella. Compara el proceso, no solo la respuesta.');
});

test('zipSkillGeneral: the root is <slug>/ with SKILL.md (+ references), checked with unzip', () => {
  const files = buildSkillGeneral(daniel());
  unzipped(zipSkillGeneral(daniel(), { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(listing, [`${SLUG}/`, `${SLUG}/SKILL.md`]);
    assert.equal(read(`${SLUG}/SKILL.md`), files['SKILL.md']);
  });
  const con = { ...daniel(), material: 'Glosario: POA es el plan operativo anual.' };
  unzipped(zipSkillGeneral(con, { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(listing, [`${SLUG}/`, `${SLUG}/SKILL.md`, `${SLUG}/references/`, `${SLUG}/references/material.md`].sort());
    assert.equal(read(`${SLUG}/references/material.md`), buildSkillGeneral(con)['references/material.md']);
  });
});

test('zipTodoSkillGeneral: <slug>-kit with README, INSTRUCCIONES_GPT and the skill folder', () => {
  const files = buildSkillGeneral(daniel());
  const kit = `${SLUG}-kit`;
  unzipped(zipTodoSkillGeneral(daniel(), { date: FIXED }), ({ listing, read }) => {
    assert.deepEqual(listing, [`${kit}/`, `${kit}/README.md`, `${kit}/INSTRUCCIONES_GPT.md`, `${kit}/${SLUG}/`, `${kit}/${SLUG}/SKILL.md`].sort());
    for (const n of ARCHIVOS_SKILL) assert.equal(read(n === 'SKILL.md' ? `${kit}/${SLUG}/SKILL.md` : `${kit}/${n}`), files[n], n);
  });
  unzipped(zipTodoSkillGeneral({ ...daniel(), material: 'x y z' }, { date: FIXED }), ({ listing }) => {
    assert.ok(listing.includes(`${kit}/${SLUG}/references/material.md`));
  });
});

test('normalizeSkill repairs anything read back from storage', () => {
  const p = normalizeSkill({
    nombre: '  Ana María. ',
    quienSoy: ' docente\nde colegio ',
    skillNombre: 'Plan   de clase',
    cuando: '- Te pido un plan\n\n2. Digo «planea»\n   \n* Te paso un tema',
    entradas: ['  ', 7, null, 'El tema'],
    pasos: Array.from({ length: 20 }, (_, i) => `Paso ${i + 1}`),
    reglas: ['x'.repeat(500)],
    formato: 'Línea 1  \r\n\r\n\r\n\r\nLínea 2\n',
    tono: 'nope',
    herramientas: ['gemini', 'ninguna', 'claude', 'gemini', 'otra'],
    extra: 'drop me',
  });
  assert.equal(p.nombre, 'Ana María');
  assert.equal(p.quienSoy, 'docente de colegio');
  assert.equal(p.skillNombre, 'Plan de clase');
  assert.deepEqual(p.cuando, ['Te pido un plan', 'Digo «planea»', 'Te paso un tema']);
  assert.deepEqual(p.entradas, ['El tema']);
  assert.equal(p.pasos.length, 12);
  assert.equal(p.reglas[0].length, 200);
  assert.equal(p.formato, 'Línea 1\n\nLínea 2');
  assert.equal(p.tono, 'directo');
  assert.deepEqual(p.herramientas, ['claude', 'gemini']);
  assert.ok(!('extra' in p));
  assert.deepEqual(Object.keys(p), Object.keys(VACIO_SKILL));
  assert.deepEqual(normalizeSkill({ herramientas: ['ninguna'] }).herramientas, ['ninguna']);
  for (const junk of [null, undefined, 42, 'texto', []]) assert.deepEqual(normalizeSkill(junk), normalizeSkill({}));
});

test('empty and partial profiles still produce valid files, paste, test and ZIPs', () => {
  const partials = [
    VACIO_SKILL, {}, null,
    { skillNombre: 'Acta' },
    { queHace: 'Resume.' },
    { cuando: ['Te paso un acta'] },
    { nombre: 'Luz' },
    { material: 'Guía' },
    { ejemploSalida: 'Solo salida' },
    { formato: 'Una tabla de tres columnas' },
    { tono: 'esencial', herramientas: ['copilot'] },
  ];
  for (const p of partials) {
    const files = buildSkillGeneral(p);
    for (const [name, text] of Object.entries(files)) {
      assert.doesNotMatch(text, BAD, `${name} for ${JSON.stringify(p)}`);
      assertNoEmptyHeading(text, `${name} for ${JSON.stringify(p)}`);
    }
    assert.ok(descripcionSkill(p).length <= 200);
    assert.doesNotMatch(pasteSkillGeneral(p), BAD);
    assert.doesNotMatch(JSON.stringify(pruebaSkillGeneral(p)), BAD);
    assert.ok(zipSkillGeneral(p, { date: FIXED }).length > 100);
    assert.ok(zipTodoSkillGeneral(p, { date: FIXED }).length > 100);
  }
  // A one-line format is a description, not a template: no fence.
  const f = buildSkillGeneral({ ...daniel(), formato: 'Una tabla de tres columnas: qué, quién, cuándo' })['SKILL.md'];
  assert.ok(section(f, 'Formato de salida').includes('\n\nUna tabla de tres columnas: qué, quién, cuándo\n'));
  assert.ok(!section(f, 'Formato de salida').includes('```'));
  // A template that already has a fence gets a longer one.
  const fenced = buildSkillGeneral({ ...daniel(), formato: 'Tabla:\n```\n| a | b |\n```' })['SKILL.md'];
  assert.ok(section(fenced, 'Formato de salida').includes('````markdown\nTabla:\n```\n| a | b |\n```\n````'));
});

test('field → file map is truthful: each field rewrites exactly the files it points to', () => {
  const changes = {
    skillNombre: { skillNombre: 'Acta de comité' },
    queHace: { queHace: 'Resume reuniones en una página.' },
    cuando: { cuando: ['Te paso un acta'] },
    entradas: { entradas: ['Las notas'] },
    pasos: { pasos: ['Lee todo', 'Resume'] },
    reglas: { reglas: ['Nunca inventes nombres'] },
    formato: { formato: '# Acta\n- …' },
    ejemplo: { ejemploEntrada: 'Notas del lunes', ejemploSalida: 'Acta del lunes' },
    verifico: { verifico: ['Todo está en las notas'] },
    material: { material: 'Glosario del comité' },
    quienSoy: { quienSoy: 'secretaria del consejo directivo' },
    nombre: { nombre: 'Andrés' },
    tono: { tono: 'esencial' },
    herramientas: { herramientas: ['gemini'] },
  };
  assert.deepEqual(CAMPOS_SKILL.map((c) => c.id).sort(), Object.keys(changes).sort());
  // Every profile key is covered by exactly one field (ejemplo covers both example keys).
  const keys = Object.values(changes).flatMap((c) => Object.keys(c)).sort();
  assert.deepEqual(keys, Object.keys(VACIO_SKILL).sort());
  const base = buildSkillGeneral(daniel());
  for (const campo of CAMPOS_SKILL) {
    assert.ok(campo.label, campo.id);
    const next = buildSkillGeneral({ ...daniel(), ...changes[campo.id] });
    const changed = ARCHIVOS_SKILL.filter((n) => next[n] !== base[n]);
    assert.deepEqual(changed.sort(), [...campo.archivos].sort(), campo.id);
  }
});
