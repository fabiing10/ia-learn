// node --test talleres/cerebro/web/shared/brief-a-mvp.content.test.mjs
// brief-a-mvp.content.js is a verbatim copy of the workshop draft. Each export is
// compared with its file on disk (trailing newlines and CRLF normalised), so a change
// in the draft fails here until it is copied into the module.
//
// Export                                   → file under talleres/cerebro/insumos/brief-a-mvp/skill-brief-a-mvp/
// SKILL_FRONTMATTER + '\n\n' + SKILL_CUERPO → brief-a-mvp/SKILL.md
// REF_PLANTILLA_SPEC_MVP                   → brief-a-mvp/references/plantilla-spec-mvp.md
// REF_TABLA_DE_RECORTE                     → brief-a-mvp/references/tabla-de-recorte.md
// REF_PROMPTS_POR_CAPA                     → brief-a-mvp/references/prompts-por-capa.md
// REF_HERRAMIENTAS                         → brief-a-mvp/references/herramientas.md
// REF_REGLAS_DE_MESA                       → brief-a-mvp/references/reglas-de-mesa.md
// CABECERA_GPT                             → INSTRUCCIONES_GPT.md, the paragraph before its first --- rule
// README_BORRADOR                          → README.md
// EJEMPLO_BRIEF                            → brief-a-mvp/evals/semaforo-liquidaciones/prompt.md, its markdown table
// EJEMPLO_NOMBRE_BORRADOR                  → the first sentence of «Nombre y entidad» in that table

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as C from './brief-a-mvp.content.js';
import { EJEMPLO_MVP, buildMvp } from './brief-a-mvp.js';

const DRAFT = fileURLToPath(new URL('../../insumos/brief-a-mvp/skill-brief-a-mvp/', import.meta.url));
const read = (path) => readFileSync(`${DRAFT}${path}`, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');
const REFS = {
  'plantilla-spec-mvp.md': 'REF_PLANTILLA_SPEC_MVP',
  'tabla-de-recorte.md': 'REF_TABLA_DE_RECORTE',
  'prompts-por-capa.md': 'REF_PROMPTS_POR_CAPA',
  'herramientas.md': 'REF_HERRAMIENTAS',
  'reglas-de-mesa.md': 'REF_REGLAS_DE_MESA',
};
const tabla = (text) => {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('|'));
  const end = lines.findIndex((l, i) => i > start && !l.startsWith('|'));
  return lines.slice(start, end < 0 ? lines.length : end).join('\n');
};

test('SKILL.md: front matter and body are the draft file', () => {
  assert.equal(`${C.SKILL_FRONTMATTER}\n\n${C.SKILL_CUERPO}`, read('brief-a-mvp/SKILL.md'));
});

test('the five references are the draft files', () => {
  for (const [file, name] of Object.entries(REFS)) assert.equal(C[name], read(`brief-a-mvp/references/${file}`), file);
});

test('CABECERA_GPT is the paragraph of INSTRUCCIONES_GPT.md before its first rule', () => {
  const gpt = read('INSTRUCCIONES_GPT.md');
  assert.equal(C.CABECERA_GPT, gpt.slice(0, gpt.indexOf('\n---\n')).trim());
});

test('README_BORRADOR is the draft README.md', () => {
  assert.equal(C.README_BORRADOR, read('README.md'));
});

test('EJEMPLO_BRIEF is the table of the semaforo-liquidaciones eval, and the draft example is named by it', () => {
  const prompt = read('brief-a-mvp/evals/semaforo-liquidaciones/prompt.md');
  assert.equal(C.EJEMPLO_BRIEF, tabla(prompt));
  const nombre = C.EJEMPLO_BRIEF.split('\n').find((l) => l.startsWith('| Nombre y entidad |'));
  assert.ok(nombre.startsWith(`| Nombre y entidad | ${C.EJEMPLO_NOMBRE_BORRADOR}. `));
});

test('front matter: name brief-a-mvp, a description claude.ai accepts (≤ 200 characters, one line, no angle brackets)', () => {
  const m = C.SKILL_FRONTMATTER.match(/^---\nname: (.+)\ndescription: "(.+)"\n---$/);
  assert.ok(m, 'two keys, description quoted on one line');
  assert.equal(m[1], 'brief-a-mvp');
  const description = m[2];
  assert.ok([...description].length <= 200, `description has ${[...description].length} characters`);
  assert.ok(description.length <= 200, 'also in UTF-16 units');
  assert.doesNotMatch(description, /[<>"]/);
});

test('the draft INSTRUCCIONES_GPT.md is cabecera, SKILL body and the references, in the order the generator follows', () => {
  const gpt = read('INSTRUCCIONES_GPT.md');
  const parts = gpt.split('\n---\n').map((p) => p.trim());
  assert.equal(parts[0], C.CABECERA_GPT);
  assert.equal(parts[1], C.SKILL_CUERPO);
  const drafted = parts.slice(2).map((p) => {
    const m = p.match(/^<!-- references\/(\S+) -->\n+([\s\S]*)$/);
    assert.ok(m, `reference block with its comment: ${p.slice(0, 60)}`);
    assert.equal(m[2], C[REFS[m[1]]], m[1]);
    return m[1];
  });
  assert.deepEqual(drafted.sort(), Object.keys(REFS).sort(), 'the five references, once each');
  const order = (text) => [...text.matchAll(/^<!-- references\/(\S+) -->$/gm)].map((x) => x[1]);
  assert.deepEqual(order(buildMvp(EJEMPLO_MVP)['INSTRUCCIONES_GPT.md']), order(gpt), 'the generated file keeps the draft order');
});
