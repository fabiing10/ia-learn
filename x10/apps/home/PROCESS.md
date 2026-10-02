# Del prompt a la landing: cómo se construyó

Este documento cuenta qué hizo la IA (Claude Code) desde un solo prompt hasta la landing
publicada en `/`. Sirve como caso de uso para el taller: **prompt → herramienta → modelo → resultado**.

- **Herramienta:** Claude Code, trabajando dentro del repositorio del proyecto.
- **Modelo:** Claude Opus 5.5.
- **Resultado:** `x10/apps/index.html` + `x10/apps/home/` → `dist/index.html`.

## El prompt (tal cual)

> **Rol:** Eres un diseñador y desarrollador web senior de landing pages premium.
> **Contexto:** Dicto el taller "x10 · Multiplica tus talentos con inteligencia artificial" en la
> Convención de Hombres MCI 2026 (1 al 3 de octubre, G12 Centro de Convenciones), para 130 hombres
> de 20 a 50 años. Tesis: "La IA acelera. Tú decides." El contenido está en el brief del taller y
> la marca (dorado #E8B53A, motivo ×) en el proyecto.
> **Tarea:** Crea la landing del taller, con menos de 8 secciones interactivas: de qué se trata, la
> ruta entender → desmitificar → discernir → aplicar → crear, y llamados al test x10, al playbook y
> a la presentación.
> **Formato:** Una página en español, mobile-first, accesible, modo claro y oscuro, animaciones
> sutiles. No inventes datos: si falta algo, deja {{LLAVES}}.

El prompt ya usa la fórmula del taller, **R·C·T·F** (rol, contexto, tarea, formato).

---

## 1. Cómo interpreté el prompt

| Lo que dice el prompt | Cómo lo traduje |
|---|---|
| "menos de 8 secciones interactivas" | **6 secciones**, y cada una tiene una interacción real (no solo enlaces). El encabezado y el pie no cuentan como secciones. |
| "de qué se trata" | Tesis del taller, qué vas a poder hacer al salir y un interruptor "lo que sí puede / lo que no puede" la IA. |
| "la ruta entender → desmitificar → discernir → aplicar → crear" | Un recorrido de 5 pasos navegable: cada fase muestra qué pasa en el taller, su idea central y su ancla bíblica. |
| "llamados al test x10, al playbook y a la presentación" | Enlaces relativos a `/test/`, `/playbook/` y `/presentacion/` (mismo dominio), más enlaces directos a capítulos del playbook (`/playbook/#rctf`, `#semaforo`, etc.). |
| "No inventes datos" | Todo el texto sale del brief, de las diapositivas o del contrato del proyecto. Lo que no está queda como `{{LLAVE}}` visible. |
| "modo claro y oscuro" | Oscuro por defecto; respeta la preferencia del sistema; botón para cambiar; la elección se recuerda y se comparte con `/test` y `/playbook`. |
| "animaciones sutiles" | Un solo momento animado al cargar (el contador ×1 → ×10, 600 ms) y animaciones cortas solo como respuesta a lo que hace el visitante. |

**Decisiones y supuestos clave**

- **El test va primero.** El test se usa durante la sesión (QR en la pantalla de espera, resultados en
  vivo en la diapositiva "¿Dónde estamos?"), así que tiene botón en la barra superior, en la portada y
  sección propia.
- **No revelo lo que el taller revela en vivo.** No usé Lucas 19:16-17 en la landing: en la
  presentación ese versículo es el momento en que se revela por qué el taller se llama x10. Tampoco
  escribí la respuesta del Ejercicio 3 (la frase que no está en la Biblia): en la landing es "una
  pregunta trampa".
- **No imprimo "130 hombres de 20 a 50 años".** El brief dice "~130"; es un dato de planeación, no un
  mensaje para el asistente. La página le habla a él directamente.
- **Una sola cita bíblica por fase**, como pide el brief (máximo una por bloque), y solo las que están
  en el brief, en Reina-Valera 1960. La fase "Crear" no tiene cita porque el bloque 8 del brief no la tiene.
- **Sin promesas.** El pie aclara que "x10" es una metáfora de multiplicación, no una promesa de
  riqueza ni de resultados mágicos (regla del brief).
- **Los ocho casos del semáforo** van en el orden de `config.json → semaforoOrden`: el caso de la
  consejería queda de último, como pide el brief.

## 2. Qué leí del proyecto

- `x10-brief-presentacion.md` (todo): objetivo, tesis, tono, paleta, slides S00–S39, ejercicios,
  datos verificados y pendientes.
- `x10/apps/CONTRACT.md`: rutas, sistema de diseño compartido, niveles ×1/×2/×5/×10, anclas del
  playbook y reglas de contenido.
- `x10/src/styles/tokens.css`, `theme-dark.css`, `theme-light.css`: colores, tipografías y tiempos
  de animación de la presentación. La landing los importa tal cual.
- `x10/src/slides/b0-presesion.html`, `b1-apertura.html`, `b9-cierre.html`: textos exactos de la
  portada, la pantalla de espera ("3 minutos · anónimo" del test) y el cierre.
- `x10/apps/shared/diagnosis.js` y `apps/test/main.js`: textos de los cuatro niveles y la nota de
  privacidad del test.
- `x10/apps/playbook/index.html`: títulos de capítulos y anclas reales, para que los enlaces
  profundos funcionen.
- `x10/config.json` y `x10/vite.apps.config.js`: orden del semáforo y cómo se construye `/`.

## 3. Plan de secciones (6, menos de 8)

| # | Sección | Para qué | Interacción |
|---|---|---|---|
| 1 | **Portada** `#inicio` | Nombre, tesis, evento, expositor y los dos llamados principales | Pregunta "¿Ya usaste inteligencia artificial hoy?" con dos respuestas que revelan "Probablemente sí." (la misma frase de la pantalla de espera del taller) |
| 2 | **De qué se trata** `#taller` | Tesis "La IA multiplica; el hombre decide", formato del taller y lo que vas a poder hacer al salir | Interruptor "Lo que sí puede / Lo que no puede" (slide S12) |
| 3 | **La ruta** `#ruta` | Las cinco fases | Recorrido de 5 pasos con barra de progreso, teclado (flechas, Inicio, Fin) y botón "Siguiente" |
| 4 | **¿Qué color es?** `#semaforo` | Probar el semáforo antes del taller | Juego con los 8 casos del Ejercicio 2: eliges el color, ves cómo lo vemos en el taller y al final un resumen |
| 5 | **Test x10** `#test` | Llevar al test | Explorador de los cuatro niveles; la longitud de cada barra es el multiplicador (×1, ×2, ×5, ×10) |
| 6 | **Llévatelo** `#llevatelo` | Playbook, presentación y los tres retos | Lista de los tres retos (S38) que se pueden marcar y se recuerdan en el dispositivo; cada reto enlaza a su capítulo del playbook |

¿Por qué 6 y no 7? Cada sección responde a una parte del prompt y no hay dos que hagan lo mismo. El
semáforo es la única sección "extra": la elegí porque es el corazón de la tesis ("Tú decides") y
convierte la landing en una muestra del taller, no en un folleto.

## 4. Construcción

**Archivos**

| Archivo | Qué contiene |
|---|---|
| `x10/apps/index.html` | Todo el contenido en HTML, metadatos, tema antes del primer pintado y respaldo sin JavaScript |
| `x10/apps/home/home.css` | Estilos. Importa los tokens y los dos temas de la presentación y las fuentes locales (`@fontsource`) |
| `x10/apps/home/main.js` | Interacciones (sin librerías) |
| `x10/apps/home/PROCESS.md` | Este documento |

**Sistema visual.** Paleta de la marca (tinta `#0B0F1A`, papel `#F7F5F0`, dorado `#E8B53A`, cian
solo para los `{{LLAVES}}`), Space Grotesk para títulos e Inter para el texto. El "×" es el único
adorno: la marca, las viñetas de las listas y los niveles. Los colores del semáforo solo aparecen en
la sección del semáforo, como pide el brief. En tema claro el dorado de los textos se oscurece para
mantener el contraste.

**Técnicas de interacción**

- **Contador ×1 → ×10 solo con CSS** (`@property` + `counter()`): no parpadea si el JavaScript tarda
  y, sin animación, muestra directamente ×10.
- **Patrón de pestañas accesible (ARIA tabs)** reutilizado en tres sitios: puede/no puede, la ruta y
  los niveles. Teclado con flechas, Inicio y Fin.
- **Mejora progresiva.** El juego del semáforo lee los casos de una lista HTML. Sin JavaScript, esa
  lista se ve con su color y todas las fases de la ruta se muestran abiertas.
- **Memoria local** (`localStorage`, protegida con `try/catch`) para el tema y los retos; si el
  navegador la bloquea, la página sigue funcionando.
- **Anuncios para lectores de pantalla** (`aria-live`) cuando aparece una respuesta, y el foco pasa
  al siguiente paso lógico (por ejemplo, al botón "Siguiente caso").
- **Barra superior** que marca la sección en pantalla.
- **Sin dependencias nuevas, sin CDN y sin peticiones externas.** Las fuentes salen del proyecto.

## 5. Verificación

Todo lo siguiente se ejecutó; los números son los que salieron.

- **Build:** `cd x10 && npm run build` pasa y genera `dist/index.html` (27 KB; CSS de la landing
  25,6 KB y JS 7,1 KB sin comprimir), junto a `/test`, `/panel`, `/playbook` y `/presentacion`.
- **Producción servida en local** (`dist/` en `127.0.0.1:5178`): `/`, `/test/`, `/playbook/` y
  `/presentacion/` responden 200. Las seis anclas del playbook a las que enlaza la landing existen.
- **Playwright (Chromium headless), 7 contextos:** escritorio 1440×900 y móvil 390×844 (táctil,
  escala 2×), oscuro y claro, más uno con movimiento reducido y otro de teclado. Resultado en los 7:
  0 errores ni advertencias de consola, 0 errores de página, 0 peticiones a otros dominios,
  0 peticiones fallidas y 0 px de desbordamiento horizontal. Se repitió contra el servidor de
  desarrollo y contra `dist/` con el mismo resultado.
- **Interacciones probadas por script:** la pregunta de la portada revela "Probablemente sí."; el
  interruptor muestra "Lo que no puede"; "Siguiente" y las flechas avanzan la ruta y Fin salta a
  "Crear"; el semáforo completo da "Coincidiste en 7 de 8 casos." con una respuesta distinta a
  propósito; el nivel ×10 muestra su descripción; marcar dos retos da "2 de 3 cumplidos" y se
  mantiene al recargar; el tema cambia a claro, actualiza la etiqueta del botón y se mantiene al recargar.
- **Accesibilidad:** el primer Tab llega a "Saltar al contenido"; foco visible en todos los
  controles; áreas táctiles ≥ 44 px; contraste calculado: texto principal 17,1:1 (oscuro) y
  16,4:1 (claro), texto secundario 10,4:1 y 8,8:1, enlaces dorados en claro 6,1:1, botón dorado
  10,1:1, dorado grande en claro 3,2:1 (solo en texto grande, donde el mínimo es 3:1).
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` la duración de las animaciones
  queda en 0,001 s y el contador muestra ×10 de inmediato. Sin esa preferencia, el contador se
  muestreó durante la carga: 1, 1, 2, 5, 7, 9, 9, 10.

**Lo que no se verificó:** celulares reales, Safari y Firefox, lectores de pantalla reales
(VoiceOver/NVDA) y auditorías automáticas tipo axe o Lighthouse.

Capturas en `x10/.shots/landing/` (escritorio completo, móvil arriba + ruta + semáforo, en oscuro y
claro, más los estados de cada interacción).

## 6. Iteraciones tras revisar las capturas

1. **Las cinco fases de la ruta se veían al mismo tiempo** y en el semáforo aparecía un botón dorado
   vacío. Causa: el `display: grid` / `inline-flex` de esos componentes ganaba al atributo
   `hidden`. Arreglo: una regla global para que `hidden` siempre oculte.
2. **En móvil, la barra superior salía desplazada en dos capturas.** Antes de tocar nada lo medí:
   la barra estaba en su sitio (`top = 0`); la captura se tomaba en mitad del desplazamiento suave.
   Cambié el script de capturas, no la página.
3. **El semáforo dejaba un hueco grande a la derecha en escritorio.** La leyenda de colores pasó a
   una columna al lado del juego (desde 1024 px).
4. **En móvil la leyenda repetía lo que ya dice cada botón.** Se oculta en pantallas pequeñas cuando
   el juego está activo (sin JavaScript sigue visible).
5. **Los dos botones de la portada quedaban de anchos distintos en móvil.** Ahora ocupan el ancho
   completo por debajo de 480 px.
6. **El borde de color del juego se curvaba raro en las esquinas.** Pasó a colorear el borde completo.
7. **Demasiado espacio entre secciones en escritorio.** El espaciado máximo bajó de 128 a 112 px.
8. **La captura de la respuesta de la portada salía vacía.** Era la animación de 320 ms todavía en
   curso; añadí una espera en el script. La página estaba bien.

## 7. Resultado final y lo que queda pendiente

Una landing de 6 secciones interactivas en `/`, en español, mobile-first, con modo claro y oscuro,
que lleva al test, al playbook y a la presentación sin depender de servicios externos.

**`{{LLAVES}}` que el expositor debe completar** (se ven en cian, con borde punteado):

| Llave | Dónde | Qué falta |
|---|---|---|
| `{{DIA_Y_HORA_DEL_TALLER}}` | Portada, "Cuándo" | Día y hora del taller dentro de la convención (1 al 3 de octubre) |
| `{{SALON_DEL_TALLER}}` | Portada, "Dónde" | Salón dentro del G12 Centro de Convenciones |
| `{{CONTACTO_EXPOSITOR}}` | Pie de página | Contacto del expositor (pendiente también en el brief) |

**Pendiente del brief que afecta a esta página:** `{{CONFIRMAR_VERSION}}` (las citas usan
Reina-Valera 1960, como dice el brief).
