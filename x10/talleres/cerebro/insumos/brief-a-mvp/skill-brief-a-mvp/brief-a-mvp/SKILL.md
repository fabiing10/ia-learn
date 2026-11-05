---
name: brief-a-mvp
description: "Convierte un brief o una idea en un MVP de una sesión: recorte, SPEC de una página y prompts por capas. Úsala siempre que me peguen un brief o digan MVP, prototipo, «quiero construir» o «los prompts»."
---

# De brief a MVP

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

1. **Mapear la entrada.** Lee `references/plantilla-spec-mvp.md` (tabla "brief → SPEC"). Si llegó un brief, asigna cada campo a su bloque de la SPEC y lista los bloques que quedaron vacíos. Si llegó una frase, escribe primero la frase completa ("Quiero una herramienta que ___ para ___") y trata todos los bloques como vacíos. Nunca vuelvas a preguntar lo que el brief ya responde.
2. **Prueba del adivino, primera vuelta.** Lista lo que tendrías que adivinar para construir eso y haz como máximo tres preguntas, las que más cambian el MVP (típicamente: qué decide la herramienta y qué decide la persona; con qué criterios o reglas; cuál es el documento de salida). Espera la respuesta. Si dicen "asume", asume lo más simple y anótalo en el cierre.
3. **Momento de valor.** Una frase: "Cuando [usuario] recibe [entrada], necesita [resultado] en menos de [tiempo], sin [frustración]". Es el paso del flujo donde más tiempo se pierde y que se puede demostrar con datos inventados.
4. **Recorte.** Lee `references/tabla-de-recorte.md`. Escribe una tabla de dos columnas: lo que pide el brief → lo que construimos hoy. No mandes las cosas a "después" sin más: da el sustituto viable (SECOP → diez registros de ejemplo; correo → semáforo; PDF → cuadro de texto). Regla de oro: lo determinístico (plazos, cálculos, estados, listas de chequeo) se construye con reglas explícitas; la IA entra solo al final, solo si sobra tiempo y solo para sugerir. Propón el recorte; la persona decide qué se queda.
5. **SPEC de una página.** Usa los bloques y límites de `references/plantilla-spec-mvp.md`, en ese orden. Las reglas van numeradas (R1, R2…) en español claro y cada una con un ejemplo concreto; los datos de ejemplo son diez registros ficticios con los valores que hacen falta para probar las reglas; los casos de prueba traen el resultado esperado (un valor, una fecha, un color), no una descripción vaga.
6. **Prueba del adivino, segunda vuelta.** Lee la SPEC como si fueras la herramienta y escribe tres cosas que aún tendrías que adivinar. Corrígelas en la SPEC antes de entregar.
7. **Plan de capas.** Según el tiempo: una sesión = capas 0 a 6 con un solo documento de salida; un día = más una capa de IA opcional; una semana = puede incluir carga de archivos y usuarios. Capa 0 cargar la SPEC sin construir; 1 esqueleto y datos de ejemplo; 2 motor de reglas; 3 ficha de detalle y lista de chequeo; 4 tablero o resumen; 5 documento de salida; 6 persistencia, alta de registros y filtros; 7 opcional, lectura de texto por palabras clave o con IA.
8. **Prompts.** Lee `references/herramientas.md` (bloque de la herramienta elegida) y `references/prompts-por-capa.md`. Escribe un prompt por capa, cada uno en un bloque de código para copiar entero, con la instrucción técnica de cabecera de la herramienta, "no modifiques lo que ya funciona" y "no agregues lo que no pedí". Si la experiencia es "nunca" o "algo con IA", después de cada prompt pon "Qué debe verse" y "Si falla"; si es "programo", omítelos. Agrega al final el prompt de prueba final con los casos de la SPEC, la plantilla de corrección y la plantilla "no te pases".
9. **Cierre.** Las reglas de mesa de `references/reglas-de-mesa.md` en cinco líneas y la sección "Lo que aún adivinaría", aunque quede vacía.

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

```markdown
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
```

Responde claro y directo. La SPEC y los prompts van en bloques de código para copiarlos enteros; lo demás en prosa corta o tablas.

## Ejemplo

Entrada: el brief de "Semáforo de Liquidaciones Contractuales" (oficina de contratación; usuario: abogado que cierra contratos; problema: no sabe cuándo vence el plazo de liquidación ni qué documentos faltan; solución pedida: inventario desde SECOP, alertas por correo, revisión documental, análisis financiero, generación de actas y reportes). Herramienta: Claude Code. Experiencia: nunca. Una sesión.

Salida: ninguna pregunta (el brief responde lo esencial) o una sola sobre los plazos legales; momento de valor "cuando el abogado abre la herramienta ve qué contratos vencen y qué documentos faltan"; recorte con SECOP → diez contratos de ejemplo, correo → semáforo, análisis financiero → roadmap, actas → un solo oficio de requerimiento; SPEC con diez contratos ficticios, diez reglas (R1 requiere liquidación, R2 bilateral = terminación + 4 meses, R3 unilateral +2, R4 máximo +24, R5 etapa, R6 semáforo, R7-R8 lista de chequeo, R9 completitud, R10 prioridad) y siete casos de prueba con etapa, fecha y color; siete prompts con "un único archivo index.html, sin backend", cada uno con "Qué debe verse"; prueba final; cierre con "Lo que aún adivinaría: si el plazo pactado en pliegos prevalece sobre los 4 meses".
