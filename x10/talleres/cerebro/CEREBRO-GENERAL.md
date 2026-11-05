# Cerebro — from "Cerebro Jurídico" to a general skills brain

Design and execution contract, 5 Nov 2026. Read `CONTRACT.md` first (routes, design
system, build, process rules); this file overrides it where the two disagree.
Code and comments in English; every user-facing string in Spanish (Colombia, tú).

## Conclusion

`/cerebro/` becomes **Cerebro**: one page, three *cerebros* as tabs inside the
"Construir" section. Each tab is a form that writes files live, like the legal one
does today. Everything else on the page (Cargar, Prueba) reads from the active tab.

| Tab (order) | id | What it builds | Example preloaded |
|---|---|---|---|
| **Skill general** (default) | `skill` | One installable skill for any task: `SKILL.md` (Agent Skills format, Claude), `INSTRUCCIONES_GPT.md` (ChatGPT Proyecto / GPT, Gemini Gem), `README.md` | Daniel, coordinador de proyectos: «Resumen de reunión» |
| **Ideación** | `ideacion` | The ideation skill of the Vibe Coding course: turns an idea into a one-page spec and the refined first message for the building tool | Sofía, estudiante: «Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador» |
| **Jurídico** | `juridico` | The existing legal brain, unchanged (ten fields, six files, task skills, test, vault) | Laura, litigante |

Thesis of the page and the deck (general now): «La IA no es tu asistente junior; es tu
sistema. Y los sistemas se diseñan.» Message: «La IA ya sabe buscar. Tu criterio no está
en internet.» A *cerebro* is what the AI cannot search about you, written once: who you
are, how you do each task, what it never does, how it is verified. A *skill* is that,
packaged so the AI applies it on its own when the task appears.

Why: the legal brain proved the value (live A/B on 21 Oct 2026: 2/7 vs 7/7 criteria on
the same contract). The same mechanism applies to any industry; the class is now about
generative AI, how it works, and skills. The Vibe Coding students need the ideation skill
in ChatGPT and Claude to produce the refined prompts of the product they will build.

## Ownership (parallel agents, one working tree, no git)

| Agent | Files |
|---|---|
| **A · generators** (Opus) | `web/shared/skill-general.js` + `.test.mjs`, `web/shared/ideacion.js` + `.test.mjs` |
| **B · landing** (Opus, starts when A is done) | `web/index.html`, `web/landing/*`, `web/shared/cerebros.js`, `web/shared/store.js` (+ test), `web/shared/facts.test.mjs`, `CONTRACT.md` (routes/keys), `web/shared/catalog.js` only if a label must change |
| **C · deck** (Opus) | `presentacion/**` (slides, config.json, deck.css, js) |
| **D · survey + platform copy** (Sonnet) | `web/shared/encuesta.js` + test, `web/encuesta/*`, `talleres.config.js`, `scripts/smoke.mjs`, `src/gate/gate.js` (+ test if a string moves), `web/playbook/index.html` (portada only) |

Nobody runs `git`, `vercel` or `supabase`. Tests: `node --test talleres/cerebro/web/shared/*.test.mjs src/gate/gate.test.mjs`.
Build: `node scripts/build.mjs cerebro`. Smoke (after a full `npm run build`): `npm run smoke`.

---

## A · Generators (pure ES modules, no DOM, no Vite aliases)

Same style as `generator.js` / `skills.js`: deterministic, byte-identical output for the
same profile, `normalize*` repairs anything from localStorage, `zip` from `./zip.js`
(accepts `[{ name, data }]` or `{ path: text }`), tests with `node:test`.

Shared helpers to reuse from `catalog.js`: `HERRAMIENTAS` (claude, chatgpt, gemini,
copilot, ninguna), `INSTALAR_SKILL` (verified Claude steps), `RUTAS_CARGA` wording as a
model for new routes.

### A1 · `skill-general.js`

```js
export const ARCHIVOS_SKILL = ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md']; // tab order; principal: 'SKILL.md'
export const TONOS_SKILL = [
  { id: 'directo',   label: 'Claro y directo',        instruccion: 'Responde claro y directo, en párrafos cortos' },
  { id: 'didactico', label: 'Didáctico, explícame',   instruccion: 'Explica cada paso y por qué, con un ejemplo cuando ayude' },
  { id: 'esencial',  label: 'Solo lo esencial',       instruccion: 'Entrega solo el resultado, en listas, sin preámbulos' },
];
export const CAMPOS_SKILL = [ // field → files, for the map figure and the "feeds" line under each field
  { id: 'skillNombre',   label: 'Nombre',        archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'queHace',       label: 'Qué hace',      archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'cuando',        label: 'Cuándo',        archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'entradas',      label: 'Qué entrego',   archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'pasos',         label: 'Pasos',         archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'reglas',        label: 'Reglas',        archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'formato',       label: 'Formato',       archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'ejemplo',       label: 'Ejemplo',       archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'verifico',      label: 'Verifico',      archivos: ['SKILL.md', 'README.md'] },
  { id: 'material',      label: 'Material',      archivos: ['SKILL.md', 'README.md'] },
  { id: 'quienSoy',      label: 'Quién soy',     archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'tono',          label: 'Tono',          archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramientas',  label: 'IA que usas',   archivos: ['README.md'] },
];
export const EJEMPLO_SKILL = { /* Daniel, see below */ };
export const VACIO_SKILL   = { /* every string '', every list [], tono 'directo', herramientas [] */ };
export function normalizeSkill(raw)            // → profile (shape below); lists: trimmed non-empty strings, max 12 items, 200 chars each
export function slugSkill(profile)             // skillNombre → 'resumen-de-reunion' (NFD, [a-z0-9-], ≤ 40, fallback 'mi-skill')
export function descripcionSkill(profile)      // ≤ 200 chars (see rule), used in the YAML and the README
export function buildSkillGeneral(raw)         // → { 'README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md', ['references/material.md'] }
export function pasteSkillGeneral(raw)         // → text for "Copiar todo para pegar en un chat"
export function zipSkillGeneral(raw, { date }) // → bytes: `<slug>/SKILL.md` (+ `<slug>/references/material.md`)
export function zipTodoSkillGeneral(raw, { date }) // → bytes: `<slug>-kit/README.md`, `<slug>-kit/INSTRUCCIONES_GPT.md`, `<slug>-kit/<slug>/SKILL.md` (+ references)
export function pruebaSkillGeneral(raw)        // → { pregunta, esperado: { con: [..], sin: [..] }, nota }
```

Profile shape:

```js
{ nombre: '',          // how the AI calls the person (optional)
  quienSoy: '',        // role/context, one line: 'coordinador de proyectos en una ONG'
  skillNombre: '',     // 'Resumen de reunión'
  queHace: '',         // one sentence
  cuando: [],          // trigger phrases / situations, one per line
  entradas: [],        // what the person hands over
  pasos: [],           // ordered steps
  reglas: [],          // what always applies / never happens
  formato: '',         // multiline output template
  ejemploEntrada: '', ejemploSalida: '',
  verifico: [],        // how the person knows it came out right
  material: '',        // optional reference text → references/material.md
  tono: 'directo' | 'didactico' | 'esencial',
  herramientas: [] }   // ids from HERRAMIENTAS
```

**`descripcionSkill`**: `${queHace} Úsala cuando ${cuando[0..2] joined ', '}, aunque no lo pida con esas palabras.`
Trim at a word boundary to ≤ 200 characters, ending with `…` if cut (the Claude limit is
200; a test asserts `≤ 200` for the example and for a long profile). Descriptions are
"pushy" on purpose: Claude undertriggers skills.

**`SKILL.md`** (exact structure; `{}` = profile-driven; omit a section's bullets gracefully
when the list is empty by writing the placeholder line in brackets, never an empty heading):

```
---
name: {slug}
description: {JSON.stringify(descripcion)}
---

# {skillNombre}

Skill de mi cerebro. Soy {quienSoy}.{ Llámame {nombre}.}{ Antes de empezar, lee references/material.md.}

## Cuándo usarla

{- cuando…}
Si dudas, pregúntame si quieres que la use.

## Qué te entrego

{- entradas…}
Si falta algo de esta lista, pídemelo antes de empezar.

## Pasos

{1. pasos…}

## Reglas que siempre aplican

{- reglas…}
- No inventes datos que no te di; si falta un dato, dilo en lugar de completarlo.
- Termina con una sección «Para revisar» con lo que debo confirmar antes de usar la salida.

## Formato de salida

{formato}
{tono.instruccion}.

## Ejemplo

Entrada: {ejemploEntrada}
Salida: {ejemploSalida}

## Cómo sé que quedó bien

{- verifico…}
```

**`INSTRUCCIONES_GPT.md`** (no YAML; same content as plain instructions; ≤ 7 000
characters, a test asserts it for the example):

```
# Instrucciones · {skillNombre}

Pégalas en las instrucciones de un Proyecto de ChatGPT, de un GPT personalizado o de una Gem de Gemini.

---

Guarda esta skill y actívala sola cuando aparezca la tarea; no esperes a que la nombre.

SKILL: {skillNombre}
QUÉ HACE: {queHace}
QUIÉN SOY: {quienSoy}.{ Llámame {nombre}.}

CUÁNDO USARLA
{- cuando…}

QUÉ TE ENTREGO
{- entradas…}
Si falta algo, pídemelo antes de empezar.

PASOS
{1. pasos…}

REGLAS QUE SIEMPRE APLICAN
{- reglas…}
- No inventes datos que no te di; si falta un dato, dilo.
- Termina con «Para revisar»: lo que debo confirmar antes de usar la salida.

FORMATO DE SALIDA
{formato}
{tono.instruccion}.

EJEMPLO
Entrada: {ejemploEntrada}
Salida: {ejemploSalida}

Si te pido otra cosa, no apliques esta skill.{ Material de referencia: está en el archivo material.md de este Proyecto; léelo antes del paso 1.}
```

**`README.md`**: title `# {skillNombre} · tu skill`, one paragraph on what a skill is
(«Una skill es un procedimiento escrito que la IA aplica sola cuando aparece la tarea.
Esta carpeta trae la misma skill en dos formatos.»), a table of the files, then
«Instalar» with one block per tool in `herramientas` (the person's tools first, the rest
after under «Otras rutas»):

- Claude: `INSTALAR_SKILL.pasos` from `catalog.js` verbatim (+ its `nota`).
- ChatGPT: «Proyectos → Nuevo proyecto → Instrucciones: pega `INSTRUCCIONES_GPT.md`. O
  Explorar GPTs → Crear → Configurar → Instrucciones.» Mark `{{VERIFICAR_MENUS_CHATGPT}}`.
- Gemini: «Gems → Nueva gem → Instrucciones: pega `INSTRUCCIONES_GPT.md`.» Mark
  `{{VERIFICAR_MENUS_GEMINI}}`.
- Copilot: «Pega `INSTRUCCIONES_GPT.md` al inicio del chat; Copilot no guarda skills en
  cuentas personales.» Mark `{{VERIFICAR_COPILOT}}`.
- Any tool: «Chat nuevo → pega `INSTRUCCIONES_GPT.md` → envía. Te confirma en tres
  líneas (ver abajo).»

Then «Probarla»: `pruebaSkillGeneral(profile).pregunta` and the two columns, and
«Mantenerla»: «Cuando la IA se equivoque, no corrijas el chat: corrige la skill (un paso,
una regla o el formato) y vuelve a subirla.»

**`pasteSkillGeneral`**: header + blank line + the body of `INSTRUCCIONES_GPT.md` below
its `---` rule. Header, verbatim:

```
Guarda estas instrucciones como una skill para este chat. Cuando termines de leerlas, confírmame en tres líneas: (1) cómo se llama la skill y cuándo se activa, (2) qué me vas a pedir antes de empezar, (3) con qué sección vas a cerrar cada respuesta. No hagas nada más todavía.
```

**`pruebaSkillGeneral`**: `pregunta` = `ejemploEntrada` if set, else «Pega aquí una entrada
real de la tarea: lo mismo que le darías a un colega». `esperado.con` =
[«Sigue tus pasos en orden y pide lo que falta de «Qué te entrego»», «Respeta tus reglas:
no inventa, se detiene donde dijiste», «Entrega en tu formato, con el tono que elegiste»,
«Cierra con «Para revisar»»]; `esperado.sin` = [«Formato distinto cada vez», «Rellena lo
que falta con supuestos», «No sabe qué nunca debe hacer», «Sin cierre de revisión: todo
parece listo»]. `nota` = «Hazla en un chat con la skill y en otro sin ella. Compara el
proceso, no solo la respuesta.»

**`EJEMPLO_SKILL`** (Daniel): nombre 'Daniel'; quienSoy 'coordinador de proyectos en una
ONG de educación'; skillNombre 'Resumen de reunión'; queHace 'Convierte las notas o la
transcripción de una reunión en un resumen con decisiones, compromisos con responsable y
fecha, y pendientes.'; cuando ['Te pego notas o la transcripción de una reunión', 'Digo
«resume la reunión» o «saca los compromisos»', 'Te paso un audio transcrito con varias
personas hablando']; entradas ['Las notas o la transcripción completa', 'La fecha y el
nombre de la reunión', 'Quiénes asistieron, si no está en las notas']; pasos ['Lee todo
antes de escribir; identifica a cada persona por su nombre o su rol', 'Separa decisiones
(lo que ya se acordó) de compromisos (alguien hace algo para una fecha) y de pendientes
(sin dueño o sin fecha)', 'Escribe cada compromiso con responsable y fecha; si falta uno
de los dos, déjalo en pendientes y márcalo', 'Redacta el resumen en el formato de abajo',
'Lista al final lo que no quedó claro en las notas']; reglas ['No agregues compromisos que
nadie dijo', 'Si dos personas dijeron cosas distintas, anota las dos; no elijas', 'Nombres
propios solo si están en las notas; nada de cargos inventados', 'Nunca asumas una fecha:
si no está, va a pendientes']; formato "# Reunión: {nombre} · {fecha}\n\n## Decisiones\n-
…\n\n## Compromisos\n| Qué | Quién | Para cuándo |\n\n## Pendientes\n- …\n\n## Para
revisar\n- …"; ejemploEntrada 'Notas del comité del 3 de noviembre: Ana propone mover el
taller al 20; Luis dice que confirma el salón el viernes; nadie definió quién avisa a los
colegios.'; ejemploSalida 'Decisiones: el taller pasa al 20 de noviembre. Compromisos:
Luis confirma el salón · viernes 7 de noviembre. Pendientes: avisar a los colegios, sin
responsable. Para revisar: ¿Ana confirmó la nueva fecha con el equipo?'; verifico ['Cada
compromiso tiene responsable y fecha, o está en pendientes', 'No hay nada en el resumen
que no esté en las notas', 'Lo ambiguo quedó en «Para revisar», no resuelto por la IA'];
material ''; tono 'directo'; herramientas ['chatgpt', 'claude'].

Tests (`skill-general.test.mjs`, ≥ 8): same profile → identical files; slug rules; description
≤ 200 and ends with `…` only when cut; SKILL.md has the YAML (name = slug, description is
valid JSON string) and every section in order; empty lists produce the bracketed
placeholder, never an empty heading; `material` adds the references file and the
«lee references/material.md» line in both SKILL.md and INSTRUCCIONES_GPT.md; ZIP entries
(`<slug>/SKILL.md`, optional references) and the kit ZIP paths; `pasteSkillGeneral` starts
with the header; INSTRUCCIONES_GPT.md ≤ 7 000 chars for the example; CAMPOS_SKILL ids are
exactly the profile keys that change at least one file (a map test like `generator.test.mjs`
does for the legal one: change each field from the example and assert exactly those files
changed; `ejemplo` covers `ejemploEntrada` + `ejemploSalida`).

### A2 · `ideacion.js`

The Vibe Coding principles, fixed; the student's profile only personalises who they are,
their phrase, their tool and their limits. Source of every principle: this document (the
plan lives in `../vibecoding/plan-clase-1.md`, read it for the vocabulary; `../vibecoding/web/shared/spec.js`
has the seven blocks and the traps, do not import it: copy the text so the module stays
inside `cerebro/`).

```js
export const ARCHIVOS_IDEACION = ['README.md', 'SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'references/plantilla-spec.md', 'references/reglas-de-mesa.md'];
export const SLUG_IDEACION = 'ideacion-de-producto';
export const SECTORES = [
  { id: 'publico',        label: 'Sector público',       sistema: 'una entidad pública' },
  { id: 'empresa',        label: 'Empresa privada',      sistema: 'una empresa' },
  { id: 'emprendimiento', label: 'Emprendimiento propio', sistema: 'mi propio emprendimiento' },
  { id: 'academia',       label: 'Universidad o colegio', sistema: 'una institución educativa' },
  { id: 'social',         label: 'Organización social',  sistema: 'una organización social' },
  { id: 'otro',           label: 'Otro',                 sistema: 'mi contexto' },
];
export const CONSTRUYE = [ // multi
  { id: 'web',           label: 'App web' },
  { id: 'movil',         label: 'App móvil' },
  { id: 'automatizacion',label: 'Automatización o flujo' },
  { id: 'servicio',      label: 'Servicio o experiencia' },
  { id: 'contenido',     label: 'Contenido o comunidad' },
];
export const HERRAMIENTAS_CONSTRUCCION = [
  { id: 'lovable',     label: 'Lovable',     caja: 'cerrada' },
  { id: 'base44',      label: 'Base44',      caja: 'cerrada' },
  { id: 'claude-code', label: 'Claude Code', caja: 'abierta' },
  { id: 'codex',       label: 'Codex',       caja: 'abierta' },
  { id: 'nose',        label: 'No sé aún',   caja: null },
];
export const NIVELES = [
  { id: 'cero',    label: 'Nunca he construido nada', sistema: 'nunca he construido software' },
  { id: 'algo',    label: 'Ya hice algo con IA',       sistema: 'ya construí algo pequeño con IA' },
  { id: 'programo',label: 'Programo',                  sistema: 'sé programar' },
];
export const TONOS_IDEACION = TONOS_SKILL shape: directo / didactico / esencial (same ids and texts as A1; duplicate, do not import)
export const CAMPOS_IDEACION = [
  { id: 'frase',         label: 'Tu frase',       archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'README.md'] },
  { id: 'sector',        label: 'Sector',         archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md'] },
  { id: 'construye',     label: 'Qué construyes', archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramienta',   label: 'Herramienta',    archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'PRIMER_MENSAJE.md', 'README.md'] },
  { id: 'nivel',         label: 'Nivel',          archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'restricciones', label: 'Límites',        archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'nombre',        label: 'Nombre',         archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md', 'README.md'] },
  { id: 'tono',          label: 'Tono',           archivos: ['SKILL.md', 'INSTRUCCIONES_GPT.md'] },
  { id: 'herramientas',  label: 'IA que usas',    archivos: ['README.md'] },
];
export const EJEMPLO_IDEACION = { nombre: 'Sofía', sector: 'academia', construye: ['web'], frase: 'Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador', herramienta: 'lovable', nivel: 'cero', restricciones: ['No usa datos reales de los residentes', 'No tiene pagos'], tono: 'didactico', herramientas: ['chatgpt'] };
export const VACIO_IDEACION = { nombre: '', sector: null, construye: [], frase: '', herramienta: null, nivel: null, restricciones: [], tono: 'directo', herramientas: [] };
export function normalizeIdeacion(raw)
export function buildIdeacion(raw)          // → the six files
export function pasteIdeacion(raw)          // header (same text as A1) + INSTRUCCIONES_GPT.md body
export function zipIdeacion(raw, { date })  // bytes: `ideacion-de-producto/SKILL.md`, `.../references/plantilla-spec.md`, `.../references/reglas-de-mesa.md`
export function zipTodoIdeacion(raw, { date }) // bytes: `ideacion-kit/README.md`, `ideacion-kit/INSTRUCCIONES_GPT.md`, `ideacion-kit/PRIMER_MENSAJE.md`, `ideacion-kit/ideacion-de-producto/…`
export function pruebaIdeacion(raw)         // → { pregunta: frase || 'Quiero una app que ___ para ___', esperado, nota }
```

**`SKILL.md`** (fixed text; `{}` profile-driven):

```
---
name: ideacion-de-producto
description: "Convierte una idea suelta en una spec de una página y en el primer mensaje para construirla con IA. Úsala siempre que diga que tengo una idea, quiero una app, una automatización o un producto, o pida ayuda para definir, aterrizar o recortar un proyecto, aunque no diga «spec»."
---

# Ideación de producto

Skill de mi cerebro.{ Llámame {nombre}.} Soy de {sector.sistema} y {nivel.sistema}. Construyo {construye labels, lowercase, joined ' y '} con {herramienta.label} (caja {cerrada|abierta}: {una frase}) | Todavía no elegí herramienta: recomiéndame una al final.
Mi idea de partida: «{frase}».

## Cuándo usarla

Cuando te cuente una idea («quiero una app que… para…»), cuando te pida aterrizar, recortar o explicar un proyecto, o cuando te pegue una lista de funciones. No la uses para escribir código: esta skill termina en la spec y en el primer mensaje para la herramienta.

## Principio

Vibe coding no es pedir una app. Es describirla tan bien que la IA no tenga que adivinar. Todo lo que la IA tendría que adivinar es lo que falta en la spec.

## Pasos

1. La frase. Si no la tengo, ayúdame a escribirla: «Quiero una app que ___ para ___». Si traigo una lista de funciones, primero la frase.
2. Prueba del adivino. Antes de proponer nada, lista lo que tendrías que adivinar para construir eso. Hazme máximo tres preguntas, las que más cambian el producto, y espera mis respuestas.
3. Las cinco piezas. Ubica la idea en el mapa: front (lo que la persona ve y toca), lógica (lo que pasa cuando toca algo), base de datos (lo que recuerda cuando cierra la pestaña), dominio (dónde vive) y repositorio (de quién es y cómo se deshace un cambio). En la V1, dominio y repositorio los resuelve la herramienta: dilo y sigue.
4. La spec de una página, con los siete bloques de references/plantilla-spec.md y sus límites: 1 para quién y qué problema (un párrafo); 2 qué hace (tres a cinco acciones con verbo, «[Rol] puede [acción]»); 3 qué guarda (las cosas y sus datos); 4 quién puede hacer qué (máximo dos roles); 5 qué NO hace (mínimo tres cosas, van a «después»); 6 cómo sé que funciona (tres escenarios «Cuando [rol] hace [acción], pasa [resultado]», uno por acción principal); 7 pantallas (opcional, una frase cada una).
5. El recorte. V1 = un tipo de usuario principal, tres acciones y una cosa que se guarda. Si hay más de cinco acciones o más de dos roles, lo que sobra baja al bloque 5. Correos y notificaciones, pagos, inicio de sesión con Google, «que tenga IA» y «que sea bonita» van a «después», salvo que sean la acción principal. Propón el recorte; YO DECIDO qué se queda.
6. Prueba del adivino, segunda vuelta. Lee la spec como si fueras la herramienta y escribe tres cosas que aún tendrías que adivinar. Corrígelas en la spec antes de entregar.
7. La entrega, en este orden: (a) la spec completa en markdown; (b) el primer mensaje listo para pegar en la herramienta: la instrucción de cabecera de references/plantilla-spec.md y la spec debajo, todo en un solo bloque de código; (c) la caja: {herramienta fija: «construyo en {label}, caja {cerrada|abierta}: {razón}» | «recomiéndame caja cerrada (Lovable, Base44: todo armado, sin instalar nada) o abierta (Claude Code, Codex: yo elijo cada pieza), con una razón»}; (d) las reglas de mesa y el protocolo de error de references/reglas-de-mesa.md, en cinco líneas.

## Reglas que siempre aplican

- Pregunta en vez de adivinar; máximo tres preguntas por turno.
- No agregues funciones que no pedí. Si crees que falta algo, va al bloque 5 como propuesta.
- Acciones con verbo, nunca pantallas: «una página con un formulario» no dice qué pasa al enviar.
- Nunca uses datos reales de personas ni de empresas en los ejemplos: inventa nombres.
- Cuando iteremos la spec, un cambio por mensaje.
{- restricciones…}
- Termina cada entrega con una sección «Lo que aún adivinaría», aunque quede vacía.

## Formato

{tono.instruccion}. La spec siempre con los títulos de la plantilla, en ese orden. El primer mensaje en un bloque de código, para copiarlo entero.

## Ejemplo

Entrada: «Quiero una app que organice las solicitudes de mantenimiento de mi edificio para el administrador».
Salida: tres preguntas (¿quién registra, los residentes o solo el administrador?; ¿qué estados tiene una solicitud?; ¿hace falta ver el historial?), luego la spec de siete bloques con tres acciones, dos roles, cuatro cosas en «qué NO hace» y tres escenarios, y el primer mensaje con la cabecera.
```

**`references/plantilla-spec.md`**: the template of the plan («Plantilla: spec de una
página») verbatim, preceded by the «Instrucción de cabecera para el primer mensaje» block
verbatim (the four lines + `[pegar aquí la spec completa]`), and followed by «Trampas
frecuentes» (the five of the plan, one line each).

**`references/reglas-de-mesa.md`**: the five reglas de mesa, the four-step protocolo de
error and the four «Qué no hacer» safety lines, verbatim from the plan.

**`INSTRUCCIONES_GPT.md`**: same intro line as A1, then the SKILL.md body with the two
references inlined at the end as «PLANTILLA DE LA SPEC» and «REGLAS DE MESA Y PROTOCOLO
DE ERROR» (uppercase section titles, no `#`), ≤ 7 500 characters (test).

**`PRIMER_MENSAJE.md`**: what the student sends after installing the skill:

```
# Primer mensaje

Pégalo en un chat con la skill instalada (o después de pegar INSTRUCCIONES_GPT.md).

---

Tengo una idea: «{frase || Quiero una app que ___ para ___}».
Contexto: {sector.sistema}; {nivel.sistema}. {Construiré en {herramienta.label}. | Todavía no elegí herramienta.}
Aplica la skill de ideación de producto: hazme máximo tres preguntas, luego la spec de una página y el primer mensaje para la herramienta.
```

**`README.md`**: `# Ideación de producto · tu skill`; what it does in two lines; the files
table; «Instalar» per tool like A1 (the student's tools first; for ChatGPT add «Si usas un
Proyecto, sube también plantilla-spec.md y reglas-de-mesa.md como archivos»); «Usarla»
(three steps: instala, pega PRIMER_MENSAJE.md, responde sus preguntas; copia el primer
mensaje a la herramienta); «Probarla» with `pruebaIdeacion`; «Después de construir»: las
reglas de mesa en una línea y «la spec es el documento al que vuelven todos los mensajes».

**`pruebaIdeacion`**: `esperado.con` = [«Hace máximo tres preguntas antes de proponer»,
«Spec de siete bloques: tres a cinco acciones con verbo, máximo dos roles», «Mínimo tres
cosas en «Qué NO hace»», «Tres escenarios «Cuando… pasa…» y el primer mensaje con la
cabecera», «Cierra con «Lo que aún adivinaría»»]; `esperado.sin` = [«Propone una lista
larga de funciones sin preguntar», «Pantallas en vez de acciones», «Sin «Qué NO hace»:
intenta construir una empresa», «Sin escenarios: no hay cómo probarla», «Un prompt
suelto, no un primer mensaje con cabecera»]; `nota` as A1.

Tests (`ideacion.test.mjs`, ≥ 8): determinism; YAML name = slug; the seven steps and the
fixed rules present; restricciones appear as bullets between the fixed rules and the
closing rule; «no elegí herramienta» branch vs fixed tool branch; PRIMER_MENSAJE with and
without phrase; ZIP paths; kit ZIP paths; INSTRUCCIONES_GPT.md ≤ 7 500 and contains the
seven template headings; CAMPOS_IDEACION map test as in A1.

---

## B · Landing (after A)

Goal: one page, three cerebros as tabs, nothing of the legal flow broken.

### `shared/cerebros.js` (registry the landing consumes)

```js
export const CEREBROS = [ { id: 'skill', … }, { id: 'ideacion', … }, { id: 'juridico', … } ];
export const cerebroById = (id) => …;
// each entry:
{ id, label: 'Skill general' | 'Ideación' | 'Jurídico', corto: 'Skill' | 'Ideación' | 'Jurídico',
  eyebrow: 'Paso 1 · Construye',
  titulo: 'Tu perfil escribe tu skill' | 'Tu idea escribe tu skill de ideación' | 'Tu perfil escribe tus archivos',
  lead: one sentence each (see copy below),
  ejemplo: { nombre: 'Daniel' | 'Sofía' | 'Laura', descripcion: 'Daniel, coordinador de proyectos. Cámbialo por lo tuyo.' | … },
  storeKey: 'cj-perfil-skill' | 'cj-perfil-ideacion' | 'cj-perfil',
  campos: FIELD_SCHEMA[] | null,      // null → the legal custom form (landing/form.js)
  mapa: CAMPOS_* ,                     // for the map figure (legal: CAMPOS + FIJOS as today)
  archivos: ARCHIVOS_*,                // tab order; the first file shown: principal
  principal: 'SKILL.md' | 'SKILL.md' | '00_ADN.md',
  perfilEjemplo, perfilVacio, normalize, same: (a, b) => …,
  build(profile) → { name: text },
  paste(profile) → text,
  descargas(profile) → [ { id, archivo: 'resumen-de-reunion.zip', titulo: 'Skill para Claude', nota: 'Súbela sin descomprimir', bytes: () => Uint8Array }, { id: 'todo', archivo: '…-kit.zip', titulo: 'Todo (.zip)', … } ],
  // legal: 'cerebro-juridico.zip' (five files, «No es una skill») + one ZIP per chosen task («Estos sí son skills»), as today
  prueba(profile) → { tabs?: [...], pregunta, esperado: { con, sin }, nota },   // legal: per-task tabs as today
  rutas: true,          // show «Para dejarlo fijo» routes (legal: as today; new: README routes are enough → false)
  cuenta: true,         // the account privacy check (all three)
  boveda: false | true, // only juridico
  confirm3: [...]       // the three confirmation lines shown under «Copiar todo» (legal: as today; new: the three lines of the paste header)
}
```

Field schema for the generic form (`landing/form-generic.js`, new; renders from data,
native inputs, same CSS classes as `form.js`: `.field`, `.field__label`, `.field__n`,
`.feeds`, `.chips`, `.chip`, `.cards`, `.input`, `.textarea`, `.field__hint`):

```js
{ id, tipo: 'text' | 'textarea' | 'lines' | 'radio' | 'checkbox' | 'cards',
  label, hint?, placeholder?, opciones?: [{ id, label, desc? }], max?, rows?, opcional?: true, n: 1.. }
```

`lines` is a textarea whose value is split on newlines into a `string[]` (one item per
line; the hint says so). `cards` renders like `cards()` in `form.js` with `desc`.
`onChange(campo, profile, { typing })` and `onFocusField` exactly like `mountForm`, so
`main.js` treats both forms the same. Typing fields debounce as today.

Fields, in order. Skill general: skillNombre (text), queHace (text), cuando (lines),
entradas (lines), pasos (lines, hint «Uno por línea, en orden»), reglas (lines), formato
(textarea, rows 6), ejemploEntrada (textarea, opcional), ejemploSalida (textarea,
opcional), verifico (lines), material (textarea, opcional, hint «Pega aquí una guía, una
plantilla o un criterio que la IA deba leer antes de empezar. Va a references/material.md»),
quienSoy (text), nombre (text, opcional), tono (cards), herramientas (checkbox from
HERRAMIENTAS, `ninguna` exclusive as in form.js).
Ideación: frase (textarea rows 2, placeholder «Quiero una app que ___ para ___»), sector
(radio chips), construye (checkbox chips), herramienta (radio chips), nivel (radio chips),
restricciones (lines, opcional, hint «Lo que tu producto nunca hace o lo que nunca pegas»),
nombre (text, opcional), tono (cards), herramientas (checkbox).

### `index.html` changes

- `<title>Cerebro · Construye tus skills</title>`; meta description general; mark
  «§ cerebro» (bar, footer, favicon unchanged).
- Hero: eyebrow «Cerebro · IA generativa y skills»; title lines «La IA no es tu asistente
  junior;» / «es tu sistema.» / «Y los sistemas se diseñan.»; lead: «**La IA ya sabe
  buscar; tu criterio no está en internet.** Un cerebro es lo que la IA no puede buscar de
  ti, escrito una vez: quién eres, cómo haces cada tarea, qué nunca hace y cómo se
  verifica. Una skill es ese cerebro empacado para que la IA lo aplique sola cuando
  aparece la tarea.»; promise unchanged. CTAs: «Construir mi skill» → `#construir`.
- The «Te llevas» aside becomes dynamic: title «Te llevas» + list of the active cerebro's
  files with a one-line description each (skill: SKILL.md «La skill, para Claude»,
  INSTRUCCIONES_GPT.md «La misma skill para ChatGPT y Gemini», README.md «Cómo instalarla
  y probarla»; ideación adds PRIMER_MENSAJE.md «Lo que envías primero» and the two
  references «Plantilla de la spec» / «Reglas de mesa»; legal: the six as today).
- Steps nav: «Construye / Carga / Prueba» (drop the fourth).
- In `#construir`, above the toolbar: the tab strip `role="tablist"` «Skill general ·
  Ideación · Jurídico» (ids `cerebro-skill`, …), each tab with a one-line sub-label
  («Una skill para cualquier tarea» · «De la idea a la spec y al primer prompt» · «El
  cerebro de un abogado: cinco archivos y sus skills»). Below it, `sec__title` and
  `sec__lead` change with the tab. Active tab in `localStorage` `cj-cerebro`; deep links
  `#skill`, `#ideacion`, `#juridico` select the tab and scroll to `#construir`; `?c=` too.
  Default `skill`.
- Toolbar buttons: «Empezar en blanco» / «Volver al ejemplo de {nombre}».
- `#cargar`: lead per cerebro. «Copiar todo para pegar en un chat» uses `paste()`; the
  three confirmation lines come from `confirm3`. The two download cards become one list
  from `descargas()` plus «Cómo instalarla en Claude» (`INSTALAR_SKILL`) shown for all.
  Keep the legal texts «No es una skill» and «Estos sí son skills» for the legal cards
  (`facts.test.mjs` asserts them: update the test to read the strings from `cerebros.js`
  or keep them literally in the HTML template of the legal download card).
  «Para dejarlo fijo» routes block: legal only (`rutas: true`).
- `#prueba`: per cerebro (`prueba()`); legal keeps its task tabs; the two columns render
  `esperado`; the `<details>` «¿Por qué no una pregunta de “cuántos días”?» legal only.
- `#boveda`: legal only (`hidden` otherwise); nav link «Bóveda» hidden with it.
- Footer: «Playbook» link stays; legal disclaimer line only when legal tab is active;
  «Borrar mis datos» clears all three profiles and the tab choice.
- Dock (phones): nodes from the active cerebro's `archivos` (short labels: first two
  characters, or the first letter after `references/`).

### `main.js`

Refactor into: state `{ cerebro, profile, files }` per cerebro, `switchCerebro(id)`
(re-mounts the form: custom `mountForm` for legal, `mountGenericForm` otherwise; re-mounts
the map with that cerebro's `mapa`/`archivos`; `mountArchivos` gains `setArchivos(list)`
so tabs re-render), the existing renderers parameterised by the active cerebro. Keep every
legal behaviour byte-for-byte (same ids, same texts).

### `store.js`

`loadProfileFor(cerebro)`, `saveProfileFor(cerebro, profile)` using `cerebro.storeKey`
and `cerebro.normalize`; keep `loadProfile/saveProfile` for the legal key. `KEYS` adds
`perfilSkill: 'cj-perfil-skill'`, `perfilIdeacion: 'cj-perfil-ideacion'`, `cerebro:
'cj-cerebro'`; `clearData` removes them all. Update `store.test.mjs` and `CONTRACT.md`.

### CSS (`landing/landing.css`)

Tab strip for cerebros (`.cerebros`, `.cerebros__tab`, sub-label), reuse `.pill` look but
larger; works at 390 px (tabs wrap or scroll) and 1440 px. Light and dark. The generic
form must look identical to the legal one.

### Verification (B reports with evidence)

`node --test …` all green; `node scripts/build.mjs cerebro`; with `playwright-core`
(`chromium.launch({ channel: 'chrome' })`) open `dist` via `PORT=8099 node scripts/serve.js`
and check `/cerebro/`: default tab skill, switch the three tabs, type in a `lines` field
and see the file change, download buttons produce ZIPs (assert `Content-Type` or the
download event), `#ideacion` deep link, `/cerebro/offline/` still builds. Screenshots of
the three tabs at 390 and 1440 under `x10/.shots/cerebro/landing/`. No console errors.

---

## C · Deck (`presentacion/`)

Goal: the same deck engine and controllers, now **Cerebro: cómo funciona la IA generativa
y cómo se le escribe una skill**. General audience; legal is the worked example.

- `config.json`: `titulo` «Cerebro · IA generativa y skills: lo que la IA no puede buscar
  de ti»; `marca.texto` «cerebro»; `evento` «Clase · Cerebro: IA generativa y skills»;
  `fecha` `{{FECHA_CLASE}}` (presenter fills it); `bloques` renamed: 00 Antes de empezar ·
  01 Gancho y tesis · 02 Cómo funciona · 03 Una skill · 04 Evidencia y verificación · 05
  Cierre; `qr.construir` → `https://x10.expert/cerebro/#skill`, add `qr.ideacion` →
  `https://x10.expert/cerebro/#ideacion` (the build writes `qr/ideacion.svg`); keep
  `prueba` (the legal A/B captures) and `fuentes`; `encuesta.sesion` → `cerebro-skills`.
- Block 1: `sala` (labels: «usa IA cada semana o más», «la IA que más usan», «ya usa
  Proyectos o Gems», «creó una skill, un GPT o una Gem», «no apagó el entrenamiento, o no
  sabe», «ya recibió un dato o una fuente que no existía»; lists «Quiénes son» (rol) and
  «Para qué la usan» (usos)) · `c03` thesis general («La IA no es tu asistente junior; es
  tu sistema.») · `criterio` general (cards: Tu criterio «Qué aceptas, qué negocias, qué
  nunca haces» → `SKILL.md · Reglas`; Tu procedimiento «Los pasos, y dónde se detiene: YO
  DECIDO» → `SKILL.md · Pasos`; Tus límites «Qué nunca subes, y a qué cuenta» → `Reglas`;
  Tu forma de entregar «Formato y tono, igual siempre» → `Formato`) · `c05` map, now «Un
  cerebro hace lo mismo, escrito en archivos» with the generic skill sections instead of
  the five legal files.
- Block 2 «Cómo funciona» (promote from reserve and generalise the text, keep controllers):
  `c08` «Sin búsqueda, estima» (general example, no court) · `c09` la mesa de trabajo
  (context window) · `c11` «Dónde se equivoca hoy» (general: datos, fechas, citas, código
  que no existe) · `c16` libro abierto (RAG) · `c17` IA con manos (agentes) · `c04`
  neurona/Hebb stays in reserve.
- Block 3 «Una skill»: `pse` «Pegar, Proyecto o skill» (keep 85 % / 55 %) · `campos` «Qué
  campo mueve qué» rewritten for the general skill form (Nombre y qué hace → description:
  cuándo se activa; Pasos y reglas → lo que la IA hace y nunca hace; Formato, ejemplo y
  verifico → cómo entrega y cómo sabes que quedó bien; Tono y quién soy → cómo te habla;
  IA que usas → solo el README) · new `tres` «Tres cerebros, un mismo método» (Skill
  general · Ideación · Jurídico: one line each, the QR of `construir`) · `c07` go
  («Construyan su skill», QR `construir`, 6 min) · `c12` load · `c13` «La prueba: una
  tarea suya» general.
- Block 4: `c18` + `ab` (legal A/B kept as the worked example; kicker «El ejemplo que
  corrimos con abogados») · `c21` gates generalised («Cinco minutos antes de usarlo») ·
  `c22` → «El que firma, decide y responde eres tú.» general.
- Block 5: `c23` close («La herramienta va a cambiar el año entrante. Tu cerebro, no.»).
- Reserve (`b9`, uncounted, notes «Reserva ·»): `trampa`, `c01` (legal numbers), `r1`,
  `r2`, `r3`, `c02`, `c04`, `c06`, `c14` ladder, `c15` vault, and the legal versions of
  `criterio`/`campos` if useful.
- Speaker notes re-timed; the total should stay around 22 minutes.
- `deck.css`: whatever the new `tres` slide needs; no overflow at 1920×1080 (check with
  the existing screenshot script `shots/` approach: Playwright, each slide, no element
  overflowing the section; fix as the previous session did for `campos`).
- Keep `sala.js` working (it reads `data-sala-*`; the KPI keys do not change).

Verification: `node scripts/build.mjs cerebro`; open `dist/cerebro/presentacion/index.html`
with Playwright, count slides, screenshot every counted slide to `x10/.shots/cerebro/deck/`,
report any overflow fixed. Smoke expects `§cerebro` in the deck text and ≥ 24 counted
slides (D updates `smoke.mjs`; C keeps ≥ 24).

---

## D · Survey, platform copy (Sonnet)

- `web/shared/encuesta.js`: header comment general; `SESSION_DEFAULT = 'cerebro-skills'`;
  options:
  - `rol` «¿Qué haces hoy?»: estudiante «Estudiante», emprendedor «Emprendedor/a», empresa
    «Profesional en una empresa», independiente «Independiente o freelance», docente
    «Docente o investigador/a», publico «Sector público», otro «Otro».
  - `herramientas`: chatgpt, claude, gemini, copilot «Microsoft Copilot», perplexity,
    notebooklm «Gemini Notebook (NotebookLM)», otra «Otra», ninguna «Ninguna todavía».
  - `usos` «¿Para qué la usas?» (exclusive `nada`): escribir «Escribir o redactar»,
    resumir «Resumir o estudiar», construir «Programar o construir apps», datos «Analizar
    datos o tablas», buscar «Buscar información», imagenes «Imágenes, diseño o video»,
    ideas «Pensar ideas o decidir», nada «Nada aún».
  - `alucino` «¿La IA te ha dado un dato, una cita o una fuente que no existía?»
    (si / no / noverifique «No lo verifiqué»).
  - `favorita`, `plan`, `frecuencia`, `proyectos` («¿Usas Proyectos (ChatGPT, Claude) o
    Gems (Gemini)?»), `skill` («¿Has creado una skill, un GPT personalizado o una Gem?»),
    `entrena`: keep ids; generalise wording where it says abogado/jurídico.
  - `CONTACTO.ayuda` general («Para enviarte el kit de la clase…»), placeholders general
    (`Sofía Ruiz`, `sofia@correo.co`).
  - Keep every question id and the SINGLE/MULTI sets: the SQL function depends on them.
  - Update `encuesta.test.mjs` for the new options and session.
- `web/encuesta/index.html`: title/meta/mark «cerebro», intro keeps the h1 «¿Cómo usas la
  IA hoy?» (smoke), copy general.
- `talleres.config.js` cerebro: `nombre` «Cerebro · IA generativa y skills», `resumen`
  «Un cerebro es lo que la IA no puede buscar de ti, escrito una vez. Tres constructores:
  una skill general, la skill de ideación del curso de vibe coding y el cerebro
  jurídico.», `fecha` «Clase abierta · 2026» (no invented date), `marca` unchanged.
- `scripts/smoke.mjs`: `/talleres/` text «Cerebro ·» → use `'Cerebro'`; `/cerebro/` expects
  `#construir` and the tab strip `[role="tablist"] [data-cerebro="skill"]`; deck text
  `§cerebro`.
- `src/gate/gate.js`: mark «§ cerebro», `<title>Uso interno · Cerebro</title>`; keep
  «Presentación de uso interno» (tests).
- `web/playbook/index.html`: only the portada: title «Cerebro · Playbook», mark
  «cerebro», one paragraph at the top of «Qué hay aquí» saying this playbook keeps the
  legal brain as the complete worked example and that the fundamentals chapter applies to
  any cerebro; link `/cerebro/#skill` and `/cerebro/#ideacion`. Nothing else.
- Run `node --test talleres/cerebro/web/shared/encuesta.test.mjs src/gate/gate.test.mjs`.

---

## Copy bank (Spanish, reuse verbatim)

- Tab leads. Skill: «Una skill es un procedimiento escrito que la IA aplica sola cuando
  aparece la tarea. Llena los campos como se los explicarías a alguien nuevo en tu
  equipo; al lado se escribe tu SKILL.md.» Ideación: «La skill del curso de vibe coding:
  convierte una idea en una spec de una página y en el primer mensaje para la
  herramienta. Pasa la prueba del adivino antes de construir.» Jurídico: the current lead.
- Cargar lead (new cerebros): «Un botón copia la skill con una instrucción al inicio.
  Abre un chat nuevo, pega y envía. Para dejarla fija, el README trae la ruta de cada
  herramienta.»
- Prueba lead (new cerebros): «Hazla en un chat con la skill y en otro sin ella. Compara
  el proceso, no solo la respuesta.»
- Pegar, Proyecto o skill (deck and landing): «Pegar: vale para este chat. Proyecto: vale
  para todos los chats del proyecto. Skill: la IA la aplica sola, en cualquier chat,
  cuando aparece la tarea.»
