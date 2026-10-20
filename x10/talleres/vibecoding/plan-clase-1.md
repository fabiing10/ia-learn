# Vibe Coding — Clase 1: plan de sesión

Oct 19, 2026 · @Fabian Zapata

## Objetivos y resultado de la clase

Al salir, cada estudiante tiene la spec V1 de su proyecto, la primera versión publicada en una URL y el código en un repositorio propio. La clase 2 parte de ahí: no vuelve a explicar, acompaña.

**Al terminar, el estudiante puede:**

1. Nombrar las 5 piezas de una app (front, lógica, base de datos, dominio, repositorio) y ubicarlas en cualquier herramienta.
2. Escribir una spec de una página que pase la prueba del adivino (nada que la IA tenga que suponer).
3. Distinguir caja cerrada (Lovable, Base44) de caja abierta (Claude Code, Codex) y explicar cuándo conviene cada una.
4. Iterar con la herramienta siguiendo las reglas de mesa: un cambio por mensaje, probar, describir lo que ve.

**Entregables al salir:**

| Entregable | Dónde queda | Para qué sirve en la clase 2 |
| --- | --- | --- |
| Spec V1 (plantilla llena) | Playbook / impreso | Base para cualquier cambio que pidan |
| App publicada | URL pública de Lovable | Tres usuarios reales la prueban en la semana |
| Repositorio | GitHub, conectado en dos direcciones | Es la caja que se abre en la clase 2 |
| Lista de fallos y dudas | Formulario de salida | Define los grupos de la clase 2 |
| Playbook | Landing del curso | Ruta A (caja cerrada) y ruta B (caja abierta) para seguir solos |

**Supuestos del plan:** 150 minutos; público cero técnico; cada estudiante con portátil y cuentas creadas antes de llegar; cada uno construye su propio proyecto (hay un menú de respaldo para quien no trae idea); la construcción se hace en caja cerrada y la caja abierta se demuestra, no se practica. Si alguno de estos cambia, cambia el plan.

## Línea de tiempo (150 minutos)

La mitad de la clase es taller: 70 de los 150 minutos los pasan construyendo. Los bloques de contenido existen para que ese taller no se vuelva adivinanza.

| Hora | Bloque | Min | Qué pasa | Resultado visible |
| --- | --- | --- | --- | --- |
| 0:00 | 1. Apertura | 10 | Dos productos terminados; A/B prompt vs spec en vivo; tesis | La sala vio la diferencia antes de oír la explicación |
| 0:10 | 2. Fundamentos | 25 | Qué es vibe coding; mapa de 5 piezas; prompt vs spec | Hoja "mi app en 5 piezas" diligenciada |
| 0:35 | 3. Herramientas y A/B | 25 | Caja cerrada; caja abierta; misma spec, dos cajas; decisión para hoy | Criterios para elegir herramienta |
| 1:00 | Pausa | 5 |  |  |
| 1:05 | 4. Taller: la spec | 30 | Plantilla bloque a bloque; prueba del adivino en parejas; primer mensaje listo | Spec V1 |
| 1:35 | 5. Taller: construir | 40 | Lovable desde la spec; cinco puntos de control; reglas de mesa | App publicada y repositorio conectado |
| 2:15 | 6. Cierre | 10 | Qué se llevan; tarea; cómo funciona la clase 2; formulario de salida | Lista de fallos y dudas |
| 2:25 | Margen | 5 | Absorbe retrasos de generación |  |

Regla de tiempo: si a la 1:00 vas tarde, recorta el bloque 3 (Base44 a una mención, tabla A/B a tres criterios). Nunca recortes el bloque 4: una spec floja arruina el bloque 5.

## Antes de la clase

Sin cuentas creadas, los primeros 20 minutos se van en registros y correos de verificación. El correo previo es parte del plan, no un detalle logístico.

**Correo 7 días antes** (y recordatorio de dos líneas el día anterior):

```markdown
Asunto: Clase 1 de vibe coding — 4 cosas antes del [fecha]

Hola,

En la primera clase vamos a construir. Para no perder tiempo en registros, lleguen con esto listo:

1. Cuenta en Lovable (lovable.dev), creada con el correo que usarán en clase. Plan gratuito.
2. Cuenta en GitHub (github.com). Elijan un nombre de usuario sencillo; lo van a usar.
3. Portátil con cargador y Chrome actualizado. No sirve tablet ni celular.
4. Una frase, escrita: "Quiero una app que ___ para ___". Si no tienen idea, en clase hay un menú.

Opcional: cuenta en claude.ai. La usaremos para la segunda ruta del playbook.

No necesitan saber programar. Necesitan saber qué quieren resolver.

Fabian
```

**Checklist del estudiante** (va en la landing, marcable):

- [ ] Cuenta en Lovable activa (ya entré una vez)
- [ ] Cuenta en GitHub activa
- [ ] Portátil, cargador, Chrome
- [ ] Mi frase: "Quiero una app que \_\_\_ para \_\_\_"
- [ ] Opcional: cuenta en claude.ai

**Qué hacer con quien llega sin cuentas:** que se registre durante el bloque 1 (los primeros 10 minutos son demo, no necesitan teclado). Si a la 0:35 sigue sin Lovable, trabaja en pareja con alguien que sí tenga, y hace su propio proyecto en casa con la ruta A del playbook.

## Bloque 1 — Apertura (0:00–0:10)

La tesis se demuestra antes de enunciarse: la sala ve el resultado de un prompt perezoso al lado del resultado de una spec, y saca la conclusión sola.

| Minuto | Qué haces | Qué dices (idea central) |
| --- | --- | --- |
| 0:00 | Antes de saludar, en Lovable envías el prompt perezoso: "Hazme una app para gestionar las solicitudes de mi equipo". Lo dejas corriendo en una pestaña. | Nada todavía. |
| 0:01 | Proyectas dos productos terminados: el tablero de solicitudes hecho en Lovable (URL pública) y un proyecto tuyo hecho con Claude Code. Sin explicar cómo. | "Al final de hoy tienen el primero publicado. El segundo es a dónde lleva este camino." |
| 0:04 | Abres el resultado del prompt perezoso (o la captura de respaldo) al lado del tablero construido desde la spec de una página. | "Misma herramienta, mismo día. ¿Qué cambió?" |
| 0:06 | Señalas tres diferencias concretas: campos inventados vs campos pedidos; sin roles vs dos roles; estados decorativos vs estados que cambian de verdad. | "La herramienta no se equivocó. Adivinó, porque le tocó." |
| 0:08 | Pregunta a la sala: "¿Cuál de los dos tendrían que rehacer mañana?" | Dejas que respondan. |
| 0:09 | Tesis, una sola frase en pantalla. | "Vibe coding no es pedir una app. Es describirla tan bien que la IA no tenga que adivinar. Hoy aprenden a describir, a elegir la herramienta y a iterar." |

**Señal de que funcionó:** alguien pregunta "¿y cómo se escribe eso?". Esa pregunta es el pase al bloque 2.

**Plan B:** si Lovable está lento o caído, muestras capturas del resultado perezoso tomadas la víspera. El A/B no depende de que la generación corra en vivo; depende de que vean los dos resultados juntos.

## Bloque 2 — Fundamentos (0:10–0:35)

Tres ideas, en este orden: qué es vibe coding, de qué está hecha una app, y por qué una spec no es un prompt. Todo lo demás del curso se apoya en estas tres.

### 2.1 Qué es vibe coding y qué no (5 min)

- Definición para la clase: construir software describiendo lo que quieres, dejando que la IA escriba el código, mientras tú diriges, pruebas y decides.
- Origen en una línea: el término lo puso Andrej Karpathy en febrero de 2025. Lo que describía ya era práctica común; el nombre la hizo visible.
- Lo que cambió: escribir código dejó de ser el cuello de botella. Lo que no cambió: alguien tiene que saber qué quiere y verificar que salió.
- El fallo típico: "la app que nadie entiende". Funciona hasta que deja de funcionar, y nadie sabe por qué. Esta clase existe para que eso no les pase.
- Lo que ustedes sí entienden: no el código, el producto. Qué hace, qué guarda, quién lo usa, cómo se prueba.

### 2.2 El mapa de 5 piezas (10 min)

Toda app, de la más simple a la más grande, son cinco cosas. El mapa queda fijo en pantalla el resto de la clase; cada herramienta, demo y error se ubica en él.

| Pieza | En palabras de la clase | En una app de domicilios | Pregunta que responde |
| --- | --- | --- | --- |
| Front | Lo que la persona ve y toca | El menú, el carrito, el botón "pedir" | ¿Qué ve el usuario? |
| Lógica | Lo que pasa cuando toca algo | Calcula el total, asigna el domiciliario | ¿Qué hace la app por dentro? |
| Base de datos | Lo que la app recuerda cuando cierras la pestaña | Pedidos, direcciones, usuarios | ¿Qué guarda? |
| Dominio | La dirección donde la gente la encuentra | la-app.com | ¿Dónde vive? |
| Repositorio | El plano y el historial; lo que hace que sea tuya | Cada versión del código, con fecha y autor | ¿De quién es y cómo se deshace un cambio? |

Actividad (3 min): hoja "Mi app en 5 piezas", una línea por pieza para su idea. Dominio y repositorio los dejan en blanco: hoy los resuelve la herramienta. Prueba rápida: dos personas ubican una función de su app ("el jefe ve la lista y aprueba") en una pieza. Si dudan entre front y lógica, bien: esa duda es la que la spec resuelve.

Cierre del punto: "Ninguna de las cinco la construyen ustedes. Su trabajo es decidir qué hace cada una. Eso se escribe, y se llama spec."

### 2.3 Prompt vs spec (10 min)

- Un prompt es un mensaje. Una spec es la descripción del producto a la que todos los mensajes se refieren. El prompt perezoso de la apertura era un mensaje sin spec; por eso la herramienta adivinó.
- La spec de una página tiene siete bloques: para quién y qué problema; qué hace (3 a 5 acciones con verbo); qué guarda; quién puede hacer qué; qué NO hace; cómo sé que funciona (tres escenarios); pantallas. La plantilla completa está en Materiales.
- La prueba del adivino: antes de enviar, pregúntate qué tendría que adivinar la IA. La lista de lo que adivina es la lista de lo que falta en la spec.
- "Qué NO hace" es la herramienta de alcance. V1 = un tipo de usuario principal, tres acciones, una cosa que se guarda. Todo lo demás va a una lista llamada "después". Sin esa lista, cada estudiante intenta construir una empresa en 40 minutos.
- Los tres escenarios ("cuando X hace Y, pasa Z") son las pruebas. Al construir, se verifican uno por uno. Si no pasa el escenario, no está listo, por bonita que se vea.
- Muestras la spec del tablero de solicitudes llena: la misma que produjo el resultado bueno de la apertura. Recorres los siete bloques en dos minutos.

**Señal de que funcionó:** al pedirles un ejemplo de "qué NO hace" para su idea, responden con algo que claramente querían incluir.

## Bloque 3 — Herramientas y A/B (0:35–1:00)

Dos familias de herramientas, un criterio para elegir y una decisión tomada por ti para hoy. "Caja cerrada / caja abierta" reemplaza "no-code vs código": la cerrada entrega todo armado y esconde las piezas; la abierta muestra todo y te hace responsable.

### 3.1 Caja cerrada: Lovable y Base44 (8 min)

- Qué hace una caja cerrada: recibe la descripción, construye front, lógica y base de datos, y publica. Las cinco piezas están, pero adentro.
- Lovable sobre el mapa: genera front y lógica; la base de datos y la publicación las resuelve su propia nube; el repositorio se conecta a GitHub con sincronización en dos direcciones, disponible en todos los planes ([Lovable, exportar código](https://lovable.dev/faq/code-export/export-download-code); [detalle de planes](https://axonbuild.com/blog/lovable-export-code/)). Demo de 3 minutos: abres el tablero, muestras el historial de versiones, el botón de publicar y la conexión a GitHub.
- Base44 sobre el mapa: igual de empaquetado. Exportar a GitHub exige plan Builder o superior ([documentación de Base44](https://docs.base44.com/Integrations/Using-GitHub)), y la app exportada puede seguir dependiendo del backend alojado en Base44 ([guía de exportación](https://capgo.app/blog/transform-base44-app-to-mobile-with-capacitor/)). Una mención con captura, no demo.
- El criterio que importa: ¿se puede abrir la caja después, y a qué precio? Por eso hoy se construye en Lovable. No porque sea mejor en todo, sino porque la salida es gratis y en dos direcciones.

### 3.2 Caja abierta: Claude Code y Codex (7 min)

- Un agente de código no es un chat. Lee tus archivos, escribe código, lo ejecuta, prueba el resultado y vuelve a intentar. Agente = modelo + herramientas.
- Las cinco piezas están a la vista: tú eliges la base de datos, dónde se publica y el dominio. Más control, más decisiones, más responsabilidad.
- Demo: video grabado de 4 minutos construyendo el tablero desde la misma spec en Claude Code, cortado a los momentos clave: lee la spec, pregunta lo que no está claro, crea archivos, ejecuta, prueba un escenario, corrige un error. Grabado, no en vivo: en vivo cualquier espera de 90 segundos mata el bloque.
- El puente: la spec de una página se convierte en el archivo de instrucciones del proyecto (CLAUDE.md o AGENTS.md). Deja de ser un documento aparte y pasa a vivir con el código.

### 3.3 A/B: misma spec, dos cajas (7 min)

La tabla se lee criterio por criterio, con el tablero de cada caja en pantalla. Sin calificar cuál gana: cada fila gana una distinta.

| Criterio | Caja cerrada (Lovable) | Caja abierta (Claude Code / Codex) |
| --- | --- | --- |
| Tiempo a primera versión | Minutos, sin instalar nada | Minutos de generación, más instalación y decisiones previas |
| Control sobre las piezas | Bajo: la herramienta decide base de datos, hosting y estructura | Total: tú decides cada pieza |
| Costo | Créditos por mensaje dentro de un plan mensual | Suscripción o consumo por uso, más hosting y base de datos aparte |
| Un cambio que la caja no previó (exportar a Excel, enviar correo) | Depende de las integraciones que ofrezca | Se construye; el límite es tu spec |
| Cuando se rompe | Volver a la versión anterior; poco diagnóstico | El error se ve y se corrige; exige leerlo |
| Salida del código | GitHub en dos direcciones | Es tuyo desde el primer archivo |
| Quién lo mantiene | Tú, dentro de la herramienta | Tú o un ingeniero, con el código en la mano |

### 3.4 Decisión para hoy (3 min)

"Todos construyen en caja cerrada. ¿Por qué? Porque el objetivo de hoy es su primera versión publicada, y la caja cerrada no requiere instalar nada. La caja abierta está en la ruta B del playbook, y en la clase 2 la abrimos con el proyecto de uno de ustedes." Dicho así, nadie siente que le negaron el camino difícil: le dieron el orden correcto.

## Bloque 4 — Taller parte 1: la spec (1:05–1:35)

Treinta minutos con reloj en pantalla, bloque por bloque. Quien llega al bloque 5 con una spec que pasó la prueba del adivino construye en 40 minutos; quien llega con una idea suelta pasa esos 40 minutos discutiendo con la herramienta.

| Minuto | Paso | Instrucción a la sala |
| --- | --- | --- |
| 1:05 | Arranque | Plantilla impresa o en la landing. Quien no trae idea elige una del menú de proyectos (Materiales). Nadie empieza sin frase "quiero una app que \_\_\_ para \_\_\_". |
| 1:07 | Bloques 1 y 2 (5 min) | Para quién y qué problema, en un párrafo. Qué hace: tres acciones con verbo ("registra una solicitud", "cambia el estado", "ve la lista"). Máximo cinco. |
| 1:12 | Bloques 3 y 4 (5 min) | Qué guarda: las "cosas" y sus datos (una solicitud tiene: título, descripción, fecha, estado, quién la pidió). Quién puede hacer qué: dos roles como máximo. |
| 1:17 | Bloque 5 (3 min) | Qué NO hace. Mínimo tres cosas que quisieran y que van a "después". Aquí se recorta: si la lista de acciones pasa de cinco, lo que sobra baja a esta lista. |
| 1:20 | Bloque 6 (5 min) | Tres escenarios: "Cuando \[rol\] hace \[acción\], pasa \[resultado\]". Uno por acción principal. Son las pruebas del bloque 5. |
| 1:25 | Prueba del adivino en parejas (5 min) | Cada uno lee la spec del otro y escribe tres cosas que la IA tendría que adivinar. Se corrigen en el momento. |
| 1:30 | Primer mensaje (5 min) | Pegan la spec bajo la instrucción de cabecera (Materiales). Listo para enviar en el bloque 5. El bloque 7 (pantallas) es opcional: nadie se detiene por él. |

**Tu papel:** recorrer la sala con una sola prioridad, el alcance inflado. "Quiero Uber para veterinarias" se convierte en "registro de citas con estado" por la vía del bloque 5, no discutiendo la idea. Segunda prioridad: specs que describen pantallas en vez de acciones ("una página con un formulario bonito" no dice qué pasa al enviar).

**Trampas frecuentes y qué responder:**

- "Que sea bonita" → no es una acción; va a pantallas, y la herramienta ya la hace razonable.
- "Y que tenga IA" → va a "después", salvo que sea la acción principal. Hoy se construye la base.
- "Que mande correos" → integración; va a "después". En 40 minutos no cabe.
- Sin roles → "¿quién llena y quién decide?". Si es la misma persona, un rol basta, y lo escriben.
- Sin "qué NO hace" → la spec no está lista. Es el bloque que más se salta y el que más cuesta saltarse.

**Señal de que funcionó:** cada spec tiene al menos tres cosas en "qué NO hace" y tres escenarios con rol, acción y resultado.

## Bloque 5 — Taller parte 2: construir (1:35–2:15)

Cuarenta minutos en Lovable, guiados por cinco puntos de control. Cada punto es una prueba que el estudiante hace como usuario, no como programador; la app avanza solo cuando pasa la prueba.

| Minuto | Punto de control | Cómo se prueba | Si falla |
| --- | --- | --- | --- |
| 1:35 | Enviar el primer mensaje | Todos a la vez. Mientras genera (2 a 5 min), narras en el mapa de 5 piezas: "está creando el front; cuando pidamos guardar, creará la base de datos". | Si la generación supera 6 minutos, revisa la red del salón antes de culpar a la herramienta. |
| 1:40 | 1. Carga la primera versión | La vista previa abre y se ve algo parecido a la spec. | Copiar el mensaje de error tal cual y pedir que lo arregle. Dos intentos máximo; luego, versión anterior. |
| 1:48 | 2. La acción principal funciona | Ejecutar el escenario 1 de la spec, paso a paso. | Describir lo que se ve, no lo que se cree que falla: "al presionar Enviar no pasa nada", no "el botón está mal programado". |
| 1:55 | 3. Guarda datos | La prueba de la pestaña: cerrar la pestaña, volver a abrir, ¿sigue ahí lo que registré? | Mensaje exacto: "Los datos deben guardarse en la base de datos, no en la memoria del navegador". Es la frase que más repetirás. |
| 2:05 | 4. Publicada | Botón de publicar; copiar la URL; abrirla desde el celular. | Si la publicación tarda, seguir al punto 5 y volver. |
| 2:12 | 5. Conectada a GitHub | Configuración del proyecto, conectar GitHub, ver el repositorio creado. | Si no alcanza el tiempo, es tarea para la semana; el playbook lo explica con capturas. |

**Reglas de mesa** (en pantalla todo el bloque; también en Materiales):

1. Un cambio por mensaje.
2. Describe lo que ves, no lo que crees que falla.
3. Prueba antes de pedir lo siguiente.
4. Si se rompió, vuelve a la versión anterior antes de arreglar.
5. Nunca pegues datos reales.

**Bonus para quien va adelante** (en este orden): filtro por estado; vista separada por rol; exportar la lista a CSV; ajustar textos y nombres. Fuera de hoy: envío de correos, inicio de sesión con Google, pagos. Son integraciones que consumen el bloque entero y fallan por razones ajenas a la spec.

**Tu papel:** recorrer la sala y mantener una lectura del estado: en cada punto de control pides mano alzada ("¿quién ya pasó el 2?"). Con más de 15 estudiantes necesitas un asistente; con 25 o más, dos. Un estudiante atascado sin ayuda durante 8 minutos pierde el resto del bloque.

**Si a alguien se le acaban los créditos:** el proyecto es pequeño justamente por esto, pero puede pasar. Se sienta con el vecino, hace los puntos de control que falten en el proyecto del vecino, y termina el suyo en casa con la ruta A. No se pierde la clase, se pierde la publicación de hoy.

## Bloque 6 — Cierre (2:15–2:25)

Diez minutos para nombrar lo que se llevan, dejar la tarea y recoger los datos que arman la clase 2.

**Qué se llevan (1 min):** la frase de apertura, otra vez, ahora con su app en pantalla. Spec, URL, repositorio. "Hace dos horas y media tenían una idea. Ahora tienen un producto con dirección y plano."

**Tarea para la clase 2 (3 min):**

1. Que tres personas reales usen la app esta semana. No familiares que dicen que todo está bien: personas que la necesitarían.
2. Anotar qué falló, qué no entendieron y qué pidieron. Esa lista llega a la clase 2.
3. Traer una lista de dudas, por tontas que parezcan. Las tontas son las que todos tienen.
4. Opcional: leer la ruta B del playbook y crear cuenta en claude.ai. En la clase 2 abrimos la caja de un proyecto real.

**Cómo funciona la clase 2 (2 min):** no es otra clase magistral. Es una retro de fallos comunes, trabajo en grupos según el tipo de problema, y la apertura en vivo de la caja de uno de los proyectos. Lo que falló esta semana es el material.

**Formulario de salida (3 min, en la landing):** nombre, URL de la app, enlace del repositorio, principal duda, y hasta dónde llegaron (punto de control 1 a 5). Con eso armas los grupos antes de la clase 2, no durante.

**Última frase:** "La herramienta va a cambiar de nombre el año entrante. La spec, el mapa y las reglas de mesa, no."

## Materiales

Todo lo que el estudiante toca durante la clase. Va impreso o en la landing; nada de esto se dicta.

### Plantilla: spec de una página

```markdown
# [Nombre de la app] — Spec V1

## 1. Para quién y qué problema
[Un párrafo. Quién la usa y qué le resuelve. Ej.: "El equipo de mantenimiento recibe solicitudes por WhatsApp y las pierde. Esta app las recibe en un solo lugar y muestra en qué estado van."]

## 2. Qué hace (3 a 5 acciones, con verbo)
- [Rol] puede [acción]. Ej.: "Cualquier persona puede registrar una solicitud con título, descripción y área."
- [Rol] puede [acción]. Ej.: "El responsable puede cambiar el estado: nueva, en proceso, resuelta."
- [Rol] puede [acción]. Ej.: "Cualquier persona puede ver la lista de solicitudes y su estado."

## 3. Qué guarda
- [Cosa]: [sus datos]. Ej.: "Solicitud: título, descripción, área, fecha de creación, estado, nombre de quien la pidió."

## 4. Quién puede hacer qué (máximo dos roles)
- [Rol 1]: [qué ve y qué puede hacer]
- [Rol 2]: [qué ve y qué puede hacer]

## 5. Qué NO hace (mínimo tres cosas, van a "después")
- [Ej.: no envía correos ni notificaciones]
- [Ej.: no tiene inicio de sesión; el responsable entra por una URL aparte]
- [Ej.: no adjunta archivos]

## 6. Cómo sé que funciona (tres escenarios)
- Cuando [rol] hace [acción], pasa [resultado]. Ej.: "Cuando una persona registra una solicitud, aparece en la lista con estado Nueva y la fecha de hoy."
- Cuando ... , pasa ...
- Cuando ... , pasa ...

## 7. Pantallas (opcional, una frase cada una)
- [Pantalla]: [qué muestra]. Ej.: "Lista: todas las solicitudes, la más reciente arriba, con filtro por estado."
```

### Instrucción de cabecera para el primer mensaje

Se pega encima de la spec. Le dice a la herramienta que pregunte en vez de adivinar.

```markdown
Construye la versión 1 de esta app exactamente como está descrita abajo.
No agregues funciones que no estén en la spec. Si algo no está claro, pregúntame antes de construir.
Los datos deben guardarse en una base de datos, no en la memoria del navegador.
Cuando termines, dime cómo pruebo cada uno de los tres escenarios de la sección 6.

[pegar aquí la spec completa]
```

### Menú de proyectos (para quien no trae idea)

| Proyecto | Para quién | Tres acciones de V1 | Qué guarda |
| --- | --- | --- | --- |
| Tablero de solicitudes | Un equipo que recibe pedidos por chat (mantenimiento, RR.HH., jurídico) | Registrar solicitud; cambiar estado; ver lista con filtro | Solicitud: título, descripción, área, fecha, estado, solicitante |
| Registro a un evento con cupo | Quien organiza un evento con asistentes limitados | Inscribirse; ver cupos disponibles; ver lista de confirmados | Inscripción: nombre, correo, fecha; evento: cupo máximo |
| Directorio con búsqueda | Un gremio, un edificio, una comunidad | Agregar entrada; buscar por nombre o categoría; ver ficha | Entrada: nombre, categoría, contacto, descripción |
| Reserva de un recurso | Quien comparte una sala, un equipo o una agenda | Reservar franja; ver calendario del día; cancelar reserva | Reserva: recurso, fecha, hora inicio, hora fin, quién reserva |
| Encuesta con panel de respuestas | Quien necesita recoger opiniones y verlas juntas | Responder; ver resumen por pregunta; exportar respuestas | Respuesta: fecha, respuestas a cada pregunta |
| Seguimiento de casos | Quien lleva varios asuntos con responsable y estado | Crear caso; asignar responsable; cambiar estado y ver historial | Caso: título, responsable, estado, fecha, notas |

### Reglas de mesa

1. Un cambio por mensaje.
2. Describe lo que ves, no lo que crees que falla.
3. Prueba antes de pedir lo siguiente.
4. Si se rompió, vuelve a la versión anterior antes de arreglar.
5. Nunca pegues datos reales.

### Protocolo de error

1. Lee lo que dice la herramienta. Casi siempre dice qué pasó.
2. Copia el mensaje de error tal cual y pídele que lo arregle. Sin interpretarlo.
3. Si en dos intentos no lo arregla, vuelve a la versión anterior y pide el mismo cambio de otra forma, más pequeño.
4. Si vuelve a fallar, anótalo para la clase 2 y sigue con el siguiente punto de control.

### Qué no hacer (seguridad, una lectura de dos minutos)

- No pegar datos reales de personas, clientes ni de la empresa. Inventar nombres.
- No publicar una app con información sensible sin inicio de sesión. V1 no lo tiene; por eso V1 no lleva datos sensibles.
- No pegar contraseñas ni llaves de otros servicios en un mensaje a la herramienta.
- No conectar la app a cuentas reales (correo, pagos, bases de datos de la empresa) en esta etapa.

### Hoja "Mi app en 5 piezas" (bloque 2)

| Pieza | Mi app |
| --- | --- |
| Front: lo que la persona ve y toca |  |
| Lógica: lo que pasa cuando toca algo |  |
| Base de datos: lo que recuerda |  |
| Dominio | (hoy lo resuelve la herramienta) |
| Repositorio | (hoy lo resuelve la herramienta) |

## Preparación de Fabian

La clase depende de cinco cosas construidas antes: el tablero en las dos cajas, el resultado perezoso, el video y los impresos. Sin ellas, los bloques 1 y 3 se convierten en esperas.

**Demos y respaldos**

- [ ] Escribir la spec de una página del tablero de solicitudes (es el ejemplo que se muestra en 2.3 y la base del A/B).
- [ ] Construir el tablero en Lovable desde esa spec; publicarlo; conectarlo a GitHub. Es la demo de 3.1 y la referencia del bloque 5.
- [ ] Generar el resultado del prompt perezoso en Lovable la víspera y guardar capturas (respaldo del bloque 1).
- [ ] Construir el tablero con Claude Code desde la misma spec, grabando la sesión; cortar a 4 minutos con los momentos clave (lee, pregunta, crea, ejecuta, prueba, corrige).
- [ ] Elegir el segundo producto terminado de la apertura (uno tuyo, hecho con Claude Code) y tener su URL lista.
- [ ] Capturas de cada paso en Lovable: nuevo proyecto, publicar, conectar GitHub, historial de versiones. Son el plan B si la herramienta cambia de interfaz esa semana.

**Herramientas y cuentas**

- [ ] Verificar los límites del plan gratuito de Lovable la semana de la clase (créditos por día y por mes). Decidir si el proyecto cabe o si conviene pedir a la universidad un plan para la sesión.
- [ ] Confirmar que la sincronización con GitHub sigue disponible en el plan que usarán los estudiantes.
- [ ] Probar el flujo completo del bloque 5 en una cuenta gratuita nueva, de principio a fin, con reloj.

**Impresos y landing**

- [ ] Plantilla de spec de una página (impresa, una por estudiante, y en la landing).
- [ ] Hoja "Mi app en 5 piezas".
- [ ] Reglas de mesa y protocolo de error en una sola hoja.
- [ ] Menú de proyectos.
- [ ] Formulario de salida en la landing (nombre, URL, repositorio, duda principal, punto de control alcanzado).
- [ ] Playbook con rutas A y B publicado antes de la clase; la ruta B incluye la instalación completa que no cabe en clase.

**Logística**

- [ ] Correo previo enviado 7 días antes; recordatorio el día anterior.
- [ ] Red del salón probada con varias generaciones simultáneas. Si falla, hotspot propio para tus demos y aviso a la universidad.
- [ ] Asistente confirmado si hay más de 15 estudiantes.
- [ ] Reloj visible en pantalla para los bloques 4 y 5.
- [ ] Lista de estudiantes con sus frases "quiero una app que \_\_\_" si las enviaron antes: permite anticipar los alcances inflados.

## Riesgos y qué recortar

El plan está al límite de los 150 minutos. Lo que puede fallar es conocido; lo que importa es tener decidido de antemano qué se sacrifica.

| Riesgo | Señal | Plan B |
| --- | --- | --- |
| Estudiantes sin cuentas | A la 0:35 hay gente registrándose | Trabajan en pareja en el bloque 5; hacen su proyecto en casa con la ruta A |
| Créditos gratuitos agotados a mitad de taller | Lovable deja de responder a alguien en el punto 3 o 4 | Se une al proyecto del vecino para los puntos restantes; termina en casa |
| Red del salón saturada | Generaciones de más de 6 minutos en el 1:35 | Escalonar el envío del primer mensaje por filas; tus demos por hotspot |
| Interfaz de Lovable cambió esa semana | Los botones no están donde el playbook dice | Capturas de respaldo; narras el cambio en vivo y actualizas el playbook después |
| Alcance inflado en las specs | Specs con 8 acciones y sin "qué NO hace" | Bloque 5 de la plantilla es obligatorio; nadie construye sin tres cosas en "después" |
| Heterogeneidad del grupo | Algunos terminan el punto 5 a las 2:00; otros no pasan del 2 | Bonus ordenados para los rápidos; asistente para los lentos; nunca frenar al grupo |
| Demos en vivo que no cargan | Lovable o el video no abren | Todo demo tiene captura o grabación; nada depende de una conexión en el momento |
| Te quedas sin tiempo | A la 1:00 no has terminado el bloque 3 | Recortes en el orden de abajo |

**Orden de recortes si vas tarde:**

1. Base44 pasa a una mención de 30 segundos con captura.
2. La tabla A/B se reduce a tres filas: control, cuando se rompe, salida del código.
3. El bonus del bloque 5 desaparece.
4. El punto de control 5 (GitHub) pasa a tarea con capturas en el playbook.

Lo que no se recorta: el A/B de la apertura, el mapa de 5 piezas, el bloque 4 completo y los puntos de control 1 a 4. Son los que determinan si la clase 2 tiene con qué trabajar.

## Propuesta de formato para la clase 2

La clase 2 no explica; acompaña. Su material es lo que falló en la semana, y los grupos se arman con el formulario de salida antes de llegar, no en el salón.

| Tramo | Min | Qué pasa |
| --- | --- | --- |
| Retro de fallos comunes | 15 | Los tres o cuatro fallos que más se repitieron en los formularios, resueltos en vivo en un proyecto de un estudiante. |
| Grupos por tipo de problema | 60 | Tres mesas: "no funciona" (protocolo de error aplicado), "quiero agregar" (nueva acción: se escribe primero en la spec, luego se pide), "quiero abrir la caja" (repositorio y ruta B). Rotas entre mesas; el asistente cubre la que no estás. |
| Abrir la caja en vivo | 30 | Tomas el repositorio de un estudiante, lo abres con Claude Code, ubicas las carpetas en el mapa de 5 piezas y agregas una función pequeña que la caja cerrada no resolvió. Misma spec, segunda caja, sobre su proyecto. |
| Qué sigue | 15 | Guía de decisión: cuándo seguir en caja cerrada, cuándo pasar a caja abierta, cuándo llamar a un ingeniero. Dominio propio y costos reales de mantener una app publicada. |

La duración exacta se ajusta a lo que la universidad asigne; el orden y la proporción se mantienen.
