# Plantilla de la SPEC de MVP

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

```markdown
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
- `campo`: tipo (texto, número, fecha AAAA-MM-DD, lista de opciones [a, b, c], sí/no)
- ...
- `observaciones`: texto
- `validado_por_humano`: sí/no (por defecto no)

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
```

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
- Sin resultado esperado en los casos → la capa 2 no se puede verificar.
