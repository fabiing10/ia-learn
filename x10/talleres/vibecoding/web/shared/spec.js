// The one-page spec (plan-clase-1.md, "Plantilla: spec de una página"):
// the seven blocks, the markdown serializer, the first message with the
// instrucción de cabecera, the prueba del adivino rules and the menu prefill.
// Pure functions, no DOM: spec.test.mjs runs them with plain node.

/** Instrucción de cabecera, verbatim. The spec goes under it, after a blank line. */
export const CABECERA = [
  'Construye la versión 1 de esta app exactamente como está descrita abajo.',
  'No agregues funciones que no estén en la spec. Si algo no está claro, pregúntame antes de construir.',
  'Los datos deben guardarse en una base de datos, no en la memoria del navegador.',
  'Cuando termines, dime cómo pruebo cada uno de los tres escenarios de la sección 6.',
].join('\n');

/**
 * The seven blocks. `heading` is the template line; `guide` is the plan's
 * instruction for that block during bloque 4 of the class.
 */
export const BLOCKS = [
  {
    n: 1,
    key: 'paraQuien',
    title: 'Para quién y qué problema',
    heading: '## 1. Para quién y qué problema',
    guide: 'Un párrafo. Quién la usa y qué le resuelve.',
  },
  {
    n: 2,
    key: 'acciones',
    title: 'Qué hace',
    heading: '## 2. Qué hace (3 a 5 acciones, con verbo)',
    guide: 'Tres acciones con verbo ("registra una solicitud", "cambia el estado", "ve la lista"). Máximo cinco.',
  },
  {
    n: 3,
    key: 'guarda',
    title: 'Qué guarda',
    heading: '## 3. Qué guarda',
    guide: 'Las "cosas" y sus datos (una solicitud tiene: título, descripción, fecha, estado, quién la pidió).',
  },
  {
    n: 4,
    key: 'roles',
    title: 'Quién puede hacer qué',
    heading: '## 4. Quién puede hacer qué (máximo dos roles)',
    guide: '¿Quién llena y quién decide? Dos roles como máximo. Si es la misma persona, un rol basta, y lo escribes.',
  },
  {
    n: 5,
    key: 'noHace',
    title: 'Qué NO hace',
    heading: '## 5. Qué NO hace (mínimo tres cosas, van a "después")',
    guide: 'Mínimo tres cosas que quisieras y que van a "después". Aquí se recorta: si las acciones pasan de cinco, lo que sobra baja a esta lista.',
  },
  {
    n: 6,
    key: 'escenarios',
    title: 'Cómo sé que funciona',
    heading: '## 6. Cómo sé que funciona (tres escenarios)',
    guide: 'Tres escenarios: "Cuando [rol] hace [acción], pasa [resultado]". Uno por acción principal. Son las pruebas cuando construyas.',
  },
  {
    n: 7,
    key: 'pantallas',
    title: 'Pantallas',
    heading: '## 7. Pantallas (opcional, una frase cada una)',
    guide: 'Opcional: nadie se detiene por él. Una frase por pantalla.',
    optional: true,
  },
];

/** Most rows the builder offers per list. Above the plan's limits on purpose: the adivino explains the limit. */
export const LIMITS = { acciones: 8, guarda: 5, roles: 4, noHace: 8, escenarios: 5, pantallas: 6 };

const ROW_SHAPE = {
  acciones: ['rol', 'accion'],
  guarda: ['cosa', 'datos'],
  roles: ['rol', 'puede'],
  escenarios: ['quien', 'hace', 'pasa'],
  pantallas: ['pantalla', 'muestra'],
};

const MAX_FIELD = 600;
const MAX_PARAGRAPH = 2000;

const emptyRow = (key) => Object.fromEntries(ROW_SHAPE[key].map((f) => [f, '']));
const rows = (key, n) => Array.from({ length: n }, () => emptyRow(key));

export function emptySpec() {
  return {
    nombre: '',
    paraQuien: '',
    acciones: rows('acciones', 3),
    guarda: rows('guarda', 1),
    roles: rows('roles', 2),
    noHace: ['', '', ''],
    escenarios: rows('escenarios', 3),
    pantallas: rows('pantallas', 1),
  };
}

const str = (v, max = MAX_FIELD) => (v === null || v === undefined ? '' : String(v)).slice(0, max);

/** Repairs anything read back from localStorage into a valid spec. */
export function normalizeSpec(raw) {
  const base = emptySpec();
  if (!raw || typeof raw !== 'object') return base;
  const out = { nombre: str(raw.nombre, 120), paraQuien: str(raw.paraQuien, MAX_PARAGRAPH) };
  for (const key of Object.keys(ROW_SHAPE)) {
    const list = Array.isArray(raw[key]) ? raw[key].slice(0, LIMITS[key]) : null;
    out[key] = list
      ? list.map((r) => Object.fromEntries(ROW_SHAPE[key].map((f) => [f, str(r && typeof r === 'object' ? r[f] : '')])))
      : base[key];
  }
  out.noHace = Array.isArray(raw.noHace) ? raw.noHace.slice(0, LIMITS.noHace).map((v) => str(v)) : base.noHace;
  return out;
}

// ── Text helpers ──────────────────────────────────────────

const line = (s) => str(s).replace(/\s+/g, ' ').trim();
const stripEnd = (s) => s.replace(/[\s.;,:]+$/u, '');
const clean = (s) => stripEnd(line(s));
const upperFirst = (s) => (s ? s[0].toLocaleUpperCase('es') + s.slice(1) : s);
/** Lowercases the first letter unless the word looks like an acronym (IA, CSV). */
const lowerFirst = (s) => (s && !(s.length > 1 && /\p{Lu}/u.test(s[1])) ? s[0].toLocaleLowerCase('es') + s.slice(1) : s);
const DETERMINERS = /^(el|la|los|las|un|una|unos|unas|cualquier|cada|todo|toda|todos|todas|alguien|quien|nadie|mi|tu|su)\b/iu;
const paragraph = (s) =>
  str(s, MAX_PARAGRAPH)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const filled = (row) => Object.values(row).some((v) => line(v));
const filledRows = (list) => (Array.isArray(list) ? list.filter(filled) : []);
const filledItems = (list) => (Array.isArray(list) ? list.filter((v) => line(v)) : []);

// Normalized pieces of each row, shared by the serializer and the rules.
const accionParts = (a) => ({
  rol: upperFirst(clean(a.rol).replace(/\s+puede$/iu, '')),
  accion: lowerFirst(clean(a.accion).replace(/^puede\s+/iu, '')),
});
const escenarioParts = (e) => {
  const quien = clean(e.quien).replace(/^cuando\s+/iu, '');
  return {
    quien: DETERMINERS.test(quien) ? lowerFirst(quien) : quien,
    hace: lowerFirst(clean(e.hace)),
    pasa: lowerFirst(clean(e.pasa)),
  };
};

// ── Markdown ──────────────────────────────────────────────

const SERIALIZE = {
  paraQuien: (s) => paragraph(s.paraQuien) || '[Un párrafo. Quién la usa y qué le resuelve.]',
  acciones: (s) =>
    list(s.acciones, '- [Rol] puede [acción].', (a) => {
      const p = accionParts(a);
      return `- ${p.rol || '[Rol]'} puede ${p.accion || '[acción]'}.`;
    }),
  guarda: (s) =>
    list(s.guarda, '- [Cosa]: [sus datos].', (g) => `- ${upperFirst(clean(g.cosa)) || '[Cosa]'}: ${clean(g.datos) || '[sus datos]'}.`),
  roles: (s) =>
    list(s.roles, '- [Rol 1]: [qué ve y qué puede hacer]', (r) => `- ${upperFirst(clean(r.rol)) || '[Rol]'}: ${clean(r.puede) || '[qué ve y qué puede hacer]'}`),
  noHace: (s) => filledItems(s.noHace).map((x) => `- ${clean(x)}`).join('\n') || '- [Algo que quisieras y que va a "después"]',
  escenarios: (s) =>
    list(s.escenarios, '- Cuando [rol] hace [acción], pasa [resultado].', (e) => {
      const p = escenarioParts(e);
      return `- Cuando ${p.quien || '[rol]'} ${p.hace || 'hace [acción]'}, ${p.pasa || 'pasa [resultado]'}.`;
    }),
  pantallas: (s) =>
    list(s.pantallas, '', (p) => `- ${upperFirst(clean(p.pantalla)) || '[Pantalla]'}: ${clean(p.muestra) || '[qué muestra]'}.`),
};

function list(items, empty, fmt) {
  const f = filledRows(items);
  return f.length ? f.map(fmt).join('\n') : empty;
}

/** The spec in the plan's markdown format. Block 7 is left out while empty. */
export function specToMarkdown(spec) {
  const s = normalizeSpec(spec);
  const parts = [`# ${line(s.nombre) || '[Nombre de la app]'} — Spec V1`];
  for (const b of BLOCKS) {
    const body = SERIALIZE[b.key](s);
    if (!body) continue;
    parts.push(`${b.heading}\n${body}`);
  }
  return parts.join('\n\n') + '\n';
}

/** What the student pastes into the tool: cabecera, blank line, spec. */
export function firstMessage(spec) {
  return `${CABECERA}\n\n${specToMarkdown(spec)}`;
}

// ── Prueba del adivino ────────────────────────────────────
// Each rule returns hints { id, block, text }. Hints never block anything:
// they are the list of what the AI would have to guess.

const word = (alts) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts})(?![\\p{L}\\p{N}])`, 'iu');
const RX = {
  bonita: word('bonit[oa]s?|lind[oa]s?|hermos[oa]s?|atractiv[oa]s?|modern[oa]s?|elegantes?|bell[oa]s?|chever[ea]s?'),
  ia: word('ia|i\\.a\\.|inteligencia artificial|chat ?bots?|chatgpt|gpt'),
  correo: word('correos?|e-?mails?|mails?|notificaci[oó]n(?:es)?|notificar|sms|whatsapp|mensajes? de texto'),
  integracion: word(
    'pag(?:o|os|ar|a|ue)|cobr(?:o|os|ar|a)|pasarela(?: de pagos?)?|(?:inicio de sesi[oó]n|iniciar sesi[oó]n|login|ingresar|entrar|registrarse) con google',
  ),
  pantallaStart: /^(?:(?:un|una|unos|unas|el|la|los|las|mi|tu|su)\s|(?:p[aá]gina|pantalla|formulario|bot[oó]n|secci[oó]n|vista|men[uú]|dashboard|landing|interfaz|dise[ñn]o)(?![\p{L}]))/iu,
  pantallaHave: /^(?:tener|hacer|crear|mostrar)\s+(?:un|una)\s+(?:p[aá]gina|pantalla|formulario|bot[oó]n|secci[oó]n|vista|men[uú])/iu,
};

const ordinal = (i) => `${i + 1}`;
const plural = (n, one, many) => (n === 1 ? one : many);

/** Text of each block, for the vocabulary traps. */
function blockTexts(s) {
  return {
    1: paragraph(s.paraQuien),
    2: filledRows(s.acciones).map((a) => `${a.rol} ${a.accion}`).join(' \n '),
    3: filledRows(s.guarda).map((g) => `${g.cosa} ${g.datos}`).join(' \n '),
    4: filledRows(s.roles).map((r) => `${r.rol} ${r.puede}`).join(' \n '),
    5: filledItems(s.noHace).join(' \n '),
    6: filledRows(s.escenarios).map((e) => `${e.quien} ${e.hace} ${e.pasa}`).join(' \n '),
    7: filledRows(s.pantallas).map((p) => `${p.pantalla} ${p.muestra}`).join(' \n '),
  };
}

const TRAPS = [
  {
    id: 'bonita',
    rx: RX.bonita,
    blocks: [1, 2, 3, 4, 6],
    text: '"Que sea bonita" no es una acción: va a pantallas (bloque 7), y la herramienta ya la hace razonable.',
  },
  {
    id: 'ia',
    rx: RX.ia,
    blocks: [1, 2, 3, 4, 6, 7],
    text: '"Y que tenga IA" va a "después", salvo que sea la acción principal. Hoy se construye la base.',
  },
  {
    id: 'correo',
    rx: RX.correo,
    blocks: [2, 4, 6],
    text: 'Enviar correos, mensajes o notificaciones es una integración: va a "después". En 40 minutos no cabe.',
  },
  {
    id: 'integracion',
    rx: RX.integracion,
    blocks: [2, 4, 6],
    text: 'Pagos e inicio de sesión con Google son integraciones: fuera de hoy, van a "después".',
  },
];

const roleKey = (r) => clean(r).toLocaleLowerCase('es').replace(/^(el|la|los|las|un|una|cualquier)\s+/u, '');

export function adivino(spec) {
  const s = normalizeSpec(spec);
  const hints = [];
  const add = (block, id, text) => hints.push({ id, block, text });

  // Título
  if (!line(s.nombre)) add(0, 'nombre-vacio', 'Ponle un nombre a tu app. Va en el título de la spec.');

  // 1 · Para quién y qué problema
  const pq = paragraph(s.paraQuien);
  if (!pq) add(1, 'para-quien-vacio', 'Escribe un párrafo: quién la usa y qué le resuelve. Sin esto, la IA adivina para quién es.');
  else if (pq.split(/\s+/).length < 12)
    add(1, 'para-quien-corto', 'Cuenta un poco más: quién la usa y qué problema le resuelve hoy. Un párrafo corto basta.');

  // 2 · Qué hace
  const acciones = filledRows(s.acciones);
  acciones.forEach((a, i) => {
    const p = accionParts(a);
    if (!p.rol || !p.accion) {
      const falta = !p.rol ? 'quién la hace (el rol)' : 'qué hace (la acción con verbo)';
      add(2, 'accion-incompleta', `A la acción ${ordinal(i)} le falta ${falta}. Formato: "[Rol] puede [acción]".`);
    }
    if (p.accion && (RX.pantallaStart.test(p.accion) || RX.pantallaHave.test(p.accion))) {
      add(
        2,
        'accion-pantalla',
        `La acción ${ordinal(i)} describe una pantalla o una cosa, no lo que alguien hace. Escríbela con verbo, por ejemplo "registrar una solicitud". Las pantallas van en el bloque 7.`,
      );
    }
  });
  if (acciones.length < 3) {
    add(2, 'acciones-pocas', `Llevas ${acciones.length} ${plural(acciones.length, 'acción', 'acciones')}. La V1 necesita tres acciones con verbo (máximo cinco).`);
  } else if (acciones.length > 5) {
    add(2, 'acciones-muchas', `Tienes ${acciones.length} acciones. El máximo es cinco: lo que sobra baja a "Qué NO hace" y va a "después".`);
  }

  // 3 · Qué guarda
  const guarda = filledRows(s.guarda);
  if (!guarda.length) {
    add(3, 'guarda-vacio', '¿Qué guarda la app? Escribe las "cosas" y sus datos (una solicitud tiene: título, descripción, fecha, estado, quién la pidió).');
  }
  guarda.forEach((g, i) => {
    if (!clean(g.cosa)) add(3, 'guarda-incompleto', `En la fila ${ordinal(i)} de "Qué guarda" falta la cosa (solicitud, reserva, caso…).`);
    else if (!clean(g.datos)) add(3, 'guarda-incompleto', `A "${clean(g.cosa)}" le faltan sus datos: ¿qué se anota de cada una?`);
  });

  // 4 · Quién puede hacer qué
  const roles = filledRows(s.roles);
  const accionRoles = new Set(acciones.map((a) => roleKey(a.rol)).filter(Boolean));
  const nRoles = Math.max(roles.length, accionRoles.size);
  if (!roles.length) {
    add(4, 'roles-vacio', 'Sin roles, la IA adivina. ¿Quién llena y quién decide? Si es la misma persona, un rol basta, y lo escribes.');
  }
  if (nRoles > 2) {
    const donde = roles.length > 2 ? '' : ' en tus acciones';
    add(4, 'roles-muchos', `Hay ${nRoles} roles${donde}. Máximo dos en la V1: los demás van a "después".`);
  }
  roles.forEach((r, i) => {
    if (!clean(r.rol)) add(4, 'rol-incompleto', `En la fila ${ordinal(i)} de roles falta el nombre del rol.`);
    else if (!clean(r.puede)) add(4, 'rol-incompleto', `A "${clean(r.rol)}" le falta qué ve y qué puede hacer.`);
  });

  // 5 · Qué NO hace
  const noHace = filledItems(s.noHace);
  if (!noHace.length) {
    add(5, 'no-hace-vacio', 'Sin "Qué NO hace" la spec no está lista. Es el bloque que más se salta y el que más cuesta saltarse.');
  } else if (noHace.length < 3) {
    add(5, 'no-hace-pocas', `Llevas ${noHace.length} en "Qué NO hace". Mínimo tres cosas que quisieras y que van a "después".`);
  }

  // 6 · Cómo sé que funciona
  const escenarios = filledRows(s.escenarios);
  escenarios.forEach((e, i) => {
    const p = escenarioParts(e);
    const falta = [!p.quien && 'quién (el rol)', !p.hace && 'qué hace', !p.pasa && 'qué pasa (el resultado)'].filter(Boolean);
    if (falta.length) {
      add(6, 'escenario-incompleto', `Al escenario ${ordinal(i)} le falta ${falta.join(' y ')}. Formato: "Cuando [rol] hace [acción], pasa [resultado]".`);
    }
  });
  if (escenarios.length < 3) {
    add(6, 'escenarios-pocos', `Llevas ${escenarios.length} ${plural(escenarios.length, 'escenario', 'escenarios')}. Son tres, uno por acción principal: son las pruebas cuando construyas.`);
  }

  // 7 · Pantallas (opcional)
  filledRows(s.pantallas).forEach((p, i) => {
    if (!clean(p.pantalla) || !clean(p.muestra)) {
      add(7, 'pantalla-incompleta', `La pantalla ${ordinal(i)} necesita nombre y una frase de qué muestra. Si no la necesitas, bórrala: este bloque es opcional.`);
    }
  });

  // Vocabulary traps (trampas frecuentes), once per block where they appear.
  const texts = blockTexts(s);
  for (const trap of TRAPS) {
    for (const b of trap.blocks) if (trap.rx.test(texts[b])) add(b, trap.id, trap.text);
  }

  return hints.sort((a, b) => a.block - b.block);
}

export function hintsByBlock(hints) {
  const out = Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map((n) => [n, []]));
  for (const h of hints) out[h.block].push(h);
  return out;
}

// ── Menu prefill ──────────────────────────────────────────

/** Fills blocks 1–3 (and the name, if empty) from a row of the menú de proyectos. */
export function prefillFromMenu(spec, row) {
  const s = normalizeSpec(spec);
  return {
    ...s,
    nombre: line(s.nombre) ? s.nombre : row.proyecto,
    paraQuien: row.paraQuien,
    acciones: row.acciones.map((a) => ({ rol: '', accion: lowerFirst(a.trim()) })),
    guarda: row.guarda.split(';').map((part) => {
      const [cosa, ...rest] = part.split(':');
      return { cosa: upperFirst(cosa.trim()), datos: rest.join(':').trim() };
    }),
  };
}

/** True when any of the given blocks (1–7) already has text. */
export function hasContentInBlocks(spec, blockNumbers) {
  const s = normalizeSpec(spec);
  return blockNumbers.some((n) => {
    const key = BLOCKS[n - 1].key;
    const v = s[key];
    if (key === 'paraQuien') return !!line(v);
    if (key === 'noHace') return filledItems(v).length > 0;
    return filledRows(v).length > 0;
  });
}

/** File-name friendly slug of the app name. */
export function specSlug(spec) {
  const slug = line(spec?.nombre)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'mi-app';
}
