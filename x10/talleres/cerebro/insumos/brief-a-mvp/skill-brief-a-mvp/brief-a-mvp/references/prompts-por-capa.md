# Plantillas de prompts por capa

Las usa el paso 8 de la skill. Rellenar los corchetes con los nombres de la SPEC (pantallas, campos, reglas, registros) y anteponer la cabecera de `herramientas.md`. Cada prompt va en un bloque de código. "Qué debe verse" y "Si falla" se incluyen cuando la experiencia es "nunca" o "algo con IA".

## Prompt 0 — Cargar la SPEC (no construye)

```
Eres mi par de desarrollo para construir un prototipo (MVP). Te doy la especificación completa.
NO construyas nada todavía. Léela y respóndeme en máximo 8 líneas:
1) Qué vas a construir, en una frase.
2) Qué NO vas a construir.
3) Qué dudas tienes sobre las reglas R1 a R[n]. Si no tienes dudas, dilo.
Restricciones para todo el proyecto: [cabecera de la herramienta]; datos ficticios; interfaz en español.

--- ESPECIFICACIÓN ---
[pegar aquí la SPEC completa]
```
Qué debe verse: un resumen correcto y, si hay dudas, preguntas precisas. Responder y avanzar.

## Prompt 1 — Capa 1: esqueleto + datos de ejemplo

```
Siguiendo la SPEC, construye SOLO la capa 1:
- [cabecera de la herramienta].
- Los 10 [registros] de ejemplo de la SPEC, en el código, con TODOS los campos del modelo de datos.
- [Pantalla 1]: una tabla con las columnas [lista de columnas básicas, sin las calculadas]. [Formato de valores: pesos, fechas].
- Título "[nombre]" y subtítulo con la fecha de hoy.
Todavía NO calcules [reglas]. No agregues otras pantallas ni funcionalidades.
Antes de escribir código, dime en 3 líneas qué vas a hacer.
```
Qué debe verse: tabla con los 10 registros, valores con formato, fechas de la SPEC.
Si falla: "Faltan los registros X y Y de la SPEC; agrégalos sin modificar lo demás."

## Prompt 2 — Capa 2: motor de reglas

```
Siguiendo la SPEC, implementa SOLO las reglas R1 a R[k]:
- Para cada [registro] calcula [resultados de las reglas: estado, fecha límite, días, color, tarifa...].
- "Hoy" es la fecha del sistema del navegador. [Si aplica]
- Agrega a la tabla las columnas: [columnas calculadas].
- Ordena la tabla según R[prioridad].
- Implementa los cálculos en una función separada y pura (recibe un registro y la fecha de hoy, devuelve los resultados).
No cambies el modelo de datos ni la estructura existente; solo agrega columnas. No agregues filtros ni otras pantallas todavía.
Antes de escribir código, muéstrame cómo quedaría el cálculo para [registro de ejemplo] con hoy = [fecha fija].
```
Qué debe verse: la tabla de resultados esperados de la SPEC (un registro por estado/color).
Si falla: plantilla de corrección con la regla copiada.

## Prompt 3 — Capa 3: ficha de detalle y lista de chequeo

```
Siguiendo la SPEC, construye [Pantalla 2]:
- Al hacer clic en una fila se abre la ficha (vista que reemplaza la tabla, con botón "Volver").
- Muestra todos los campos, [los resultados de las reglas] con el vigente resaltado.
- [Lista de chequeo / sub-elementos] editable entre [Sí / No / N/A] y el porcentaje según R[n], también como columna en la tabla.
- Campo de observaciones y botón "Marcar como validado por humano" que muestra ✓ en la tabla.
- Los cambios se reflejan de inmediato (solo en memoria por ahora).
No modifiques el motor de reglas. No agregues el tablero ni el documento todavía.
```
Qué debe verse: [registro X] → [n] elementos, [m] en No, [p] %. Cambiar uno → el porcentaje cambia.

## Prompt 4 — Capa 4: tablero

```
Siguiendo la SPEC, construye [Pantalla 3] accesible desde una pestaña "Tablero":
- Contadores por [estado/color], cada uno con su color.
- Indicadores [los de la SPEC].
- Lista "Top 5" según R[prioridad], con [columnas]; clic abre la ficha.
Reutiliza las funciones de cálculo existentes; no dupliques lógica. No modifiques las pantallas 1 y 2.
```
Qué debe verse: los contadores esperados de la SPEC.

## Prompt 5 — Capa 5: documento de salida

```
Siguiendo la SPEC (sección "Documento"), agrega en la ficha un botón "Generar [documento]":
- Genera un texto plano con: [estructura exacta de la SPEC: encabezado, destinatario, referencia, párrafos, lista numerada de [elementos en No], plazo, bloque de firma "[Nombre y cargo del funcionario responsable]"].
- Si [no aplica: sin pendientes / no requiere / ya cerrado], muestra el mensaje o deshabilita el botón con explicación.
- Cuadro de solo lectura con "Copiar al portapapeles" y "Descargar .txt" [adaptar a la herramienta].
No modifiques nada más. Muéstrame primero el texto que generarías para [registro X].
```
Qué debe verse: el documento lista exactamente los elementos en No; los casos que no aplican se comportan como dice la SPEC.

## Prompt 6 — Capa 6: persistencia, alta de registros y filtros

```
Siguiendo la SPEC, agrega:
1. [Persistencia según la herramienta], para que al recargar no se pierda nada. Si no hay nada guardado, carga los 10 de ejemplo. Botón "Restablecer datos de ejemplo" con confirmación dentro de la página.
2. "Exportar JSON" y "Importar JSON" (reemplaza tras confirmación).
3. Botón "Nuevo [registro]" con formulario de todos los campos; al guardar, [sub-elementos] se crean según R[n] y el registro aparece con sus resultados calculados.
4. Filtros por [campos] y buscador por [campos].
No modifiques el motor de reglas ni el generador de documentos.
```
Qué debe verse: crear un registro → aparece calculado; recargar → sigue ahí.

## Prompt 7 (opcional) — Lectura por palabras clave (antesala de la IA)

```
Agrega en la ficha un cuadro "Pegar texto de [documento fuente]" y un botón "Detectar [elementos] mencionados".
Busca en el texto (sin mayúsculas ni tildes) palabras clave asociadas a cada [elemento]: [lista palabra → elemento].
Muestra sugerencias "El texto menciona [elemento]; ¿marcar como Sí?" con un botón por cada una. Nunca cambies el estado automáticamente: la persona confirma uno por uno.
No modifiques nada más.
```
Variante con IA (solo si la herramienta lo permite sin API key o si hay un día o más): "usa [la capacidad de preguntar a Claude / la API] para devolver en JSON qué elementos menciona el texto; sugerir, nunca cambiar".

## Prompt de prueba final

```
Verifica la aplicación contra estos casos con hoy = [fecha fija] y dime, caso por caso, si el resultado coincide. Si alguno no coincide, explica por qué antes de corregir:
1. [registro] → [resultado esperado].
2. ...
[n]. Tablero → [contadores esperados].
```

## Plantilla de corrección

```
En [pantalla/función], para el caso [registro concreto], esperaba [resultado A] y obtuve [resultado B].
La regla aplicable es [Rn]: "[copiar la regla]".
Corrige solo eso. No modifiques nada que ya funcione. Dime en 2 líneas qué cambiaste.
```
Si después de dos correcciones sigue fallando: retroceder a la versión anterior y repetir el prompt de la capa con la regla más explícita y un ejemplo numérico.

## Plantilla "no te pases"

```
Agregaste [X] y no lo pedí. Elimínalo y deja la aplicación exactamente como estaba más lo que pedí en el último prompt. Recuerda las restricciones: [cabecera de la herramienta].
```
