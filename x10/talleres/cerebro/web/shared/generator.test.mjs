// node --test 'talleres/cerebro/web/shared/*.test.mjs'
// The generator turns a profile into the six files of the cerebro jurídico.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHIVOS, CAMPOS, FIJOS, buildFiles, buildPaste, sistemaBlock, normalizeProfile,
} from './generator.js';
import {
  AREAS, CONFIDENCIALIDAD, HERRAMIENTAS, INTRO_CARGA, PERFIL_LAURA, PERFIL_VACIO, ROLES,
  RUTAS_CARGA, TAREAS, TONOS, PREGUNTA_PRUEBA, PRIVACIDAD, POSICIONES,
} from './catalog.js';
import { PLAN, blockAfter, squash } from './plan.fixture.mjs';

const NAMES = ['README.md', '00_ADN.md', '01_LINEAS_ROJAS.md', '02_PLAYBOOK.md', '03_FUENTES.md', '04_VERIFICACION.md'];
const laura = () => structuredClone({ ...PERFIL_LAURA, areas: [...PERFIL_LAURA.areas], tareas: [...PERFIL_LAURA.tareas], herramientas: [...PERFIL_LAURA.herramientas] });
const BAD = /undefined|null|NaN|\[object Object\]/;

// H2 sections outside code fences (skill templates contain "## Skill: <nombre>").
const h2s = (md) => {
  let fence = false;
  return md.split('\n').filter((l) => {
    if (/^(```|~~~)/.test(l)) fence = !fence;
    return !fence && l.startsWith('## ');
  });
};
const skills = (md) => h2s(md).filter((l) => l.startsWith('## Skill: ')).length;

const section = (md, heading) => {
  let fence = false;
  let on = false;
  const out = [];
  for (const line of md.split('\n')) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    if (!fence && line.startsWith('## ')) {
      if (on) break;
      on = line.startsWith(`## ${heading}`);
    }
    if (on) out.push(line);
  }
  assert.ok(out.length, `missing section "## ${heading}"`);
  return out.join('\n');
};

test('buildFiles returns exactly the six files, in order', () => {
  const files = buildFiles(laura());
  assert.deepEqual(Object.keys(files), NAMES);
  assert.deepEqual(ARCHIVOS, NAMES);
  for (const name of NAMES) assert.ok(files[name].length > 200, `${name} too short`);
});

test('same profile gives byte-identical files, whatever the click order', () => {
  const a = buildFiles(laura());
  const b = buildFiles({ ...laura(), areas: ['constitucional', 'civil'], tareas: ['peticiones', 'contratos', 'jurisprudencia'], herramientas: ['chatgpt', 'claude'] });
  assert.deepEqual(a, b);
  assert.equal(buildPaste(laura()), buildPaste(laura()));
});

test('every file ends with one newline and has no trailing spaces on headings', () => {
  for (const [name, text] of Object.entries(buildFiles(laura()))) {
    assert.ok(text.endsWith('\n') && !text.endsWith('\n\n'), `${name} ending`);
    assert.ok(text.startsWith('# '), `${name} starts with a title`);
  }
});

test('system block for Laura is the §4.3 extract (wraps aside)', () => {
  const extract = blockAfter('**Extracto de `00_ADN.md` (bloque de sistema):**');
  assert.equal(squash(sistemaBlock(laura())), squash(extract));
});

test('system block follows the §6.10 template for every role, tone and confidentiality', () => {
  for (const rol of ROLES) {
    for (const tono of TONOS) {
      for (const conf of CONFIDENCIALIDAD) {
        const s = sistemaBlock({ ...laura(), rol: rol.id, tono: tono.id, confidencialidad: conf.id });
        assert.ok(s.startsWith(`Eres mi asistente jurídico. Trabajo en Colombia como ${rol.sistema}, con práctica en civil y comercial, constitucional y tutelas. Llámame Laura.`));
        const lc = (t) => t[0].toLowerCase() + t.slice(1);
        assert.ok(s.includes(`4. Confidencialidad: ${lc(conf.sistema)}`), conf.id);
        assert.ok(s.includes(`5. Tono: ${lc(tono.instruccion)}. Formato: ${lc(tono.formato)}.`), tono.id);
        assert.match(s, /\n8\. Nunca presentes un borrador como definitivo\. Yo firmo, radico y decido\.$/);
      }
    }
  }
});

test('system block rules 1–3 and 6–8 are the §6.10 template, verbatim', () => {
  const tpl = squash(blockAfter('### 6.10 Plantilla del bloque de instrucciones de sistema'));
  const s = squash(sistemaBlock(laura()));
  for (const n of [1, 2, 3, 6, 7, 8]) {
    const rule = tpl.match(new RegExp(`${n}\\. .*?(?= ${n + 1}\\. |$)`))[0];
    assert.ok(s.includes(rule), `rule ${n}`);
  }
});

test('system block: official links instead of silence, and my positions before general practice', () => {
  const s = sistemaBlock(laura());
  assert.ok(s.includes('2. Fuentes: primero revisa 03_FUENTES.md. Si la regla no está allí y puedes buscar en internet, búscala en la fuente oficial'));
  assert.ok(s.includes('Si no la abriste en una fuente oficial, márcala [NO VERIFICADO].'));
  assert.ok(s.includes('3. Citas: cada sentencia, norma o artículo que cites lleva, en la misma línea, su enlace oficial o la marca [NO VERIFICADO]; también las que vienen de 03_FUENTES.md mientras su enlace oficial esté vacío.'));
  assert.ok(s.includes('6. Procedimientos y criterio: para las tareas de 02_PLAYBOOK.md sigue sus pasos, aplica mis posiciones antes que la práctica general y detente en cada punto marcado YO DECIDO.'));
  assert.ok(!s.includes('no tengo la fuente exacta'), 'the old rule told a searching model to stop');
});

test('ciudad: in the system block and 00_ADN only; absent when empty', () => {
  const con = buildFiles({ ...laura(), ciudad: 'Medellín' });
  assert.ok(sistemaBlock({ ...laura(), ciudad: 'Medellín' }).includes('Ejerzo en Medellín: cuando algo dependa de mi ciudad (foro, juzgados, cámara de comercio), usa esa.'));
  assert.ok(con['00_ADN.md'].includes('- Ciudad: Medellín'));
  assert.ok(!sistemaBlock(laura()).includes('Ejerzo en'));
  assert.ok(!buildFiles(laura())['00_ADN.md'].includes('- Ciudad:'));
  assert.equal(normalizeProfile({ ciudad: '  Cali.  ' }).ciudad, 'Cali');
});

test('posiciones: each option rewrites one row of the contracts table; defaults keep the plan table', () => {
  assert.deepEqual(POSICIONES.map((x) => x.id), ['responsabilidad', 'confidencialidad', 'datos', 'penal']);
  const plan = squash(blockAfter('#### Skill: Revisión de contratos con semáforo'));
  for (const pos of POSICIONES) {
    const ids = pos.opciones.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length, pos.id);
    for (const o of pos.opciones) {
      for (const k of ['label', 'verde', 'amarillo', 'rojo']) assert.ok(o[k], `${pos.id}.${o.id}.${k}`);
      const row = `| ${pos.fila} | ${o.verde} | ${o.amarillo} | ${o.rojo} |`;
      const pb = buildFiles({ ...laura(), posiciones: { [pos.id]: o.id } })['02_PLAYBOOK.md'];
      assert.ok(pb.includes(row), `${pos.id}.${o.id} row in playbook`);
      assert.equal(pb.split(`| ${pos.fila} |`).length - 1, 1, 'one row per clause');
    }
    // the first option is the plan's own row
    const first = pos.opciones[0];
    assert.ok(plan.includes(squash(`| ${pos.fila} | ${first.verde} | ${first.amarillo} | ${first.rojo} |`)), `${pos.id} default = plan`);
  }
  assert.equal(buildFiles({ ...laura(), posiciones: {} })['02_PLAYBOOK.md'], buildFiles(laura())['02_PLAYBOOK.md']);
  assert.deepEqual(normalizeProfile({ posiciones: { datos: 'transmision', penal: 'nope', x: 'y' } }).posiciones, { datos: 'transmision' });
  // without the contracts task the positions change nothing
  const sin = { ...laura(), tareas: ['peticiones'] };
  assert.deepEqual(buildFiles({ ...sin, posiciones: { datos: 'transmision' } }), buildFiles(sin));
});

test('system block without name, role or areas drops those clauses cleanly', () => {
  const s = sistemaBlock(PERFIL_VACIO);
  assert.ok(s.startsWith('Eres mi asistente jurídico. Trabajo en Colombia como abogado/a.\n'));
  assert.ok(!s.includes('Llámame'));
  assert.ok(!s.includes('con práctica en'));
  assert.doesNotMatch(s, BAD);
});

test('areas in the system block keep acronyms (M&A, PI)', () => {
  const s = sistemaBlock({ ...laura(), areas: ['societario', 'pi'] });
  assert.ok(s.includes('con práctica en societario y M&A, PI y tecnología.'));
});

test('empty and partial profiles still produce six valid files', () => {
  const partials = [
    PERFIL_VACIO,
    {},
    { rol: 'firma' },
    { areas: ['penal'] },
    { tareas: ['terminos'] },
    { herramientas: ['ninguna'] },
    { confidencialidad: 'sensible' },
    { tono: 'ejecutivo' },
    { nombre: '   ', nuncaDelego: '   ' },
    { rol: 'no-existe', areas: ['x'], tareas: [42], herramientas: null, tono: 7 },
  ];
  for (const p of partials) {
    const files = buildFiles(p);
    assert.deepEqual(Object.keys(files), NAMES);
    for (const [name, text] of Object.entries(files)) {
      assert.doesNotMatch(text, BAD, `${name} for ${JSON.stringify(p)}`);
      assert.ok(text.length > 150, `${name} for ${JSON.stringify(p)}`);
    }
    assert.doesNotMatch(buildPaste(p), BAD);
  }
});

test('normalizeProfile drops unknown ids, dedupes, keeps catalog order and caps tasks at 3', () => {
  const p = normalizeProfile({
    nombre: '  Ana María. ',
    rol: 'publico',
    areas: ['datos', 'nope', 'civil', 'civil'],
    tareas: ['contenido', 'terminos', 'contratos', 'peticiones'],
    herramientas: ['gemini', 'ninguna', 'claude'],
    confidencialidad: 'otra',
    tono: 'formal',
    nuncaDelego: '  firmar el acto.  ',
  });
  assert.equal(p.nombre, 'Ana María');
  assert.equal(p.rol, 'publico');
  assert.deepEqual(p.areas, ['civil', 'datos']);
  assert.deepEqual(p.tareas, ['contratos', 'terminos', 'contenido']);
  assert.deepEqual(p.herramientas, ['claude', 'gemini']);
  assert.equal(p.confidencialidad, null);
  assert.equal(p.tono, 'formal');
  assert.equal(p.nuncaDelego, 'firmar el acto.');
  assert.deepEqual(normalizeProfile({ herramientas: ['ninguna'] }).herramientas, ['ninguna']);
});

test('00_ADN: who I am, what good work is, and the system block ready to copy', () => {
  const adn = buildFiles(laura())['00_ADN.md'];
  for (const s of ['Laura', 'Litigante independiente', 'Civil y comercial', 'Constitucional y tutelas', 'Claude', 'ChatGPT', 'Claro y didáctico', 'Reservada (datos de terceros)']) {
    assert.ok(adn.includes(s), s);
  }
  for (const t of PERFIL_LAURA.tareas) assert.ok(adn.includes(TAREAS.find((x) => x.id === t).label));
  for (const item of ROLES[0].buenTrabajo) assert.ok(adn.includes(`- ${item}.`), item);
  assert.ok(adn.includes('```text\n' + sistemaBlock(laura()) + '\n```'));
});

test('changing the role to sector público rewrites 00_ADN and 01_LINEAS_ROJAS', () => {
  const files = buildFiles({ ...laura(), rol: 'publico' });
  assert.ok(files['00_ADN.md'].includes('Trabajo en Colombia como abogado/a en una entidad pública'));
  assert.ok(files['00_ADN.md'].includes('- Peticiones y PQRS clasificadas por tipo con el término correcto.'));
  assert.ok(files['01_LINEAS_ROJAS.md'].includes('- Expedir, firmar o notificar un acto administrativo.'));
  assert.ok(!files['01_LINEAS_ROJAS.md'].includes('La estrategia procesal'));
});

test('01_LINEAS_ROJAS: "Lo que nunca delego" for Laura is the §4.3 extract', () => {
  const extract = blockAfter('**Extracto de `01_LINEAS_ROJAS.md`:**').trim();
  const rojas = buildFiles(laura())['01_LINEAS_ROJAS.md'];
  assert.ok(squash(section(rojas, 'Lo que nunca delego')) === squash(extract), 'extract not found verbatim');
});

test('01_LINEAS_ROJAS: without a custom line, the role default goes first; no duplicates', () => {
  const rojas = buildFiles({ ...laura(), nuncaDelego: '' })['01_LINEAS_ROJAS.md'];
  assert.match(section(rojas, 'Lo que nunca delego'), /## Lo que nunca delego\n\n- La estrategia procesal/);
  const dup = buildFiles({ ...laura(), nuncaDelego: 'la estrategia procesal: qué pretender, qué recurso interponer y cuándo' })['01_LINEAS_ROJAS.md'];
  assert.equal(dup.split('La estrategia procesal').length - 1, 1);
});

test('01_LINEAS_ROJAS: confidentiality rules of the chosen level, AI limits and the Colombian frame', () => {
  for (const conf of CONFIDENCIALIDAD) {
    const rojas = buildFiles({ ...laura(), confidencialidad: conf.id })['01_LINEAS_ROJAS.md'];
    assert.ok(rojas.includes(conf.label), conf.id);
    for (const r of conf.reglas) assert.ok(rojas.includes(`- ${r}.`), r);
    for (const other of CONFIDENCIALIDAD.filter((c) => c.id !== conf.id)) {
      for (const r of other.reglas) assert.ok(!rojas.includes(r), `leaks ${other.id}`);
    }
  }
  const rojas = buildFiles(laura())['01_LINEAS_ROJAS.md'];
  const nunca = section(rojas, 'Lo que la IA nunca hace');
  assert.ok(nunca.includes('Cita una sentencia, norma o artículo sin su enlace oficial'));
  assert.ok(nunca.includes('Usa la práctica general cuando 02_PLAYBOOK.md tiene mi posición.'));
  const marco = section(rojas, 'Marco colombiano');
  for (const s of ['T-323 de 2024', 'PCSJA24-12243', 'Ley 1581 de 2012', 'Decreto 1377 de 2013', 'Art. 74 C.P.', 'Ley 1123 de 2007']) {
    assert.ok(marco.includes(s), s);
  }
  assert.ok(rojas.includes('Las normas citadas son semilla para verificación en fuente oficial; no constituyen asesoría jurídica.'));
});

// Fact-checked skills: the corrected wording wins over the plan's.
const CORREGIDAS = {
  peticiones: [
    'según 03_FUENTES.md (art. 14 del CPACA, sustituido por el art. 1 de la Ley 1755 de 2015)',
    'redacta la remisión y el aviso al peticionario (art. 21: dentro de los 5 días siguientes si es escrita, de inmediato si es verbal)',
    'Trampa conocida: muchas IA responden con los términos ampliados del art. 5 del Decreto 491 de 2020 (30, 20 y 35 días), derogado por la Ley 2207 de 2022.',
  ],
};

test('02_PLAYBOOK: one skill per chosen task, verbatim from §6.7 unless fact-checked', () => {
  for (const t of TAREAS) {
    const pb = buildFiles({ ...laura(), tareas: [t.id] })['02_PLAYBOOK.md'];
    const body = section(pb, `Skill: ${t.skill.titulo}`);
    if (CORREGIDAS[t.id]) {
      for (const s of CORREGIDAS[t.id]) assert.ok(squash(body).includes(s), `${t.id}: ${s}`);
      for (const s of ['YO entrego', 'IA hace', 'YO DECIDO', 'VERIFICO']) assert.ok(body.includes(s), `${t.id}: ${s}`);
    } else {
      assert.ok(squash(body).includes(squash(blockAfter(`#### Skill: ${t.skill.titulo}`))), t.id);
    }
    assert.equal(skills(pb), 1, t.id);
  }
  const pb = buildFiles(laura())['02_PLAYBOOK.md'];
  assert.equal(skills(pb), 3);
  assert.ok(pb.includes('| Limitación de responsabilidad |'));
  assert.ok(squash(pb).includes('art. 5 del Decreto 491 de 2020 (30, 20 y 35 días), derogado por la Ley 2207 de 2022'));
  for (const s of ['YO entrego', 'IA hace', 'YO DECIDO', 'VERIFICO']) assert.ok(section(pb, 'La estructura de toda skill').includes(s));
  assert.ok(pb.includes('\n## Cómo agregar una skill\n'));
});

test('02_PLAYBOOK: never more than three skills; none chosen still explains what to do', () => {
  const pb = buildFiles({ ...laura(), tareas: TAREAS.map((t) => t.id) })['02_PLAYBOOK.md'];
  assert.equal(skills(pb), 3);
  const empty = buildFiles({ ...laura(), tareas: [] })['02_PLAYBOOK.md'];
  assert.equal(skills(empty), 0);
  assert.ok(empty.includes('\n## Cómo agregar una skill\n'));
});

test('03_FUENTES: official sources, seed per chosen area behind the warning, entry and alert', () => {
  const fu = buildFiles(laura())['03_FUENTES.md'];
  assert.ok(fu.includes('03_FUENTES.md solo crece con lo que abriste y verificaste'));
  for (const url of ['https://www.suin-juriscol.gov.co/', 'https://www.corteconstitucional.gov.co/relatoria/', 'https://consultaprocesos.ramajudicial.gov.co/']) {
    assert.ok(fu.includes(url), url);
  }
  const seed = section(fu, 'Semilla por área');
  for (const a of ['civil', 'constitucional']) {
    const area = AREAS.find((x) => x.id === a);
    const at = seed.indexOf(`### ${area.label}`);
    assert.ok(at >= 0, area.label);
    const warn = seed.indexOf('verifica vigencia antes de confiar', at);
    const first = seed.indexOf(area.fuentes[0], at);
    assert.ok(warn > at && warn < first, `${a}: warning must precede the seed`);
    for (const f of area.fuentes) assert.ok(seed.includes(`- ${f}`), f);
  }
  assert.ok(!seed.includes('Código Penal (Ley 599 de 2000)'));
  // §4.3 shape, with the fact-checked wording (facts.test.mjs pins the content).
  const entry = section(fu, 'Entrada verificada: derecho de petición');
  for (const k of ['- Tipo: norma', '- Identificación: ', '- Regla extraída: ', '- Alerta de vigencia: ', '- Verificado por: Laura   Fecha: ______   Enlace oficial: ______']) {
    assert.ok(entry.includes(k), k);
  }
  assert.ok(section(fu, 'Alertas de vigencia').includes('Ley 2207 de 2022'));
  assert.ok(section(fu, 'Alertas de vigencia').includes('art. 5 del Decreto 491 de 2020 derogado por la Ley 2207 de 2022'));
  assert.ok(fu.includes('- Tipo: norma | sentencia'), 'template');
  assert.ok(!fu.includes('biblioteca cerró'), 'models search now: 03 is what you verified, read first');
  assert.ok(fu.includes('La IA lo consulta primero, antes de buscar.'));
});

test('03_FUENTES: the verified entry carries the user name, or blanks when there is none', () => {
  const fu = buildFiles({ ...laura(), nombre: '' })['03_FUENTES.md'];
  assert.ok(fu.includes('- Verificado por: ______   Fecha: ______   Enlace oficial: ______'));
  const empty = buildFiles({ ...laura(), areas: [] })['03_FUENTES.md'];
  assert.ok(section(empty, 'Semilla por área').length > 40);
});

test('04_VERIFICACION: protocol §8.1, levels §8.2, red team §8.3 and the log', () => {
  const ve = buildFiles(laura())['04_VERIFICACION.md'];
  const proto = blockAfter('### 8.1 Protocolo');
  for (const line of proto.split('\n').filter((l) => l.trim())) {
    assert.ok(ve.includes(line), `protocol line: ${line}`);
  }
  assert.ok(ve.includes(blockAfter('### 8.2 Los tres niveles').trim()));
  assert.ok(ve.includes(blockAfter('### 8.3 Red team con un segundo modelo')));
  assert.ok(ve.trimEnd().endsWith('| Fecha | Tarea | IA usada | Qué verifiqué | Resultado |\n|---|---|---|---|---|'));
  assert.ok(ve.includes('exige el enlace oficial de cada cita y ábrelo'));
  assert.ok(ve.includes('«Ya lo verifiqué» también es una respuesta de la IA'));
  assert.equal(ve, buildFiles(PERFIL_VACIO)['04_VERIFICACION.md'], '04 is fixed');
});

test('README: name, how to load (chosen tools first), maintain, levels, three actions, disclaimer', () => {
  const rm = buildFiles(laura())['README.md'];
  assert.ok(rm.startsWith('# Cerebro jurídico de Laura\n'));
  assert.ok(rm.includes(INTRO_CARGA));
  const carga = section(rm, 'Cómo cargarlo');
  const order = RUTAS_CARGA.map((r) => carga.indexOf(`### ${r.label}`));
  assert.ok(order.every((i) => i > 0), 'all routes present');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  const gem = section(buildFiles({ ...laura(), herramientas: ['gemini'] })['README.md'], 'Cómo cargarlo');
  const label = (id) => RUTAS_CARGA.find((r) => r.id === id).label;
  assert.ok(gem.indexOf(`### ${label('gemini')}`) < gem.indexOf(`### ${label('claude')}`));
  assert.ok(carga.includes('verificadas el 20 de octubre de 2026'));
  for (const r of RUTAS_CARGA.filter((x) => x.nota)) assert.ok(carga.includes(r.nota), `nota ${r.id}`);
  const tree = blockAfter('### 4.5 Cómo se mantiene');
  assert.ok(rm.includes(tree), 'decision tree §4.5');
  assert.ok(rm.includes('03_FUENTES.md solo crece con lo que abriste y verificaste'));
  for (let n = 0; n <= 5; n++) assert.ok(section(rm, 'Niveles de madurez').includes(`Nivel ${n}`));
  const acciones = section(rm, 'Tres acciones para mañana');
  for (const s of ['Revisa tu cuenta: apaga el entrenamiento con tus datos', 'e instala tus skills en Claude', 'escribe la corrección en `02_PLAYBOOK.md` o `03_FUENTES.md`', 'abre `04_VERIFICACION.md`']) {
    assert.ok(acciones.includes(s), s);
  }
  // Before pasting: what each account does with your data, your tools first.
  const cuenta = section(rm, 'Antes de pegar: revisa tu cuenta');
  for (const x of PRIVACIDAD) {
    assert.ok(cuenta.includes(`### ${x.label}`), x.id);
    for (const k of ['entrena', 'apagar', 'ojo', 'fuente']) assert.ok(cuenta.includes(x[k]), `${x.id}.${k}`);
  }
  assert.ok(cuenta.indexOf('### Claude') < cuenta.indexOf('### Gemini'));
  const gemFirst = section(buildFiles({ ...laura(), herramientas: ['gemini'] })['README.md'], 'Antes de pegar: revisa tu cuenta');
  assert.ok(gemFirst.indexOf('### Gemini') < gemFirst.indexOf('### Claude'), 'chosen tools first');
  assert.ok(rm.indexOf('## Antes de pegar') < rm.indexOf('## Cómo cargarlo'));
  // Skills: one ZIP per chosen task, with the install steps.
  const sk = section(rm, 'Instala tus skills en Claude');
  for (const id of PERFIL_LAURA.tareas) {
    const t = TAREAS.find((x) => x.id === id);
    assert.ok(sk.includes(`\`${t.skill.slug}.zip\``), id);
  }
  assert.ok(sk.includes('«Upload a skill»'));
  assert.ok(section(buildFiles({ ...laura(), tareas: [] })['README.md'], 'Instala tus skills en Claude').includes('Elige tareas en tu perfil'));
  assert.ok(rm.includes('no constituyen asesoría jurídica'));
  assert.ok(buildFiles(PERFIL_VACIO)['README.md'].startsWith('# Mi cerebro jurídico\n'));
});

test('buildPaste: §4.4 intro, then the five files separated by ===== name =====', () => {
  const paste = buildPaste(laura());
  const files = buildFiles(laura());
  assert.ok(paste.startsWith(INTRO_CARGA + '\n\n===== 00_ADN.md =====\n'));
  const names = [...paste.matchAll(/^===== (.+) =====$/gm)].map((m) => m[1]);
  assert.deepEqual(names, NAMES.slice(1));
  for (const n of NAMES.slice(1)) assert.ok(paste.includes(`===== ${n} =====\n${files[n].trimEnd()}\n`), n);
  assert.ok(!paste.includes('# Cerebro jurídico de Laura'), 'README stays out of the chat');
  assert.ok(!paste.includes(PREGUNTA_PRUEBA));
});

test('field → file map is truthful: each field rewrites exactly the files it points to', () => {
  const changes = {
    nombre: { nombre: 'Andrés' },
    rol: { rol: 'publico' },
    areas: { areas: ['civil', 'constitucional', 'penal'] },
    tareas: { tareas: ['contratos', 'jurisprudencia', 'terminos'] },
    herramientas: { herramientas: ['claude', 'chatgpt', 'gemini'] },
    confidencialidad: { confidencialidad: 'sensible' },
    tono: { tono: 'formal' },
    nuncaDelego: { nuncaDelego: 'Firmar la demanda' },
    ciudad: { ciudad: 'Medellín' },
    posiciones: { posiciones: { confidencialidad: 'dos' } },
  };
  assert.deepEqual(CAMPOS.map((c) => c.id).sort(), Object.keys(changes).sort());
  const base = buildFiles(laura());
  for (const campo of CAMPOS) {
    const next = buildFiles({ ...laura(), ...changes[campo.id] });
    const changed = NAMES.filter((n) => next[n] !== base[n]);
    assert.deepEqual(changed.sort(), [...campo.archivos].sort(), campo.id);
  }
  assert.deepEqual([...FIJOS.archivos].sort(), ['01_LINEAS_ROJAS.md', '03_FUENTES.md', '04_VERIFICACION.md']);
});

test('the catalog covers every option of §6.3', () => {
  assert.equal(ROLES.length, 6);
  assert.equal(AREAS.length, 11);
  assert.equal(TAREAS.length, 10);
  assert.deepEqual(HERRAMIENTAS.map((h) => h.label), ['Claude', 'ChatGPT', 'Gemini', 'Copilot', 'Ninguna']);
  assert.equal(CONFIDENCIALIDAD.length, 3);
  assert.equal(TONOS.length, 3);
  assert.ok(PLAN.includes(PREGUNTA_PRUEBA));
});

test('every task has its own test prompt; the contracts one is the workshop test', () => {
  for (const t of TAREAS) {
    assert.ok(typeof t.prueba === 'string' && t.prueba.length > 40, t.id);
    assert.doesNotMatch(t.prueba, /\{\{|undefined/, t.id);
  }
  assert.equal(TAREAS.find((t) => t.id === 'contratos').prueba, PREGUNTA_PRUEBA);
  assert.ok(PREGUNTA_PRUEBA.includes('Represento a EL CONTRATISTA'));
});
