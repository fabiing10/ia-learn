// Fixed texts of the brief-a-mvp skill. Source of truth: the workshop draft in
// talleres/cerebro/insumos/brief-a-mvp/skill-brief-a-mvp/ (arrived 5 Nov 2026).
// Every text below is a verbatim copy of it, and brief-a-mvp.content.test.mjs checks
// each one against the file on disk: change the draft there and copy it here; never
// edit these texts by hand.
//
// brief-a-mvp.js parametrises them by structure (encargo 05, PROMPT 2, rules A–G):
// - SKILL_CUERPO starts with `# De brief a MVP` and keeps the `## ` sections
//   «Qué necesito antes de empezar», «Reglas que siempre aplican», «Formato de
//   salida» and «Ejemplo». In «Qué necesito…», the items that name «herramienta»,
//   «experiencia» and «tiempo» become statements when the form answers them; the
//   brief's and the sector's stay. «Formato de salida» holds «Responde claro y
//   directo.» (the tone replaces it). «Ejemplo» names its example with
//   EJEMPLO_NOMBRE_BORRADOR.
// - REF_TABLA_DE_RECORTE keeps «## Sustituciones propias del sector público
//   colombiano» (dropped for the other sectors).
// - REF_HERRAMIENTAS: one `## ` block per tool whose title holds every word of the
//   tool's label («Claude Code o Codex (caja abierta, local)» serves both tools).
// - README_BORRADOR: its title, opening, «Instalar» routes (`**Etiqueta:**`
//   paragraphs), «Probar» (the first paragraph gives way to the test with the brief)
//   and «Archivos» (rewritten for the kit).

/** brief-a-mvp/SKILL.md: the front matter, fixed (name and description never change with the form). */
export const SKILL_FRONTMATTER = `---
name: brief-a-mvp
description: "Convierte un brief o una idea en un MVP de una sesión: recorte, SPEC de una página y prompts por capas. Úsala siempre que me peguen un brief o digan MVP, prototipo, «quiero construir» o «los prompts»."
---`;

/** brief-a-mvp/SKILL.md: everything after the front matter. */
export const SKILL_CUERPO = `# De brief a MVP

Skill del taller de IA para gestión pública (x10.expert). Recibe un brief (la plantilla de diez campos: nombre y entidad, usuario, problema, reto, solución, flujo principal, qué NO hará, datos, humano responsable, cómo sabremos que funciona) o una idea en una frase, y termina en tres cosas: el recorte a MVP, la SPEC de una página y los prompts por capas para construirla hoy. No escribe código: los prompts los pega la persona en su herramienta.

## Principio

Vibe coding no es pedir una app; es describirla tan bien que la herramienta no tenga que adivinar. Y un MVP no es un sistema de información: es un momento de valor para un usuario, con datos de ejemplo, demostrable en cinco minutos. Todo lo que la herramienta tendría que adivinar falta en la SPEC; todo lo que no se puede demostrar hoy con datos inventados es roadmap, no MVP.

## Qué necesito antes de empezar

- El brief o la idea (obligatorio).
- La herramienta: Lovable, Claude (artifact), Claude Code, Codex, Gemini AI Studio o "no sé" (si no me lo dicen, pregunto; si no saben, recomiendo Lovable para quien no instala nada y Claude Code para quien ya usa VS Code).
- La experiencia construyendo: nunca / algo con IA / programo (si no me lo dicen, asumo "nunca").
- El tiempo: una sesión de 90 minutos, un día o una semana (si no me lo dicen, asumo una sesión).
- El sector (público, privado, educación, social). Si el brief nombra una entidad pública, es sector público.

Si falta la herramienta o el brief, pídelos antes de empezar. Lo demás se asume y se anota en "Lo que aún adivinaría".

## Procedimiento

1. **Mapear la entrada.** Lee \`references/plantilla-spec-mvp.md\` (tabla "brief → SPEC"). Si llegó un brief, asigna cada campo a su bloque de la SPEC y lista los bloques que quedaron vacíos. Si llegó una frase, escribe primero la frase completa ("Quiero una herramienta que ___ para ___") y trata todos los bloques como vacíos. Nunca vuelvas a preguntar lo que el brief ya responde.
2. **Prueba del adivino, primera vuelta.** Lista lo que tendrías que adivinar para construir eso y haz como máximo tres preguntas, las que más cambian el MVP (típicamente: qué decide la herramienta y qué decide la persona; con qué criterios o reglas; cuál es el documento de salida). Espera la respuesta. Si dicen "asume", asume lo más simple y anótalo en el cierre.
3. **Momento de valor.** Una frase: "Cuando [usuario] recibe [entrada], necesita [resultado] en menos de [tiempo], sin [frustración]". Es el paso del flujo donde más tiempo se pierde y que se puede demostrar con datos inventados.
4. **Recorte.** Lee \`references/tabla-de-recorte.md\`. Escribe una tabla de dos columnas: lo que pide el brief → lo que construimos hoy. No mandes las cosas a "después" sin más: da el sustituto viable (SECOP → diez registros de ejemplo; correo → semáforo; PDF → cuadro de texto). Regla de oro: lo determinístico (plazos, cálculos, estados, listas de chequeo) se construye con reglas explícitas; la IA entra solo al final, solo si sobra tiempo y solo para sugerir. Propón el recorte; la persona decide qué se queda.
5. **SPEC de una página.** Usa los bloques y límites de \`references/plantilla-spec-mvp.md\`, en ese orden. Las reglas van numeradas (R1, R2…) en español claro y cada una con un ejemplo concreto; los datos de ejemplo son diez registros ficticios con los valores que hacen falta para probar las reglas; los casos de prueba traen el resultado esperado (un valor, una fecha, un color), no una descripción vaga.
6. **Prueba del adivino, segunda vuelta.** Lee la SPEC como si fueras la herramienta y escribe tres cosas que aún tendrías que adivinar. Corrígelas en la SPEC antes de entregar.
7. **Plan de capas.** Según el tiempo: una sesión = capas 0 a 6 con un solo documento de salida; un día = más una capa de IA opcional; una semana = puede incluir carga de archivos y usuarios. Capa 0 cargar la SPEC sin construir; 1 esqueleto y datos de ejemplo; 2 motor de reglas; 3 ficha de detalle y lista de chequeo; 4 tablero o resumen; 5 documento de salida; 6 persistencia, alta de registros y filtros; 7 opcional, lectura de texto por palabras clave o con IA.
8. **Prompts.** Lee \`references/herramientas.md\` (bloque de la herramienta elegida) y \`references/prompts-por-capa.md\`. Escribe un prompt por capa, cada uno en un bloque de código para copiar entero, con la instrucción técnica de cabecera de la herramienta, "no modifiques lo que ya funciona" y "no agregues lo que no pedí". Si la experiencia es "nunca" o "algo con IA", después de cada prompt pon "Qué debe verse" y "Si falla"; si es "programo", omítelos. Agrega al final el prompt de prueba final con los casos de la SPEC, la plantilla de corrección y la plantilla "no te pases".
9. **Cierre.** Las reglas de mesa de \`references/reglas-de-mesa.md\` en cinco líneas y la sección "Lo que aún adivinaría", aunque quede vacía.

## Reglas que siempre aplican

- Pregunta en vez de adivinar; máximo tres preguntas por turno, y nunca sobre lo que el brief ya dice.
- No agregues funciones que el brief no pide. Si crees que falta algo, va a "Qué NO construimos" como propuesta.
- Todo lo determinístico son reglas numeradas; nunca "que la IA lo analice" para plazos, cálculos o estados. Las reglas que escribas son del dominio del usuario y pueden estar simplificadas: dilo y pide que el experto las valide.
- Datos ficticios siempre: nombres, NIT, números de contrato y expedientes inventados. Nunca datos personales ni información reservada.
- Sin backend, sin login, sin APIs externas, sin claves, en todo prompt, salvo que el tiempo sea una semana y la persona lo pida.
- La herramienta nunca decide, firma, radica, notifica ni envía: la SPEC siempre tiene un bloque de validación humana y los documentos salen con el bloque de firma vacío.
- Una capa por prompt. Los nombres de campos, pantallas y reglas son los de la SPEC y no cambian entre prompts.
- Cuando iteremos, un cambio por mensaje.
- Termina cada entrega con "Lo que aún adivinaría".

## Formato de salida

Usa siempre esta plantilla, con estos títulos y en este orden:

\`\`\`markdown
# [Nombre del MVP] · de brief a MVP

## 1. Lo que entendí del brief
(tabla: campo del brief → bloque de la SPEC; los vacíos marcados)

## 2. Preguntas antes de seguir
(máximo tres, o "Ninguna: el brief responde lo esencial")

## 3. Momento de valor
## 4. Recorte
(tabla: lo que pide → lo que construimos hoy; debajo, lo que va al roadmap)

## 5. SPEC de una página
(un solo bloque de código markdown, listo para guardar como SPEC.md)

## 6. Plan de capas
(tabla: capa · qué se construye · cómo se verifica)

## 7. Prompts
(Prompt 0 … Prompt N, prueba final, plantilla de corrección, plantilla "no te pases"; cada uno en bloque de código)

## 8. Reglas de mesa
## 9. Lo que aún adivinaría
\`\`\`

Responde claro y directo. La SPEC y los prompts van en bloques de código para copiarlos enteros; lo demás en prosa corta o tablas.

## Ejemplo

Entrada: el brief de "Semáforo de Liquidaciones Contractuales" (oficina de contratación; usuario: abogado que cierra contratos; problema: no sabe cuándo vence el plazo de liquidación ni qué documentos faltan; solución pedida: inventario desde SECOP, alertas por correo, revisión documental, análisis financiero, generación de actas y reportes). Herramienta: Claude Code. Experiencia: nunca. Una sesión.

Salida: ninguna pregunta (el brief responde lo esencial) o una sola sobre los plazos legales; momento de valor "cuando el abogado abre la herramienta ve qué contratos vencen y qué documentos faltan"; recorte con SECOP → diez contratos de ejemplo, correo → semáforo, análisis financiero → roadmap, actas → un solo oficio de requerimiento; SPEC con diez contratos ficticios, diez reglas (R1 requiere liquidación, R2 bilateral = terminación + 4 meses, R3 unilateral +2, R4 máximo +24, R5 etapa, R6 semáforo, R7-R8 lista de chequeo, R9 completitud, R10 prioridad) y siete casos de prueba con etapa, fecha y color; siete prompts con "un único archivo index.html, sin backend", cada uno con "Qué debe verse"; prueba final; cierre con "Lo que aún adivinaría: si el plazo pactado en pliegos prevalece sobre los 4 meses".`;

/** How the draft's «Ejemplo» names its example (the first sentence of «Nombre y entidad» in the eval); the profile's brief replaces it. */
export const EJEMPLO_NOMBRE_BORRADOR = 'Semáforo de Liquidaciones Contractuales';

/** brief-a-mvp/references/plantilla-spec-mvp.md */
export const REF_PLANTILLA_SPEC_MVP = `# Plantilla de la SPEC de MVP

La usan los pasos 1, 5 y 6 de la skill. Primero la tabla de mapeo (qué campo del brief alimenta qué bloque); después la plantilla con sus límites.

## Brief → SPEC

| Campo del brief (plantilla de 10 campos) | Bloque de la SPEC que alimenta | Si falta |
|---|---|---|
| Nombre y entidad | Título y Contexto | Pedir el nombre; la entidad puede ser "ficticia para el taller" |
| Usuario (quién es, qué necesita, qué le frustra) | Contexto y Momento de valor | Pregunta 1 candidata |
| Problema | Contexto | Derivar del usuario y el reto |
| Reto ("¿Cómo podríamos…?") | Qué construimos (una frase) | Escribirlo a partir del momento de valor |
| Solución | Recorte (es la "visión completa"; de aquí sale lo que se sustituye) | Asumir la mínima: una pantalla con reglas |
| Flujo principal | Plan de capas y Salida (cada paso del flujo suele ser una capa) | Proponer el flujo entrada → criterios → análisis → salida → validación |
| Qué NO hará | Qué NO construimos (se suman los límites del sector y de la herramienta) | Proponer mínimo tres |
| Datos | Entrada / modelo de datos y Datos de ejemplo | Pregunta candidata: qué campos tiene un registro |
| Humano responsable | Validación humana | Pregunta candidata: quién decide y dónde se detiene la herramienta |
| Cómo sabremos que funciona | Criterio de éxito (casos de prueba) | Derivar de las reglas: un caso por regla principal |

Los **criterios / reglas de negocio** no tienen campo propio en el brief: salen de "Solución", "Flujo" y del conocimiento del usuario. Si no están en el brief, es la pregunta más valiosa de la prueba del adivino: "¿Con qué reglas decide hoy el funcionario? Dame dos ejemplos con números".

## Plantilla (bloques en este orden)

\`\`\`markdown
# [Nombre del MVP]

## Contexto
Entidad: [ficticia o real sin datos sensibles]. Usuario: [rol concreto]. Hoy hace [tarea] manualmente y le toma [tiempo]; le frustra [frustración].

## Qué construimos (alcance del MVP)
Una aplicación web de una sola página, sin backend, sin base de datos externa, sin login, sin API keys. Los datos de ejemplo viven dentro del código. Idioma: español.
Resuelve exactamente esto: "[momento de valor en una frase]".

## Qué NO construimos
- No se conecta a [sistemas externos del brief].
- No [decide / firma / radica / notifica / envía].
- No lee documentos ni PDF; los datos se registran en formularios o se pegan como texto.
- No usa IA para [plazos / cálculos / estados / clasificaciones determinísticas]; eso son reglas.
- [Lo que el brief pide y va al roadmap, con su sustituto en el recorte]

## Entrada (modelo de datos)
Un **[registro]** tiene estos campos:
- \`campo\`: tipo (texto, número, fecha AAAA-MM-DD, lista de opciones [a, b, c], sí/no)
- ...
- \`observaciones\`: texto
- \`validado_por_humano\`: sí/no (por defecto no)

### Datos de ejemplo (10 registros ficticios)
Tabla con los 10 registros y todos sus campos. Deben cubrir cada regla y cada color/estado al menos una vez, con fechas y valores concretos. Nombres, NIT y números inventados.

## Criterios / reglas (en español claro; simplificadas para el MVP, el experto las valida)
R1. Si [condición], entonces [resultado]. Ejemplo: [caso con números].
R2. ...
(Entre 5 y 12 reglas. Cada regla una sola idea. Si hay umbrales, escribirlos: "más de 60 días", "4 meses".)

## Salida
- Pantalla 1 – [Lista / inventario]: columnas [...], ordenada por [regla], con filtros por [...].
- Pantalla 2 – [Ficha / detalle]: [campos], [resultados de las reglas], [lista de chequeo editable], observaciones, botón "Marcar como validado".
- Pantalla 3 – [Tablero / resumen] (opcional): contadores y lista de prioridad.
- Documento – [Oficio / memorando / ficha]: estructura exacta (encabezado, párrafos, lista, plazo, bloque de firma vacío); botones "Copiar" y "Descargar".

## Validación humana
La persona puede editar cualquier campo, escribir observaciones y marcar "validado por humano". La herramienta nunca cambia [el estado decisivo] por sí sola; solo sugiere.

## Criterio de éxito (casos de prueba con "hoy" = [fecha fija])
1. [Registro X] → [etapa / valor / color esperado].
2. ...
(Entre 5 y 8 casos: uno por cada estado o color, uno de borde, uno que no aplica, uno ya cerrado.)
\`\`\`

## Límites que hacen la SPEC verificable

- Una página. Si pasa de una página, es un sistema, no un MVP.
- Máximo 3 pantallas y 1 documento de salida en una sesión.
- Entre 5 y 12 reglas, todas con ejemplo.
- 10 registros de ejemplo, ni más ni menos: suficientes para cubrir las reglas, pocos para leerlos en clase.
- Entre 5 y 8 casos de prueba con resultado esperado concreto.
- Máximo 2 roles; si el brief trae más, el MVP toma el principal y el resto va a "Qué NO construimos".

## Trampas frecuentes

- "Que la IA analice el expediente" → ¿con qué criterios? Esos criterios, escritos, son las reglas. La "lectura" va a la capa 7.
- "Que se conecte a [sistema]" → diez registros de ejemplo con los mismos campos que traería el sistema.
- "Que genere Word, Excel y PPT" → un documento en texto con copiar y descargar.
- "Que avise por correo" → semáforo y lista ordenada por urgencia.
- Sin "Qué NO construimos" → la SPEC no está lista.
- Sin resultado esperado en los casos → la capa 2 no se puede verificar.`;

/** brief-a-mvp/references/tabla-de-recorte.md */
export const REF_TABLA_DE_RECORTE = `# Tabla de recorte: de lo que pide el brief a lo que se construye hoy

La usa el paso 4 de la skill. La regla: no mandar a "después" sin dar el sustituto que sí cabe en una sesión. Copiar las filas que apliquen a la tabla del recorte y agregar las propias del brief.

## Sustituciones generales

| Lo que pide el brief | Lo que construimos hoy (sustituto) | Va al roadmap |
|---|---|---|
| Conexión a una base de datos o sistema de la entidad | 10 registros de ejemplo en el código, con los mismos campos | Carga de CSV/Excel; luego integración |
| "Que lea el PDF / el expediente / el correo" | Un cuadro de texto donde se pega el contenido; campos manuales | OCR y lectura con IA |
| Consulta de normas, jurisprudencia, conceptos, tablas oficiales | 5-12 reglas escritas por el usuario como criterios; una lista corta de referencias visibles en la app | Repositorio documental; búsqueda |
| Repositorio institucional de respuestas / fichas / plantillas | 5 registros de ejemplo guardados dentro de la app, buscables por palabra clave | Repositorio real con control de versiones |
| Alertas por correo, WhatsApp, calendario | Semáforo de colores y lista ordenada por urgencia; contadores en un tablero | Notificaciones programadas |
| Firma, radicación, notificación, expedición | Botón "Marcar como validado" y observaciones; documento con bloque de firma vacío | Integración con gestor documental |
| Generación de Word, Excel, PPT | Un documento en texto plano con "Copiar" y "Descargar .txt / .csv" | Plantillas institucionales en Word |
| Usuarios, roles, permisos, login | Un solo rol; sin login; la "validación" es un botón | Autenticación institucional |
| Base de datos persistente | localStorage (archivo local / Lovable) o almacenamiento del artifact (Claude), con exportar/importar JSON | Base de datos real |
| "Que use IA para analizar / clasificar / decidir" | Reglas explícitas primero; la IA solo en la capa 7, para sugerir, y la persona confirma | Modelo con trazabilidad y protección de datos |
| Reportes periódicos e indicadores | Un tablero con 4-6 contadores y "Top 5" | Reportes exportables, históricos |
| "Que sea bonita" / "moderna" | No es una acción; la herramienta ya la hace razonable | Diseño institucional |
| Varios tipos de documento de salida | Uno solo, el más frecuente | Los demás, uno por iteración |

## Sustituciones propias del sector público colombiano

| Lo que pide el brief | Lo que construimos hoy |
|---|---|
| SECOP I / II, RUES, Orfeo, SIIF, bases de la entidad | 10 registros de ejemplo con los campos que ese sistema traería (número, contratista, objeto, valor, fechas, estado) |
| Buzón institucional / correo compartido | Botón "Nuevo" con formulario, o cuadro de texto para pegar |
| Normativa (Ley 80, Ley 1150, CPACA, Ley 1755, Ley 1123, Estatuto Tributario, tablas de retención, UVT) | Reglas R1…Rn con la cita como referencia y la nota "simplificada para el MVP; validar con el área jurídica / contable" |
| Relatorías, jurisprudencia del Consejo de Estado, conceptos de CCE | Una lista de 5 criterios o precedentes de ejemplo, con palabras clave, dentro de la app |
| Datos personales reales, expedientes, información reservada | Nunca. Nombres, NIT, cédulas y radicados inventados |
| Acto administrativo, resolución, acta de liquidación, otrosí, calificación de cargos, respuesta a petición | Un borrador en texto con la estructura institucional y el bloque de firma "[Nombre y cargo del funcionario]" vacío |
| Términos legales (días hábiles, festivos, suspensión de términos) | Días calendario en el MVP, declarado como simplificación; días hábiles y festivos al roadmap |
| Trazabilidad y auditoría | Campo "observaciones" y "validado por humano" con fecha; la trazabilidad real va al roadmap |

## Regla de oro

Todo lo determinístico (plazos, cálculos, estados, listas de chequeo, prioridades, tarifas) se construye con reglas, no con IA. La IA entra al final, si sobra tiempo, para lo que las reglas no pueden hacer: leer texto libre, resumir, clasificar. Y siempre sugiere; nunca decide.

## Cómo presentar el recorte

Tabla de dos columnas con las filas del brief, seguida de una línea: "Propongo este recorte; dime qué se queda y qué sale". La persona decide. Lo que sale se anota en "Qué NO construimos" de la SPEC con su sustituto.`;

/** brief-a-mvp/references/prompts-por-capa.md */
export const REF_PROMPTS_POR_CAPA = `# Plantillas de prompts por capa

Las usa el paso 8 de la skill. Rellenar los corchetes con los nombres de la SPEC (pantallas, campos, reglas, registros) y anteponer la cabecera de \`herramientas.md\`. Cada prompt va en un bloque de código. "Qué debe verse" y "Si falla" se incluyen cuando la experiencia es "nunca" o "algo con IA".

## Prompt 0 — Cargar la SPEC (no construye)

\`\`\`
Eres mi par de desarrollo para construir un prototipo (MVP). Te doy la especificación completa.
NO construyas nada todavía. Léela y respóndeme en máximo 8 líneas:
1) Qué vas a construir, en una frase.
2) Qué NO vas a construir.
3) Qué dudas tienes sobre las reglas R1 a R[n]. Si no tienes dudas, dilo.
Restricciones para todo el proyecto: [cabecera de la herramienta]; datos ficticios; interfaz en español.

--- ESPECIFICACIÓN ---
[pegar aquí la SPEC completa]
\`\`\`
Qué debe verse: un resumen correcto y, si hay dudas, preguntas precisas. Responder y avanzar.

## Prompt 1 — Capa 1: esqueleto + datos de ejemplo

\`\`\`
Siguiendo la SPEC, construye SOLO la capa 1:
- [cabecera de la herramienta].
- Los 10 [registros] de ejemplo de la SPEC, en el código, con TODOS los campos del modelo de datos.
- [Pantalla 1]: una tabla con las columnas [lista de columnas básicas, sin las calculadas]. [Formato de valores: pesos, fechas].
- Título "[nombre]" y subtítulo con la fecha de hoy.
Todavía NO calcules [reglas]. No agregues otras pantallas ni funcionalidades.
Antes de escribir código, dime en 3 líneas qué vas a hacer.
\`\`\`
Qué debe verse: tabla con los 10 registros, valores con formato, fechas de la SPEC.
Si falla: "Faltan los registros X y Y de la SPEC; agrégalos sin modificar lo demás."

## Prompt 2 — Capa 2: motor de reglas

\`\`\`
Siguiendo la SPEC, implementa SOLO las reglas R1 a R[k]:
- Para cada [registro] calcula [resultados de las reglas: estado, fecha límite, días, color, tarifa...].
- "Hoy" es la fecha del sistema del navegador. [Si aplica]
- Agrega a la tabla las columnas: [columnas calculadas].
- Ordena la tabla según R[prioridad].
- Implementa los cálculos en una función separada y pura (recibe un registro y la fecha de hoy, devuelve los resultados).
No cambies el modelo de datos ni la estructura existente; solo agrega columnas. No agregues filtros ni otras pantallas todavía.
Antes de escribir código, muéstrame cómo quedaría el cálculo para [registro de ejemplo] con hoy = [fecha fija].
\`\`\`
Qué debe verse: la tabla de resultados esperados de la SPEC (un registro por estado/color).
Si falla: plantilla de corrección con la regla copiada.

## Prompt 3 — Capa 3: ficha de detalle y lista de chequeo

\`\`\`
Siguiendo la SPEC, construye [Pantalla 2]:
- Al hacer clic en una fila se abre la ficha (vista que reemplaza la tabla, con botón "Volver").
- Muestra todos los campos, [los resultados de las reglas] con el vigente resaltado.
- [Lista de chequeo / sub-elementos] editable entre [Sí / No / N/A] y el porcentaje según R[n], también como columna en la tabla.
- Campo de observaciones y botón "Marcar como validado por humano" que muestra ✓ en la tabla.
- Los cambios se reflejan de inmediato (solo en memoria por ahora).
No modifiques el motor de reglas. No agregues el tablero ni el documento todavía.
\`\`\`
Qué debe verse: [registro X] → [n] elementos, [m] en No, [p] %. Cambiar uno → el porcentaje cambia.

## Prompt 4 — Capa 4: tablero

\`\`\`
Siguiendo la SPEC, construye [Pantalla 3] accesible desde una pestaña "Tablero":
- Contadores por [estado/color], cada uno con su color.
- Indicadores [los de la SPEC].
- Lista "Top 5" según R[prioridad], con [columnas]; clic abre la ficha.
Reutiliza las funciones de cálculo existentes; no dupliques lógica. No modifiques las pantallas 1 y 2.
\`\`\`
Qué debe verse: los contadores esperados de la SPEC.

## Prompt 5 — Capa 5: documento de salida

\`\`\`
Siguiendo la SPEC (sección "Documento"), agrega en la ficha un botón "Generar [documento]":
- Genera un texto plano con: [estructura exacta de la SPEC: encabezado, destinatario, referencia, párrafos, lista numerada de [elementos en No], plazo, bloque de firma "[Nombre y cargo del funcionario responsable]"].
- Si [no aplica: sin pendientes / no requiere / ya cerrado], muestra el mensaje o deshabilita el botón con explicación.
- Cuadro de solo lectura con "Copiar al portapapeles" y "Descargar .txt" [adaptar a la herramienta].
No modifiques nada más. Muéstrame primero el texto que generarías para [registro X].
\`\`\`
Qué debe verse: el documento lista exactamente los elementos en No; los casos que no aplican se comportan como dice la SPEC.

## Prompt 6 — Capa 6: persistencia, alta de registros y filtros

\`\`\`
Siguiendo la SPEC, agrega:
1. [Persistencia según la herramienta], para que al recargar no se pierda nada. Si no hay nada guardado, carga los 10 de ejemplo. Botón "Restablecer datos de ejemplo" con confirmación dentro de la página.
2. "Exportar JSON" y "Importar JSON" (reemplaza tras confirmación).
3. Botón "Nuevo [registro]" con formulario de todos los campos; al guardar, [sub-elementos] se crean según R[n] y el registro aparece con sus resultados calculados.
4. Filtros por [campos] y buscador por [campos].
No modifiques el motor de reglas ni el generador de documentos.
\`\`\`
Qué debe verse: crear un registro → aparece calculado; recargar → sigue ahí.

## Prompt 7 (opcional) — Lectura por palabras clave (antesala de la IA)

\`\`\`
Agrega en la ficha un cuadro "Pegar texto de [documento fuente]" y un botón "Detectar [elementos] mencionados".
Busca en el texto (sin mayúsculas ni tildes) palabras clave asociadas a cada [elemento]: [lista palabra → elemento].
Muestra sugerencias "El texto menciona [elemento]; ¿marcar como Sí?" con un botón por cada una. Nunca cambies el estado automáticamente: la persona confirma uno por uno.
No modifiques nada más.
\`\`\`
Variante con IA (solo si la herramienta lo permite sin API key o si hay un día o más): "usa [la capacidad de preguntar a Claude / la API] para devolver en JSON qué elementos menciona el texto; sugerir, nunca cambiar".

## Prompt de prueba final

\`\`\`
Verifica la aplicación contra estos casos con hoy = [fecha fija] y dime, caso por caso, si el resultado coincide. Si alguno no coincide, explica por qué antes de corregir:
1. [registro] → [resultado esperado].
2. ...
[n]. Tablero → [contadores esperados].
\`\`\`

## Plantilla de corrección

\`\`\`
En [pantalla/función], para el caso [registro concreto], esperaba [resultado A] y obtuve [resultado B].
La regla aplicable es [Rn]: "[copiar la regla]".
Corrige solo eso. No modifiques nada que ya funcione. Dime en 2 líneas qué cambiaste.
\`\`\`
Si después de dos correcciones sigue fallando: retroceder a la versión anterior y repetir el prompt de la capa con la regla más explícita y un ejemplo numérico.

## Plantilla "no te pases"

\`\`\`
Agregaste [X] y no lo pedí. Elimínalo y deja la aplicación exactamente como estaba más lo que pedí en el último prompt. Recuerda las restricciones: [cabecera de la herramienta].
\`\`\``;

/** brief-a-mvp/references/herramientas.md */
export const REF_HERRAMIENTAS = `# Adaptación por herramienta

La usa el paso 8 de la skill. Cada bloque da: la instrucción técnica de cabecera (va al inicio del Prompt 1 y se recuerda en los demás), cómo se persiste, cómo se descarga, cómo se retrocede y qué advertir. Elegir un solo bloque.

## Lovable (caja cerrada)

- **Cabecera:** "Construye una app web React de una sola página. Sin backend, sin Supabase, sin autenticación, sin API keys. Los datos de ejemplo van en el código. Interfaz en español."
- **Persistencia (capa 6):** localStorage con try/catch; exportar/importar JSON.
- **Descargas:** funcionan con un enlace normal (Blob).
- **Retroceder:** historial de versiones de Lovable; "vuelve a la versión anterior".
- **Advertir:** si Lovable ofrece conectar Supabase o login, decir que no en el MVP.

## Claude Code o Codex (caja abierta, local)

- **Cabecera:** "Construye un único archivo \`index.html\` con HTML, CSS y JavaScript dentro, sin dependencias externas (o como máximo una hoja de estilos por CDN). Sin backend, sin base de datos, sin login, sin API keys. Se abre con doble clic en el navegador. Interfaz en español."
- **Carga de la SPEC:** guardar \`SPEC.md\` en la carpeta y pedir "Lee @SPEC.md".
- **Persistencia:** localStorage con try/catch; exportar/importar JSON.
- **Descargas:** funcionan con un enlace normal.
- **Retroceder:** "deshaz los cambios del último prompt" o git si existe.
- **Advertir:** usar el modo local ("This computer" en Codex), no el modo cloud; el resultado es un archivo en la carpeta, no una página publicada.

## Claude (artifact en claude.ai)

- **Cabecera:** "Crea un único artifact HTML de una sola página (HTML, CSS y JavaScript en el mismo archivo). Sin backend, sin APIs externas, sin login, sin claves. Datos de ejemplo en el código. Interfaz en español. Más adelante te pediré guardar datos en el almacenamiento del artifact y un botón de descarga con la capacidad de descargas."
- **Persistencia (capa 6):** "guarda los datos en el almacenamiento del artifact en modo compartido, para que no se pierdan al recargar y para que quien reciba el link vea el mismo inventario; si no está disponible, modo solo lectura con aviso". No usar localStorage.
- **Descargas:** la página no puede iniciar descargas por sí misma; pedir "un botón que use la capacidad de descargas del artifact; si no está disponible, ocúltalo".
- **Confirmaciones:** no usar \`confirm()\` ni \`alert()\`; la confirmación va dentro de la página.
- **IA opcional (capa 7):** "usa la capacidad del artifact de preguntar a Claude"; no requiere API key; el consumo va al plan de quien usa el artifact.
- **Retroceder:** editar el mensaje anterior en el chat crea una rama con el artifact anterior intacto.
- **Advertir:** compartir por link, almacenamiento y descargas requieren plan Pro o superior; en Free se construye y se demuestra desde la propia pantalla. El almacenamiento compartido lo ve todo el que abra el artifact: nunca datos reales.

## Gemini AI Studio (Build)

- **Cabecera:** "Construye una app web de una sola página. Sin backend, sin base de datos externa, sin autenticación, sin claves de API. Datos de ejemplo en el código. Interfaz en español."
- **Persistencia:** localStorage con try/catch; exportar/importar JSON.
- **Descargas:** enlace normal.
- **Retroceder:** historial del proyecto; si no, repetir el prompt de la capa.
- **Advertir:** si propone usar la API de Gemini dentro de la app, dejarlo para la capa 7.

## "No sé"

Recomendar: Lovable si la persona no quiere instalar nada y quiere ver interfaz rápido; Claude (artifact) si ya usa claude.ai y quiere compartir un link; Claude Code o Codex si ya tiene VS Code o terminal. Elegir una y seguir; cambiar de herramienta a mitad de camino cuesta más que terminar en la elegida.

## Instrucciones comunes a todos los prompts

Cada prompt termina con estas dos líneas:
- "No modifiques lo que ya está construido; solo agrega lo que pido en este prompt."
- "No agregues funcionalidades, pantallas ni campos que no te pedí. Si falta información para hacerlo, pregúntame antes de asumir."`;

/** brief-a-mvp/references/reglas-de-mesa.md */
export const REF_REGLAS_DE_MESA = `# Reglas de mesa y protocolo de error

Las usa el paso 9 de la skill. Tomadas de Cerebro (x10.expert/cerebro), sin cambios. Son para cuando ya se está construyendo.

## Reglas de mesa

1. Un cambio por mensaje.
2. Describe lo que ves, no lo que crees que falla.
3. Prueba antes de pedir lo siguiente.
4. Si se rompió, vuelve a la versión anterior antes de arreglar.
5. Nunca pegues datos reales.

## Protocolo de error

1. Lee lo que dice la herramienta. Casi siempre dice qué pasó.
2. Copia el mensaje de error tal cual y pídele que lo arregle. Sin interpretarlo.
3. Si en dos intentos no lo arregla, vuelve a la versión anterior y pide el mismo cambio de otra forma, más pequeño.
4. Si vuelve a fallar, anótalo y sigue con el siguiente punto de control.

## Qué no hacer (seguridad)

- No pegar datos reales de personas, clientes ni de la entidad. Inventar nombres.
- No publicar una app con información sensible sin inicio de sesión. V1 no lo tiene; por eso V1 no lleva datos sensibles.
- No pegar contraseñas ni llaves de otros servicios en un mensaje a la herramienta.
- No conectar la app a cuentas reales (correo, pagos, bases de datos de la entidad) en esta etapa.`;

/** INSTRUCCIONES_GPT.md: the paragraph before its first --- rule. */
export const CABECERA_GPT = `Instrucción: a partir de ahora aplica esta skill cada vez que te pegue un brief, una idea o pida prompts para un MVP. Confírmame en tres líneas: cómo se llama la skill y cuándo se activa, qué me vas a pedir antes de empezar, y con qué sección cierras cada respuesta.`;

/** README.md, whole. */
export const README_BORRADOR = `# brief-a-mvp · skill del taller

Pega tu brief (o tu idea) y la skill te devuelve el recorte a MVP, la SPEC de una página y los prompts por capas para construirla hoy.

## Instalar

**Claude (claude.ai):** Ajustes → Capacidades → Skills → subir \`brief-a-mvp.zip\` sin descomprimir. Luego, en un chat nuevo, pega tu brief y di con qué herramienta vas a construir.

**Claude Code:** copia la carpeta \`brief-a-mvp/\` a \`~/.claude/skills/brief-a-mvp/\` (para todos tus proyectos) o a \`.claude/skills/brief-a-mvp/\` dentro del proyecto. Luego: \`/brief-a-mvp\` o simplemente pega el brief.

**ChatGPT / Gemini:** abre un chat nuevo y pega el contenido de \`INSTRUCCIONES_GPT.md\` (es la skill y sus referencias en un solo texto). Después pega tu brief.

## Probar

Pega el brief de tu grupo y escribe: "Voy a construir en [Lovable / Claude / Claude Code / Codex / AI Studio], [nunca he construido / ya hice algo con IA / programo], tengo una sesión de 90 minutos. Dame el MVP y los prompts."

Debe responder con nueve secciones: lo que entendió, preguntas (máximo tres), momento de valor, recorte, SPEC, plan de capas, prompts, reglas de mesa y "Lo que aún adivinaría". Si no hace eso, vuelve a pegar en un chat nuevo.

## Archivos

- \`brief-a-mvp/\` — la skill (SKILL.md + references/ + evals/)
- \`brief-a-mvp.zip\` — la misma carpeta para subir a claude.ai
- \`INSTRUCCIONES_GPT.md\` — versión en un solo texto para ChatGPT y Gemini`;

/** brief-a-mvp/evals/semaforo-liquidaciones/prompt.md: the table only (no front matter, no opening sentence). */
export const EJEMPLO_BRIEF = `| Campo | Contenido |
|---|---|
| Nombre y entidad | Semáforo de Liquidaciones Contractuales. Oficina de contratación de una entidad pública colombiana. |
| Usuario | Abogado o profesional de la oficina de contratación responsable del cierre (liquidación) de contratos y convenios. Necesita saber, por contrato, si requiere liquidación, en qué etapa del plazo está y qué documentos faltan. Le frustra abrir cada expediente para verificarlo manualmente y enterarse tarde de los vencimientos. |
| Problema | La información del cierre contractual está dispersa (contrato, actas, informes, pólizas, certificaciones). Calcular los términos y verificar la completitud documental toma entre una y dos horas por contrato, y con frecuencia los plazos se vencen sin que nadie lo note, con riesgo de pérdida de competencia, hallazgos de los órganos de control y saldos sin definir. |
| Reto | ¿Cómo podríamos ayudar a la oficina de contratación a ver en segundos qué contratos están próximos a vencer su plazo de liquidación y qué documentos faltan en cada uno, sin sustituir la revisión jurídica? |
| Solución | Una herramienta de IA que consolide el inventario contractual desde SECOP y las bases de la entidad, calcule los términos de liquidación y genere alertas por correo, revise la documentación del expediente contra listas de chequeo, analice la consistencia de valores, pagos y garantías, genere actas de liquidación, oficios y requerimientos, consulte la normativa y jurisprudencia aplicable y produzca informes de seguimiento e indicadores. |
| Flujo principal | 1. Se consolida el inventario de contratos. 2. La herramienta calcula los términos y alerta. 3. Revisa el expediente e identifica faltantes. 4. Genera los documentos de liquidación. 5. El profesional revisa, valida y tramita. |
| Qué NO hará | No decide si procede la liquidación ni declara la pérdida de competencia. No firma, radica ni notifica. |
| Datos | Contratos y convenios de la entidad (número, contratista, objeto, valor, plazo, fechas, supervisor, estado), documentos del expediente, informes de supervisión, garantías. |
| Humano responsable | El profesional de la oficina de contratación revisa cada caso, decide y tramita. |
| Cómo sabremos que funciona | Reducción del tiempo de revisión por contrato y cero plazos de liquidación vencidos sin alerta. |`;

// The box of each tool in the presentation line of SKILL.md, first person. Not in the
// draft: from the field 03 hint of the encargo («Caja cerrada (Lovable, AI Studio):
// todo armado, sin instalar nada. Artifact (Claude): una página con link para
// compartir. Caja abierta (Claude Code, Codex): archivos en tu computador»).
export const CAJAS = {
  cerrada: 'caja cerrada: todo armado, sin instalar nada',
  artifact: 'artifact: una página con link para compartir',
  abierta: 'caja abierta: archivos en mi computador',
};
