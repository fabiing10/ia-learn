# x10 — Multiplica tus talentos con inteligencia artificial
## Brief de construcción para Claude Code

> **Slogan:** La IA acelera. Tú decides.
> **Expositor:** Fabian Zapata
> **Evento:** Convención de Hombres MCI 2026 · G12 Centro de Convenciones · 1 al 3 de octubre de 2026
> **Duración:** 60 minutos (con bloque opcional de +20 si el espacio es de 80)
> **Audiencia:** ~130 hombres, 20 a 50 años, niveles de conocimiento de IA muy distintos

---

## 0. Instrucciones para Claude Code

1. Lee todo este documento antes de escribir código.
2. Construye una presentación web dinámica (no un documento, no un artifact) siguiendo la sección 2.
3. Cada slide de la sección 5 es una slide real. Respeta el orden, el texto en pantalla y las notas del orador.
4. Las **notas del orador** van en el panel de notas del presentador, nunca en pantalla.
5. Todo lo que esté entre `{{LLAVES}}` es un placeholder que el expositor completa. No inventes esos datos.
6. No inventes cifras, citas ni versículos. Usa solo los que están aquí.
7. Menos texto es mejor: máximo ~15 palabras visibles por slide (salvo tablas y casos).
8. Al terminar, deja un `README.md` con: cómo correrla offline, atajos de teclado, cómo abrir la vista del presentador y cómo exportar a PDF.

---

## 1. Contexto y estrategia

### Objetivo
Llevar a los asistentes a descubrir el mundo de la IA por fases:

**entender → desmitificar → discernir → aplicar → crear.**

Al salir, cada asistente debe poder:
- Explicar con sus palabras qué es la IA y qué no es.
- Escribir un buen prompt con una fórmula simple.
- Saber cuándo usarla y cuándo no (especialmente en el ministerio).
- Haber visto la IA crear algo real en minutos.

### Tesis
**La IA multiplica; el hombre decide.**
La IA acelera lo que sabes hacer. El criterio, la responsabilidad, la consejería y la creatividad con propósito siguen siendo humanos.

### Tono
- Taller práctico, no prédica. No es extensión de las charlas de la convención.
- Anclas bíblicas **cortas**: máximo una por bloque, una sola línea en pantalla, 20–30 segundos de explicación.
- Respetuoso con las preocupaciones legítimas (estafas, contenido falso, "¿esto es malo?"), sin miedo y sin hype.
- No prometer riqueza ni resultados mágicos. "x10" es una metáfora de multiplicación, no una promesa.

### Versión bíblica
Las citas están en Reina-Valera 1960, fragmentos cortos. `{{CONFIRMAR_VERSION}}` si la convención usa otra.

---

## 2. Requisitos técnicos

### Stack recomendado
- **Reveal.js 5** (npm), por estas razones:
  - `auto-animate` para la línea de tiempo y las transiciones entre bloques.
  - `fragments` para revelar contenido paso a paso.
  - Vista del presentador con notas, slide siguiente y reloj (tecla `S`).
  - Exporta a PDF (`?print-pdf`) como respaldo.
  - Corre 100% offline desde una carpeta.
- Alternativa válida si prefieres Vue: **Slidev**. Elige uno y no mezcles.
- Vite como build. Resultado final: carpeta `dist/` estática que abre sin internet.

### Reglas no negociables
- **Cero dependencias en línea durante la presentación.**
  - Fuentes con `@fontsource`.
  - Librerías empaquetadas.
  - Imágenes y videos locales.
  - QR generados en build con la librería `qrcode`.
- Formato 16:9, base 1920×1080.
- Legibilidad desde el fondo de un salón para 130 personas:
  - Títulos ≥ 96 px.
  - Cuerpo ≥ 40 px.
  - Nada de fuentes delgadas.
- Cada demo en vivo tiene un **video de respaldo** embebido en una slide oculta o vertical (`{{VIDEO_DEMO_X}}.mp4`).
- Tecla rápida o slide oculta para saltar a cada respaldo sin buscar.
- Incluir tema claro alternativo (toggle con una tecla). En salones iluminados, los fondos oscuros se ven grises en proyector, así que hay que probar ambos en el lugar.

### Estructura sugerida del repo
```
x10/
  index.html
  src/
    slides/        # un archivo por bloque (b0-apertura.html, b1-tiempos.html, ...)
    styles/        # tokens.css, theme-dark.css, theme-light.css, animations.css
    assets/
      img/  video/  audio/  qr/
  scripts/
    build-qr.js    # genera QR desde config.json
  config.json      # URLs, nombre, placeholders
  README.md
```

### `config.json` (placeholders)
```json
{
  "urlPlaybook": "{{URL_PLAYBOOK}}",
  "urlLanding": "{{URL_LANDING_OPCIONAL}}",
  "contacto": "{{CONTACTO_EXPOSITOR}}",
  "herramientaDemo": "Lovable"
}
```

---

## 3. Identidad visual

### Concepto
**Multiplicación.**
- El símbolo `×` es el motivo gráfico.
- Las transiciones entre bloques muestran un contador o un patrón que pasa de 1 a 10 elementos.

### Paleta (tokens CSS)
- Fondo oscuro: `#0B0F1A`. Fondo claro: `#F7F5F0`.
- **Dorado "talento"**, el acento principal: `#E8B53A`. El talento era una medida de oro y plata, de ahí la conexión.
- Acento tecnológico: `#3AC7E8`.
- Texto principal: `#F2F2F2` sobre oscuro, `#14171F` sobre claro.
- Semáforo (solo en el bloque 5):
  - Verde `#2FBF71`
  - Amarillo `#F2C14E`
  - Rojo `#E5484D`

### Tipografía
- Display: **Space Grotesk** (o Sora), peso 600–700.
- Cuerpo: **Inter**, peso 400–600.

### Animaciones
- Sutiles y rápidas (≤ 600 ms). Ninguna animación debe retrasar la lectura.
- Usos:
  - `auto-animate` en la línea de tiempo.
  - Contador 1 → 10 en la portada y en el cierre.
  - Fragments para revelar respuestas (mitos, semáforo, "¿Humano o IA?").
- Nada de rebotes ni giros. Elegante y sobrio.

### Separadores de bloque
Slide breve con:
- El número del bloque.
- Una palabra grande: ENTENDER · CONCEPTOS · MITOS · DISCERNIR · INVESTIGAR · MULTIPLICAR · CREAR · DECIDIR.
- Una barra de progreso de 10 segmentos.

---

## 4. Arco y tiempos (60 min)

| # | Bloque | Fase | Inicio–fin | Min |
|---|---|---|---|---|
| 0 | Pre-sesión (loop mientras entran) | — | antes | — |
| 1 | Apertura: "¿Humano o IA?" | Enganchar | 0:00–0:05 | 5 |
| 2 | Entender los tiempos | Entender | 0:05–0:12 | 7 |
| 3 | Conceptos + fórmula del prompt + Ejercicio 1 | Entender | 0:12–0:22 | 10 |
| 4 | Mitos | Desmitificar | 0:22–0:28 | 6 |
| 5 | El semáforo: usar y no usar + regulación | Discernir | 0:28–0:35 | 7 |
| 6 | IA para investigar la Palabra + Ejercicio 3 | Aplicar | 0:35–0:43 | 8 |
| 7 | Multiplica tu trabajo: herramientas y casos | Aplicar | 0:43–0:50 | 7 |
| 8 | Demo en vivo: de idea a app | Crear | 0:50–0:56 | 6 |
| 9 | Cierre: ¿por qué x10? + retos | Decidir | 0:56–1:00 | 4 |
| + | Bloque opcional (si hay 80 min) | — | 1:00–1:20 | 20 |

**Total: 60 minutos.** Ver la sección 8 para qué recortar si vas atrasado.

---

## 5. Slides detalladas

Formato de cada slide:
- **En pantalla:** texto visible.
- **Animación:** cómo aparece.
- **Interacción:** qué hace la sala.
- **Notas:** lo que dice el expositor (panel del presentador).

---

### BLOQUE 0 · Pre-sesión (loop)

#### S00 · Pantalla de espera
- **En pantalla:**
  - "¿Ya usaste inteligencia artificial hoy?"
  - Tras 3 segundos: "Probablemente sí."
  - Abajo, pequeño: "x10 · Ten tu celular a la mano."
- **Animación:** fondo con partículas doradas que se multiplican lentamente. Loop.
- **Notas:** usar mientras la gente entra. Pedir a los ayudantes que ubiquen a las personas adelante.

---

### BLOQUE 1 · Apertura (0:00–0:05)

#### S01 · Portada
- **En pantalla:**
  - **x10**
  - "Multiplica tus talentos con inteligencia artificial"
  - "La IA acelera. Tú decides."
  - Fabian Zapata
- **Animación:** el número cuenta de 1 a 10 y se fija en "x10".
- **Notas:** presentación personal en una frase. 13+ años en tecnología, fundador de una empresa de software. No leer el currículum.

#### S02 · Levanta la mano si…
- **En pantalla** (un fragment por pregunta):
  1. …has usado ChatGPT u otra IA
  2. …la usas cada semana
  3. …tienes negocio propio
  4. …eres empleado
  5. …sirves como líder en tu iglesia
- **Interacción:** mano alzada.
- **Notas:** observar la proporción y ajustar los ejemplos. Si la mayoría tiene negocio, enfatizar los casos de negocio en el bloque 7. Si la mayoría es empleada, los casos de trabajo.

#### S03 · Juego: ¿Humano o IA?
- **En pantalla:** tres rondas. Cada una muestra A y B, y luego revela la respuesta con un fragment.
  - **Ronda 1, imagen:** una foto real y una generada por IA. `{{IMG_REAL}}` / `{{IMG_IA}}`
  - **Ronda 2, texto:** dos párrafos cortos, uno escrito por el expositor y otro por IA. `{{TEXTO_HUMANO}}` / `{{TEXTO_IA}}`
  - **Ronda 3, voz:** dos audios de 8 segundos de la voz del expositor, uno real y otro clonado. `{{AUDIO_REAL}}` / `{{AUDIO_CLON}}`
- **Animación:** al revelar, la opción correcta se ilumina con el borde dorado.
- **Interacción:** la sala vota levantando la mano por A o por B.
- **Notas:**
  - Clonar **solo tu propia voz**.
  - El mensaje del audio clonado puede ser: "Hola, soy Fabian, estoy en un problema, necesito que me consignes…". Cortarlo ahí.
  - Remate: "Ya no se puede distinguir a simple vista. Por eso no basta con usar la IA: hay que entenderla." Retomamos esto en el cierre con la palabra clave familiar.

#### S04 · La promesa
- **En pantalla:** "En 60 minutos vas a…"
  - Entender qué es (y qué no es)
  - Saber cuándo usarla y cuándo no
  - Verla multiplicar trabajo en vivo
- **Animación:** tres fragments.
- **Notas:** "Da igual si nunca la has usado o si la usas todos los días; hay algo para ti."

---

### BLOQUE 2 · Entender los tiempos (0:05–0:12)

#### S05 · Separador: ENTENDER
- **En pantalla:**
  - "…entendidos en los tiempos, y que sabían lo que Israel debía hacer."
  - 1 Crónicas 12:32
- **Notas:** 20 segundos. "Los hijos de Isacar no eran los más fuertes; eran los que entendían su momento. Hoy entender el momento incluye entender esto."

#### S06 · Línea de tiempo
- **En pantalla:** línea horizontal. Cada hito aparece con `auto-animate`.
  - **1950** · Alan Turing pregunta: ¿pueden pensar las máquinas?
  - **1956** · Nace el término "inteligencia artificial"
  - **1997** · Una computadora (Deep Blue) vence al campeón mundial de ajedrez
  - **2012** · Las máquinas aprenden a "ver" imágenes
  - **2017** · Se inventa el *Transformer*, la "T" de ChatGPT
  - **2022** · ChatGPT llega a 100 millones de usuarios en ~2 meses
  - **2024–2026** · Agentes: la IA ya no solo responde, **ejecuta tareas**
- **Animación:**
  - La línea crece de izquierda a derecha.
  - El espacio entre hitos se acorta al final para mostrar la aceleración visualmente.
- **Notas:**
  - Mensaje: "Tomó 70 años llegar a 2022 y apenas 4 años para lo que viene ahora. Lo nuevo no es la IA, es la **velocidad**."
  - El dato de 2022 es una estimación de UBS reportada en febrero de 2023. Decir "según estimaciones".

#### S07 · Cada herramienta nueva dio miedo
- **En pantalla:** secuencia de íconos.
  - Imprenta → Radio → Televisión → Internet → IA
  - "La pregunta nunca fue la herramienta. Fue quién la usa y para qué."
- **Notas:**
  - Uno de los primeros grandes libros impresos con tipos móviles fue la Biblia de Gutenberg (s. XV).
  - La iglesia usó la radio, la TV y el internet para llevar el mensaje. Cada una generó resistencia al principio.

#### S08 · ¿Por qué ahora?
- **En pantalla:** tres razones.
  1. Entiende tu idioma (le hablas como a una persona)
  2. Está en tu bolsillo, muchas veces gratis
  3. Mejora cada mes
- **Notas:** "Probablemente ya la tienes en WhatsApp: es el círculo de colores de Meta AI." `{{VERIFICAR_META_AI_ACTIVO}}` antes del evento.

---

### BLOQUE 3 · Conceptos (0:12–0:22)

#### S09 · Separador: CONCEPTOS

#### S10 · ¿Qué es la IA?
- **En pantalla:**
  - "Un sistema que aprendió de millones de ejemplos a reconocer patrones y producir respuestas."
  - Abajo: "Piensa en el autocompletar de tu WhatsApp… pero gigante."
- **Animación:** una frase en el celular se autocompleta palabra por palabra.
- **Notas:** "No piensa como tú. Calcula cuál es la siguiente palabra más probable, y lo hace tan bien que parece que entiende."

#### S11 · Las 6 palabras que necesitas
- **En pantalla:** seis tarjetas. Cada una con la palabra y una línea de definición.
  - **IA generativa** · IA que crea: texto, imágenes, voz, video, código
  - **Modelo** · El "motor": ChatGPT, Claude, Gemini, Meta AI…
  - **Prompt** · La instrucción que le das
  - **Contexto** · Todo lo que le cuentas para que entienda tu caso
  - **Alucinación** · Cuando inventa algo con total seguridad
  - **Agente** · IA que ejecuta tareas por ti, no solo conversa
- **Animación:** las tarjetas entran una a una.
- **Notas:** detenerse en "alucinación". Es el concepto más importante para el resto del taller.

#### S12 · Lo que hace / lo que no hace
- **En pantalla:** dos columnas.
  - **Sí puede:** escribir · resumir · traducir · analizar · crear imágenes y voces · programar
  - **No puede:** sentir · creer · orar · tener conciencia · tener criterio moral · saber si lo que dice es verdad
- **Notas:** la última línea es la clave: "Por eso tú sigues siendo el responsable."

#### S13 · La fórmula del buen prompt: R·C·T·F
- **En pantalla:** cuatro bloques que se arman.
  - **Rol** · "Eres un asesor comercial…"
  - **Contexto** · "Tengo un taller de ornamentación…"
  - **Tarea** · "Escribe un mensaje para…"
  - **Formato** · "Máximo 4 líneas, tono cordial"
- **Animación:** los cuatro bloques se apilan y forman un prompt completo.
- **Notas:** "Si le hablas como a un empleado nuevo, con contexto y claridad, te responde como uno bueno."

#### S14 · EJERCICIO 1 · Prompt pobre vs. prompt RCTF (todos con el celular)
- **En pantalla:**
  - **Paso 1:** abre Meta AI en WhatsApp (o la IA que tengas) y escribe:
    > Escríbeme un mensaje para un cliente.
  - **Paso 2:** ahora escribe:
    > Eres un asesor comercial amable. Tengo un taller de ornamentación y un cliente lleva dos semanas sin responder una cotización de una reja. Escríbele un mensaje de WhatsApp corto y cordial que le recuerde la cotización y le ofrezca resolver dudas. Máximo 4 líneas.
  - **Paso 3:** compara.
- **Interacción:**
  - 3 minutos.
  - Los ayudantes recorren la sala.
  - Dos voluntarios leen en voz alta sus dos respuestas.
- **Notas:**
  - Tener las dos respuestas ya proyectadas como respaldo (`{{CAPTURA_PROMPT_POBRE}}`, `{{CAPTURA_PROMPT_RCTF}}`) por si falla la conexión.
  - Mensaje: "Misma herramienta, otro resultado. La diferencia la hiciste tú."

---

### BLOQUE 4 · Mitos (0:22–0:28)

#### S15 · Separador: MITOS
- **En pantalla:** "¿Mito o realidad?"
- **Interacción:** en cada mito la sala responde en voz alta antes de revelar.

#### S16 · Mito 1: "La IA piensa y siente"
- **En pantalla:**
  - MITO
  - "Predice palabras. No tiene alma, conciencia ni fe."
  - "…creó Dios al hombre a su imagen." · Génesis 1:27
- **Notas:** "La imagen de Dios está en el hombre, no en la máquina. La máquina la hizo el hombre."

#### S17 · Mito 2: "Si lo dice la IA, es verdad"
- **En pantalla:**
  - MITO
  - "Puede inventar datos, citas y hasta versículos."
  - "El simple todo lo cree; mas el avisado mira bien sus pasos." · Proverbios 14:15
- **Notas:** conecta con "alucinación". "Esto lo vamos a probar en vivo en unos minutos."

#### S18 · Mito 3: "La IA es mala en sí misma"
- **En pantalla:**
  - MITO
  - "Es una herramienta. El uso define el fruto."
- **Notas:**
  - Tratar con respeto. Hay preocupaciones reales: estafas, contenido falso, pornografía, adicción a pantallas.
  - "El riesgo es real. La respuesta es el discernimiento, no la ignorancia. El que no la entiende es el más fácil de engañar."

#### S19 · Mito 4: "Me va a reemplazar"
- **En pantalla:**
  - MEDIA VERDAD
  - "Reemplaza tareas. El que aprende a usarla gana ventaja."
- **Notas:** ser honesto. Algunos trabajos van a cambiar mucho. "La pregunta útil no es si te va a afectar, sino qué tareas tuyas cambian y qué haces con el tiempo que te libera."

#### S20 · Mito 5: "Es gratis"
- **En pantalla:**
  - MITO
  - "Si no pagas con dinero, muchas veces pagas con datos."
  - **Regla de oro:** nunca le entregues cédulas, claves, tarjetas ni datos de otras personas.
- **Notas:** "Ni los datos de tu familia, ni los de tus clientes, ni los de las personas que lideras."

---

### BLOQUE 5 · Discernir: el semáforo (0:28–0:35)

#### S21 · Separador: DISCERNIR
- **En pantalla:** un semáforo grande.
  - 🟢 Úsala con confianza
  - 🟡 Úsala, pero revisa y complementa
  - 🔴 No la uses para esto

#### S22 · EJERCICIO 2 · ¿Qué color es? (toda la sala)
- **En pantalla:** ocho casos, uno por fragment. La sala dice el color en voz alta y luego se revela.
  1. Resumir un documento largo del trabajo → 🟢
  2. Investigar el contexto histórico de un libro de la Biblia → 🟢 (verificando)
  3. Redactar una cotización para un cliente → 🟢
  4. Preparar el esquema de una enseñanza para tu grupo → 🟡 (es una base; el contenido y la vida los pones tú)
  5. Pedirle orientación sobre un tema médico o legal → 🟡 (orienta, pero decide con un profesional)
  6. Pedirle que escriba tu devocional y compartirlo como tuyo → 🔴
  7. Contarle la situación de una persona que aconsejas y preguntarle qué decirle → 🔴
  8. Subir la lista de tu grupo con teléfonos y direcciones → 🔴
- **Animación:** cada caso aparece con el borde del color tras revelar.
- **Notas:** ritmo ágil, ~20 segundos por caso. Dejar el 7 para el final y detenerse ahí.

#### S23 · Por qué la consejería es roja
- **En pantalla:**
  - "Yo soy el buen pastor; y conozco mis ovejas." · Juan 10:14
  - Tres líneas:
    - La IA no conoce a la persona ni su historia
    - No ora ni responde por el consejo
    - Y estarías entregando información íntima de alguien sin su permiso
- **Notas:** "La IA te puede ayudar a **entender un tema**. La persona necesita a **alguien que la conozca**. Eso no se delega."

#### S24 · Lo que es tuyo
- **En pantalla:** cinco palabras grandes, una por fragment.
  - DECIDIR · ACONSEJAR · CREAR CON PROPÓSITO · DISCERNIR · RESPONDER
- **Notas:** "La IA propone. Tú decides y respondes por lo que decides."

#### S25 · ¿Y la ley?
- **En pantalla:**
  - **Colombia hoy:**
    - Política Nacional de IA (CONPES 4144, febrero 2025)
    - Proyecto de ley de IA en trámite en el Congreso (PL 025 de 2026 Cámara), con enfoque por niveles de riesgo inspirado en el modelo europeo
    - Ley 1581 de 2012 de protección de datos, que ya aplica
  - **La regla simple:** "Lo que no es legal sin IA, tampoco lo es con IA."
- **Notas:**
  - Un minuto, sin entrar en detalle legal.
  - "Todavía no hay una ley de IA aprobada en Colombia, pero la protección de datos ya rige. Subir datos de otros a una IA puede ser un problema legal, no solo ético."
  - `{{VERIFICAR_ESTADO_PL_ANTES_DEL_EVENTO}}`

---

### BLOQUE 6 · Investigar la Palabra (0:35–0:43)

#### S26 · Separador: INVESTIGAR
- **En pantalla:**
  - "…escudriñando cada día las Escrituras para ver si estas cosas eran así." · Hechos 17:11
  - Abajo, grande: **Investiga con IA. Verifica con la Biblia.**
- **Notas:** "Los de Berea no creían cualquier cosa; verificaban. Esa es exactamente la actitud correcta con la IA."

#### S27 · DEMO 1 (proyectada): estudio de la palabra "talento"
- **En pantalla:** el prompt preparado (copiar a Claude o ChatGPT en vivo):
  > Actúa como un investigador de historia bíblica. Explícame qué era un "talento" en tiempos de Jesús: qué medía, cuánto valía aproximadamente en jornales y cómo se relaciona con Mateo 25:14-30. Cita los pasajes con libro, capítulo y versículo, y separa claramente lo que es dato histórico de lo que es interpretación.
- **Interacción:** la sala observa. Al final se pregunta: "¿Cómo verificamos esto?"
- **Notas:**
  - Lo esperado, en términos generales:
    - El talento era una unidad de peso usada para metales preciosos.
    - Equivalía aprox. a 6.000 denarios, y un denario era el jornal de un día (Mateo 20:2). Es decir, unos 20 años de trabajo.
    - El sentido moderno de "talento" como habilidad viene de esta parábola.
  - Mostrar la verificación: abrir Mateo 20:2 y Mateo 25 en la Biblia.
  - **Respaldo:** `{{VIDEO_DEMO_TALENTO}}.mp4`.

#### S28 · EJERCICIO 3 · Pon a prueba a la IA (todos con el celular)
- **En pantalla:**
  - Pregúntale a tu IA:
    > ¿En qué versículo dice la Biblia "Dios ayuda a quien se ayuda"?
  - Luego: "¿Qué te respondió? ¿Cómo lo verificas?"
- **Interacción:** 2 minutos. Mano alzada: "¿A quién le dijo que sí está en la Biblia? ¿A quién le dijo que no?"
- **Notas:**
  - La frase **no está en la Biblia**; es un refrán popular.
  - Si la IA responde bien: "Puede ayudarte a desmentir mitos, pero igual se verifica."
  - Si inventa un versículo: "Esto es una alucinación en vivo. Por eso la Biblia va en la otra mano."
  - **Respaldo:** `{{CAPTURA_ALUCINACION_REAL}}`. Usar solo una captura real que tú mismo hayas obtenido; no fabricarla.

#### S29 · Usos verdes en la investigación bíblica
- **En pantalla:** grilla de seis.
  - Contexto histórico y cultural
  - Líneas de tiempo y mapas
  - Significado de palabras en griego y hebreo
  - Comparar traducciones
  - Conectar pasajes relacionados
  - Preparar preguntas de discusión para tu grupo
  - Pie: "Todo verificado. Nada reemplaza tu lectura ni tu oración."
- **Notas:** cierre del bloque con el contraste. "Investigación: sí. Revelación, consejería y devocional: eso es tuyo."

---

### BLOQUE 7 · Multiplica tu trabajo (0:43–0:50)

#### S30 · Separador: MULTIPLICAR

#### S31 · El mapa de herramientas
- **En pantalla:** grilla por categoría (nombres; logos opcionales).
  - **Conversar y escribir:** ChatGPT · Claude · Gemini · Meta AI · Copilot
  - **Investigar con fuentes:** Perplexity · NotebookLM
  - **Presentaciones y diseño:** Gamma · Canva
  - **Crear páginas y apps:** Lovable · Bolt · v0
  - **Voz, imagen y video:** ElevenLabs · generadores integrados en ChatGPT y Gemini
- **Animación:** las categorías se encienden una a una.
- **Notas:**
  - "La herramienta cambia cada mes. La habilidad (pedir bien y verificar) se queda."
  - No recomendar marcas por encima de otras.
  - `{{VERIFICAR_PLANES_GRATIS}}`

#### S32 · Tres casos que puedes hacer mañana
- **En pantalla:** tres tarjetas, cada una con antes y después.
  1. **Cotización profesional** · De una nota de voz a un documento ordenado
  2. **Contenido para tu negocio** · Un mes de ideas de publicaciones en minutos
  3. **Entender un contrato** · Resumen y preguntas clave para llevarle a tu abogado (no lo reemplaza)
- **Notas:**
  - Elegir un caso según la encuesta de S02 y mostrar el prompt en 30 segundos.
  - No dar cifras de "ahorro de tiempo" que no puedas sostener.

#### S33 · Del chat al agente
- **En pantalla:** diagrama de flujo.
  - **Chat:** tú preguntas → responde
  - **Agente:** tú das un objetivo → planea → ejecuta pasos → te entrega el resultado
- **Animación:** el flujo del agente se dibuja paso a paso.
- **Notas:** puente al demo. "Ahora vamos a pedirle a una IA que construya una app completa mientras hablamos."

---

### BLOQUE 8 · Crear: demo en vivo (0:50–0:56)

#### S34 · Separador: CREAR
- **En pantalla:** "Construyamos algo. Ahora."

#### S35 · DEMO 2 · De idea a app en minutos (Lovable)
- **En pantalla:** elección a mano alzada entre tres ideas.
  - **A.** Página web para el negocio de alguien de la sala
  - **B.** Página para un evento de la iglesia
  - **C.** App sencilla para organizar las reuniones de un grupo (sin datos reales)
- **Interacción:** gana la idea más votada. Si es A, un voluntario dice nombre y tipo de negocio.
- **Notas:**
  - Prompts listos en la sección 7.
  - Mientras genera (1–3 min), narrar lo que hace: lee la idea → planea → escribe código → publica.
  - Si tarda más de 3 minutos, saltar al respaldo sin disculparse.

#### S36 · El resultado
- **En pantalla:**
  - Captura o la app en vivo.
  - Frase: "Lo que antes tomaba semanas y un equipo, hoy es un borrador en minutos."
  - Debajo: "El borrador es de la IA. La visión y las decisiones son tuyas."
- **Notas:** mostrarla en el celular si se puede (QR al link publicado).

---

### BLOQUE 9 · Decidir: cierre (0:56–1:00)

#### S37 · ¿Por qué x10?
- **En pantalla:**
  - "Señor, tu mina ha ganado diez minas." · Lucas 19:16
  - Luego, como fragment: "…tendrás autoridad sobre diez ciudades." · Lucas 19:17
- **Animación:** el contador 1 → 10 de la portada se repite y se fija en **x10**.
- **Notas:**
  - Revelar el nombre del taller.
  - "Lo que recibimos es para multiplicarlo. Y con la multiplicación viene la responsabilidad."
  - 30 segundos. No predicar.

#### S38 · Tres retos para esta semana
- **En pantalla:**
  1. Usa la fórmula **R·C·T·F** en una tarea real de tu trabajo
  2. Haz un estudio de contexto de un pasaje y **verifícalo**
  3. Acuerda con tu familia una **palabra clave** contra estafas de voz
- **Notas:** conectar el reto 3 con el audio clonado de S03. "Si alguien te llama con mi voz pidiendo plata, pídele la palabra clave."

#### S39 · Cierre
- **En pantalla:**
  - **La IA acelera. Tú decides.**
  - QR al playbook: `{{URL_PLAYBOOK}}`
  - "Todo lo de hoy y mucho más, organizado para que lo leas con calma."
  - Contacto: `{{CONTACTO_EXPOSITOR}}`
- **Notas:** dejar este slide proyectado durante las preguntas.

---

### BLOQUE OPCIONAL (+20 min, solo si el espacio es de 80)
- **Preguntas abiertas:** 10 min.
- **Segunda iteración del demo:** 5 min. Agregar un formulario o una sección en vivo con el prompt 2 de la sección 7.
- **Landing con notas en vivo:** 5 min, si se construye. Revelar que "mientras yo hablaba, la IA preparó las notas", con QR a `{{URL_LANDING_OPCIONAL}}`.

---

## 6. Resumen de ejercicios interactivos

| # | Ejercicio | Bloque | Quién | Tiempo | Necesita internet |
|---|---|---|---|---|---|
| — | Levanta la mano si… | 1 | Sala | 1 min | No |
| — | ¿Humano o IA? | 1 | Sala | 2 min | No (assets locales) |
| 1 | Prompt pobre vs. RCTF | 3 | Todos, celular | 3 min | Sí (datos del asistente) |
| — | ¿Mito o realidad? | 4 | Sala | En el bloque | No |
| 2 | Semáforo de 8 casos | 5 | Sala | 3 min | No |
| — | Demo "talento" | 6 | Expositor | 3 min | Sí, con respaldo en video |
| 3 | Pon a prueba a la IA | 6 | Todos, celular | 2 min | Sí (datos del asistente) |
| — | De idea a app (Lovable) | 8 | Expositor + voto | 5 min | Sí, con respaldo en video |

**Regla:** todo lo que depende de internet tiene respaldo local. La sala usa sus datos móviles, no el wifi del evento.

---

## 7. Guiones de demo

### Demo "talento" (bloque 6)
- **Herramienta:** Claude o ChatGPT en el navegador, con sesión ya iniciada.
- **Ensayo:** correr el prompt de S27 al menos dos veces antes del evento. Revisar que no invente versículos; si lo hace, mejor, porque es material para el ejercicio 3.
- **Respaldo:** grabar la pantalla del mejor ensayo (`{{VIDEO_DEMO_TALENTO}}.mp4`, ≤ 90 s, se puede acelerar).

### Demo Lovable (bloque 8)

**Antes del evento**
- **Cuenta:** el plan gratis da solo 5 créditos diarios, que alcanzan para 2 a 4 interacciones. Para el demo en vivo conviene el plan Pro, o no gastar ningún crédito ese día antes de presentar.
- **Reinicio de créditos:** los créditos diarios se reinician a las 00:00 UTC, que son las **7:00 p. m. en Bogotá**. Si ensayas la noche anterior, ensaya después de esa hora para que al día siguiente tengas los 5 completos.
- **Respaldo:** construir la víspera una versión completa de cada idea (A, B y C) y publicarlas. Grabar un video de 60–90 s del proceso de la idea más probable.
- **Conexión:** hotspot del celular dedicado solo al computador del expositor. Probarlo en el salón.

**Prompt 1, idea A (negocio)**
> Crea una página web de una sola página para {{NOMBRE_NEGOCIO}}, un {{TIPO_NEGOCIO}} en {{CIUDAD}}. Incluye: encabezado con el nombre y una frase de valor, sección de servicios con 3 tarjetas, sección "¿Por qué elegirnos?", preguntas frecuentes, botón flotante de WhatsApp y pie de página con datos de contacto de ejemplo. Estilo moderno y limpio, colores {{COLORES}}, tipografía legible, optimizada para celular. Todo el texto en español.

**Prompt 1, idea B (evento)**
> Crea una página para un evento llamado {{NOMBRE_EVENTO}}. Incluye: portada con fecha y lugar, cuenta regresiva, agenda por horas, sección de invitados con fotos de ejemplo, preguntas frecuentes y botón de inscripción. Estilo elegante, fondo oscuro con acentos dorados, optimizada para celular. Todo en español.

**Prompt 1, idea C (grupo)**
> Crea una app sencilla para organizar las reuniones semanales de un grupo pequeño: calendario de próximas reuniones, tema de cada reunión, lista de quién lleva qué (anfitrión, alimentos, música) y una sección de anuncios. Usa datos de ejemplo ficticios. Diseño amigable y optimizado para celular. Todo en español.

**Prompt 2 (iteración, opcional)**
> Agrega un formulario de contacto con nombre, servicio de interés y mensaje. Al enviarlo, abre WhatsApp con el mensaje ya armado.

**Alternativa sin Lovable:** pedirle a Claude que genere en vivo una línea de tiempo interactiva del contexto de Mateo 25 y Lucas 19. No consume créditos de Lovable y conecta con el bloque 6.

---

## 8. Si vas atrasado: qué recortar

| Prioridad | Recorte | Ahorra |
|---|---|---|
| 1 | Omitir S08 (¿Por qué ahora?) | 1 min |
| 2 | Dejar solo 3 mitos (S17, S18, S20) | 2 min |
| 3 | En el semáforo, mostrar 5 casos en vez de 8 (1, 4, 6, 7, 8) | 1–2 min |
| 4 | Omitir S32 (tres casos) | 1–2 min |
| 5 | Demo Lovable directamente con el proyecto ya construido | 2–3 min |

**Nunca recortar:** S14 (ejercicio 1), S23 (consejería), S28 (ejercicio 3), S37–S39 (cierre).

---

## 9. Checklist técnico antes del evento

- [ ] La presentación abre desde `dist/` con el wifi apagado.
- [ ] Vista del presentador probada (notas legibles, reloj visible).
- [ ] Probado en el proyector del salón, con tema claro y oscuro. Elegir uno.
- [ ] Audio de S03 suena por el sistema de sonido del salón (llevar adaptador o cable).
- [ ] Todos los videos de respaldo cargan y se reproducen.
- [ ] QR del playbook escaneable desde la última fila. Mínimo ~25% del alto de la pantalla.
- [ ] Hotspot dedicado probado en el salón.
- [ ] Sesiones abiertas en Claude/ChatGPT y Lovable. Créditos disponibles.
- [ ] Meta AI activo en WhatsApp (verificar en 2–3 celulares distintos).
- [ ] PDF exportado como último respaldo, en una memoria USB.
- [ ] 3–4 ayudantes con instrucciones para los ejercicios 1 y 3.
- [ ] Clicker o control remoto de diapositivas, con pilas.

---

## 10. Playbook (fase 2, URL aparte)

Debe existir una URL estable **antes** del evento para el QR, aunque el contenido completo se publique después. Estructura propuesta:

1. **Bienvenida.** Qué es x10 y cómo usar este playbook.
2. **Qué es la IA.** Glosario ampliado (las 6 palabras + 10 más).
3. **La fórmula R·C·T·F.** Explicación y 20 prompts listos para copiar:
   - Trabajo y empleo
   - Negocio y ventas
   - Hogar y finanzas personales
   - Investigación bíblica
4. **El semáforo completo.** Más casos por categoría.
5. **Guía de investigación bíblica con IA.** Checklist de verificación paso a paso.
6. **Herramientas por categoría.** Qué hace cada una, si tiene plan gratis y cuándo usarla.
7. **Seguridad.**
   - Estafas con voz clonada y videos falsos
   - Palabra clave familiar
   - Privacidad y qué nunca compartir
   - IA y los hijos
8. **Marco legal en Colombia.** CONPES 4144, proyecto de ley, Ley 1581.
9. **Ruta de aprendizaje de 30 días.** Un reto por semana.
10. **Recursos y contacto.**

Puede vivir en el mismo repo como `/playbook`, o en un sitio aparte. Mismo sistema visual que la presentación.

---

## 11. Datos verificados y pendientes

**Verificados (1 de octubre de 2026):**
- **Convención:** 1 al 3 de octubre de 2026, G12 Centro de Convenciones. Fuente: convenciondehombres.com.
- **CONPES 4144:** Política Nacional de IA, aprobada el 14 de febrero de 2025, con hoja de ruta a 2030. No crea sanciones por sí mismo.
- **Proyecto de ley de IA:** PL 025 de 2026 Cámara, radicado el 21 de julio de 2026. Sucede al PL 324 de 2025 del cuatrienio anterior. Enfoque por niveles de riesgo inspirado en la UE. **Sin aprobar** a la fecha.
- **Lovable plan gratis:** 5 créditos diarios, tope de 30 al mes, reinicio a las 00:00 UTC.

**Por verificar antes de presentar:**
- `{{VERIFICAR_META_AI_ACTIVO}}`: que Meta AI esté activo en WhatsApp en celulares colombianos.
- `{{VERIFICAR_PLANES_GRATIS}}`: planes gratis actuales de las herramientas de S31.
- `{{VERIFICAR_ESTADO_PL_ANTES_DEL_EVENTO}}`: estado del proyecto de ley.
- `{{CONFIRMAR_VERSION}}`: versión bíblica de las citas.

**Assets que debe preparar el expositor:**
- `{{IMG_REAL}}`, `{{IMG_IA}}`
- `{{TEXTO_HUMANO}}`, `{{TEXTO_IA}}`
- `{{AUDIO_REAL}}`, `{{AUDIO_CLON}}` (solo su propia voz)
- `{{CAPTURA_PROMPT_POBRE}}`, `{{CAPTURA_PROMPT_RCTF}}`
- `{{CAPTURA_ALUCINACION_REAL}}`
- `{{VIDEO_DEMO_TALENTO}}`, `{{VIDEO_DEMO_LOVABLE}}`
- `{{URL_PLAYBOOK}}`, `{{CONTACTO_EXPOSITOR}}`
