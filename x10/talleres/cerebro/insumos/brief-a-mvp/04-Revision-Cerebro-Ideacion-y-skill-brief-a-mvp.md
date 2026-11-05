# Revisión del modo Ideación de Cerebro y diseño de la skill `brief-a-mvp`

**Para:** Claude Code (refinar la skill y la sección de ideación de x10.expert/cerebro)
**De:** revisión hecha el 5 de noviembre de 2026 sobre la página en producción, el playbook y la skill de ejemplo (Sofía)
**Objetivo:** que un participante del taller pegue su brief (plantilla Uniandes de 10 campos) o una idea en una frase y reciba (1) el recorte a MVP, (2) la SPEC de una página y (3) los prompts paso a paso, por capas, listos para Lovable, Claude, Codex o AI Studio.

---

## 1. Qué hay hoy en el modo Ideación (inventario)

### 1.1 Campos del formulario

| # | Campo | Tipo de dato | Obligatorio | Alimenta | Observación |
|---|---|---|---|---|---|
| 01 | Tu idea, en una frase | texto corto | sí | SKILL, GPT, PRIMER_MENSAJE, README | "Quién la usa y qué le resuelve". Única entrada de contenido. |
| 02 | Dónde trabajas o estudias | selección única (6: sector público, empresa privada, emprendimiento, universidad/colegio, org. social, otro) | sí | SKILL, GPT, PRIMER_MENSAJE | Solo cambia una frase de contexto. No activa reglas por sector. |
| 03 | Qué quieres construir | selección múltiple (app web, app móvil, automatización, servicio/experiencia, contenido/comunidad) | sí | SKILL, GPT | Tres de las cinco opciones no encajan con la plantilla de spec (que es de app). |
| 04 | Con qué vas a construir | selección única (Lovable, Base44, Claude Code, Codex, no sé) | sí | SKILL, GPT, PRIMER_MENSAJE, README | Define "caja cerrada / abierta". Falta Claude (artifact) y Gemini AI Studio. |
| 05 | Tu experiencia construyendo | selección única (nunca / ya hice algo con IA / programo) | sí | SKILL, GPT, PRIMER_MENSAJE | Hoy solo cambia el tono; no cambia la profundidad de la salida. |
| 06 | Tus límites | texto multilínea | no | SKILL, GPT | Van a "Reglas que siempre aplican". |
| 07 | ¿Cómo quieres que la IA te llame? | texto corto | no | SKILL, GPT, README | Presentación. |
| 08 | Cómo quieres que te responda | selección única (claro y directo / didáctico / solo lo esencial) | sí | SKILL, GPT | Va a "Formato". |
| 09 | La IA que usas hoy | selección única (Claude, ChatGPT, Gemini, Copilot, ninguna) | sí | README | Solo ordena las rutas de instalación. |

### 1.2 Archivos que genera

`SKILL.md` · `INSTRUCCIONES_GPT.md` · `PRIMER_MENSAJE.md` · `references/plantilla-spec.md` · `references/reglas-de-mesa.md` · `README.md`. Dos ZIP: la skill sola (para subir a Claude sin descomprimir) y el kit completo.

### 1.3 Procedimiento de la skill generada (7 pasos)

1. La frase ("Quiero una app que ___ para ___").
2. Prueba del adivino: máximo 3 preguntas.
3. Las cinco piezas (front, lógica, base de datos, dominio, repositorio).
4. Spec de una página con 7 bloques (para quién · qué hace 3-5 acciones con verbo · qué guarda · roles ≤2 · qué NO hace ≥3 · 3 escenarios "cuando… pasa…" · pantallas opcional).
5. Recorte: V1 = 1 rol, 3 acciones, 1 cosa guardada; correos, pagos, login, IA y "bonita" van a después. "YO DECIDO".
6. Prueba del adivino, segunda vuelta.
7. Entrega: spec + primer mensaje con cabecera + la caja + reglas de mesa en 5 líneas.
Cierre obligatorio: "Lo que aún adivinaría".

---

## 2. Veredicto como juez

### 2.1 Lo que está bien y hay que conservar

- **La prueba del adivino.** Es el mejor mecanismo del diseño: convierte "describir bien" en una prueba operativa (lo que la herramienta tendría que adivinar). Conservarla en las dos vueltas y como cierre.
- **Límites numéricos en la spec** (3-5 acciones con verbo, ≤2 roles, ≥3 "no hace", 3 escenarios). Son verificables; un evaluador automático puede comprobarlos.
- **El recorte con "YO DECIDO"** y la lista de lo que va a "después". Alineado con el principio del cerebro (la IA propone, la persona decide).
- **Reglas de mesa y protocolo de error.** Cortas, correctas, memorables. Reutilizar tal cual.
- **La cabecera del primer mensaje** ("no agregues funciones; si algo no está claro, pregúntame").
- **Description "pushy"** ("aunque no diga spec"). Es exactamente lo que Anthropic recomienda para que la skill se active: Claude tiende a no usar skills si la descripción es tímida.
- **Portabilidad** (INSTRUCCIONES_GPT) y el chequeo de carga en tres líneas.
- **Tamaño**: 47 líneas; muy por debajo del límite recomendado (500). Hay espacio para crecer con referencias.

### 2.2 Vacíos frente a lo que la clase necesita

| # | Vacío | Efecto en el taller | Severidad |
|---|---|---|---|
| V1 | **No acepta un brief como entrada.** Solo recibe "una frase" y vuelve a preguntar lo que el brief ya responde. | Los grupos ya tienen 10 campos trabajados en tres sesiones; la skill los ignora y los frustra. | Alta |
| V2 | **Termina en el primer mensaje.** No produce la secuencia de prompts por capas, ni "qué debe verse", ni el prompt de prueba final, ni la plantilla de corrección. | El 80 % del tiempo de hoy es la construcción iterativa; la skill se detiene justo antes. | Alta |
| V3 | **La cabecera dice "los datos deben guardarse en una base de datos, no en la memoria del navegador".** | Empuja a Lovable hacia Supabase + login, que es el error número 1 de una sesión de 90 minutos. Contradice el MVP sin backend. | Alta |
| V4 | **La spec no tiene un bloque de criterios/reglas de negocio** (R1…Rn en español claro). Tiene "qué hace" y "qué guarda", pero no "con qué criterios decide". | Para gestión pública (plazos, listas de chequeo, tarifas, estados) las reglas SON el producto. Sin ese bloque la herramienta las inventa. | Alta |
| V5 | **No hay bloque de datos de ejemplo** (10 registros ficticios) ni **casos de prueba con resultado esperado** (valores concretos). Los "3 escenarios" son conductuales, no verificables numéricamente. | Sin datos y resultados esperados no se puede verificar la capa 2 (motor de reglas). | Alta |
| V6 | **El recorte es genérico** (correos, pagos, login, IA, bonita). No cubre lo que piden los briefs del sector público: SECOP, Orfeo, correo institucional, OCR de PDF, jurisprudencia, firma/radicación, Word/Excel/PPT. Y solo manda a "después"; no da el **sustituto viable**. | Los grupos no saben por qué reemplazar "consulta SECOP" hoy. | Media |
| V7 | **No adapta la salida a la herramienta.** "Caja cerrada/abierta" es un buen concepto, pero el prompt es el mismo para Lovable, Claude Code, Codex; no existe Claude (artifact) ni AI Studio. | Lovable necesita "sin Supabase"; Claude Code/Codex "un solo index.html"; artifact "almacenamiento del artifact + descarga por capacidad". | Media |
| V8 | **Falta el bloque de validación humana** en la spec (el "YO DECIDO" del cerebro general y el "Humano responsable" del brief). | Es el criterio común de los 8 briefs y de la T-323; no puede ser implícito. | Media |
| V9 | **El campo 05 (experiencia) no cambia la salida**, solo el tono. | Quien "nunca ha construido" necesita "qué debe verse" y "si falla" después de cada prompt; quien programa, no. | Baja |
| V10 | **Campo 03 (qué construyes)** mezcla tipos que la spec no soporta (contenido, comunidad, servicio). | Ruido; no produce salidas distintas. | Baja |
| V11 | **El ejemplo (Sofía, mantenimiento de edificio)** no es del dominio del taller. Los ejemplos enseñan más que las reglas y también afectan el disparo de la skill. | Para la clase de gestión pública, el ejemplo debe ser un brief público (el Semáforo). | Baja |
| V12 | **No hay evals.** No existe una forma de saber si la skill mejora o empeora al editarla. | Claude Code puede correr casos de prueba; hoy no hay ninguno. | Media |

### 2.3 Lo que NO cambiaría

La estructura de tres pasos de la landing (construye / carga / prueba), la privacidad en el navegador, el chequeo de carga en tres líneas, y la decisión de generar texto plano portable. El problema no es la landing; es que la skill de Ideación está diseñada para "idea en una frase → spec → primer prompt" y el taller necesita "brief → MVP → prompts por capas".

---

## 3. Diseño propuesto: skill `brief-a-mvp`

Recomendación: **no sobrescribir** la skill de Ideación (sirve para quien llega con una idea suelta). Crear una segunda skill, `brief-a-mvp`, que la continúa: acepta un brief o una idea, recorta, escribe la SPEC con reglas y datos de ejemplo, y entrega los prompts por capas adaptados a la herramienta. En la landing, puede aparecer como cuarta tarjeta ("De brief a MVP: la spec, las capas y los prompts") o como modo dentro de Ideación cuando el campo "Pega tu brief" tiene contenido.

### 3.1 Entradas (campos nuevos o modificados en la landing)

| # | Campo | Tipo | Oblig. | Qué hace en la skill |
|---|---|---|---|---|
| A | **Pega tu brief** (o escribe tu idea en una frase) | texto multilínea | sí (uno de los dos) | Si trae los campos de la plantilla (nombre y entidad, usuario, problema, reto, solución, flujo, qué no hará, datos, humano responsable, cómo sabremos), se mapean a la SPEC y se saltan las preguntas ya respondidas. Si es una frase, se corre la Ideación clásica primero. |
| B | Sector | selección única | sí | `Sector público` activa el bloque de reglas del sector (datos ficticios, nunca decide/firma/radica, humano responsable, sin fuentes institucionales) y la tabla de recorte pública. |
| C | Herramienta | selección única: Lovable · Claude (artifact) · Claude Code · Codex · Gemini AI Studio · no sé | sí | Selecciona el archivo `references/herramientas.md` → bloque de la herramienta: instrucción técnica de cabecera, persistencia, descargas, cómo retroceder. |
| D | Experiencia | selección única (nunca / algo con IA / programo) | sí | `nunca`: cada prompt lleva "qué debe verse" y "si falla". `programo`: prompts sin andamiaje. |
| E | Tiempo disponible | selección única: 1 sesión (90 min) · 1 día · 1 semana | sí | Define cuántas capas entran en el MVP (90 min = capas 0-6 con una sola salida documental). |
| F | Límites | texto multilínea | no | Igual que hoy; se suman a "Qué NO hará" del brief. |
| G | Tono / nombre / IA que usas | como hoy | — | Sin cambios. |

Eliminar el campo 03 (qué construyes) o reducirlo a "app web / automatización"; el resto no produce salidas distintas.

### 3.2 Procedimiento de la skill (lo que Claude hace al activarse)

1. **Leer la entrada y mapearla.** Tabla campo del brief → bloque de la SPEC (ver `references/plantilla-spec-mvp.md`). Listar los bloques que quedaron vacíos.
2. **Prueba del adivino (≤3 preguntas), solo sobre los vacíos que más cambian el MVP.** Si el usuario dice "asume", asumir y registrarlo en "Lo que aún adivinaría".
3. **Momento de valor.** Una frase: "Cuando [usuario] recibe [entrada], necesita [resultado] en menos de [tiempo], sin [frustración]".
4. **Recorte.** Tabla de dos columnas "lo que pide el brief → lo que construimos hoy", usando la tabla de sustituciones de `references/tabla-de-recorte.md` (no mandar a "después": dar el sustituto). Regla de oro: lo determinístico se construye con reglas; la IA solo al final y solo para sugerir. Proponer; **el usuario decide**.
5. **SPEC de una página** con estos bloques (en este orden): contexto · qué construimos (una frase) · qué NO construimos · entrada / modelo de datos **+ 10 registros de ejemplo ficticios** · **criterios R1…Rn en español claro, con un ejemplo numérico cada uno** · salida (pantallas y documento) · validación humana · **criterio de éxito con casos de prueba y resultado esperado**.
6. **Prueba del adivino, segunda vuelta,** leyendo la SPEC como si fuera la herramienta.
7. **Plan de capas** adaptado a tiempo y herramienta: 0 cargar SPEC · 1 esqueleto + datos · 2 motor de reglas · 3 ficha / detalle · 4 tablero o resumen · 5 documento de salida · 6 persistencia + alta de registros + filtros · 7 opcional "lectura" por palabras clave o IA.
8. **Prompts**, uno por capa, cada uno en un bloque de código para copiar, con la instrucción técnica de cabecera de la herramienta, "no modifiques lo existente", "no agregues lo que no pedí", y (según experiencia) "qué debe verse" y "si falla". Más: prompt de prueba final (los casos de la SPEC), plantilla de corrección y plantilla "no te pases".
9. **Cierre:** "Lo que aún adivinaría" (aunque quede vacío) y las reglas de mesa en 5 líneas.

### 3.3 Reglas que siempre aplican

- Preguntar en vez de adivinar; máximo 3 preguntas por turno.
- No agregar funciones que el brief no pide; lo que parezca faltar va a "Qué NO construimos" como propuesta.
- Todo lo determinístico (plazos, cálculos, estados, listas de chequeo) son reglas explícitas; nunca "que la IA lo analice".
- Datos ficticios siempre; nunca nombres, NIT, cédulas ni expedientes reales.
- Una capa por prompt; cada prompt incluye las restricciones de cabecera; nombres de campos y pantallas estables entre prompts (los de la SPEC).
- Sin backend, sin login, sin APIs externas, sin claves, salvo que el usuario elija "1 semana" y lo pida.
- La herramienta nunca decide, firma, radica ni notifica: siempre hay un botón de validación humana y un bloque de firma vacío.
- Terminar con "Lo que aún adivinaría".

### 3.4 Archivos de la skill

```
brief-a-mvp/
├── SKILL.md                         (≤ 150 líneas: cuándo, procedimiento, reglas, formato, ejemplo corto)
├── references/
│   ├── plantilla-spec-mvp.md        (bloques, límites, mapeo brief → spec)
│   ├── tabla-de-recorte.md          (sustituciones: genéricas + sector público)
│   ├── prompts-por-capa.md          (plantillas de los 7 prompts + prueba + corrección + no-te-pases)
│   ├── herramientas.md              (Lovable · Claude artifact · Claude Code · Codex · AI Studio)
│   └── reglas-de-mesa.md            (las de Cerebro, sin cambios)
└── evals/
    └── semaforo-liquidaciones/      (prompt.md con el brief; case.yaml; graders/)
```

Progresión de carga: la descripción siempre en contexto; el cuerpo al activarse; cada referencia solo cuando el paso la pide. Por eso SKILL.md debe decir en cada paso qué archivo leer.

### 3.5 Formato de la salida (plantilla fija)

```markdown
# [Nombre del MVP] · de brief a MVP

## 1. Lo que entendí del brief   (tabla campo → bloque; vacíos marcados)
## 2. Preguntas antes de seguir   (máximo 3; o "ninguna")
## 3. Momento de valor            (una frase)
## 4. Recorte                     (tabla: pide → construimos hoy; lo que va a después)
## 5. SPEC de una página          (bloque de código markdown completo, listo para guardar como SPEC.md)
## 6. Plan de capas               (tabla: capa · qué se construye · cómo se verifica)
## 7. Prompts                     (Prompt 0 … Prompt N, prueba final, corrección, no-te-pases; cada uno en bloque de código)
## 8. Reglas de mesa              (5 líneas)
## 9. Lo que aún adivinaría
```

### 3.6 Description propuesta (frontmatter)

> "Convierte un brief de proyecto o una idea en un MVP construible en una sesión: recorta el alcance, escribe la SPEC de una página con reglas y datos de ejemplo, y entrega los prompts paso a paso por capas para Lovable, Claude, Claude Code, Codex o Gemini AI Studio. Úsala siempre que me peguen un brief, una ficha de proyecto, una lista de funcionalidades o digan 'quiero construir', 'cómo arranco', 'dame los prompts', 'MVP', 'prototipo', aunque no digan spec ni skill."

---

## 4. Caso de prueba para validar la skill (hoy)

**Entrada:** el brief del Semáforo de Liquidaciones en la plantilla de 10 campos (está en `MVP-Semaforo-de-Liquidaciones.docx`, sección 1, y en `evals/semaforo-liquidaciones/prompt.md` de la skill borrador). Herramienta: Claude Code. Experiencia: nunca. Tiempo: 1 sesión. Sector: público.

**Salida esperada (criterios de aceptación):**

1. No hace más de 3 preguntas, y ninguna sobre algo que el brief ya responde (usuario, problema, qué no hará, humano responsable).
2. La tabla de recorte sustituye al menos: inventario desde SECOP → 10 registros de ejemplo; alertas por correo → semáforo; análisis de consistencia financiera → después; generación de actas/oficios → un solo oficio.
3. La SPEC tiene: ≥ 8 registros de ejemplo con fechas; ≥ 6 reglas numeradas (plazo bilateral, unilateral, máximo, semáforo, lista de chequeo, completitud); un bloque "validación humana"; ≥ 5 casos de prueba con resultado esperado concreto (etapa, fecha, color).
4. Entrega entre 6 y 8 prompts, uno por capa, cada uno en bloque de código, con la instrucción "un único archivo index.html" (porque la herramienta es Claude Code) y "sin backend".
5. Cada prompt lleva "qué debe verse" (porque experiencia = nunca).
6. Hay prompt de prueba final, plantilla de corrección y plantilla "no te pases".
7. Cierra con "Lo que aún adivinaría".
8. No propone Supabase, login ni API keys en ninguna parte.

Comparar con la salida de referencia: `SPEC-semaforo-liquidaciones.md` y `02-Caso-de-uso-y-prompts-Semaforo-de-Liquidaciones.md` (construidos a mano hoy). La skill no tiene que reproducirlos literalmente; tiene que llegar a algo equivalente en estructura y nivel de detalle.

Para la segunda vuelta, probar con el brief de RetenIA (Grupo 1) y con el de IDU-Sentencias: el primero es de reglas tributarias (debe producir tablas de tarifas como criterios), el segundo necesita "lectura" de texto (debe mandar la IA a la capa 7 y proponer campos manuales para el MVP).

---

## 5. Instrucciones para Claude Code

1. Abrir la carpeta `Practica/skill-brief-a-mvp/`. Es el borrador v0 (SKILL.md, references, un eval). Leerlo completo antes de cambiar nada.
2. Correr el eval `semaforo-liquidaciones` con la skill y sin la skill; comparar contra los criterios de la sección 4.
3. Ajustar SKILL.md donde falle. Prioridades: (a) que no vuelva a preguntar lo que el brief responde; (b) que la SPEC traiga reglas con ejemplo numérico y casos con resultado esperado; (c) que los prompts salgan adaptados a la herramienta.
4. Mantener SKILL.md por debajo de 150 líneas; todo lo que crezca va a `references/`.
5. Agregar los evals de RetenIA e IDU-Sentencias (los briefs están en `Retos - Grupos IA GP (Uniandes)/`).
6. Empaquetar: ZIP de la carpeta `brief-a-mvp/` (con SKILL.md en la raíz de la carpeta) para subir a claude.ai sin descomprimir; y la misma carpeta copiada a `~/.claude/skills/brief-a-mvp/` para Claude Code. Generar `INSTRUCCIONES_GPT.md` (SKILL.md + referencias concatenadas con la instrucción de cabecera) para ChatGPT/Gemini.
7. Para la landing de Cerebro: agregar la cuarta tarjeta o el campo "Pega tu brief" en Ideación, con los campos de la sección 3.1, y que el generador produzca esta skill con los mismos tres pasos (construye / carga / prueba). Cambiar la cabecera del primer mensaje: reemplazar "los datos deben guardarse en una base de datos" por la instrucción técnica de la herramienta elegida (`references/herramientas.md`).
8. Cambiar el ejemplo precargado del modo Ideación por un brief de gestión pública cuando el sector sea "público"; mantener a Sofía para los demás.

---

## 6. Resumen en cinco líneas (para contarlo en clase)

1. Cerebro ya resuelve bien "idea → spec → primer prompt"; lo que falta es "brief → MVP → prompts por capas".
2. Los cuatro vacíos graves: no recibe el brief, no da los prompts de construcción, empuja a base de datos y no tiene bloque de reglas ni datos de ejemplo.
3. La solución es una segunda skill, `brief-a-mvp`, que reutiliza la prueba del adivino, el recorte y las reglas de mesa, y agrega SPEC con reglas, datos y casos, más prompts adaptados a la herramienta.
4. Se valida con el brief del Semáforo: si produce algo equivalente a lo que construimos hoy a mano, funciona.
5. Cada grupo puede instalarla y pasarle su propio brief al cierre de la sesión.
