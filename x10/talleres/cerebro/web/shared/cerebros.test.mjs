// The registry the landing reads: four cerebros, each one able to build, paste,
// download and test from its own profile.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CEREBROS, cerebroById, elegirCerebro, inicialDock, nombreCorto } from './cerebros.js';
import { KEYS } from './store.js';
import { INTRO_CARGA, PERFIL_LAURA, TAREAS } from './catalog.js';
import { FIJOS, buildPaste } from './generator.js';
import { INSTRUCCION_PEGAR } from './skill-general.js';
import { CABECERA_GPT } from './brief-a-mvp.content.js';
import { ARCHIVOS_MVP, CONFIRM3_MVP, buildMvp } from './brief-a-mvp.js';

const byId = Object.fromEntries(CEREBROS.map((c) => [c.id, c]));
const isZip = (bytes) => bytes instanceof Uint8Array && bytes[0] === 0x50 && bytes[1] === 0x4b;
const ascii = (bytes) => new TextDecoder('latin1').decode(bytes);

test('four cerebros, skill first, brief→MVP before the legal one; labels and examples as the plans say', () => {
  assert.deepEqual(CEREBROS.map((c) => c.id), ['skill', 'ideacion', 'mvp', 'juridico']);
  assert.deepEqual(CEREBROS.map((c) => c.label), ['Skill general', 'Ideación', 'De brief a MVP', 'Jurídico']);
  assert.deepEqual(CEREBROS.map((c) => c.corto), ['Skill', 'Ideación', 'Brief→MVP', 'Jurídico']);
  assert.deepEqual(CEREBROS.map((c) => c.ejemplo.nombre), ['Daniel', 'Sofía', 'Grupo 7 · Semáforo de Liquidaciones', 'Laura']);
  assert.deepEqual(CEREBROS.map((c) => c.principal), ['SKILL.md', 'SKILL.md', 'SKILL.md', '00_ADN.md']);
  for (const c of CEREBROS) {
    for (const k of ['sub', 'eyebrow', 'titulo', 'lead', 'cargarLead', 'pruebaLead']) assert.ok(typeof c[k] === 'string' && c[k], `${c.id}.${k}`);
  }
});

test('each cerebro stores its profile under its own contract key', () => {
  assert.deepEqual(CEREBROS.map((c) => c.storeKey), [KEYS.perfilSkill, KEYS.perfilIdeacion, KEYS.perfilMvp, KEYS.perfil]);
});

test('cerebroById: known ids, null otherwise', () => {
  assert.equal(cerebroById('ideacion'), byId.ideacion);
  assert.equal(cerebroById('nope'), null);
  assert.equal(cerebroById(undefined), null);
});

test('build(perfilEjemplo) returns exactly the archivos, in tab order, and principal is one of them', () => {
  for (const c of CEREBROS) {
    assert.deepEqual(Object.keys(c.build(c.perfilEjemplo)), c.archivos, c.id);
    assert.deepEqual(Object.keys(c.build(c.perfilVacio)), c.archivos, `${c.id} (vacío)`);
    assert.ok(c.archivos.includes(c.principal), c.id);
    assert.deepEqual(c.build(c.perfilEjemplo), c.build({ ...c.perfilEjemplo }), `${c.id} deterministic`);
  }
});

test('descargas(): every entry is a named ZIP whose bytes start with PK', () => {
  for (const c of CEREBROS) {
    const list = c.descargas(c.perfilEjemplo);
    assert.ok(list.length >= 2, c.id);
    assert.equal(new Set(list.map((d) => d.id)).size, list.length, `${c.id} unique ids`);
    for (const d of list) {
      assert.match(d.archivo, /^[a-z0-9-]+\.zip$/, `${c.id}/${d.id}`);
      assert.ok(d.titulo, `${c.id}/${d.id} titulo`);
      assert.ok(isZip(d.bytes()), `${c.id}/${d.id} bytes`);
    }
  }
});

test('descargas(): the skill ZIP and the whole kit of each new cerebro', () => {
  assert.deepEqual(byId.skill.descargas(byId.skill.perfilEjemplo).map((d) => d.archivo), ['resumen-de-reunion.zip', 'resumen-de-reunion-kit.zip']);
  assert.deepEqual(byId.ideacion.descargas(byId.ideacion.perfilEjemplo).map((d) => d.archivo), ['ideacion-de-producto.zip', 'ideacion-kit.zip']);
  assert.deepEqual(
    byId.mvp.descargas(byId.mvp.perfilEjemplo).map((d) => [d.archivo, d.titulo, d.nota]),
    [['brief-a-mvp.zip', 'Skill para Claude', 'Súbela sin descomprimir'], ['brief-a-mvp-kit.zip', 'Todo', 'README, instrucciones, primer mensaje y la skill']],
  );
  assert.ok(ascii(byId.mvp.descargas(byId.mvp.perfilEjemplo)[0].bytes()).includes('brief-a-mvp/SKILL.md'));
  const skill = ascii(byId.skill.descargas(byId.skill.perfilEjemplo)[0].bytes());
  assert.ok(skill.includes('resumen-de-reunion/SKILL.md'));
});

test('descargas() legal: the brain ZIP (not a skill) and one skill ZIP per chosen task', () => {
  const list = byId.juridico.descargas(PERFIL_LAURA);
  assert.equal(list[0].id, 'cerebro');
  assert.equal(list[0].archivo, 'cerebro-juridico.zip');
  assert.equal(list[0].tipo, 'cerebro');
  const brain = ascii(list[0].bytes());
  for (const n of byId.juridico.archivos) assert.ok(brain.includes(`cerebro-juridico/${n}`), n);
  const skills = list.slice(1);
  assert.deepEqual(skills.map((d) => d.id), ['contratos', 'jurisprudencia', 'peticiones']);
  assert.ok(skills.every((d) => d.tipo === 'skill'));
  assert.deepEqual(skills.map((d) => d.archivo), skills.map((d) => `${TAREAS.find((t) => t.id === d.id).skill.slug}.zip`));
  assert.deepEqual(byId.juridico.descargas({ ...PERFIL_LAURA, tareas: [] }).map((d) => d.id), ['cerebro']);
});

test('prueba(): a question and the two columns; legal keeps one tab per chosen task', () => {
  for (const c of CEREBROS) {
    const p = c.prueba(c.perfilEjemplo);
    assert.ok(Array.isArray(p.esperado.con) && p.esperado.con.length, `${c.id} con`);
    assert.ok(Array.isArray(p.esperado.sin) && p.esperado.sin.length, `${c.id} sin`);
    assert.ok(p.tabs?.length || p.pregunta, c.id);
  }
  const legal = byId.juridico.prueba(PERFIL_LAURA);
  assert.deepEqual(legal.tabs.map((t) => t.id), ['contratos', 'jurisprudencia', 'peticiones']);
  assert.equal(legal.tabs[0].pregunta, TAREAS.find((t) => t.id === 'contratos').prueba);
  assert.equal(legal.aviso, '');
  const sinTareas = byId.juridico.prueba({ ...PERFIL_LAURA, tareas: [] });
  assert.deepEqual(sinTareas.tabs.map((t) => t.id), ['contratos']);
  assert.match(sinTareas.aviso, /No elegiste tareas/);
  assert.equal(byId.skill.prueba(byId.skill.perfilEjemplo).pregunta, byId.skill.perfilEjemplo.ejemploEntrada);
  assert.equal(byId.ideacion.prueba(byId.ideacion.perfilEjemplo).pregunta, byId.ideacion.perfilEjemplo.frase);
  const pm = buildMvp(byId.mvp.perfilEjemplo)['PRIMER_MENSAJE.md'];
  assert.equal(byId.mvp.prueba(byId.mvp.perfilEjemplo).pregunta, pm.slice(pm.indexOf('\n---\n\n') + 6).trimEnd(), 'brief→MVP: the first message is the test');
  assert.equal(byId.mvp.pruebaLarga, true);
  assert.ok(CEREBROS.filter((c) => c.id !== 'mvp').every((c) => !c.pruebaLarga));
});

test('paste(): the new cerebros start with the skill header; legal is the five files as today', () => {
  assert.ok(byId.skill.paste(byId.skill.perfilEjemplo).startsWith(`${INSTRUCCION_PEGAR}\n\n`));
  assert.ok(byId.ideacion.paste(byId.ideacion.perfilEjemplo).startsWith(`${INSTRUCCION_PEGAR}\n\n`));
  assert.ok(byId.mvp.paste(byId.mvp.perfilEjemplo).startsWith(`${CABECERA_GPT}\n\n`), 'brief→MVP: the draft header');
  assert.equal(byId.juridico.paste(PERFIL_LAURA), buildPaste(PERFIL_LAURA));
  assert.ok(byId.juridico.paste(PERFIL_LAURA).startsWith(INTRO_CARGA));
});

test('only the legal cerebro has the custom form, the fixed blocks, the routes and the vault', () => {
  assert.equal(byId.juridico.campos, null);
  assert.equal(byId.juridico.fijos, FIJOS);
  for (const c of CEREBROS) {
    const legal = c.id === 'juridico';
    assert.equal(c.rutas, legal, `${c.id}.rutas`);
    assert.equal(c.boveda, legal, `${c.id}.boveda`);
    assert.equal(c.cuenta, true, `${c.id}.cuenta`);
    if (!legal) assert.equal(c.fijos, null, `${c.id}.fijos`);
  }
});

test('generic forms: one field per profile key, numbered in order, each wired to a node of the map', () => {
  for (const c of CEREBROS.filter((x) => x.campos)) {
    assert.deepEqual(c.campos.map((f) => f.id).sort(), Object.keys(c.perfilVacio).sort(), `${c.id}: fields = profile keys`);
    assert.deepEqual(c.campos.map((f) => f.n), c.campos.map((_, i) => i + 1), `${c.id}: numbering`);
    const mapa = c.mapa.map((m) => m.id);
    for (const f of c.campos) assert.ok(mapa.includes(f.mapa ?? f.id), `${c.id}.${f.id} → map`);
    for (const id of mapa) assert.ok(c.campos.some((f) => (f.mapa ?? f.id) === id), `${c.id}: map node ${id} has a field`);
    for (const f of c.campos) {
      assert.ok(['text', 'textarea', 'lines', 'radio', 'checkbox', 'cards'].includes(f.tipo), `${c.id}.${f.id} tipo`);
      assert.ok(f.label, `${c.id}.${f.id} label`);
      const lista = Array.isArray(c.perfilVacio[f.id]);
      assert.equal(lista, f.tipo === 'lines' || f.tipo === 'checkbox', `${c.id}.${f.id}: list fields are lines or checkbox`);
      if (['radio', 'checkbox', 'cards'].includes(f.tipo)) {
        assert.ok(f.opciones.length, `${c.id}.${f.id} opciones`);
        // Every option survives the module's normalize: the form never offers a value it drops.
        for (const o of f.opciones) {
          const v = f.tipo === 'checkbox' ? [o.id] : o.id;
          assert.deepEqual(c.normalize({ ...c.perfilVacio, [f.id]: v })[f.id], v, `${c.id}.${f.id}=${o.id}`);
        }
      }
    }
  }
});

test('the skill form: lines where the plan says, tone as cards with the instruction', () => {
  const tipo = Object.fromEntries(byId.skill.campos.map((f) => [f.id, f.tipo]));
  for (const id of ['cuando', 'entradas', 'pasos', 'reglas', 'verifico']) assert.equal(tipo[id], 'lines', id);
  assert.equal(tipo.tono, 'cards');
  assert.equal(byId.skill.campos.find((f) => f.id === 'pasos').hint, 'Uno por línea, en orden.');
  assert.ok(byId.skill.campos.find((f) => f.id === 'material').hint.includes('references/material.md'));
  assert.ok(byId.skill.campos.find((f) => f.id === 'tono').opciones.every((o) => o.desc));
  assert.equal(byId.ideacion.campos.find((f) => f.id === 'frase').placeholder, 'Quiero una app que ___ para ___');
});

test('cambios(): the map nodes whose fields differ, in form order', () => {
  const s = byId.skill;
  assert.deepEqual(s.cambios(s.perfilEjemplo, s.perfilEjemplo), []);
  assert.deepEqual(s.cambios(s.perfilEjemplo, { ...s.perfilEjemplo, ejemploSalida: 'otra' }), ['ejemplo']);
  assert.deepEqual(s.cambios(s.perfilEjemplo, { ...s.perfilEjemplo, ejemploEntrada: 'x', ejemploSalida: 'y', pasos: ['z'] }), ['pasos', 'ejemplo']);
  assert.deepEqual(byId.juridico.cambios(PERFIL_LAURA, { ...PERFIL_LAURA, nombre: 'Ana' }), ['nombre']);
  assert.deepEqual(
    s.cambios(s.perfilEjemplo, s.perfilVacio),
    ['skillNombre', 'queHace', 'cuando', 'entradas', 'pasos', 'reglas', 'formato', 'ejemplo', 'verifico', 'quienSoy', 'nombre', 'herramientas'],
    'Daniel → blank: everything but the empty material and the default tone',
  );
});

test('same(): compares normalized profiles', () => {
  for (const c of CEREBROS) {
    assert.ok(c.same(c.perfilEjemplo, c.normalize(c.perfilEjemplo)), c.id);
    assert.ok(!c.same(c.perfilEjemplo, c.perfilVacio), c.id);
  }
});

test('confirm3: three lines, each a bold part and the rest', () => {
  for (const c of CEREBROS) {
    assert.equal(c.confirm3.length, 3, c.id);
    for (const [b, rest] of c.confirm3) assert.ok(b && rest, c.id);
  }
});

test('«Te llevas» lists files of the cerebro, each with its one-line description', () => {
  for (const c of CEREBROS) {
    assert.ok(c.llevas.titulo && c.llevas.items.length, c.id);
    for (const it of c.llevas.items) {
      assert.ok(c.archivos.includes(it.archivo), `${c.id}: ${it.archivo}`);
      assert.ok(it.que, `${c.id}: ${it.archivo} description`);
    }
  }
  assert.deepEqual(byId.skill.llevas.items.map((x) => x.archivo), ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md']);
  assert.equal(byId.ideacion.llevas.items.length, 6);
  assert.deepEqual(byId.mvp.llevas.items.map((x) => x.archivo), [
    'SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'references/plantilla-spec-mvp.md', 'references/tabla-de-recorte.md',
    'references/prompts-por-capa.md', 'references/herramientas.md', 'references/reglas-de-mesa.md', 'README.md',
  ]);
});

test('elegirCerebro: hash, then ?c=, then the saved tab, then skill', () => {
  assert.equal(elegirCerebro({}), 'skill');
  assert.equal(elegirCerebro({ guardado: 'juridico' }), 'juridico');
  assert.equal(elegirCerebro({ search: '?c=ideacion', guardado: 'juridico' }), 'ideacion');
  assert.equal(elegirCerebro({ hash: '#juridico', search: '?c=ideacion', guardado: 'skill' }), 'juridico');
  assert.equal(elegirCerebro({ hash: '#cargar', search: '?c=nope', guardado: 'otra' }), 'skill');
  assert.equal(elegirCerebro({ hash: '#prueba', guardado: 'ideacion' }), 'ideacion');
});

test('short names for tabs and the map, two letters for the dock', () => {
  assert.equal(nombreCorto('references/plantilla-spec.md'), 'plantilla-spec');
  assert.equal(nombreCorto('00_ADN.md'), '00_ADN');
  assert.equal(nombreCorto('SKILL.md'), 'SKILL');
  assert.equal(inicialDock('README.md'), 'R');
  assert.equal(inicialDock('00_ADN.md'), '00');
  assert.equal(inicialDock('SKILL.md'), 'SK');
  assert.equal(inicialDock('INSTRUCCIONES_GPT.md'), 'IN');
  assert.equal(inicialDock('references/reglas-de-mesa.md'), 'RE');
  assert.equal(inicialDock('references/plantilla-spec.md'), 'PL');
  // Within a cerebro's list, two files never share their letters.
  for (const c of CEREBROS) {
    const dock = c.archivos.map((f) => inicialDock(f, c.archivos));
    assert.equal(new Set(dock).size, dock.length, `${c.id}: ${dock.join(' ')}`);
  }
  assert.deepEqual(byId.ideacion.archivos.map((f) => inicialDock(f, byId.ideacion.archivos)), byId.ideacion.archivos.map((f) => inicialDock(f)), 'ideación unchanged');
  assert.deepEqual(ARCHIVOS_MVP.map((f) => inicialDock(f, ARCHIVOS_MVP)), ['R', 'SK', 'IN', 'PM', 'PL', 'TA', 'PC', 'HE', 'RE']);
});

test('the landing has one tab per cerebro, in order, with its label, short label and sub-label', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const strip = html.slice(html.lastIndexOf('<div', html.indexOf('id="cerebros"')), html.indexOf('id="cerebro-panel"'));
  const tabs = [...strip.matchAll(/data-cerebro="([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(tabs, CEREBROS.map((c) => c.id));
  for (const c of CEREBROS) {
    const tab = strip.slice(strip.indexOf(`id="cerebro-${c.id}"`));
    assert.ok(tab.includes(`<span class="cerebros__full">${c.label}</span>`), `${c.id} label`);
    assert.ok(tab.includes(`aria-hidden="true">${c.corto}</span>`), `${c.id} corto`);
    assert.ok(tab.includes(`<span class="cerebros__sub">${c.sub}</span>`), `${c.id} sub`);
  }
  assert.match(strip, /role="tablist"/);
});

test('brief→MVP: the nine fields of PROMPT 1, in order, with their labels and hints', () => {
  const c = byId.mvp;
  assert.deepEqual(c.campos.map((f) => [f.id, f.tipo]), [
    ['brief', 'textarea'], ['sector', 'radio'], ['herramienta', 'radio'], ['nivel', 'radio'], ['tiempo', 'radio'],
    ['restricciones', 'lines'], ['nombre', 'text'], ['tono', 'cards'], ['herramientas', 'checkbox'],
  ]);
  assert.deepEqual(c.campos.map((f) => f.label), [
    'Tu brief o tu idea', 'Sector', 'Con qué vas a construir', 'Tu experiencia construyendo', 'Tiempo disponible',
    'Tus límites', '¿Cómo quieres que la IA te llame?', 'Cómo quieres que te responda', 'La IA que usas hoy',
  ]);
  assert.deepEqual(c.campos.filter((f) => f.opcional).map((f) => f.id), ['restricciones', 'nombre']);
  const f = Object.fromEntries(c.campos.map((x) => [x.id, x]));
  assert.ok(f.brief.hint.startsWith('Pega el brief completo (nombre y entidad, usuario, problema, reto, solución, flujo, qué NO hará, datos, humano responsable, cómo sabremos que funciona)'));
  assert.equal(f.tiempo.hint, 'Define cuántas capas entran en el MVP.');
  assert.deepEqual(f.herramienta.opciones.map((o) => o.label), ['Lovable', 'Claude (artifact)', 'Claude Code', 'Codex', 'Gemini AI Studio', 'No sé aún']);
  assert.deepEqual(f.sector.opciones.map((o) => o.label), byId.ideacion.campos.find((x) => x.id === 'sector').opciones.map((o) => o.label));
  assert.deepEqual(f.nivel.opciones.map((o) => o.label), byId.ideacion.campos.find((x) => x.id === 'nivel').opciones.map((o) => o.label));
  assert.deepEqual(f.tono.opciones, byId.ideacion.campos.find((x) => x.id === 'tono').opciones);
  assert.deepEqual(f.herramientas.opciones, byId.ideacion.campos.find((x) => x.id === 'herramientas').opciones);
  assert.equal(c.ejemplo.del, 'del Grupo 7');
  assert.deepEqual(c.confirm3, CONFIRM3_MVP);
  assert.equal(c.titulo, 'Tu brief escribe tu skill de construcción');
  assert.equal(c.sub, 'Del brief a la spec, las capas y los prompts');
});

test('descargasHabilitadas: only brief→MVP gates its ZIPs, on the brief', () => {
  const c = byId.mvp;
  assert.equal(c.descargasHabilitadas(c.perfilEjemplo), true);
  assert.equal(c.descargasHabilitadas(c.perfilVacio), false);
  assert.equal(c.descargasHabilitadas({ ...c.perfilVacio, brief: 'Quiero una app que ordene turnos' }), true);
  assert.ok(c.descargasAviso.includes('campo 01'));
  for (const x of CEREBROS.filter((y) => y.id !== 'mvp')) assert.equal(x.descargasHabilitadas, undefined, x.id);
});
