# Cerebro Jurídico — contract for the web pages

Read this before touching `x10/talleres/cerebro/`. Source of truth for routes, data,
anchors and ownership while several agents work in parallel.

## Context

The platform (`x10/`, Vite, deployed on Vercel at https://x10.expert, project `x10-presentacion`)
hosts several workshops listed in `x10/talleres.config.js`. x10 (`x10/apps/`, `x10/src/`)
and Vibe Coding (`x10/talleres/vibecoding/`) **must not be touched**. This workshop is
**Cerebro Jurídico**: a 30-minute workshop for ~94 Colombian lawyers (litigants, firm,
in-house, public sector, legaltech founders, students), mixed AI level, each with a laptop
or a phone. Thesis: "La IA no es tu abogado junior; es tu sistema. Y los sistemas se
diseñan." Each attendee leaves with five Markdown files (their "cerebro jurídico") built
from their profile, loaded into whatever AI they already use.

**The plan is the source of all content:** `x10/talleres/cerebro/plan-taller.md`. Read all
of it. Its vocabulary is the course vocabulary: keep it ("cerebro jurídico", "la mesa de
trabajo", "la biblioteca cerró", "libro abierto", "la IA con manos", "YO DECIDO",
"Verificación pendiente", "líneas rojas", DOTS, niveles 0–5, CLIENTE-01, Laura).

User-facing copy in Spanish (Colombia), addressing the reader as **tú**, plain and precise.
Code and comments in English.

## Routes and ownership

| Route | Folder (under `x10/talleres/cerebro/web/`) | Owner |
|---|---|---|
| `/cerebro/` | `index.html` + `landing/` | worker A |
| shared web code | `shared/` (except `theme.css`) | worker A |
| `/cerebro/playbook/` | `playbook/` | worker B |
| `/cerebro/presentacion/` | `../presentacion/` (the deck) | coordinator |
| `shared/theme.css`, `../accent.css`, `talleres.config.js`, `scripts/`, `package.json`, Vite configs | — | coordinator; ask before changing |

Build and dev:
- `cd x10 && node scripts/build.mjs cerebro` builds only this workshop (deck + web).
- Dev server: worker A `TALLER=cerebro npx vite -c vite.apps.config.js --port 5191`,
  worker B the same with `--port 5192`. Pages at `/cerebro/` and `/cerebro/playbook/`.
- Vite web root is `talleres/cerebro/web`, base `/cerebro/`. Every `index.html` under it
  becomes a page. Aliases: `@platform` = `x10/`, `@engine` = `x10/src/js`.

## No backend, no data leaves the browser

The plan's promise is "Nada se envía a ningún servidor" (§6.1, §6.15). So:
- No Supabase, no fetch to any API, no analytics, no CDNs, no external fonts or images.
- The profile may be kept in `localStorage` key `cj-perfil` (it stays on the device; say so).
  Theme choice in `localStorage` key `cj-theme`.
- No runtime `fetch()` of local JSON and no dynamic `import()`: everything is a static ES
  import, so the coordinator can also build the landing as one offline HTML file (plan B
  without network, §6.15).
- No new npm dependencies. ZIP files are written by our own small store-only ZIP writer.

## Design system

Same family as x10 and Vibe Coding, its own accent:
- Start every page stylesheet with `@import '../shared/theme.css';` (paths relative to the
  page folder; the landing uses `../shared/theme.css` from `landing/`). It loads the
  platform tokens, dark + light themes, the Cerebro accent and self-hosted fonts (Space
  Grotesk for display, Inter for text).
- Accent: electric violet `#9D86FF` (tokens still call it `--gold`, `--gold-text`,
  `--gold-soft`); secondary teal `#4FE0C0` (`--cyan`, `--cyan-text`). Ink `#0B0F1A`,
  paper `#F7F5F0`. Light theme text accents: violet `#5A3FD6`, teal `#0B7A63`.
- Motif: neurons and synapses (nodes, connections, pulses travelling along them). Brand
  mark: `§` in the accent + "cerebro jurídico". No "×" (x10) or "›" (Vibe Coding) motifs.
- Default dark, light toggle, respect `prefers-color-scheme` and `prefers-reduced-motion`
  (every animation has a static equivalent).
- Mobile-first for the landing (attendees scan a QR with their phone), comfortable on a
  laptop and projected at 150 % zoom. Accessible: real labels, focus states, contrast
  ≥ 4.5:1, keyboard-operable widgets.

## Landing anchors (worker A must create these ids; the deck's QR codes point to them)

`#inicio` · `#construir` (profile + live files) · `#cargar` (copy all + how to load it per
tool) · `#prueba` (test question, with/without brain) · `#boveda` (Obsidian vault ZIP)

## Playbook anchors (worker B must create exactly these ids; landing and deck link to them)

`#portada` `#dots` `#fundamentos` `#modelo-de-lenguaje` `#mesa-de-trabajo` `#biblioteca`
`#alucinacion` `#capas` `#memoria` `#ingenieria-de-contexto` `#libro-abierto`
`#ia-con-manos` `#skills` `#nube-o-local` `#por-que-difieren` `#tu-cerebro`
`#cinco-archivos` `#ejemplo-laura` `#mantenimiento` `#niveles` `#construir-y-cargar`
`#rutas-de-carga` `#pregunta-de-prueba` `#escalar` `#obsidian` `#notebooklm` `#nivel-3`
`#grilla` `#verificar` `#red-team` `#marco-colombiano` `#recursos` `#glosario` `#manana`

## Shared catalog (worker A writes it first; worker B may import it read-only)

`shared/catalog.js` exports the plan's catalogs as plain data, text verbatim from the plan:

```js
export const ROLES            // §6.5  [{ id, label, sistema, buenTrabajo: [..], nuncaDelego }]
export const AREAS            // §6.6  [{ id, label, fuentes: [..] }]
export const TAREAS           // §6.7  [{ id, label, skill: { titulo, cuando?, texto } }]
export const CONFIDENCIALIDAD // §6.8  [{ id, label, reglas: [..], sistema }]
export const TONOS            // §6.9  [{ id, label, instruccion, formato }]
export const HERRAMIENTAS     // §6.3  [{ id, label }]
export const RUTAS_CARGA      // §6.12 [{ id, label, pasos: [..] }]
export const PREGUNTA_PRUEBA, PREGUNTA_RESERVA   // §6.13 strings
export const PERFIL_LAURA     // §4.3 / §6.11 the preloaded example profile
```

## Content rules (non-negotiable)

- Do not invent figures, statistics, prices, quotes, case names, sentence numbers or
  testimonials. Use the plan's statements; the coordinator is fact-checking them against
  official sources and will patch what changes.
- Legal content is "semilla para verificación en fuente oficial; no constituye asesoría
  jurídica" — say so where norms are listed. Never cite a sentencia number the plan marks
  `[VALIDAR]` (e.g. the unificación for CLIENTE-01).
- Tool facts that change often (free-plan limits, plan names, button labels in Claude,
  ChatGPT, Gemini, Copilot, NotebookLM, Obsidian) are marked `{{VERIFICAR_<WHAT>}}`, never
  stated as fact beyond what the plan says.
- Keep `{{PLACEHOLDERS}}` for what only the presenter knows (`{{FECHA_EVENTO}}`,
  `{{URL_CORTA}}`).
- Expositor: Fabián Zapata — Fundador de Zeta Innovation · Director de Innovación de GLab.

## Process rules

- Do not run `git`, `vercel` or `supabase` commands. Do not edit outside your folders.
- Need a dependency or a change in the coordinator's files? Stop and report it in your final
  message instead of working around it.
- Screenshots and checks: Node + `playwright-core` (installed in `x10/node_modules`, launch
  with `chromium.launch({ channel: 'chrome' })`), never kill Chrome processes you did not
  start. Save screenshots under `x10/.shots/cerebro/<page>/` (gitignored).
- Before reporting done: `cd x10 && node scripts/build.mjs cerebro` passes (the deck may
  still be in progress; if only the deck fails, say so) and your pages load with no console
  errors in dark and light, at 390 px and 1440 px wide.
