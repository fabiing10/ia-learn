// Profile → installable skills, one per chosen task. Format checked on 20 Oct 2026
// against support.claude.com (12512198: folder with skill.md, YAML name ≤ 64 and
// description ≤ 200, ZIP whose root is the folder) and the open Agent Skills spec
// (agentskills.io: SKILL.md, name lowercase-hyphen matching the folder).
// Pure ES module, like generator.js.

import { zip } from './zip.js';
import { REGLA_CITAS, REGLA_FUENTES, resolve, skillTexto } from './generator.js';

const ucFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** "2. Fuentes: texto" → "Texto" (the rule without its number and label). */
const ruleBody = (rule) => rule.replace(/^\d+\.\s+[^:]+:\s*/, '');
const list = (items) => items.map((i) => `- ${i}`).join('\n');

function skillMd(t, r) {
  const { p, rol, conf, tono } = r;
  const { titulo, slug, descripcion, cuando } = t.skill;
  const texto = skillTexto(t, p);
  const quien = `Soy ${rol ? rol.sistema : 'abogado/a'} y trabajo en Colombia.${p.ciudad ? ` Ejerzo en ${p.ciudad}.` : ''}${p.nombre ? ` Llámame ${p.nombre}.` : ''}`;
  return [
    '---',
    `name: ${slug}`,
    // A JSON string is a valid YAML double-quoted scalar: colons and quotes stay safe.
    `description: ${JSON.stringify(descripcion)}`,
    '---',
    '',
    `# ${titulo}`,
    '',
    `Skill de mi cerebro jurídico. ${quien}`,
    '',
    '## Cuándo usarla',
    '',
    cuando ? ucFirst(cuando) : descripcion,
    '',
    '## Pasos',
    '',
    texto,
    '',
    '## Reglas que siempre aplican',
    '',
    list([
      'Jurisdicción por defecto: Colombia. Si usas derecho comparado o doctrina extranjera, márcalo como tal.',
      ruleBody(REGLA_FUENTES),
      ruleBody(REGLA_CITAS),
      `Confidencialidad: ${conf.sistema}`,
      'Si mi cerebro jurídico (00_ADN.md a 04_VERIFICACION.md) está cargado en el Proyecto o en el chat, úsalo primero: mis posiciones en 02_PLAYBOOK.md van antes que la práctica general.',
      'Detente en cada punto YO DECIDO y devuélveme la decisión.',
      'Termina con una sección "Verificación pendiente" que liste lo que debo confirmar. Nunca presentes un borrador como definitivo: yo firmo, radico y decido.',
    ]),
    '',
    '## Formato',
    '',
    `${tono.instruccion}. ${tono.formato}.`,
    '',
  ].join('\n');
}

/** [{ tarea, carpeta, titulo, contenido }] for the chosen tasks, playbook order. */
export function buildSkills(raw) {
  const r = resolve(raw);
  return r.tareas.map((t) => ({
    tarea: t.id,
    carpeta: t.skill.slug,
    titulo: t.skill.titulo,
    contenido: skillMd(t, r),
  }));
}

/** One skill as ZIP bytes: `<carpeta>/SKILL.md`, ready to upload to Claude. */
export function skillZip(skill, { date = new Date() } = {}) {
  return zip([{ name: `${skill.carpeta}/SKILL.md`, data: skill.contenido }], { date });
}
