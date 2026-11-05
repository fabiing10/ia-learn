# Presentación "Del brief al MVP" para x10.expert/vibecoding

**Qué es:** una presentación interactiva dentro del sistema de presentaciones de Vibe Coding (x10.expert/vibecoding), con la que los participantes siguen la sesión y copian los prompts directamente desde la diapositiva. Dos partes en este archivo:

- **Parte A — Guion de la presentación:** 18 diapositivas con el contenido exacto (texto, prompts, "qué debe verse", ciclo de iteración, descargas).
- **Parte B — Prompts para Claude Code:** cómo construirla en el repositorio de Vibe Coding, por capas.

**Insumos en `Practica/presentacion/assets/`:** `Brief-Semaforo-de-Liquidaciones.pdf` (la definición del producto, 4 páginas), `SPEC-semaforo-liquidaciones.pdf` y `SPEC-semaforo-liquidaciones.md` (la especificación que se pega en el Prompt 0). Estos tres archivos se publican como descargas de la presentación.

**Principios de diseño de la presentación (para no reabrirlos):**
- Cada diapositiva de prompt tiene la misma estructura: *Qué hace* · *Prompt* (bloque con botón Copiar) · *Qué debe verse* · *Si falla* · *Por qué importa*. Así el participante aprende el ciclo, no solo copia.
- Donde el prompt cambia según la herramienta, el bloque tiene pestañas: **Lovable / AI Studio** · **Claude Code / Codex** · **Claude (artifact)**. Lo demás es idéntico.
- Un botón "Copiar" por prompt y un botón "Descargar" por archivo. Nada más interactivo: la presentación guía, no construye.
- La fecha de referencia de los casos de prueba es **2026-11-05**. Si la sesión se repite otro día, hay que recalcular los días esperados (ver nota en la diapositiva 11).

---

# PARTE A — Guion de la presentación

## 1 · Portada

**Título:** Del brief al MVP
**Subtítulo:** Sesión práctica · Taller de IA para la Gestión Pública
**Línea:** Hoy construimos, con sus herramientas, un producto que funciona.
**Pie:** x10.expert/vibecoding · Fabián Zapata · 5 de noviembre de 2026

## 2 · Dónde estamos en el recorrido

**Título:** Tres sesiones, un camino

Cuatro pasos en línea, los tres primeros marcados como hechos y el cuarto como "hoy":

1. **Ideación** — la idea en una frase: quién la usa y qué le resuelve.
2. **Brief** — los diez campos: usuario, problema, reto, solución, flujo, qué NO hará, datos, humano responsable, cómo sabremos que funciona.
3. **Especificación** — la prueba del adivino: todo lo que la herramienta tendría que adivinar, escrito.
4. **Construcción (hoy)** — la SPEC se convierte en prompts por capas y cada capa se prueba antes de la siguiente.

**Nota al pie:** Ustedes ya tienen su brief. Hoy usamos uno de ejemplo para aprender el método; al final lo aplican al suyo.

## 3 · Qué es un MVP (y qué no)

**Título:** Un MVP se demuestra en cinco minutos con datos inventados

Tabla de dos columnas:

| Un MVP SÍ es | Un MVP NO es |
|---|---|
| Una pantalla (máximo tres) | Un sistema de información |
| Un flujo de principio a fin | Doce funcionalidades a medias |
| Datos sintéticos dentro de la app | Conexión a SECOP, Orfeo, correo, bases institucionales |
| Reglas escritas por ustedes | Jurisprudencia "consultada" por la IA |
| Un botón "validado por humano" | Firma, radicación, notificación |
| Se prueba con 3 casos | Se mide con 100 expedientes |

**Frase de cierre:** Si no lo puedes demostrar hoy con datos inventados, no es MVP: es roadmap. Y está bien tener roadmap.

## 4 · El patrón que comparten sus ocho retos

**Título:** Son el mismo producto con distinto contenido

Diagrama de cinco cajas en línea:
**Entrada** (documento, caso, factura, expediente) → **Criterios** (lista de chequeo, reglas, repositorio) → **Análisis** (contrastar; hallazgos con fuente) → **Salida** (ficha, matriz, semáforo, borrador) → **Validación humana** (revisa, ajusta, aprueba)

Debajo, una fila de ocho etiquetas pequeñas: RetenIA · Planeación · Municipios · Liquidaciones · IDARTES · DisciplinIA · IDU · Órganos de control.

**Frase:** Ninguno necesita inventar una aplicación. Cada eslabón de la cadena es un prompt.

## 5 · La regla de recorte

**Título:** De lo pretencioso a lo viable, sin perder la idea

Tabla:

| Lo que pide el brief | Lo que construimos hoy |
|---|---|
| Consulta SECOP / bases de la entidad | 10 registros de ejemplo en la app |
| Lee el PDF / el buzón | Un cuadro donde se pega texto |
| Consulta jurisprudencia y conceptos | 5-10 reglas escritas por ustedes, visibles en la app |
| Alertas por correo | Semáforo y lista ordenada por urgencia |
| Firma, radica, notifica | Botón "Marcar como validado" y bloque de firma vacío |
| Genera Word, Excel, PPT | Un documento en texto con Copiar y Descargar |
| "Que la IA analice y decida" | Reglas explícitas; la IA al final, solo para sugerir |

**Regla de oro (destacada):** Todo lo determinístico (plazos, cálculos, estados, listas de chequeo) se construye con reglas, no con IA.

## 6 · El caso de hoy: Semáforo de Liquidaciones Contractuales

**Título:** Un caso real en miniatura

**Momento de valor (cita grande):** "Cuando el abogado de contratación abre la herramienta, ve en segundos qué contratos están próximos a vencer su plazo de liquidación, qué documentos faltan en cada uno, y puede generar el oficio de requerimiento al contratista."

Cuatro tarjetas: **Entrada:** 10 contratos ficticios · **Criterios:** 10 reglas (plazos, semáforo, lista de chequeo) · **Salida:** inventario con semáforo, ficha, tablero, oficio · **Validación:** editar, observar, marcar validado.

**Por qué este caso:** es autónomo (sin SECOP, correo ni PDF), no es trivial (motor de plazos legales + documentos), el conocimiento experto es de ustedes, y cabe en seis prompts.

**Descargas (tres botones):**
- `Brief-Semaforo-de-Liquidaciones.pdf` — la definición del producto (el brief llevado a MVP).
- `SPEC-semaforo-liquidaciones.pdf` — la especificación para leer.
- `SPEC-semaforo-liquidaciones.md` — la especificación para pegar en la herramienta.

**Nota para el facilitador (visible en modo presentador o como texto pequeño):** las reglas de plazo están simplificadas (4 meses bilateral + 2 unilateral + 2 años). Es el momento de que los abogados discutan los matices; eso va al roadmap.

## 7 · Cómo lo vamos a construir

**Título:** Por capas, y cada capa se prueba antes de la siguiente

Lista numerada en una columna: 0 Cargar la SPEC (sin construir) · 1 Esqueleto y datos de ejemplo · 2 Motor de plazos y semáforo · 3 Ficha y lista de chequeo · 4 Tablero · 5 Oficio de requerimiento · 6 Persistencia, nuevos contratos y filtros · 7 (opcional) Lectura por palabras clave.

En la otra columna, **las reglas de mesa:**
1. Un cambio por mensaje.
2. Describe lo que ves, no lo que crees que falla.
3. Prueba antes de pedir lo siguiente.
4. Si se rompió, vuelve a la versión anterior antes de arreglar.
5. Nunca pegues datos reales.

**Ciclo (diagrama circular pequeño):** Pegar prompt → Mirar "qué debe verse" → ¿Coincide? Sí: siguiente capa. No: plantilla de corrección (máximo 2 intentos) → retroceder.

## 8 · Elige tu herramienta

**Título:** La misma SPEC, cinco caminos

Tabla:

| Herramienta | Cómo empezar | Instrucción técnica que va en todos los prompts |
|---|---|---|
| **Lovable** | New project | "App web React de una sola página. Sin backend, sin Supabase, sin login, sin API keys. Datos de ejemplo en el código." |
| **Gemini AI Studio** | Build | "App web de una sola página. Sin backend, sin base de datos externa, sin claves." |
| **Claude Code** | Carpeta nueva con `SPEC-semaforo-liquidaciones.md` adentro | "Un único archivo index.html con HTML, CSS y JavaScript. Sin backend, sin login, sin API keys." |
| **Codex** | Carpeta nueva, modo *This computer* (no Cloud) | Igual que Claude Code |
| **Claude (artifact)** | Chat nuevo en claude.ai | "Un único artifact HTML de una sola página. Sin backend, sin APIs externas. Guardado en el almacenamiento del artifact; descarga por capacidad." |

**Frase:** Elijan una y terminen en esa. Cambiar de herramienta a mitad de camino cuesta más que terminar.

## 9 · Prompt 0 — Cargar la especificación

**Qué hace:** le da a la herramienta toda la SPEC y le pide que la entienda **sin construir nada**. Es la prueba del adivino en vivo: si pregunta algo, es porque la SPEC tenía un hueco.

**Prompt (botón Copiar):**
```
Eres mi par de desarrollo para construir un prototipo (MVP). Te voy a dar la especificación completa.
NO construyas nada todavía. Léela y respóndeme en máximo 8 líneas:
1) Qué vas a construir, en una frase.
2) Qué NO vas a construir.
3) Qué dudas tienes sobre las reglas R1 a R10. Si no tienes dudas, dilo.
Restricciones que aplican a todo el proyecto: aplicación web de una sola página, sin backend, sin base de datos externa, sin login, sin API keys, datos de ejemplo dentro del código, interfaz en español, datos ficticios.

--- ESPECIFICACIÓN ---
[pegar aquí el contenido de SPEC-semaforo-liquidaciones.md]
```
**Pestaña Claude Code / Codex:** `Lee @SPEC-semaforo-liquidaciones.md. No construyas nada todavía. Respóndeme en máximo 8 líneas: qué vas a construir, qué no, y qué dudas tienes sobre las reglas R1-R10.`

**Qué debe verse:** un resumen correcto y, si hay dudas, preguntas precisas. Respondan con precisión y avancen. Si dice "no tengo dudas", avancen.

**Por qué importa:** la SPEC es la fuente de verdad. Si la herramienta la entiende mal aquí, lo arrastra en todas las capas.

## 10 · Prompt 1 — Esqueleto y datos de ejemplo

**Qué hace:** crea la aplicación mínima: una tabla con los 10 contratos ficticios. Nada de cálculos todavía.

**Prompt (pestañas por herramienta; cambia solo la primera viñeta):**
```
Siguiendo la SPEC, construye SOLO la capa 1:
- [Lovable/AI Studio: una app React de una sola página] / [Claude Code/Codex/Claude: un único archivo index.html con HTML, CSS y JavaScript, sin dependencias externas salvo, si quieres, una hoja de estilos por CDN].
- Los 10 contratos de ejemplo de la SPEC, cargados en el código como un arreglo de objetos con TODOS los campos del modelo de datos, incluyendo la lista de chequeo documental según R7 y R8 con los estados variados que indica la SPEC.
- Pantalla 1 (Inventario): una tabla con las columnas Número, Contratista, Tipo, Valor (formato pesos colombianos), Fecha terminación, Estado ejecución, Estado liquidación.
- Un título "Semáforo de Liquidaciones Contractuales" y un subtítulo con la fecha de hoy.
Todavía NO calcules plazos, semáforo ni completitud. No agregues otras pantallas ni funcionalidades.
Antes de escribir código, dime en 3 líneas qué vas a hacer.
```

**Qué debe verse:** una tabla con 10 filas, valores en pesos, fechas de la SPEC.

**Si falla:** "Faltan los contratos X y Y de la SPEC; agrégalos sin modificar lo demás." / "Los valores se ven sin formato; muéstralos como $ 2.450.000.000."

**Por qué importa:** "dime en 3 líneas qué vas a hacer" evita que la herramienta se vaya por otro camino. Es la forma más barata de corregir: antes de que escriba código.

## 11 · Prompt 2 — Motor de plazos y semáforo

**Qué hace:** convierte las reglas R1-R6 y R10 en lógica. Es la capa donde el conocimiento jurídico de ustedes se vuelve software.

**Prompt (botón Copiar):**
```
Siguiendo la SPEC, implementa SOLO las reglas R1 a R6 y R10:
- Para cada contrato calcula: requiere liquidación (R1), fecha límite bilateral (R2), fecha límite unilateral (R3), fecha máxima (R4), etapa vigente y días restantes (R5), color del semáforo (R6).
- "Hoy" es la fecha del sistema del navegador.
- Agrega a la tabla del inventario las columnas: Semáforo (un círculo de color con el nombre del color como tooltip), Etapa vigente, Días restantes, Fecha límite de la etapa.
- Ordena la tabla según R10.
- Implementa los cálculos en una función separada y pura (recibe un contrato y la fecha de hoy, devuelve los resultados) para que sea fácil de probar.
No cambies el modelo de datos ni la estructura de la tabla existente; solo agrega columnas. No agregues filtros ni otras pantallas todavía.
Antes de escribir código, muéstrame cómo quedaría el cálculo para el contrato SUM-014-2025 con hoy = 2026-11-05.
```

**Qué debe verse (hoy = 2026-11-05):**

| Contrato | Etapa | Días | Semáforo |
|---|---|---|---|
| CONS-007-2022 | Competencia perdida | 0 | Negro |
| SUM-021-2025 | Extemporánea | ~644 | Rojo |
| SUM-014-2025 | Unilateral | 15 | Naranja |
| INT-005-2025 | Bilateral | 45 | Amarillo |
| CONV-008-2026 | Bilateral | 88 | Verde |
| OBRA-009-2026 | Bilateral | 115 | Verde |
| OBRA-001-2025 | Bilateral | 130 | Verde |
| CONV-003-2026 | En ejecución | – | Gris |
| PS-102-2026 | No requiere | – | Gris |
| CONS-011-2025 | Liquidada | – | Gris |

**Si falla:** "Para SUM-014-2025 esperaba etapa Unilateral con fecha límite 2026-11-20 y 15 días; obtuve [X]. Revisa R2 y R3: sin plazo pactado, bilateral = terminación + 4 meses; unilateral = bilateral + 2 meses. Corrige solo eso."

**Por qué importa:** aquí los abogados verifican el cálculo. Si una regla les parece incorrecta, **cambien la SPEC primero** y luego pidan a la herramienta que la actualice. La SPEC manda, no el código.

*(Nota técnica para quien edite la presentación: los días dependen de la fecha; si la sesión se repite, recalcular SUM-014 e INT-005, que son los sensibles.)*

## 12 · Prompt 3 — Ficha del contrato y lista de chequeo

**Qué hace:** abre el detalle de un contrato, muestra las tres fechas límite y permite marcar cada documento (Sí / No / N/A). Aparece el primer control humano: observaciones y "validado".

**Prompt (botón Copiar):**
```
Siguiendo la SPEC, construye la Pantalla 2 (Ficha del contrato):
- Al hacer clic en una fila del inventario se abre la ficha (puede ser un panel lateral o una vista que reemplaza la tabla, con botón "Volver al inventario").
- Muestra todos los campos del contrato y las tres fechas límite calculadas (bilateral, unilateral, máxima), resaltando la etapa vigente y su semáforo.
- Muestra la lista de chequeo documental según R7 y R8 para el tipo del contrato, con cada documento editable entre "Sí", "No" y "N/A".
- Calcula y muestra el porcentaje de completitud documental según R9, y agrégalo también como columna "Completitud (%)" en el inventario.
- Campo de observaciones (texto libre) y botón "Marcar como validado por humano" que cambia el campo validado_por_humano y muestra ✓ en el inventario.
- Los cambios se reflejan de inmediato en el inventario (por ahora solo en memoria; no hace falta guardarlos al recargar).
No modifiques el motor de cálculo de la capa 2. No agregues el tablero ni el generador de oficios todavía.
```

**Qué debe verse:** clic en OBRA-001-2025 → 9 documentos (7 base + 2 de obra), 2 en "No", completitud 78 %. Cambiar un "No" a "Sí" → 89 % y la tabla lo refleja.

**Si falla:** "Para tipo Obra la lista debe tener 9 documentos: los 7 de R7 más 'Acta de entrega y recibo de obra' y 'Amparo de estabilidad de obra actualizado'. Corrige solo la lista de Obra."

**Por qué importa:** "no modifiques el motor de cálculo" protege lo que ya funciona. Cada prompt agrega; ninguno reescribe.

## 13 · Prompt 4 — Tablero de control

**Qué hace:** resume el inventario: contadores por color, valor en riesgo y los cinco más urgentes. Es lo que el jefe quiere ver.

**Prompt (botón Copiar):**
```
Siguiendo la SPEC, construye la Pantalla 3 (Tablero), accesible desde una pestaña o botón "Tablero" junto al inventario:
- Contadores: número de contratos por color de semáforo (Verde, Amarillo, Naranja, Rojo, Negro, Gris), cada uno con su color.
- Indicador "Contratos con competencia perdida" y "Valor total en riesgo" (suma del valor de los contratos en Rojo y Negro, formato pesos).
- Lista "Top 5 más urgentes" según el orden de R10, mostrando número, contratista, etapa, días restantes y completitud.
- Al hacer clic en un contrato del Top 5 se abre su ficha.
Reutiliza las funciones de cálculo existentes; no dupliques lógica. No modifiques las pantallas 1 y 2.
```

**Qué debe verse:** Verde 3 · Amarillo 1 · Naranja 1 · Rojo 1 · Negro 1 · Gris 3 · Competencia perdida 1 · Valor en riesgo $ 715.000.000.

**Por qué importa:** "reutiliza las funciones; no dupliques lógica". Si el tablero calculara por su cuenta, tendríamos dos verdades.

## 14 · Prompt 5 — Oficio de requerimiento

**Qué hace:** genera el primer documento de salida: un borrador de oficio al contratista con los documentos faltantes. Con bloque de firma vacío.

**Prompt (botón Copiar; pestaña Claude artifact agrega la línea de descarga por capacidad):**
```
Siguiendo la SPEC (sección "Documento – Oficio de requerimiento de documentos"), agrega en la ficha del contrato un botón "Generar oficio de requerimiento":
- Genera un texto plano con: ciudad "Bogotá D.C." y fecha de hoy en formato largo en español; destinatario (nombre del contratista); referencia (número y objeto del contrato); un párrafo que informe que el contrato se encuentra en etapa de liquidación [etapa vigente] con fecha límite [fecha límite de la etapa]; la frase "Para adelantar el trámite de liquidación, se requiere allegar los siguientes documentos:" seguida de la lista numerada de los documentos cuyo estado es "No"; un párrafo con plazo de entrega de diez (10) días hábiles contados a partir del recibo de la comunicación; y un bloque de firma "[Nombre y cargo del funcionario responsable]".
- Si no hay documentos en "No", en lugar del oficio muestra el mensaje "Este contrato no tiene documentos pendientes."
- Muestra el texto en un cuadro de solo lectura con botones "Copiar al portapapeles" y "Descargar .txt".
- Si el contrato no requiere liquidación o ya está liquidado, el botón debe estar deshabilitado con un mensaje explicativo.
No modifiques nada más. Muéstrame primero el texto que generarías para OBRA-001-2025.
```
**Pestaña Claude (artifact), línea adicional:** "El botón 'Descargar .txt' debe usar la capacidad de descargas del artifact; si no está disponible, ocúltalo."

**Qué debe verse:** el oficio de OBRA-001-2025 lista exactamente los 2 documentos en "No". OBRA-009-2026: "sin documentos pendientes". PS-102-2026: botón deshabilitado.

**Por qué importa:** el oficio es un **borrador**. No se envía, no se radica, no se firma. El bloque de firma vacío es la responsabilidad humana hecha diseño.

## 15 · Prompt 6 — Persistencia, nuevos contratos y filtros

**Qué hace:** que nada se pierda al recargar, que se puedan registrar contratos nuevos, y filtrar. Con esto la herramienta ya es usable, no solo demostrable.

**Prompt (pestañas: Lovable/AI Studio/Claude Code/Codex usan localStorage; Claude artifact usa el almacenamiento del artifact):**
```
Siguiendo la SPEC, agrega:
1. Guardado automático de todos los contratos y sus cambios en localStorage del navegador, para que al recargar la página no se pierdan. Si no hay nada guardado, carga los 10 de ejemplo. Agrega un botón "Restablecer datos de ejemplo" con confirmación.
2. Botón "Exportar JSON" (descarga todos los contratos) y "Importar JSON" (carga un archivo exportado por esta misma app, reemplazando los datos tras confirmación).
3. Botón "Nuevo contrato" que abre un formulario con todos los campos del modelo de datos (los campos de lista de opciones como selectores; las fechas con selector de fecha). Al guardar, la lista de chequeo se crea automáticamente según el tipo (R7 y R8) con todos los documentos en "No", y el contrato aparece en el inventario con su semáforo calculado.
4. Filtros en el inventario por tipo, color de semáforo y estado de liquidación, y un buscador por número o contratista.
Envuelve las lecturas y escrituras de localStorage en try/catch para que la app funcione aunque el almacenamiento falle. No modifiques el motor de cálculo ni el generador de oficios.
```
**Pestaña Claude (artifact), punto 1 reemplazado por:** "Guarda los contratos y sus cambios en el almacenamiento del artifact, en modo compartido, para que no se pierdan al recargar y para que quien reciba el link vea el mismo inventario. Si no está disponible, modo solo lectura con un aviso. Confirmaciones dentro de la página (no uses confirm())."

**Qué debe verse:** crear un contrato tipo Suministro terminado hace 3 meses sin plazo pactado → Naranja o Amarillo según los días; recargar → sigue ahí; exportar → importar en otra pestaña → mismos datos.

**Por qué importa:** aquí se ve la diferencia entre herramientas: en un archivo local los datos viven en su navegador; en un artifact, en el almacenamiento compartido que ve su equipo. Y en ninguno de los dos hay datos reales.

## 16 · Prompt 7 (opcional) — Lectura por palabras clave

**Qué hace:** simula la "lectura" de un informe sin IA: busca palabras clave y **sugiere** marcar documentos; la persona confirma uno por uno. Es la antesala de la IA real.

**Prompt (botón Copiar):**
```
Agrega en la ficha del contrato un cuadro de texto "Pegar texto del informe final de supervisión" y un botón "Detectar documentos mencionados".
Al hacer clic, busca en el texto pegado (sin distinguir mayúsculas ni tildes) palabras clave asociadas a cada documento de la lista de chequeo, por ejemplo: "acta de inicio" → Acta de inicio; "recibo final" o "acta de terminación" → Acta de terminación / recibo final; "seguridad social" o "parafiscales" → Certificación de aportes; "póliza" o "garantía" → Garantías actualizadas; "informe final" → Informe final del contratista; "pago" o "balance" → Certificación de pagos.
Muestra una lista de sugerencias: "El informe menciona [documento]; ¿marcar como Sí?" con un botón por cada una. Nunca cambies el estado automáticamente: el usuario confirma uno por uno.
No modifiques nada más.
```

**Prueba:** pegar "Se suscribió acta de recibo final el 20 de septiembre; el contratista allegó certificación de pagos de seguridad social y parafiscales; la póliza se encuentra en trámite de actualización." → debe sugerir 3 documentos.

**Por qué importa:** el flujo "sugerir → humano confirma" ya queda construido. Cuando llegue la IA real (con API key y protección de datos), solo cambia el motor, no el flujo.

## 17 · Prueba final y qué hacer cuando falla

**Título:** El MVP está listo cuando pasa los 8 casos

**Prompt de prueba (botón Copiar):**
```
Verifica la aplicación contra estos casos con hoy = 2026-11-05 y dime, caso por caso, si el resultado coincide. Si alguno no coincide, explica por qué antes de corregir:
1. SUM-014-2025 → etapa Unilateral, fecha límite 2026-11-20, 15 días, Naranja.
2. CONS-007-2022 → Competencia perdida, Negro.
3. SUM-021-2025 → Extemporánea, Rojo, fecha máxima 2028-08-10.
4. INT-005-2025 → Bilateral, fecha límite 2026-12-20, 45 días, Amarillo.
5. PS-102-2026 → No requiere, Gris, sin fechas límite.
6. CONS-011-2025 → Liquidada bilateral, Gris, botón de oficio deshabilitado.
7. OBRA-001-2025 → Bilateral, 2027-03-15, Verde, 9 documentos en la lista, oficio con exactamente los documentos en "No".
8. Tablero → Verde 3, Amarillo 1, Naranja 1, Rojo 1, Negro 1, Gris 3; valor en riesgo $ 715.000.000.
```

**Plantilla de corrección (botón Copiar):**
```
En [pantalla/función], para el caso [contrato o dato concreto], esperaba [resultado A] y obtuve [resultado B].
La regla aplicable es [Rn de la SPEC]: "[copiar la regla]".
Corrige solo eso. No modifiques nada que ya funcione. Dime en 2 líneas qué cambiaste.
```

**Plantilla "no te pases" (botón Copiar):**
```
Agregaste [X] y no lo pedí. Elimínalo y deja la aplicación exactamente como estaba más lo que pedí en el último prompt. Recuerda las restricciones: sin backend, sin base de datos externa, sin login, sin API keys.
```

**Regla:** nunca escriban "no funciona". Si después de dos correcciones sigue fallando, retrocedan (Lovable: historial; Claude Code/Codex: "deshaz los cambios del último prompt"; claude.ai: editar el mensaje anterior) y repitan el prompt de la capa con la regla más explícita.

## 18 · Ahora con su brief

**Título:** El contenido cambia; el método es el mismo

Dos columnas.

**Izquierda — Artifact o Claude Code (cuándo cada uno):**
- Artifact: validar la idea, demostrar, compartir un link, herramienta de equipo. Sin backend, sin APIs externas, sin dominio propio. Lo de hoy cabe completo.
- Claude Code / Codex: base de datos real, usuarios, integraciones, dominio institucional. Ustedes operan el producto.
- El puente: la misma SPEC sirve para los dos.

**Derecha — Lo que sigue para cada grupo:**
1. Instalen la skill `brief-a-mvp` (descarga: `brief-a-mvp.zip`) en claude.ai o Claude Code.
2. Péguenle su brief: devuelve el recorte, la SPEC y los prompts por capas para su herramienta.
3. Construyan la capa 1 y 2 esta semana; traigan el resultado.

**Descarga:** `brief-a-mvp.zip` (si ya está en Cerebro, enlazar a x10.expert/cerebro en vez de descargar aquí).

**Cierre:** Hoy no aprendieron a pedirle cosas a una IA. Aprendieron a describir un producto tan bien que la IA no tenga que adivinar.

---

# PARTE B — Prompts para Claude Code (repositorio de Vibe Coding)

Abrir Claude Code en la carpeta del repositorio de x10.expert/vibecoding. Añadir con `/add-dir` la carpeta `Practica/presentacion/` (este archivo y `assets/`). Un prompt por vez.

## PROMPT 0 — Reconocimiento (no cambia nada)

```
Vamos a crear una nueva presentación en el sistema de presentaciones de Vibe Coding, llamada "Del brief al MVP" (sesión práctica). NO cambies nada todavía.

Explora el repositorio y respóndeme en máximo 15 líneas:
1) Cómo está definida una presentación existente (por ejemplo la de la Clase 2): ¿archivo de datos (JSON/MD/JS) o componentes? ¿Qué tipos de diapositiva existen (portada, texto, tabla, dos columnas, código, diagrama)?
2) ¿Existe ya un bloque de código con botón "Copiar"? ¿Y pestañas dentro de una diapositiva? ¿Y botones de descarga de archivos? Si existen, dime dónde; si no, dónde encajarían.
3) Cómo se navega (teclado, flechas, índice) y si hay modo presentador o notas del facilitador.
4) Dónde se guardan los archivos descargables (assets) y cómo se enlazan.
5) Cómo se registra una presentación nueva para que aparezca en la página de Vibe Coding (índice, ruta, menú).
6) Qué tendrías que crear o tocar, archivo por archivo, para añadir esta presentación sin modificar las existentes.

Lee además el guion completo en 06-Instrucciones-presentacion-Vibe-Coding-sesion-practica.md (Parte A): son las 18 diapositivas con su contenido exacto. No lo resumas ni lo cambies; es el contenido que vamos a montar.
```

**Qué debe pasar:** un mapa del sistema. Si no existe bloque de código con "Copiar", pestañas o descargas, Claude Code debe proponer crearlos como componentes reutilizables (sirven para futuras clases), no como HTML pegado en esta presentación.

## PROMPT 1 — Capa 1: la presentación con las diapositivas conceptuales (1 a 8)

```
Crea la presentación "Del brief al MVP" siguiendo el sistema existente (mismo formato de datos, mismos tipos de diapositiva, misma navegación). Regístrala en el índice de Vibe Coding con la ruta /vibecoding/del-brief-al-mvp (o la convención que use el repo) y la fecha 2026-11-05.

Monta SOLO las diapositivas 1 a 8 de la Parte A del guion, con el texto exacto que está allí:
1 Portada · 2 Dónde estamos (cuatro pasos, tres hechos y "hoy") · 3 Qué es un MVP (tabla sí/no) · 4 El patrón (diagrama de cinco cajas y las ocho etiquetas) · 5 Regla de recorte (tabla y regla de oro destacada) · 6 El caso de hoy (momento de valor, cuatro tarjetas, tres botones de descarga apuntando a los archivos de assets/) · 7 Cómo lo construimos (lista de capas, reglas de mesa, ciclo) · 8 Elige tu herramienta (tabla).

Copia los tres archivos de assets/ (Brief-Semaforo-de-Liquidaciones.pdf, SPEC-semaforo-liquidaciones.pdf, SPEC-semaforo-liquidaciones.md) a la carpeta de assets que usa el sistema y enlázalos desde la diapositiva 6 como descargas.

Las diapositivas 9 a 18 van en el siguiente prompt; por ahora deja un marcador. No modifiques las presentaciones existentes. Antes de escribir, dime en 3 líneas qué archivos vas a crear.
```

**Qué debe verse:** la presentación aparece en Vibe Coding, se navega con teclado, las 8 primeras diapositivas tienen el contenido del guion, y los tres botones de descarga de la diapositiva 6 descargan los archivos.

## PROMPT 2 — Capa 2: el componente "diapositiva de prompt"

```
Crea un tipo de diapositiva reutilizable "prompt" (o el equivalente en el sistema) con esta estructura fija, en este orden:
- Título (ej. "Prompt 2 — Motor de plazos y semáforo").
- "Qué hace": párrafo corto.
- Bloque de prompt: texto monoespaciado en un cuadro con botón "Copiar" (navigator.clipboard, con mensaje "Copiado" 2 segundos). Si el prompt tiene variantes por herramienta, el bloque muestra pestañas (Lovable / AI Studio · Claude Code / Codex · Claude (artifact)) y el botón copia la pestaña activa. La pestaña elegida se recuerda en localStorage para toda la presentación (si alguien elige Claude Code en el Prompt 1, el Prompt 5 abre en Claude Code).
- "Qué debe verse": párrafo o tabla.
- "Si falla": párrafo con el texto de corrección (opcional).
- "Por qué importa": una o dos frases destacadas al pie.
El bloque de prompt debe caber sin desplazamiento vertical en una pantalla de 1366×768 con la fuente del sistema; si el prompt es largo, el cuadro tiene su propio scroll y el botón Copiar siempre visible.

Con ese tipo, monta las diapositivas 9 a 16 de la Parte A con el texto EXACTO de los prompts (no los reescribas ni los "mejores"; cada palabra está ahí a propósito). Donde el guion indica "pestañas", crea las variantes indicadas; donde no, un solo bloque.

No modifiques las diapositivas 1 a 8. Antes de escribir, dime en 3 líneas cómo vas a representar las pestañas en el formato de datos.
```

**Qué debe verse:** las diapositivas 9-16 con la misma estructura; "Copiar" funciona y copia el texto completo (incluidos los saltos de línea); la pestaña se recuerda entre diapositivas; la tabla de la diapositiva 11 cabe en pantalla.

## PROMPT 3 — Capa 3: prueba final, cierre y descargas restantes

```
Monta las diapositivas 17 y 18 de la Parte A:
- 17: tres bloques de prompt (prueba final, plantilla de corrección, plantilla "no te pases"), cada uno con su botón Copiar, más la regla final.
- 18: dos columnas y el botón de descarga de brief-a-mvp.zip (cópialo desde Practica/skill-brief-a-mvp/brief-a-mvp.zip a assets; si el sistema prefiere enlazar a x10.expert/cerebro, deja el botón apuntando allí y dímelo).

Agrega a la presentación una diapositiva índice al inicio (después de la portada) con los 18 títulos enlazados, para que los participantes salten directo a un prompt.

Agrega las notas del facilitador donde el guion las marca (diapositivas 6 y 11) en el mecanismo de notas del sistema; si no existe, como texto pequeño al pie visible solo en modo presentador o con un toggle.

No modifiques las diapositivas anteriores.
```

## PROMPT 4 — Verificación

```
Verifica la presentación "Del brief al MVP" de punta a punta y dime, punto por punto, si se cumple:
1. Las presentaciones existentes de Vibe Coding siguen iguales.
2. Son 19 diapositivas (portada, índice, 17 de contenido); la navegación por teclado y el índice funcionan.
3. Cada botón "Copiar" copia el prompt completo con sus saltos de línea; probar en las diapositivas 9, 11 y 17.
4. Las pestañas de herramienta cambian el texto y se recuerdan entre diapositivas.
5. Los cuatro archivos descargables se descargan (3 en la diapositiva 6, 1 en la 18).
6. La diapositiva 11 muestra la tabla completa de resultados esperados sin cortar filas en 1366×768.
7. En un celular (390 px de ancho) se lee y el botón Copiar es alcanzable; nada se desplaza horizontalmente.
8. Los textos de los prompts coinciden carácter a carácter con la Parte A del guion (haz un diff).
9. No hay llamadas a servidores externos ni envío de datos.
```

## Plantilla de corrección

```
En la diapositiva [n], esperaba [A] y obtuve [B]. El guion (Parte A, diapositiva [n]) dice: "[copiar]". Corrige solo eso; no modifiques otras diapositivas ni las presentaciones existentes. Dime en 2 líneas qué cambiaste.
```

## Decisiones ya tomadas

- Los prompts se montan con el texto exacto del guion. Si hay que cambiar un prompt, se cambia primero en `02-Caso-de-uso-y-prompts…` y en este guion, y luego en la presentación; la presentación no es la fuente de verdad.
- El tipo de diapositiva "prompt" y los componentes Copiar / pestañas / descarga se crean reutilizables, para las próximas clases.
- Los assets descargables son tres PDF/MD del caso y el ZIP de la skill. No se publican los archivos de los grupos.
- La fecha de referencia 2026-11-05 está en los prompts y en las tablas de resultados; está documentado en la diapositiva 11 cómo recalcular si cambia.
