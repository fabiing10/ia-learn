# x10 companion apps — shared contract

Read this before touching anything under `x10/apps/`. It is the single source of
truth for routes, data, anchors and ownership while two agents work in parallel.

## Context

`x10/` is a web presentation (Reveal.js + GSAP + Three.js) for the talk
"x10 · Multiplica tus talentos con inteligencia artificial" (Convención de Hombres
MCI 2026, ~130 men, ages 20–50, very mixed AI knowledge). Read
`../x10-brief-presentacion.md` (repo root) for the full content, tone and rules, and
`x10/src/slides/*.html` for the slide text. Tone: practical workshop, respectful,
no hype, no fear-mongering. User-facing copy in Spanish (Colombia), code and
comments in English.

Hosting: Vercel project `x10-presentacion`, production https://x10-presentacion.vercel.app.
`npm run build` builds the deck to `dist/` and then every `apps/<name>/index.html`
to `dist/<name>/index.html` via `vite.apps.config.js` (do not edit either Vite config).

| Route | Folder | Owner | Purpose |
|---|---|---|---|
| `/` | `src/` | coordinator | The deck (do not touch) |
| `/test` | `apps/test/` | worker A | Public profiling form + personal diagnosis |
| `/panel` | `apps/panel/` | worker A | Presenter-only realtime dashboard |
| shared app code | `apps/shared/` | worker A | Supabase client, questionnaire, scoring, app CSS |
| `/playbook` | `apps/playbook/` | worker B | Take-home playbook |
| `supabase/`, `package.json`, Vite configs, `config.json` | — | coordinator | Ask before changing |

Dev servers: worker A uses `npx vite -c vite.apps.config.js --port 5175`, worker B
uses `--port 5176`, so they never collide. Pages are at `/test/`, `/panel/`, `/playbook/`.

## Design system (both workers)

Reuse the deck's identity so everything feels like one product:

- Import `../../src/styles/tokens.css`, `theme-dark.css`, `theme-light.css` and fonts
  via `@fontsource/space-grotesk` (600, 700) and `@fontsource/inter` (400, 500, 600)
  — already installed. No CDN, no Google Fonts.
- Palette: ink `#0B0F1A`, paper `#F7F5F0`, gold "talento" `#E8B53A` (accent),
  cyan `#3AC7E8` (tech accent). Traffic-light colours only where the semáforo
  concept appears.
- The "×" is the brand motif (×1, ×2, ×5, ×10 levels; the mark "×10").
- Default dark; respect `prefers-color-scheme` and `prefers-reduced-motion`.
- Mobile-first: attendees open `/test` and `/playbook` on phones (390×844).
- Accessible: real labels, focus states, contrast ≥ 4.5:1, tap targets ≥ 44 px.

## Data (Supabase)

Env vars (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` from `x10/.env.local`
(gitignored). The coordinator provisions the project and sends the values. Until
then, code must run in a clearly labelled **demo mode** (no env → store in
`localStorage`, show a small "modo demo" badge) so UI work is never blocked.

Table `public.x10_responses` (migration in `supabase/migrations/`, coordinator-owned):

| column | type | notes |
|---|---|---|
| `id` | uuid | default |
| `created_at` | timestamptz | default now() |
| `session` | text ≤ 40 | default `'mci-2026'`; allow `?s=<code>` override in the URL |
| `alias` | text ≤ 40, nullable | optional first name or nickname, never required |
| `role` | text ≤ 60, required | profile role key |
| `industry` | text ≤ 60 | industry key |
| `usage_frequency` | text ≤ 40 | usage key |
| `fear_level` | smallint 1–5 | 1 = sin temor, 5 = mucho temor |
| `use_areas` | text[] ≤ 12 | where they would use AI |
| `level` | `'x1' \| 'x2' \| 'x5' \| 'x10'` | diagnosis level |
| `score` | smallint 0–100 | total score |
| `scores` | jsonb < 2 KB | per-dimension scores |
| `answers` | jsonb < 8 KB | raw answers keyed by question id |
| `duration_ms` | integer | time to complete |

RLS: anyone may INSERT (no SELECT for anon). Only the presenter
(`auth.jwt()->>'email' = 'fabiing10@gmail.com'`, magic-link login) may SELECT/DELETE.
Realtime is enabled on the table. Public aggregates: `rpc('x10_summary', { p_session })`
returns `{ total, score_avg, fear_avg, fear{1..5}, level{x1..}, role{}, industry{},
usage{}, use_areas{}, updated_at }` — the deck's results slide will use it.

Never collect email, phone, document numbers or free-text personal data beyond the
optional alias. Show a one-line privacy note (anonymous, purpose: understanding the
audience of the workshop; Ley 1581 de 2012).

## Diagnosis levels (both workers use these names)

| key | label | meaning |
|---|---|---|
| `x1` | ×1 Observador | Has heard of AI, little or no use |
| `x2` | ×2 Explorador | Tries it occasionally, basic prompts |
| `x5` | ×5 Practicante | Uses it weekly with intent, verifies, knows its limits |
| `x10` | ×10 Multiplicador | Integrates it into work/ministry, delegates with criteria, teaches others |

## Playbook anchors (worker B must create exactly these ids; worker A links to them)

`#bienvenida` `#que-es-la-ia` `#glosario` `#rctf` `#prompts-trabajo` `#prompts-negocio`
`#prompts-hogar` `#prompts-biblia` `#semaforo` `#investigacion-biblica` `#herramientas`
`#seguridad` `#palabra-clave` `#privacidad` `#ia-y-los-hijos` `#marco-legal`
`#ruta-30-dias` `#recursos`

## Content rules (from the brief, non-negotiable)

- Do not invent figures, statistics, quotes or Bible verses. Use only the verses
  and data in the brief (Reina-Valera 1960). Placeholders stay as `{{LLAVES}}`.
- Do not state current prices or free-plan limits of tools as fact; say they change
  and must be checked (`{{VERIFICAR_PLANES_GRATIS}}`).
- Legal: only the verified facts in brief §11 (CONPES 4144, PL 025 de 2026 Cámara
  sin aprobar, Ley 1581 de 2012). Never give legal advice.
- No promises of wealth or magic results. "x10" is a metaphor for multiplication.

## Process rules

- Do not run `git commit`, `git push`, `vercel` or `supabase` commands; the
  coordinator does those.
- Do not edit files outside your folders. Need a dependency or a schema change?
  Ask the coordinator.
- `npm run build` must pass before you report done.
