// The Obsidian vault of §7.2, built from the current profile.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ARBOL_BOVEDA, CARPETA_BOVEDA, addDays, buildVault, buildVaultZip } from './vault.js';
import { buildFiles } from './generator.js';
import { INTRO_CARGA, PERFIL_LAURA, PERFIL_VACIO } from './catalog.js';
import { blockAfter } from './plan.fixture.mjs';

const TODAY = '2026-10-19';
const CASO = '10_CASOS/CLIENTE-01 — Petición de documentos.md';
const NORMAS = ['Ley 1755 de 2015', 'Decreto 491 de 2020', 'Ley 2207 de 2022'].map((n) => `20_FUENTES/Normas/${n}.md`);
const SENTENCIA = '20_FUENTES/Sentencias/T-323 de 2024.md';
const PATHS = [
  'README.md', '00_ADN.md', '01_LINEAS_ROJAS.md', '02_PLAYBOOK.md', '03_FUENTES.md', '04_VERIFICACION.md',
  '05_TABLERO.md', CASO, ...NORMAS, SENTENCIA,
  '30_PLANTILLAS/Expediente.md', '30_PLANTILLAS/Sentencia.md', '30_PLANTILLAS/Norma.md',
  '90_ARCHIVO/LEEME.md',
];

/** Frontmatter as an ordered list of [key, value] with YAML comments removed. */
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'no frontmatter');
  return m[1].split('\n').map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).replace(/\s+#.*$/, '').trim()];
  });
}
const fm = (text) => Object.fromEntries(frontmatter(text));

test('the vault has exactly the §7.2 files and no plugin folder', () => {
  const v = buildVault(PERFIL_LAURA, { today: TODAY });
  assert.deepEqual(Object.keys(v), PATHS);
  assert.ok(Object.keys(v).every((p) => !p.includes('.obsidian')));
  assert.equal(CARPETA_BOVEDA, 'cerebro-juridico');
  for (const [p, text] of Object.entries(v)) {
    assert.ok(text.endsWith('\n'), p);
    assert.doesNotMatch(text, /undefined|NaN|\[object Object\]/, p);
  }
});

test('the profile files at the root are the generator files; 03 adds the vault index', () => {
  const v = buildVault(PERFIL_LAURA, { today: TODAY });
  const f = buildFiles(PERFIL_LAURA);
  for (const n of ['00_ADN.md', '01_LINEAS_ROJAS.md', '02_PLAYBOOK.md', '04_VERIFICACION.md']) assert.equal(v[n], f[n], n);
  assert.ok(v['03_FUENTES.md'].startsWith(f['03_FUENTES.md'].trimEnd()));
  for (const n of ['Ley 1755 de 2015', 'Decreto 491 de 2020', 'Ley 2207 de 2022', 'T-323 de 2024']) {
    assert.ok(v['03_FUENTES.md'].includes(`[[${n}]]`), n);
  }
});

test('README explains Obsidian, Dataview and Templater, with menu labels flagged', () => {
  const r = buildVault(PERFIL_LAURA, { today: TODAY })['README.md'];
  assert.ok(r.startsWith('# Cerebro jurídico de Laura\n'));
  for (const s of ['https://obsidian.md/', 'Dataview', 'Templater', '`30_PLANTILLAS`', '05_TABLERO.md', '{{VERIFICAR_MENUS_OBSIDIAN}}', INTRO_CARGA]) {
    assert.ok(r.includes(s), s);
  }
  assert.ok(r.indexOf('Obsidian') < r.indexOf('## Qué es esto'), 'Obsidian steps come first');
});

test('05_TABLERO carries the Dataview queries verbatim', () => {
  const t = buildVault(PERFIL_LAURA, { today: TODAY })['05_TABLERO.md'];
  assert.ok(t.includes(blockAfter('**Consultas Dataview: `05_TABLERO.md`**')));
});

test('CLIENTE-01 follows the expediente schema and is due in 5 days', () => {
  const c = buildVault(PERFIL_LAURA, { today: TODAY })[CASO];
  const keys = frontmatter(c).map(([k]) => k);
  assert.deepEqual(keys, ['tipo', 'cliente', 'radicado', 'despacho', 'jurisdiccion', 'tipo_actuacion', 'etapa', 'proximo_termino', 'termino_descripcion', 'confidencialidad', 'estado', 'fuentes', 'creado']);
  const f = fm(c);
  assert.equal(f.tipo, 'expediente');
  assert.equal(f.cliente, 'CLIENTE-01');
  assert.equal(f.jurisdiccion, 'constitucional');
  assert.equal(f.estado, 'activo');
  assert.equal(f.proximo_termino, '2026-10-24');
  assert.equal(f.creado, TODAY);
  assert.equal(f.fuentes, '["[[Ley 1755 de 2015]]", "[[Ley 2207 de 2022]]"]');
  assert.ok(c.includes('CLIENTE-01 radicó ante ENTIDAD-01 una petición pidiendo copia de un contrato de prestación de servicios'));
  assert.ok(c.includes('más de 10 días hábiles sin respuesta ni traslado por competencia'));
  assert.ok(c.includes('[PENDIENTE: sentencia de unificación verificada]'));
  assert.doesNotMatch(c, /\b(?:SU|T|C)-\d/, 'no sentencia number in the case');
  assert.ok(c.includes('## Verificación pendiente'));
});

test('dates: today is injected, accepts a Date, and rolls over months and years', () => {
  assert.equal(addDays('2026-12-29', 5), '2027-01-03');
  assert.equal(addDays('2026-02-26', 5), '2026-03-03');
  const c = buildVault(PERFIL_VACIO, { today: new Date(2026, 11, 29) })[CASO];
  assert.equal(fm(c).proximo_termino, '2027-01-03');
  assert.equal(fm(c).creado, '2026-12-29');
  assert.deepEqual(buildVault(PERFIL_LAURA, { today: TODAY }), buildVault(PERFIL_LAURA, { today: TODAY }));
});

test('norms and the sentencia arrive unverified, with no invented quotes', () => {
  const v = buildVault(PERFIL_LAURA, { today: TODAY });
  for (const p of NORMAS) {
    const f = fm(v[p]);
    assert.equal(f.tipo, 'norma', p);
    assert.equal(f.verificado_fecha, '""', p);
    assert.equal(f.enlace_oficial, '""', p);
    assert.match(v[p], /## Regla extraída \(en mis palabras\)\n\n\S/, p);
  }
  assert.ok(v[NORMAS[0]].includes('10 días'));
  assert.ok(v[NORMAS[1]].includes('[[Ley 2207 de 2022]]'));
  const decreto = fm(v[NORMAS[1]]);
  assert.equal(decreto.vigencia, 'modificada');
  assert.equal(decreto.modificada_por, '["[[Ley 2207 de 2022]]"]');
  assert.equal(decreto.articulos_clave, '["art. 5", "art. 6"]');
  const s = fm(v[SENTENCIA]);
  assert.equal(s.tipo, 'sentencia');
  assert.equal(s.numero, '"T-323 de 2024"');
  assert.equal(s.verificado_fecha, '""');
  assert.ok(v[SENTENCIA].includes('## Ratio decidendi (cita textual, máximo un párrafo)\n\n[PENDIENTE: pega la cita textual desde la relatoría]'));
  assert.ok(v[SENTENCIA].includes('La IA puede apoyar, no sustituir el razonamiento humano.'));
});

test('Templater templates are verbatim from §7.2', () => {
  const v = buildVault(PERFIL_LAURA, { today: TODAY });
  assert.equal(v['30_PLANTILLAS/Expediente.md'], blockAfter('**Plantilla Templater: `30_PLANTILLAS/Expediente.md`**') + '\n');
  assert.equal(v['30_PLANTILLAS/Sentencia.md'], blockAfter('**Plantilla: `30_PLANTILLAS/Sentencia.md`**') + '\n');
  assert.equal(v['30_PLANTILLAS/Norma.md'], blockAfter('**Plantilla: `30_PLANTILLAS/Norma.md`**') + '\n');
});

test('the folder tree shown to the user lists every file of the vault', () => {
  for (const p of PATHS) {
    const base = p.split('/').pop();
    assert.ok(ARBOL_BOVEDA.includes(base), base);
  }
  assert.ok(ARBOL_BOVEDA.startsWith('cerebro-juridico/'));
});

test('buildVaultZip packs the vault under cerebro-juridico/ and unzip accepts it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cj-vault-'));
  try {
    const file = join(dir, 'boveda.zip');
    writeFileSync(file, buildVaultZip(PERFIL_LAURA, { today: TODAY, date: new Date(2026, 9, 19, 12) }));
    assert.match(execFileSync('unzip', ['-t', file], { encoding: 'utf8' }), /No errors detected/);
    const l = execFileSync('unzip', ['-l', file], { encoding: 'utf8' });
    assert.ok(l.includes('cerebro-juridico/05_TABLERO.md'));
    assert.ok(l.includes('cerebro-juridico/30_PLANTILLAS/Expediente.md'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
