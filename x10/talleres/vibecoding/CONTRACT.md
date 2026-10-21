# Vibe Coding — contract for the web pages

Read this before touching `x10/talleres/vibecoding/`. Source of truth for routes, data,
anchors and ownership while several agents work in parallel.

## Context

The platform (`x10/`, Vite, deployed on Vercel at https://x10.expert, project `x10-presentacion`)
hosts several workshops listed in `x10/talleres.config.js`. The first one, x10, lives in
`x10/apps/` and `x10/src/` and **must not be touched**. This workshop is **Vibe Coding ·
Clase 1**: 150 minutes, university students with zero technical background, each with a
laptop. They leave with a one-page spec, a first version published at a URL (Lovable) and
the code in their own GitHub repository. Class 2 builds on that.

**The plan is the source of all content:** `x10/talleres/vibecoding/plan-clase-1.md`. Read
all of it. Its phrasing ("caja cerrada / caja abierta", "prueba del adivino", "reglas de
mesa", "puntos de control", "mapa de 5 piezas") is the course vocabulary: keep it.

User-facing copy in Spanish (Colombia, tú), practical and plain. Code and comments in English.

## Routes and ownership

| Route | Folder (under `x10/talleres/vibecoding/web/`) | Owner |
|---|---|---|
| `/vibecoding/` | `index.html` + `landing/` (CSS/JS) | worker A |
| `/vibecoding/panel/` | `panel/` | worker A |
| `/vibecoding/encuesta/` | `encuesta/` (encuesta de entrada, anónima) | coordinator |
| shared web code | `shared/` (except `theme.css`) | worker A |
| `/vibecoding/playbook/` | `playbook/` | worker B |
| `/vibecoding/presentacion/` | `../presentacion/` (the deck) | coordinator |
| `shared/theme.css`, `../accent.css`, `talleres.config.js`, `scripts/`, `package.json`, Vite configs, `supabase/` | — | coordinator; ask before changing |

Build and dev:
- `cd x10 && node scripts/build.mjs vibecoding` builds only this workshop (deck + web).
- Dev server for the web pages: worker A `TALLER=vibecoding npx vite -c vite.apps.config.js --port 5181`,
  worker B the same with `--port 5182`. Pages at `/vibecoding/`, `/vibecoding/playbook/`, `/vibecoding/panel/`.
- Vite web root is `talleres/vibecoding/web` with base `/vibecoding/`. Every `index.html`
  under it becomes a page. Aliases: `@platform` = `x10/`, `@engine` = `x10/src/js`.
- `.env.local` already has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key).

## Design system

Same family as x10, different accent:
- Start every page stylesheet with `@import '../shared/theme.css';` (paths relative to the page
  folder; the landing uses `./shared/theme.css`). It loads the platform tokens, dark + light
  themes, the Vibe Coding accent and self-hosted fonts (Space Grotesk for display, Inter for text).
- Accent: cyan `#3AC7E8` (the tokens still call it `--gold`, `--gold-text`, `--gold-soft`);
  secondary accent gold (`--cyan`, `--cyan-text`). Ink `#0B0F1A`, paper `#F7F5F0`.
- Brand mark: `›` in the accent + "vibe coding". No "×" motif (that is x10's).
- Default dark, light toggle, respect `prefers-color-scheme` and `prefers-reduced-motion`.
  Theme choice in `localStorage` key `vc-theme`.
- These pages are used on **laptops during class** (spec builder, checklist, exit form)
  and on phones afterwards: design for both, laptop first for the landing tools.
- Accessible: real labels, focus states, contrast ≥ 4.5:1, keyboard-operable widgets.
- No CDNs, no external requests from the pages, no new dependencies without asking.

## Data (Supabase, already provisioned)

Table `public.workshop_submissions` (RLS: anyone can INSERT, only the presenter
`fabiing10@gmail.com` can SELECT/DELETE via magic link; realtime enabled):

| column | value for this workshop |
|---|---|
| `workshop` | `'vibecoding'` |
| `form` | `'salida'` (exit form) |
| `session` | from `?s=<code>` (slug `[a-z0-9-]`, ≤ 40), default `'clase-1'` |
| `payload` | `{ nombre, url_app, url_repo, duda, punto_control }` (`punto_control` integer 1–5) |
| `consent_at` | ISO timestamp, required when the student submits (Ley 1581 de 2012 consent) |

Encuesta de entrada (`/vibecoding/encuesta/`): same table, `form` `'intro'`, no `consent_at`
(anonymous: no name, no email). `payload` = `{ entidad, sector, rol, nivel (0–4), frecuencia,
herramientas[], favorita, construido[], creadores[] }`, options in `web/shared/encuesta.js`.
Aggregates for the survey page and the deck slide `#/sala` come from the public function
`vc_intro_summary(p_session)` (migration `20261020170000_vc_intro_summary.sql`), never from rows.

Insert without `.select()` (anon cannot read). Panel login: `supabase.auth.signInWithOtp`
with `{ shouldCreateUser: false, emailRedirectTo: location.origin + '/vibecoding/panel/' }`.
The presenter user exists; signups are disabled. Allowed redirects: `https://x10-presentacion.vercel.app/**` (add `https://www.x10.expert/**` so the panel login works on the custom domain)
and `http://localhost:5181/**`, `http://localhost:5182/**` (already configured).
Never collect more personal data than the plan's exit form asks for.

## Landing anchors (worker A must create these ids; the deck's QR codes point to them)

`#encuesta` (encuesta de entrada) · `#cinco-piezas` (hoja "Mi app en 5 piezas") · `#spec` (spec builder) ·
`#menu` (menú de proyectos) · `#reglas` (reglas de mesa + protocolo de error) · `#salida` (exit form)

## Playbook anchors (worker B must create exactly these ids; landing and deck link to them)

`#empieza-aqui` `#vibe-coding` `#cinco-piezas` `#spec` `#prueba-del-adivino` `#plantilla`
`#cabecera` `#menu-de-proyectos` `#reglas-de-mesa` `#protocolo-de-error` `#seguridad`
`#ruta-a` `#ruta-b` `#caja-cerrada-o-abierta` `#clase-2` `#glosario`

## Content rules (non-negotiable)

- Do not invent figures, statistics, prices, quotes or testimonials. Tool facts (Lovable,
  Base44, Claude Code, Codex, GitHub, Vercel) only as the plan states them, with its source
  links, or verified now against the tool's official documentation and cited with a link.
  Anything that changes often (free-plan credits, prices, plan names, UI button names) is
  marked to verify, e.g. `{{VERIFICAR_CREDITOS_LOVABLE}}`, never stated as fact.
- Keep `{{PLACEHOLDERS}}` for things only the presenter knows (`{{FECHA_CLASE_1}}`,
  `{{URL_TABLERO_LOVABLE}}`, `{{URL_PROYECTO_CLAUDE_CODE}}`, `{{LUGAR}}`).
- Expositor: Fabian Zapata. Name only: no phone, email, WhatsApp or social profile anywhere
  in Vibe Coding (landing, playbook, survey, deck). The deck is for the presenter: no public
  page links to `/vibecoding/presentacion/`.
- Safety section of the plan ("Qué no hacer") is mandatory wherever students build.

## Process rules

- Do not run `git`, `vercel` or `supabase` commands. Do not edit outside your folders.
- Need a dependency, a schema change or a Supabase redirect URL? Stop and report it in your
  final message instead of working around it.
- Screenshots and checks: use Node + `playwright-core` (installed in `x10/node_modules`,
  launch with `chromium.launch({ channel: 'chrome' })`), not a shared browser session.
  Save screenshots under `x10/.shots/vibecoding/<page>/` (gitignored).
- Before reporting done: `cd x10 && node scripts/build.mjs vibecoding` passes and your pages
  load with no console errors.
