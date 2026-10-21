// node --test 'talleres/cerebro/web/shared/*.test.mjs'
// Each chosen task becomes an installable skill: a ZIP whose root is the skill
// folder with SKILL.md (Claude: Customize > Skills > + > upload; open Agent Skills
// spec: name lowercase-hyphen ≤ 64 matching the folder; Claude caps the
// description at 200 characters). Checked against both on 20 Oct 2026.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSkills, skillZip } from './skills.js';
import { CONFIDENCIALIDAD, PERFIL_LAURA, PERFIL_VACIO, TAREAS, TONOS } from './catalog.js';

const laura = () => ({ ...PERFIL_LAURA, areas: [...PERFIL_LAURA.areas], tareas: [...PERFIL_LAURA.tareas], herramientas: [...PERFIL_LAURA.herramientas] });

/** YAML frontmatter → { name, description } (double-quoted scalars are JSON strings). */
function frontmatter(md) {
  const m = md.match(/^---\nname: (.+)\ndescription: (.+)\n---\n/);
  assert.ok(m, 'frontmatter with name and description first');
  return { name: m[1], description: JSON.parse(m[2]) };
}

test('one skill per chosen task, in the order of the playbook', () => {
  const skills = buildSkills(laura());
  assert.deepEqual(skills.map((s) => s.tarea), ['contratos', 'jurisprudencia', 'peticiones']);
  assert.deepEqual(buildSkills(PERFIL_VACIO), []);
});

test('every task has a spec-valid slug and a description Claude accepts', () => {
  const slugs = new Set();
  for (const t of TAREAS) {
    const { slug, descripcion } = t.skill;
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, t.id);
    assert.ok(slug.length <= 64, `${t.id} slug length`);
    assert.ok(!slugs.has(slug), `${t.id} slug unique`);
    slugs.add(slug);
    assert.ok(descripcion.length > 40 && descripcion.length <= 200, `${t.id} description is ${descripcion.length} chars`);
    assert.doesNotMatch(descripcion, /\n/, t.id);
  }
});

test('SKILL.md: frontmatter, the procedure, the always-on rules and the closing', () => {
  for (const s of buildSkills({ ...laura(), tareas: TAREAS.map((t) => t.id).slice(0, 3) })) {
    const t = TAREAS.find((x) => x.id === s.tarea);
    const fm = frontmatter(s.contenido);
    assert.equal(fm.name, t.skill.slug);
    assert.equal(fm.name, s.carpeta);
    assert.equal(fm.description, t.skill.descripcion);
    assert.ok(s.contenido.includes(`# ${t.skill.titulo}`), 'title');
    assert.ok(s.contenido.includes(t.skill.texto), 'procedure verbatim');
    for (const k of ['YO DECIDO', 'Verificación pendiente', 'enlace oficial', '[NO VERIFICADO]', '02_PLAYBOOK.md']) {
      assert.ok(s.contenido.includes(k), `${s.tarea}: ${k}`);
    }
    assert.ok(s.contenido.endsWith('\n') && !s.contenido.endsWith('\n\n'));
    assert.doesNotMatch(s.contenido, /undefined|null|NaN|\[object Object\]/);
  }
});

test('the contracts skill carries the positions table: the criterion search cannot find', () => {
  const [contratos] = buildSkills(laura());
  assert.ok(contratos.contenido.includes('| Limitación de responsabilidad | Tope igual al valor del contrato, recíproco |'));
  assert.ok(contratos.contenido.includes('Mis posiciones'));
});

test('the contracts skill carries the lawyer positions and the city', () => {
  const [s] = buildSkills({ ...laura(), ciudad: 'Cali', posiciones: { datos: 'transmision' } });
  assert.ok(s.contenido.includes('| Datos personales | Roles definidos (responsable / encargado) y contrato de transmisión firmado |'));
  assert.ok(!s.contenido.includes('| Datos personales | Roles definidos (responsable / encargado) conforme a la Ley 1581 de 2012 |'));
  assert.ok(s.contenido.includes('Ejerzo en Cali'));
});

test('the skill speaks for the profile: name, role, confidentiality rule and tone', () => {
  for (const conf of CONFIDENCIALIDAD) {
    for (const tono of TONOS) {
      const [s] = buildSkills({ ...laura(), confidencialidad: conf.id, tono: tono.id });
      assert.ok(s.contenido.includes('Laura'), 'name');
      assert.ok(s.contenido.includes('abogado/a litigante con práctica propia'), 'role');
      assert.ok(s.contenido.includes(conf.sistema), conf.id);
      assert.ok(s.contenido.includes(tono.instruccion), tono.id);
    }
  }
  const [anon] = buildSkills({ ...PERFIL_VACIO, tareas: ['conceptos'] });
  assert.ok(!anon.contenido.includes('Llámame'));
  assert.doesNotMatch(anon.contenido, /undefined|null/);
});

test('skillZip: the ZIP root is the skill folder with SKILL.md inside (checked with unzip)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cj-skill-'));
  try {
    const [s] = buildSkills(laura());
    const file = join(dir, `${s.carpeta}.zip`);
    writeFileSync(file, skillZip(s, { date: new Date(2026, 9, 20, 22, 0, 0) }));
    const listing = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n');
    assert.deepEqual(listing.sort(), [`${s.carpeta}/`, `${s.carpeta}/SKILL.md`].sort());
    execFileSync('unzip', ['-q', file, '-d', join(dir, 'out')]);
    assert.deepEqual(readdirSync(join(dir, 'out')), [s.carpeta]);
    assert.equal(readFileSync(join(dir, 'out', s.carpeta, 'SKILL.md'), 'utf8'), s.contenido);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
