# brief-a-mvp · skill del taller

Pega tu brief (o tu idea) y la skill te devuelve el recorte a MVP, la SPEC de una página y los prompts por capas para construirla hoy.

## Instalar

**Claude (claude.ai):** Ajustes → Capacidades → Skills → subir `brief-a-mvp.zip` sin descomprimir. Luego, en un chat nuevo, pega tu brief y di con qué herramienta vas a construir.

**Claude Code:** copia la carpeta `brief-a-mvp/` a `~/.claude/skills/brief-a-mvp/` (para todos tus proyectos) o a `.claude/skills/brief-a-mvp/` dentro del proyecto. Luego: `/brief-a-mvp` o simplemente pega el brief.

**ChatGPT / Gemini:** abre un chat nuevo y pega el contenido de `INSTRUCCIONES_GPT.md` (es la skill y sus referencias en un solo texto). Después pega tu brief.

## Probar

Pega el brief de tu grupo y escribe: "Voy a construir en [Lovable / Claude / Claude Code / Codex / AI Studio], [nunca he construido / ya hice algo con IA / programo], tengo una sesión de 90 minutos. Dame el MVP y los prompts."

Debe responder con nueve secciones: lo que entendió, preguntas (máximo tres), momento de valor, recorte, SPEC, plan de capas, prompts, reglas de mesa y "Lo que aún adivinaría". Si no hace eso, vuelve a pegar en un chat nuevo.

## Archivos

- `brief-a-mvp/` — la skill (SKILL.md + references/ + evals/)
- `brief-a-mvp.zip` — la misma carpeta para subir a claude.ai
- `INSTRUCCIONES_GPT.md` — versión en un solo texto para ChatGPT y Gemini
