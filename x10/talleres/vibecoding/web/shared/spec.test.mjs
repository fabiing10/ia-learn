// Plain node test, no framework: `node talleres/vibecoding/web/shared/spec.test.mjs`
// The plan (plan-clase-1.md) is read from disk so the spec output and the
// cabecera are checked against its exact text, not against a copy.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CABECERA, BLOCKS, LIMITS, emptySpec, specToMarkdown, firstMessage, adivino, hintsByBlock,
  prefillFromMenu, hasContentInBlocks, normalizeSpec,
} from './spec.js';
import { MENU } from './content.js';

let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${err.message.split('\n').join('\n       ')}`);
  }
};

const plan = readFileSync(new URL('../../plan-clase-1.md', import.meta.url), 'utf8');
const blocks = [...plan.matchAll(/```markdown\n([\s\S]*?)```/g)].map((m) => m[1]);
const TEMPLATE = blocks.find((b) => b.startsWith('# [Nombre de la app]'));
const CABECERA_BLOCK = blocks.find((b) => b.startsWith('Construye la versión 1'));
const PLACEHOLDER = '[pegar aquí la spec completa]';

// The plan's filled example: the tablero de solicitudes values shown in the
// template ("Ej.: …"). Block 4 and two of the three escenarios have no example
// in the template, so they are written in the same spirit.
const EXAMPLE = {
  nombre: 'Tablero de solicitudes',
  paraQuien:
    'El equipo de mantenimiento recibe solicitudes por WhatsApp y las pierde. Esta app las recibe en un solo lugar y muestra en qué estado van.',
  acciones: [
    { rol: 'Cualquier persona', accion: 'registrar una solicitud con título, descripción y área' },
    { rol: 'El responsable', accion: 'cambiar el estado: nueva, en proceso, resuelta' },
    { rol: 'Cualquier persona', accion: 'ver la lista de solicitudes y su estado' },
  ],
  guarda: [
    { cosa: 'Solicitud', datos: 'título, descripción, área, fecha de creación, estado, nombre de quien la pidió' },
  ],
  roles: [
    { rol: 'Cualquier persona', puede: 'registra solicitudes y ve la lista con su estado' },
    { rol: 'El responsable', puede: 've la lista y cambia el estado de cada solicitud' },
  ],
  noHace: [
    'no envía correos ni notificaciones',
    'no tiene inicio de sesión; el responsable entra por una URL aparte',
    'no adjunta archivos',
  ],
  escenarios: [
    { quien: 'una persona', hace: 'registra una solicitud', pasa: 'aparece en la lista con estado Nueva y la fecha de hoy' },
    { quien: 'el responsable', hace: 'cambia el estado de una solicitud', pasa: 'la lista muestra el nuevo estado' },
    { quien: 'una persona', hace: 'abre la lista', pasa: 've todas las solicitudes con su estado' },
  ],
  pantallas: [{ pantalla: 'Lista', muestra: 'todas las solicitudes, la más reciente arriba, con filtro por estado' }],
};

const EXPECTED_MD = `# Tablero de solicitudes — Spec V1

## 1. Para quién y qué problema
El equipo de mantenimiento recibe solicitudes por WhatsApp y las pierde. Esta app las recibe en un solo lugar y muestra en qué estado van.

## 2. Qué hace (3 a 5 acciones, con verbo)
- Cualquier persona puede registrar una solicitud con título, descripción y área.
- El responsable puede cambiar el estado: nueva, en proceso, resuelta.
- Cualquier persona puede ver la lista de solicitudes y su estado.

## 3. Qué guarda
- Solicitud: título, descripción, área, fecha de creación, estado, nombre de quien la pidió.

## 4. Quién puede hacer qué (máximo dos roles)
- Cualquier persona: registra solicitudes y ve la lista con su estado
- El responsable: ve la lista y cambia el estado de cada solicitud

## 5. Qué NO hace (mínimo tres cosas, van a "después")
- no envía correos ni notificaciones
- no tiene inicio de sesión; el responsable entra por una URL aparte
- no adjunta archivos

## 6. Cómo sé que funciona (tres escenarios)
- Cuando una persona registra una solicitud, aparece en la lista con estado Nueva y la fecha de hoy.
- Cuando el responsable cambia el estado de una solicitud, la lista muestra el nuevo estado.
- Cuando una persona abre la lista, ve todas las solicitudes con su estado.

## 7. Pantallas (opcional, una frase cada una)
- Lista: todas las solicitudes, la más reciente arriba, con filtro por estado.
`;

const clone = (o) => JSON.parse(JSON.stringify(o));
const with_ = (patch) => ({ ...clone(EXAMPLE), ...patch });
const ids = (spec) => adivino(spec).map((h) => h.id);
const headings = (md) => md.split('\n').filter((l) => l.startsWith('#'));

// ── Plan fixtures ─────────────────────────────────────────

console.log('\nPlan fixtures');

test('the plan has the spec template and the cabecera blocks', () => {
  assert.ok(TEMPLATE, 'template block not found in plan-clase-1.md');
  assert.ok(CABECERA_BLOCK, 'cabecera block not found in plan-clase-1.md');
});

test('CABECERA is the plan text above the placeholder, verbatim', () => {
  assert.equal(CABECERA + '\n\n' + PLACEHOLDER + '\n', CABECERA_BLOCK);
});

test('BLOCKS are the seven numbered sections of the template, in order', () => {
  const planHeadings = headings(TEMPLATE).slice(1);
  assert.deepEqual(BLOCKS.map((b) => b.heading), planHeadings);
  assert.equal(BLOCKS.length, 7);
});

// ── Markdown serializer ───────────────────────────────────

console.log('\nspec → markdown');

test('the filled example serializes to the plan template, value for value', () => {
  assert.equal(specToMarkdown(EXAMPLE), EXPECTED_MD);
});

test('headings match the template headings, with the app name in the title', () => {
  const expected = headings(TEMPLATE).map((h) => h.replace('[Nombre de la app]', EXAMPLE.nombre));
  assert.deepEqual(headings(specToMarkdown(EXAMPLE)), expected);
});

test('each example line from the template appears verbatim in the output', () => {
  const md = specToMarkdown(EXAMPLE);
  const quoted = [...TEMPLATE.matchAll(/Ej\.: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(quoted.length >= 5, 'expected the template to carry its examples');
  for (const q of quoted) {
    const line = q.startsWith('El equipo') ? q : `- ${q}`;
    // Template examples are full sentences; the escenario one starts with "Cuando".
    assert.ok(md.includes(line), `missing: ${line}`);
  }
  for (const m of TEMPLATE.matchAll(/\[Ej\.: ([^\]]+)\]/g)) assert.ok(md.includes(`- ${m[1]}\n`), `missing: ${m[1]}`);
});

test('first message = plan cabecera with the spec pasted where the placeholder was', () => {
  const msg = firstMessage(EXAMPLE);
  assert.equal(msg, CABECERA_BLOCK.replace(PLACEHOLDER + '\n', EXPECTED_MD));
  assert.ok(msg.startsWith('Construye la versión 1 de esta app exactamente como está descrita abajo.\n'));
});

test('block 7 is left out when there are no pantallas (it is optional)', () => {
  const md = specToMarkdown(with_({ pantallas: [{ pantalla: '', muestra: '' }] }));
  assert.ok(!md.includes('## 7.'));
  assert.deepEqual(headings(md).slice(1), headings(TEMPLATE).slice(1, 7));
});

test('an empty spec keeps the template structure with bracket placeholders', () => {
  const md = specToMarkdown(emptySpec());
  assert.ok(md.startsWith('# [Nombre de la app] — Spec V1\n'));
  assert.deepEqual(headings(md).slice(1), headings(TEMPLATE).slice(1, 7));
  assert.ok(md.includes('- [Rol] puede [acción].'));
  assert.ok(md.includes('- Cuando [rol] hace [acción], pasa [resultado].'));
});

test('partial rows keep their missing part visible as a bracket', () => {
  const md = specToMarkdown(with_({ acciones: [{ rol: '', accion: 'registrar una solicitud' }] }));
  assert.ok(md.includes('- [Rol] puede registrar una solicitud.'));
  const md2 = specToMarkdown(with_({ escenarios: [{ quien: 'una persona', hace: 'registra algo', pasa: '' }] }));
  assert.ok(md2.includes('- Cuando una persona registra algo, pasa [resultado].'));
});

test('typing habits are normalized: "puede" twice, capitals, final dots, line breaks', () => {
  const md = specToMarkdown(
    with_({
      acciones: [{ rol: 'el responsable puede', accion: 'Puede Cambiar el estado.\n' }],
      escenarios: [{ quien: 'El responsable', hace: 'Cambia el estado', pasa: 'Se ve en la lista.' }],
      noHace: ['No adjunta archivos.'],
    }),
  );
  assert.ok(md.includes('- El responsable puede cambiar el estado.\n'), md);
  assert.ok(md.includes('- Cuando el responsable cambia el estado, se ve en la lista.\n'), md);
  assert.ok(md.includes('- No adjunta archivos\n'), md);
});

test('empty rows are skipped, not printed as blank bullets', () => {
  const s = with_({ noHace: ['a', '', '  ', 'b', 'c'] });
  const md = specToMarkdown(s);
  assert.ok(!md.includes('- \n'));
  assert.ok(md.includes('- a\n- b\n- c\n'));
});

// ── Prueba del adivino ────────────────────────────────────

console.log('\nPrueba del adivino');

test('silent on the plan filled example', () => {
  assert.deepEqual(adivino(EXAMPLE), []);
});

test('silent on the example without pantallas (block 7 is optional)', () => {
  assert.deepEqual(adivino(with_({ pantallas: [] })), []);
});

test('flags fewer than 3 acciones', () => {
  assert.ok(ids(with_({ acciones: EXAMPLE.acciones.slice(0, 2) })).includes('acciones-pocas'));
});

test('flags more than 5 acciones', () => {
  const six = Array.from({ length: 6 }, (_, i) => ({ rol: 'Cualquier persona', accion: `ver la cosa ${i}` }));
  const out = ids(with_({ acciones: six }));
  assert.ok(out.includes('acciones-muchas'));
  assert.ok(!out.includes('acciones-pocas'));
});

test('flags fewer than 3 items in qué NO hace, and an empty block', () => {
  assert.ok(ids(with_({ noHace: ['no adjunta archivos', 'no envía correos'] })).includes('no-hace-pocas'));
  assert.ok(ids(with_({ noHace: [] })).includes('no-hace-vacio'));
});

test('flags more than 2 roles', () => {
  const roles = [...EXAMPLE.roles, { rol: 'El jefe', puede: 'aprueba solicitudes' }];
  assert.ok(ids(with_({ roles })).includes('roles-muchos'));
});

test('flags more than 2 distinct roles used in the acciones', () => {
  const acciones = [...EXAMPLE.acciones, { rol: 'El jefe', accion: 'aprobar una solicitud' }];
  assert.ok(ids(with_({ acciones })).includes('roles-muchos'));
});

test('flags missing roles with the plan question', () => {
  const h = adivino(with_({ roles: [] })).find((x) => x.id === 'roles-vacio');
  assert.ok(h);
  assert.match(h.text, /quién llena y quién decide/i);
});

test('flags incomplete escenarios and fewer than 3', () => {
  const escenarios = [EXAMPLE.escenarios[0], { quien: 'el responsable', hace: 'cambia el estado', pasa: '' }];
  const out = ids(with_({ escenarios }));
  assert.ok(out.includes('escenario-incompleto'));
  assert.ok(out.includes('escenarios-pocos'));
});

test('flags "bonita" outside pantallas, and not inside pantallas', () => {
  const acciones = [...EXAMPLE.acciones.slice(0, 2), { rol: 'Cualquier persona', accion: 'ver una lista bonita' }];
  assert.ok(ids(with_({ acciones })).includes('bonita'));
  assert.ok(ids(with_({ paraQuien: EXAMPLE.paraQuien + ' Que sea bonito y moderno.' })).includes('bonita'));
  assert.ok(!ids(with_({ pantallas: [{ pantalla: 'Lista', muestra: 'bonita y clara' }] })).includes('bonita'));
});

test('flags "IA" anywhere except qué NO hace, without false hits inside words', () => {
  const acciones = [...EXAMPLE.acciones.slice(0, 2), { rol: 'Cualquier persona', accion: 'pedirle a la IA un resumen' }];
  assert.ok(ids(with_({ acciones })).includes('ia'));
  assert.ok(ids(with_({ paraQuien: EXAMPLE.paraQuien + ' Usa inteligencia artificial.' })).includes('ia'));
  assert.ok(!ids(with_({ noHace: [...EXAMPLE.noHace, 'no usa IA'] })).includes('ia'));
  assert.ok(!ids(with_({ paraQuien: EXAMPLE.paraQuien + ' Media historia del día.' })).includes('ia'));
});

test('flags "correo/correos" in acciones and escenarios, not in qué guarda or qué NO hace', () => {
  const acciones = [...EXAMPLE.acciones.slice(0, 2), { rol: 'El responsable', accion: 'enviar un correo al terminar' }];
  assert.ok(ids(with_({ acciones })).includes('correo'));
  const escenarios = [...EXAMPLE.escenarios.slice(0, 2), { quien: 'una persona', hace: 'se inscribe', pasa: 'le llegan correos' }];
  assert.ok(ids(with_({ escenarios })).includes('correo'));
  assert.ok(!ids(with_({ guarda: [{ cosa: 'Inscripción', datos: 'nombre, correo, fecha' }] })).includes('correo'));
  assert.ok(!ids(EXAMPLE).includes('correo'), 'the example says "no envía correos" in qué NO hace');
});

test('flags pagos and login with Google as integrations', () => {
  const acciones = [...EXAMPLE.acciones.slice(0, 2), { rol: 'El cliente', accion: 'pagar su pedido' }];
  assert.ok(ids(with_({ acciones })).includes('integracion'));
});

test('flags pantallas written instead of acciones', () => {
  const acciones = [...EXAMPLE.acciones.slice(0, 2), { rol: 'Cualquier persona', accion: 'una página con un formulario' }];
  assert.ok(ids(with_({ acciones })).includes('accion-pantalla'));
  const acciones2 = [...EXAMPLE.acciones.slice(0, 2), { rol: 'Cualquier persona', accion: 'pantalla de inicio' }];
  assert.ok(ids(with_({ acciones: acciones2 })).includes('accion-pantalla'));
});

test('flags acciones missing the rol or the action', () => {
  const acciones = [...EXAMPLE.acciones.slice(0, 2), { rol: '', accion: 'ver la lista' }];
  assert.ok(ids(with_({ acciones })).includes('accion-incompleta'));
});

test('flags an empty or one-line para quién and a missing name', () => {
  assert.ok(ids(with_({ paraQuien: '' })).includes('para-quien-vacio'));
  assert.ok(ids(with_({ paraQuien: 'Para mi equipo.' })).includes('para-quien-corto'));
  assert.ok(ids(with_({ nombre: '  ' })).includes('nombre-vacio'));
});

test('flags qué guarda empty or without data', () => {
  assert.ok(ids(with_({ guarda: [] })).includes('guarda-vacio'));
  assert.ok(ids(with_({ guarda: [{ cosa: 'Solicitud', datos: '' }] })).includes('guarda-incompleto'));
});

test('every hint names its block and has a kind, non-empty text', () => {
  const all = adivino(emptySpec());
  assert.ok(all.length >= 6);
  for (const h of all) {
    assert.ok(Number.isInteger(h.block) && h.block >= 0 && h.block <= 7, h.id);
    assert.ok(h.text.length > 10, h.id);
    assert.ok(!/!{2}|error|incorrect|mal hecho/i.test(h.text), `${h.id} should be kind: ${h.text}`);
  }
});

test('hintsByBlock groups hints for the inline per-block feedback', () => {
  const g = hintsByBlock(adivino(with_({ noHace: [], roles: [] })));
  assert.ok(g[5].some((h) => h.id === 'no-hace-vacio'));
  assert.ok(g[4].some((h) => h.id === 'roles-vacio'));
  assert.equal(g[1].length, 0);
});

// ── Menu prefill ──────────────────────────────────────────

console.log('\nMenú → spec');

test('prefill fills blocks 1–3 from the menu row and leaves 4–7 alone', () => {
  const start = with_({ paraQuien: '', acciones: [], guarda: [] });
  const row = MENU.find((m) => m.proyecto === 'Registro a un evento con cupo');
  const out = prefillFromMenu(start, row);
  assert.equal(out.paraQuien, row.paraQuien);
  assert.deepEqual(out.acciones.map((a) => a.accion), ['inscribirse', 'ver cupos disponibles', 'ver lista de confirmados']);
  assert.ok(out.acciones.every((a) => a.rol === ''), 'the menu has no roles: the student writes them');
  assert.deepEqual(out.guarda, [
    { cosa: 'Inscripción', datos: 'nombre, correo, fecha' },
    { cosa: 'Evento', datos: 'cupo máximo' },
  ]);
  assert.deepEqual(out.roles, start.roles);
  assert.deepEqual(out.noHace, start.noHace);
  assert.deepEqual(out.escenarios, start.escenarios);
  assert.deepEqual(out.pantallas, start.pantallas);
});

test('prefill sets the app name only when the student has none', () => {
  const row = MENU[0];
  assert.equal(prefillFromMenu(emptySpec(), row).nombre, row.proyecto);
  assert.equal(prefillFromMenu(with_({ nombre: 'Mi tablero' }), row).nombre, 'Mi tablero');
});

test('every menu row prefills exactly three acciones and at least one thing to keep', () => {
  for (const row of MENU) {
    const out = prefillFromMenu(emptySpec(), row);
    assert.equal(out.acciones.length, 3, row.proyecto);
    assert.ok(out.guarda.length >= 1 && out.guarda.every((g) => g.cosa && g.datos), row.proyecto);
  }
});

test('hasContentInBlocks tells whether a prefill would overwrite work', () => {
  assert.equal(hasContentInBlocks(emptySpec(), [1, 2, 3]), false);
  assert.equal(hasContentInBlocks(with_({ paraQuien: '', acciones: [], guarda: [{ cosa: 'x', datos: '' }] }), [1, 2, 3]), true);
});

// ── Model safety ──────────────────────────────────────────

console.log('\nModel');

test('normalizeSpec repairs a stored spec of the wrong shape', () => {
  const s = normalizeSpec({ nombre: 3, acciones: 'x', noHace: [1, null, 'ok'], escenarios: [{ quien: 1 }] });
  assert.equal(s.nombre, '3');
  assert.ok(Array.isArray(s.acciones));
  assert.deepEqual(s.noHace, ['1', '', 'ok']);
  assert.deepEqual(s.escenarios[0], { quien: '1', hace: '', pasa: '' });
  assert.deepEqual(normalizeSpec(null), emptySpec());
});

test('emptySpec starts with the rows the plan asks for', () => {
  const s = emptySpec();
  assert.equal(s.acciones.length, 3);
  assert.equal(s.roles.length, 2);
  assert.equal(s.noHace.length, 3);
  assert.equal(s.escenarios.length, 3);
  assert.ok(LIMITS.acciones >= 6, 'the UI must allow a 6th acción so the hint can show');
  assert.ok(LIMITS.roles >= 3, 'the UI must allow a 3rd role so the hint can show');
});

console.log(failures ? `\n${failures} failing\n` : '\nall passing\n');
process.exitCode = failures ? 1 : 0;
