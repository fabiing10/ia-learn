// The Obsidian vault of plan §7.2: the profile files at the root plus a dashboard,
// the CLIENTE-01 example case, unverified source notes and the Templater
// templates. No `.obsidian/` folder and no plugin code: the README tells the
// lawyer how to install Dataview and Templater. `today` is injected so the case
// is always due in five days from the download, and tests stay deterministic.

import { buildFiles, buildReadme } from './generator.js';
import { zip } from './zip.js';

export const CARPETA_BOVEDA = 'cerebro-juridico';
const F = '```';

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' (or a Date, read in local time) plus `days`, as 'YYYY-MM-DD'. */
export function addDays(day, days) {
  const [y, m, d] =
    day instanceof Date ? [day.getFullYear(), day.getMonth() + 1, day.getDate()] : String(day).split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export const ARBOL_BOVEDA = `cerebro-juridico/
├── README.md           ← cómo abrirla y usarla
├── 00_ADN.md
├── 01_LINEAS_ROJAS.md
├── 02_PLAYBOOK.md
├── 03_FUENTES.md       ← índice de 20_FUENTES/
├── 04_VERIFICACION.md
├── 05_TABLERO.md       ← consultas Dataview
├── 10_CASOS/
│   └── CLIENTE-01 — Petición de documentos.md
├── 20_FUENTES/
│   ├── Normas/
│   │   ├── Ley 1755 de 2015.md
│   │   ├── Decreto 491 de 2020.md
│   │   └── Ley 2207 de 2022.md
│   └── Sentencias/
│       └── T-323 de 2024.md
├── 30_PLANTILLAS/
│   ├── Expediente.md
│   ├── Sentencia.md
│   └── Norma.md
└── 90_ARCHIVO/
    └── LEEME.md        ← casos cerrados`;

const OBSIDIAN = `## Esta bóveda en Obsidian

Obsidian es una aplicación de notas gratuita, también para uso comercial, que trabaja sobre una carpeta de archivos Markdown en tu propio equipo. Sin cuenta, sin servidor. Dos complementos la convierten en un sistema de expedientes: Templater (plantillas que se llenan solas) y Dataview (consultas sobre los metadatos de las notas, como "términos que vencen esta semana"). La bóveda no trae complementos preinstalados: los instalas tú desde Obsidian, así sabes qué código corre en tu equipo.

1. Instala Obsidian desde https://obsidian.md/.
2. Descomprime este ZIP. En Obsidian elige "Abrir carpeta como bóveda" y selecciona la carpeta \`cerebro-juridico\`. {{VERIFICAR_MENUS_OBSIDIAN}}
3. Ve a Ajustes → Complementos comunitarios, actívalos y, desde la lista oficial de complementos comunitarios, instala y habilita Dataview y Templater. {{VERIFICAR_MENUS_OBSIDIAN}}
4. En los ajustes de Templater, fija la carpeta de plantillas en \`30_PLANTILLAS\`. {{VERIFICAR_MENUS_OBSIDIAN}}
5. Abre \`05_TABLERO.md\`: CLIENTE-01 aparece en "Términos que vencen en los próximos 7 días".
6. Para un caso nuevo, crea una nota en \`10_CASOS/\` y aplica la plantilla Expediente con Templater. La primera vez, Templater te pide confiar en la plantilla.

Ojo: Templater puede ejecutar JavaScript y comandos del sistema. Instálalo solo desde la lista oficial de complementos comunitarios y usa solo plantillas en las que confíes; las de \`30_PLANTILLAS/\` son texto que puedes leer antes de usarlas.

Las fuentes de \`20_FUENTES/\` llegan sin verificar a propósito: aparecen en "Fuentes sin verificar" del tablero hasta que las abras en la fuente oficial y llenes \`verificado_por\`, \`verificado_fecha\` y \`enlace_oficial\`.

${F}text
${ARBOL_BOVEDA}
${F}`;

// Nivel 3 of the demo, as checked by the coordinator on 20 Oct 2026.
const IA_CON_MANOS = `## Cuando estés listo: la IA con manos (opcional)

Con un conector, Claude Desktop puede leer esta bóveda (tu playbook, tus fuentes, las fichas) y guardar borradores en \`10_CASOS/\`.

- Ruta recomendada: Claude Desktop → Configuración → Extensiones → Filesystem (de Anthropic) → Instalar. Autoriza solo la carpeta \`cerebro-juridico\`, nada más.
- Ruta por archivo de configuración (JSON): fija la versión \`@modelcontextprotocol/server-filesystem@1.0.0\`; la 2.0.0 exige Node 24 o superior. El paso a paso está en el playbook del taller (Nivel 3).`;

const INDICE_FUENTES = `## En esta bóveda

Las entradas largas viven en 20_FUENTES/. Llegan sin verificar: el tablero las lista en "Fuentes sin verificar" hasta que llenes verificado_por, verificado_fecha y enlace_oficial.

- [[Ley 1755 de 2015]]
- [[Decreto 491 de 2020]]
- [[Ley 2207 de 2022]]
- [[T-323 de 2024]]
`;

// §7.2, verbatim.
const TABLERO = `# 05_TABLERO

> Consultas de Dataview sobre los metadatos de tus notas. Necesitan el complemento Dataview activo (ver README.md).

## Términos que vencen en los próximos 7 días
${F}dataview
TABLE cliente, tipo_actuacion, proximo_termino, termino_descripcion
FROM "10_CASOS"
WHERE estado = "activo" AND proximo_termino >= date(today) AND proximo_termino <= date(today) + dur(7 days)
SORT proximo_termino ASC
${F}

## Casos activos por etapa
${F}dataview
TABLE cliente, jurisdiccion, etapa, proximo_termino
FROM "10_CASOS"
WHERE estado = "activo"
SORT etapa ASC, proximo_termino ASC
${F}

## Fuentes sin verificar
${F}dataview
TABLE identificacion, numero, vigencia
FROM "20_FUENTES"
WHERE verificado_fecha = "" OR !verificado_fecha
${F}

## Qué sentencias sostienen qué casos
${F}dataview
TABLE file.inlinks AS "Usada en"
FROM "20_FUENTES/Sentencias"
${F}
`;

// §7.1 facts in the §7.2 expediente schema. No sentencia number: the unificación
// is still [VALIDAR] in the plan.
const caso = (today) => `---
tipo: expediente
cliente: CLIENTE-01            # siempre código, nunca nombre
radicado: ""                   # 23 dígitos cuando exista
despacho: ""
jurisdiccion: constitucional
tipo_actuacion: derecho de petición → tutela
etapa: pre-judicial
proximo_termino: ${addDays(today, 5)}    # fecha ISO; Dataview la lee
termino_descripcion: "Vencimiento para radicar tutela según estrategia"
confidencialidad: reservado    # publico | reservado | sensible
estado: activo                 # activo | suspendido | cerrado
fuentes: ["[[Ley 1755 de 2015]]", "[[Ley 2207 de 2022]]"]
creado: ${addDays(today, 0)}
---

# CLIENTE-01 — Petición de documentos

> Caso de ejemplo, ficticio y anonimizado: el mismo problema de la pregunta de prueba. Su término quedó a 5 días de la fecha en que descargaste la bóveda, para que lo veas en el tablero.

## Hechos (anonimizados)
- CLIENTE-01 radicó ante ENTIDAD-01 una petición pidiendo copia de un contrato de prestación de servicios.
- Han pasado más de 10 días hábiles sin respuesta ni traslado por competencia.

## Marco (en 03_FUENTES.md)
- Art. 14, num. 1, del CPACA, sustituido por la [[Ley 1755 de 2015]]: 10 días hábiles; silencio = aceptación; copias en los 3 días siguientes.
- [[Ley 2207 de 2022]]: derogó los arts. 5 y 6 del Decreto 491 de 2020 y restableció los términos.
- Art. 23 C.P.: derecho fundamental de petición.
- Decreto 2591 de 1991: tutela.
- Alerta: el art. 5 del [[Decreto 491 de 2020]] fue derogado por la Ley 2207 de 2022; sus términos ampliados ya no aplican.

## Jurisprudencia
- Línea reiterada de la Corte Constitucional sobre el núcleo esencial del derecho de petición (respuesta pronta, de fondo, congruente y notificada).
- [PENDIENTE: sentencia de unificación verificada]

## Línea de tiempo
| Fecha | Actuación | Folio | Término que abre |
|---|---|---|---|
| [PENDIENTE] | Radicación de la petición de documentos ante ENTIDAD-01 | [PENDIENTE] | 10 días hábiles para responder |

## Términos que corren
- Respuesta de ENTIDAD-01: vencida, sin respuesta ni traslado por competencia.

## Pruebas
- Practicadas:
- Pendientes:

## Riesgos
-

## Próxima actuación (YO DECIDO)
- Borrador de acción de tutela por violación del derecho fundamental de petición, con la sección "Verificación pendiente".

## Verificación pendiente
- [ ] Fecha de radicación confirmada y días hábiles contados con el calendario oficial de festivos.
- [ ] Sentencia de unificación vigente elegida y verificada en la relatoría oficial.
- [ ] Art. 14 del CPACA (Ley 1755 de 2015) y Ley 2207 de 2022 abiertos en SUIN-Juriscol.
`;

const list = (items) => `[${items.map((a) => `"${a}"`).join(', ')}]`;

const norma = ({ identificacion, articulos = [], vigencia, modificadaPor = [], regla, alertas }) => `---
tipo: norma
identificacion: "${identificacion}"
articulos_clave: ${list(articulos)}
vigencia: ${vigencia}
modificada_por: ${list(modificadaPor)}
enlace_oficial: ""
verificado_por: ""
verificado_fecha: ""
---

# ${identificacion}

## Regla extraída (en mis palabras)

${regla}

## Artículos clave (cita textual)

[PENDIENTE: pega la cita textual desde la fuente oficial]

## Alertas de vigencia

${alertas}

## Casos donde la uso
- [[CLIENTE-01 — Petición de documentos]]
`;

// Wording from the coordinator's check against official sources (20 Oct 2026).
const LEY_1755 = norma({
  identificacion: 'Ley 1755 de 2015',
  articulos: ['art. 14', 'art. 21', 'art. 32', 'art. 33'],
  vigencia: 'vigente            # vigente | modificada | derogada | inexequible',
  regla: `Su art. 1 sustituyó el Título II de la Ley 1437 de 2011 (CPACA). Los artículos se citan como artículos del CPACA.

- Art. 14: término general de 15 días; peticiones de documentos e información, 10 días (si no hay respuesta, se entiende aceptada y las copias se entregan en los 3 días siguientes); consultas, 30 días. Si la autoridad no puede responder a tiempo, debe informarlo antes de que venza el término, y el nuevo plazo no puede exceder el doble. Días hábiles (art. 62 de la Ley 4 de 1913).
- Art. 21: si la autoridad no es competente, remite la petición y avisa al peticionario dentro de los 5 días siguientes si es escrita, o de inmediato si es verbal.
- Art. 32: peticiones ante organizaciones privadas. Para empresas privadas de servicios públicos domiciliarios rigen el art. 33 de esta ley y el art. 158 de la Ley 142 de 1994 (15 días hábiles, silencio positivo).`,
  alertas:
    '- El art. 5 del [[Decreto 491 de 2020]] amplió estos términos durante la emergencia (30, 20 y 35 días). La [[Ley 2207 de 2022]] derogó los arts. 5 y 6 del Decreto 491 y restableció los términos de la Ley 1755. Una IA que responda con los términos ampliados está desactualizada.',
});

const DECRETO_491 = norma({
  identificacion: 'Decreto 491 de 2020',
  articulos: ['art. 5', 'art. 6'],
  vigencia: 'modificada         # arts. 5 y 6 derogados por la Ley 2207 de 2022',
  modificadaPor: ['[[Ley 2207 de 2022]]'],
  regla:
    'Decreto Legislativo del 28 de marzo de 2020. Su art. 5 amplió los términos del derecho de petición durante la emergencia sanitaria (30, 20 y 35 días); no aplicaba a peticiones sobre otros derechos fundamentales.',
  alertas:
    '- Art. 5 del Decreto 491 de 2020 derogado por la [[Ley 2207 de 2022]], que derogó los arts. 5 y 6 y restableció los términos de la [[Ley 1755 de 2015]] desde el 18 de mayo de 2022. Una IA que responda con estos términos ampliados está desactualizada.',
});

const LEY_2207 = norma({
  identificacion: 'Ley 2207 de 2022',
  vigencia: 'vigente            # vigente | modificada | derogada | inexequible',
  regla:
    'Ley del 17 de mayo de 2022, rige desde el 18 de mayo de 2022. Derogó los arts. 5 y 6 del [[Decreto 491 de 2020]] y restableció los términos del art. 14 del CPACA ([[Ley 1755 de 2015]]): 15, 10 y 30 días hábiles.',
  alertas: '- Por esta ley, los términos ampliados de 2020 ya no aplican.',
});

const T_323 = `---
tipo: sentencia
corporacion: Corte Constitucional
sala_seccion: ""
numero: "T-323 de 2024"
radicado: ""
fecha: "2024-08-02"
magistrado_ponente: "Juan Carlos Cortés González"
enlace_oficial: ""
verificado_por: ""
verificado_fecha: ""
vigente: true
---

# T-323 de 2024

## Tesis (en mis palabras, dos líneas)

La IA puede apoyar, no sustituir el razonamiento humano. Fija doce principios: transparencia, responsabilidad, privacidad, no sustitución de la racionalidad humana, seriedad y verificación, prevención de riesgos, igualdad y equidad, control humano, regulación ética, adecuación a buenas prácticas, seguimiento continuo e idoneidad. Ordenó al CSJ expedir lineamientos.

## Ratio decidendi (cita textual, máximo un párrafo)

[PENDIENTE: pega la cita textual desde la relatoría]

## Obiter / salvamentos relevantes

## Casos donde la uso
-
`;

// §7.2 Templater templates, verbatim.
const PLANTILLA_EXPEDIENTE = `---
tipo: expediente
cliente: CLIENTE-<% tp.system.prompt("Código de cliente (01, 02, ...)") %>
radicado: "<% tp.system.prompt("Radicado (vacío si no hay)") %>"
despacho: ""
jurisdiccion: <% tp.system.suggester(["civil","laboral","penal","administrativo","constitucional"], ["civil","laboral","penal","administrativo","constitucional"]) %>
tipo_actuacion: ""
etapa: ""
proximo_termino: <% tp.date.now("YYYY-MM-DD", 10) %>
termino_descripcion: ""
confidencialidad: reservado
estado: activo
fuentes: []
creado: <% tp.date.now("YYYY-MM-DD") %>
---

# <% tp.file.title %>

## Hechos (anonimizados)
-

## Línea de tiempo
| Fecha | Actuación | Folio | Término que abre |
|---|---|---|---|
| | | | |

## Términos que corren
-

## Pruebas
- Practicadas:
- Pendientes:

## Riesgos
-

## Próxima actuación (YO DECIDO)
-

## Verificación pendiente
- [ ]
`;

const PLANTILLA_SENTENCIA = `---
tipo: sentencia
corporacion: <% tp.system.suggester(["Corte Constitucional","Corte Suprema de Justicia","Consejo de Estado","Tribunal"], ["Corte Constitucional","Corte Suprema de Justicia","Consejo de Estado","Tribunal"]) %>
sala_seccion: ""
numero: "<% tp.system.prompt("Número (p. ej. T-323 de 2024)") %>"
radicado: ""
fecha: ""
magistrado_ponente: ""
enlace_oficial: ""
verificado_por: ""
verificado_fecha: ""
vigente: true
---

# <% tp.file.title %>

## Tesis (en mis palabras, dos líneas)

## Ratio decidendi (cita textual, máximo un párrafo)

## Obiter / salvamentos relevantes

## Casos donde la uso
-
`;

const PLANTILLA_NORMA = `---
tipo: norma
identificacion: "<% tp.system.prompt("Identificación (p. ej. Ley 1755 de 2015)") %>"
articulos_clave: []
vigencia: vigente            # vigente | modificada | derogada | inexequible
modificada_por: []
enlace_oficial: ""
verificado_por: ""
verificado_fecha: ""
---

# <% tp.file.title %>

## Regla extraída (en mis palabras)

## Artículos clave (cita textual)

## Alertas de vigencia

## Casos donde la uso
-
`;

const LEEME_ARCHIVO = `# 90_ARCHIVO

Casos cerrados. Cuando un caso termine, cambia \`estado: cerrado\` en su ficha y muévela aquí. El tablero solo consulta \`10_CASOS/\`, así que el caso deja de aparecer en los términos sin perder su historia ni sus enlaces a las fuentes.
`;

/** Path (inside the vault folder) → file content. */
export function buildVault(profile, { today = new Date() } = {}) {
  const files = buildFiles(profile);
  return {
    'README.md': buildReadme(profile, { extra: [OBSIDIAN, IA_CON_MANOS] }),
    '00_ADN.md': files['00_ADN.md'],
    '01_LINEAS_ROJAS.md': files['01_LINEAS_ROJAS.md'],
    '02_PLAYBOOK.md': files['02_PLAYBOOK.md'],
    '03_FUENTES.md': `${files['03_FUENTES.md'].trimEnd()}\n\n${INDICE_FUENTES}`,
    '04_VERIFICACION.md': files['04_VERIFICACION.md'],
    '05_TABLERO.md': TABLERO,
    '10_CASOS/CLIENTE-01 — Petición de documentos.md': caso(today),
    '20_FUENTES/Normas/Ley 1755 de 2015.md': LEY_1755,
    '20_FUENTES/Normas/Decreto 491 de 2020.md': DECRETO_491,
    '20_FUENTES/Normas/Ley 2207 de 2022.md': LEY_2207,
    '20_FUENTES/Sentencias/T-323 de 2024.md': T_323,
    '30_PLANTILLAS/Expediente.md': PLANTILLA_EXPEDIENTE,
    '30_PLANTILLAS/Sentencia.md': PLANTILLA_SENTENCIA,
    '30_PLANTILLAS/Norma.md': PLANTILLA_NORMA,
    '90_ARCHIVO/LEEME.md': LEEME_ARCHIVO,
  };
}

/** The vault as ZIP bytes, everything inside `cerebro-juridico/`. */
export function buildVaultZip(profile, { today = new Date(), date = new Date() } = {}) {
  const vault = buildVault(profile, { today });
  return zip(
    Object.entries(vault).map(([path, data]) => ({ name: `${CARPETA_BOVEDA}/${path}`, data })),
    { date },
  );
}
