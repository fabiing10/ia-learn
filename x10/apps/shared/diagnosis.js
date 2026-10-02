// Pure diagnosis: answers -> dimension scores -> total 0-100 -> level x1/x2/x5/x10,
// plus the personal feedback shown on /test. No DOM, no randomness, no I/O.
//
// Dimensions (0-100 each) and weights:
//   uso            30%  how often and how broadly they already use AI
//   fundamentos    25%  the three knowledge checks
//   aplicacion     25%  where they would apply it and what they would delegate
//   discernimiento 20%  traffic light, red delegations, privacy slip
//
// Levels are gated by use, not only by total, so knowing the theory without
// ever using AI cannot land above ×1 (CONTRACT: ×1 = little or no use). A gated
// score is capped to its level's band so score and level never contradict.
// ×10 needs uso ≥ 85: daily use, or weekly use that includes an advanced use
// (data, automation, agents), on top of solid fundamentals and discernment.

import { getPath, getQuestion, optionLabel, branchAnswer, labelOf } from './questions.js';

export const LEVELS = {
  x1: { key: 'x1', mult: '×1', name: 'Observador', meaning: 'Has oído de la IA y apenas empiezas a usarla.' },
  x2: { key: 'x2', mult: '×2', name: 'Explorador', meaning: 'La pruebas de vez en cuando, con instrucciones básicas.' },
  x5: { key: 'x5', mult: '×5', name: 'Practicante', meaning: 'La usas cada semana con intención, verificas y conoces sus límites.' },
  x10: { key: 'x10', mult: '×10', name: 'Multiplicador', meaning: 'La integras a tu trabajo o ministerio, delegas con criterio y enseñas a otros.' },
};
export const LEVEL_ORDER = ['x1', 'x2', 'x5', 'x10'];

export const WEIGHTS = { uso: 0.3, fundamentos: 0.25, aplicacion: 0.25, discernimiento: 0.2 };

export const DIMENSION_LABELS = {
  uso: 'Uso',
  fundamentos: 'Fundamentos',
  aplicacion: 'Aplicación',
  discernimiento: 'Discernimiento',
};

// Exactly the ids worker B creates in /playbook (CONTRACT.md).
export const PLAYBOOK_ANCHORS = [
  'bienvenida', 'que-es-la-ia', 'glosario', 'rctf', 'prompts-trabajo', 'prompts-negocio',
  'prompts-hogar', 'prompts-biblia', 'semaforo', 'investigacion-biblica', 'herramientas',
  'seguridad', 'palabra-clave', 'privacidad', 'ia-y-los-hijos', 'marco-legal',
  'ruta-30-dias', 'recursos',
];

const link = (anchor, label) => ({ href: `/playbook/#${anchor}`, anchor, label });

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const list = (v) => (Array.isArray(v) ? v : []);

const USAGE_POINTS = { nunca: 0, probado: 15, mensual: 40, semanal: 60, diario: 70 };
const ADVANCED_USES = ['datos', 'programar', 'agentes'];
const PROMPT_RIGHT = ['rol', 'contexto', 'tarea', 'formato'];
const SEMAFORO_POINTS = { amarillo: 50, rojo: 25, verde: 0 };
const CONCRETE_GOALS = ['tiempo', 'negocio', 'ministerio', 'crear'];

// ── Knowledge checks ──────────────────────────────────────

export const KNOWLEDGE = [
  {
    id: 'k_predice',
    short: 'Predice palabras',
    right: ['predice'],
    why: 'No piensa como tú. Calcula cuál es la siguiente palabra más probable, y lo hace tan bien que parece que entiende.',
    link: link('que-es-la-ia', '¿Qué es la IA?'),
  },
  {
    id: 'k_alucina',
    short: 'Alucinación',
    right: ['inventa'],
    why: 'Puede inventar datos, citas y hasta versículos, con total seguridad. Por eso siempre se verifica.',
    link: link('glosario', 'Glosario'),
  },
  {
    id: 'k_prompt',
    short: 'R·C·T·F',
    right: PROMPT_RIGHT,
    why: 'Rol, Contexto, Tarea y Formato. Si le hablas como a un empleado nuevo, con contexto y claridad, te responde como uno bueno. Y nunca le entregues cédulas, claves ni tarjetas.',
    link: link('rctf', 'La fórmula R·C·T·F'),
  },
  {
    id: 'semaforo',
    short: 'Semáforo',
    right: ['amarillo'],
    why: 'Amarillo: te puede orientar sobre un tema médico o legal, pero la decisión se toma con un profesional.',
    link: link('semaforo', 'El semáforo'),
  },
];

/** Fraction 0-1 of a knowledge item answered right (multi-select gets partial credit). */
export function knowledgeCredit(item, answer) {
  if (item.right.length === 1) return answer === item.right[0] ? 1 : 0;
  const picks = list(answer);
  const hits = picks.filter((p) => item.right.includes(p)).length;
  const wrong = picks.length - hits;
  return clamp((hits - wrong) / item.right.length, 0, 1);
}

/** Per-question review for the diagnosis screen and accuracy for the panel. */
export function gradeKnowledge(answers = {}) {
  return KNOWLEDGE.map((item) => {
    const answer = answers[item.id];
    const credit = knowledgeCredit(item, answer);
    const toLabels = (v) => list(Array.isArray(v) ? v : v ? [v] : []).map((x) => optionLabel(item.id, x));
    return {
      id: item.id,
      short: item.short,
      title: getQuestion(item.id).title,
      answered: answer !== undefined && !(Array.isArray(answer) && answer.length === 0),
      correct: credit === 1,
      credit,
      yours: toLabels(answer),
      right: item.right.map((x) => optionLabel(item.id, x)),
      why: item.why,
      link: item.link,
    };
  });
}

// ── Scoring ───────────────────────────────────────────────

function delegateOf(answers) {
  const { question, value } = branchAnswer(answers, 'delegar_');
  const option = question?.options.find((o) => o.value === value);
  return option ? { ...option, qid: question.id } : null;
}

export function scoreDimensions(answers = {}) {
  const tools = list(answers.tools);
  const uses = list(answers.usos_hoy);
  const uso =
    (USAGE_POINTS[answers.usage] ?? 0) +
    Math.min(tools.length, 3) * 5 +
    Math.min(uses.length, 3) * 3 +
    (uses.some((u) => ADVANCED_USES.includes(u)) ? 6 : 0);

  const fundamentos =
    34 * knowledgeCredit(KNOWLEDGE[0], answers.k_predice) +
    33 * knowledgeCredit(KNOWLEDGE[1], answers.k_alucina) +
    33 * knowledgeCredit(KNOWLEDGE[2], answers.k_prompt);

  const deleg = delegateOf(answers);
  const areas = list(branchAnswer(answers, 'areas_').value);
  const delegPoints = { verde: 40, amarillo: 40, rojo: 15, ninguna: 10 }[deleg?.light] ?? 0;
  const goalPoints = CONCRETE_GOALS.includes(answers.goal) ? 15 : answers.goal ? 8 : 0;
  const aplicacion = Math.min(areas.length, 3) * 15 + delegPoints + goalPoints;

  const discernimiento =
    (SEMAFORO_POINTS[answers.semaforo] ?? 0) +
    (deleg && deleg.light !== 'rojo' ? 30 : 0) +
    (answers.k_prompt !== undefined && !list(answers.k_prompt).includes('datos') ? 20 : 0);

  return {
    uso: Math.round(clamp(uso)),
    fundamentos: Math.round(clamp(fundamentos)),
    aplicacion: Math.round(clamp(aplicacion)),
    discernimiento: Math.round(clamp(discernimiento)),
  };
}

export function totalScore(scores) {
  const t = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * (scores[k] ?? 0), 0);
  return Math.round(clamp(t));
}

// Score bands per level: x1 0-29, x2 30-54, x5 55-79, x10 80-100.
export const LEVEL_CAP = { x1: 29, x2: 54, x5: 79, x10: 100 };

export function levelFor(score, scores) {
  if (score >= 80 && scores.uso >= 85 && scores.fundamentos >= 67 && scores.discernimiento >= 70) return 'x10';
  if (score >= 55 && scores.uso >= 45 && scores.discernimiento >= 50) return 'x5';
  if (score >= 30 && scores.uso >= 15) return 'x2';
  return 'x1';
}

// ── Personal feedback ─────────────────────────────────────

const ROLE_PROMPTS = {
  empresario: link('prompts-negocio', 'Prompts para tu negocio'),
  empleado: link('prompts-trabajo', 'Prompts para tu trabajo'),
  lider: link('prompts-biblia', 'Prompts para investigación bíblica'),
  estudiante: link('prompts-trabajo', 'Prompts para estudio y trabajo'),
  otro: link('prompts-hogar', 'Prompts para el hogar'),
};

const ROLE_FIELD = {
  empresario: 'tu negocio',
  empleado: 'tu trabajo',
  lider: 'tu ministerio',
  estudiante: 'tus estudios',
  otro: 'tu día a día',
};

function strengthsFor(answers, scores, knowledge) {
  const out = [];
  if (scores.uso >= 60) out.push('Ya la usas con frecuencia: tienes práctica real.');
  const k = Object.fromEntries(knowledge.map((x) => [x.id, x]));
  if (k.k_predice.correct && k.k_alucina.correct) out.push('Entiendes cómo funciona: predice palabras y puede inventar.');
  if (k.k_prompt.correct) out.push('Conoces la fórmula R·C·T·F para pedir bien.');
  if (scores.aplicacion >= 70) out.push(`Ves con claridad dónde aplicarla en ${ROLE_FIELD[answers.role] ?? 'tu vida'}.`);
  if (scores.discernimiento >= 80) out.push('Tienes criterio: sabes cuándo usarla y cuándo no.');
  if (out.length === 0) out.push('Llegaste con curiosidad y ganas de aprender: ese es el punto de partida.');
  return out.slice(0, 3);
}

function stepsFor(answers, level, deleg) {
  const role = answers.role;
  const roleLink = ROLE_PROMPTS[role] ?? ROLE_PROMPTS.otro;
  const steps = [];

  // 1 · R·C·T·F on a real task
  if (level === 'x1') {
    steps.push({
      title: 'Haz tu primer prompt con R·C·T·F',
      body: 'Abre Meta AI en WhatsApp (o la IA que tengas) y pídele algo real diciendo Rol, Contexto, Tarea y Formato.',
      links: [link('rctf', 'La fórmula R·C·T·F'), link('que-es-la-ia', '¿Qué es la IA?')],
    });
  } else if (level === 'x10') {
    steps.push({
      title: 'Multiplica: enseña R·C·T·F a alguien',
      body: 'Siéntate con una persona de tu equipo o tu grupo y resuelvan juntos una tarea real con la fórmula.',
      links: [link('rctf', 'La fórmula R·C·T·F'), link('ruta-30-dias', 'Ruta de 30 días')],
    });
  } else {
    const task =
      deleg && (deleg.light === 'verde' || deleg.light === 'amarillo')
        ? `«${deleg.label}»`
        : `una tarea real de ${ROLE_FIELD[role] ?? 'tu semana'}`;
    steps.push({
      title: 'Usa R·C·T·F en una tarea real',
      body: `Empieza por ${task}. Dile quién debe ser, tu situación, qué quieres y cómo lo quieres.`,
      links: [link('rctf', 'La fórmula R·C·T·F'), roleLink],
    });
  }

  // 2 · Verify (or rethink a red delegation)
  if (deleg?.light === 'rojo') {
    steps.push({
      title: 'Revisa el semáforo antes de delegar',
      body: `Elegiste «${deleg.label}»: eso es rojo. La IA propone; tú decides y respondes por lo que decides.`,
      links: [link('semaforo', 'El semáforo')],
    });
  } else if (role === 'lider' || answers.goal === 'ministerio' || list(answers.usos_hoy).includes('biblia')) {
    steps.push({
      title: 'Investiga con IA. Verifica con la Biblia.',
      body: 'Haz un estudio de contexto de un pasaje y confirma cada cita en tu Biblia, como los de Berea.',
      links: [link('investigacion-biblica', 'Guía de investigación bíblica')],
    });
  } else {
    steps.push({
      title: 'Verifica antes de usar',
      body: 'Pídele fuentes y confirma datos, cifras y citas en otro lado. Puede inventar con total seguridad.',
      links: [link('semaforo', 'El semáforo'), link('investigacion-biblica', 'Cómo verificar')],
    });
  }

  // 3 · Family keyword against voice scams
  steps.push({
    title: 'Acuerda una palabra clave familiar',
    body: 'Si alguien te llama con la voz de un ser querido pidiendo plata, pídele la palabra clave. Hoy una voz se puede clonar.',
    links: [link('palabra-clave', 'Palabra clave familiar'), link('seguridad', 'Seguridad')],
  });

  return steps;
}

const WORRY_NOTES = {
  voz: { text: 'Voz clonada y estafas: desconfía de llamadas urgentes pidiendo plata y usa la palabra clave familiar.', link: link('palabra-clave', 'Palabra clave') },
  empleo: { text: 'Tu empleo: la IA reemplaza tareas. El que aprende a usarla gana ventaja; tu criterio sigue siendo tuyo.', link: link('ruta-30-dias', 'Ruta de 30 días') },
  privacidad: { text: 'Privacidad: nunca le entregues cédulas, claves, tarjetas ni datos de otras personas.', link: link('privacidad', 'Privacidad') },
  engano: { text: 'Datos falsos: puede inventar con total seguridad. Verifica datos, citas y versículos.', link: link('semaforo', 'El semáforo') },
  hijos: { text: 'Tus hijos: acompáñalos y acuerden reglas claras en casa.', link: link('ia-y-los-hijos', 'IA y los hijos') },
  espiritual: { text: 'Lo espiritual: la IA no siente, no cree ni ora. Es una herramienta; el uso define el fruto.', link: link('que-es-la-ia', 'Qué es y qué no es') },
};

function fearNoteFor(answers) {
  const level = answers.fear_level;
  const worries = list(answers.worries).filter((w) => WORRY_NOTES[w]);
  if (!(level >= 4) && worries.length === 0) return null;
  const items = worries.map((w) => WORRY_NOTES[w]);
  if (level >= 4 && !items.some((i) => i.link.anchor === 'privacidad')) {
    items.push({ text: 'Usarla con cuidado empieza por no compartir lo que no compartirías con un extraño.', link: link('seguridad', 'Seguridad') });
  }
  return {
    title: level >= 4 ? 'Sobre tu temor' : 'Sobre lo que te preocupa',
    lead:
      level >= 4
        ? 'Es sensato tener cuidado. El riesgo es real; la respuesta es el discernimiento, no la ignorancia.'
        : 'Tus preocupaciones son legítimas. Esto te ayuda a usarla con tranquilidad:',
    items: items.slice(0, 4),
  };
}

/** Full diagnosis for a finished questionnaire. */
export function diagnose(answers = {}) {
  const scores = scoreDimensions(answers);
  const raw = totalScore(scores);
  const level = levelFor(raw, scores);
  const score = Math.min(raw, LEVEL_CAP[level]);
  const knowledge = gradeKnowledge(answers);
  const deleg = delegateOf(answers);
  return {
    score,
    level,
    levelInfo: LEVELS[level],
    scores,
    strengths: strengthsFor(answers, scores, knowledge),
    steps: stepsFor(answers, level, deleg),
    knowledge,
    fearNote: fearNoteFor(answers),
    roleLabel: labelOf.role(answers.role),
    pathLength: getPath(answers).length,
  };
}
