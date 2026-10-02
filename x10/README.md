# x10 · Multiplica tus talentos con inteligencia artificial

Presentación web para la Convención de Hombres MCI 2026 (G12 Centro de Convenciones, 1 al 3 de octubre de 2026). 60 minutos + bloque opcional de 20.

Reveal.js 5.2.1 maneja la navegación, las notas y el PDF. GSAP 3.15 (SplitText, DrawSVG, MorphSVG, Flip) anima en los eventos de Reveal. Three.js dibuja solo el fondo de partículas. Todo está empaquetado: **no necesita internet para presentar**.

---

## 0. El sitio en línea

| URL | Qué es |
|---|---|
| https://x10-presentacion.vercel.app/ | Landing del taller (construida desde un solo prompt, ver `docs/caso-landing-prompt.md`) |
| https://x10-presentacion.vercel.app/presentacion/ | Esta presentación |
| https://x10-presentacion.vercel.app/test/ | Test x10: perfil y diagnóstico (Supabase) |
| https://x10-presentacion.vercel.app/panel/ | Tablero en vivo, solo para el expositor (enlace mágico al correo) |
| https://x10-presentacion.vercel.app/playbook/ | Playbook del taller |

Cada push a `main` en GitHub se publica solo en Vercel. Supabase: proyecto `x10-presentacion` (organización Zeta Inc); la clave pública va en las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (en `.env.local` y en Vercel). La slide "¿Dónde estamos?" (después de S37) muestra los resultados agregados en vivo cuando hay internet.

## 1. Presentar sin internet

La presentación compilada queda en **`dist/presentacion/`** (un `index.html` con todo adentro + `media/` con tus archivos). Esa carpeta es la que se lleva al evento.

**Opción A, doble clic (recomendada).** Abre `dist/presentacion/index.html` con Chrome o Edge. Funciona con el wifi apagado: JS, CSS, fuentes y QR van dentro del archivo.

**Opción B, servidor local.** Si el navegador del salón bloquea la vista del presentador desde un archivo:

```bash
cd x10
npm run serve          # o: node scripts/serve.js
# abre http://localhost:8080/presentacion/
```

No necesita dependencias ni internet (Node 18+).

Antes de empezar:

1. Pantalla completa con **F**.
2. Haz **un clic** en la ventana proyectada. El navegador exige una interacción antes de reproducir audio (S03, ronda de voz).
3. Prueba **T** (tema claro) y **M** (modo ligero) en el proyector. Ambos se recuerdan al recargar.

## 2. Atajos de teclado

| Tecla | Acción |
|---|---|
| → · Espacio · PageDown · clicker | Siguiente paso o slide. Nunca entra a los respaldos |
| ← · PageUp · clicker | Anterior |
| Alt + → / ← | Salta los pasos de la slide actual |
| **S** | Vista del presentador (notas, siguiente slide, reloj) |
| **F** | Pantalla completa |
| **B** o **.** | Pantalla negra (pausa) |
| **G** | Ir a una slide: escribe el id (por ejemplo `s22`) y Enter |
| **Esc** u **O** | Vista general de todas las slides |
| **M** | Modo ligero: apaga WebGL y las animaciones pesadas |
| **T** | Tema claro / oscuro |
| **1** | Respaldo ejercicio 1 (capturas de los dos prompts) |
| **2** | Respaldo demo "talento" (video) |
| **3** | Respaldo ejercicio 3 (captura de una alucinación real) |
| **4** | Respaldo demo de idea a app (video) |
| **R** | Volver de un respaldo a donde estabas |
| **Inicio / Fin** | Primera / última slide |
| **?** | Lista de atajos en pantalla |

Con el mouse: los audios de S03 se reproducen con su botón, el botón "Copiar prompt" de S27 copia el prompt al portapapeles, los temporizadores de S14 y S28 se pausan con un clic, y en S35 un clic sobre una idea la marca como ganadora.

## 3. Vista del presentador

1. Pulsa **S** en la ventana proyectada. Se abre una ventana nueva (permite ventanas emergentes si el navegador pregunta).
2. Arrástrala a la pantalla del portátil. Muestra la slide actual, la siguiente, las notas y el reloj (clic en el reloj para reiniciarlo).
3. Puedes avanzar desde cualquiera de las dos ventanas; la otra se sincroniza. **M** y **T** pulsadas en la vista del presentador también cambian la pantalla proyectada.
4. Las vistas previas corren en modo ligero (sin WebGL) para no cargar la tarjeta gráfica.

Las notas incluyen el tiempo de cada bloque, qué hace cada clic, qué recortar si vas atrasado y los datos que hay que decir con cuidado.

## 4. Exportar a PDF (último respaldo)

1. Abre `dist/presentacion/index.html?print-pdf` (o `http://localhost:8080/presentacion/?print-pdf`) en **Chrome**.
2. Ctrl/Cmd + P → Guardar como PDF.
3. Diseño: **Horizontal**. Márgenes: **Ninguno**. Activa **Gráficos de fondo**.

Cada slide sale en su estado final (todos los pasos revelados, el semáforo completo, la línea de tiempo como lista). Los respaldos, temporizadores y botones no se imprimen. Para el PDF en tema claro, pulsa **T** antes de abrir `?print-pdf`.

## 5. Completar los datos pendientes

Todo lo que está entre `{{LLAVES}}` se ve en pantalla como un recuadro punteado azul hasta que lo completes.

**`config.json`** (después de editarlo: `npm run build`):

| Campo | Para qué |
|---|---|
| `urlPlaybook` | QR del cierre (S39) |
| `urlLanding` | QR del bloque opcional (notas en vivo) |
| `urlDemoApp` | QR de S36 a la app publicada en la demo |
| `contacto` | Contacto del expositor en S39 |
| `herramientaDemo` | Nombre de la herramienta en S35 y S41 |
| `textos.textoHumano`, `textos.textoIa` | Párrafos de la ronda 2 de S03 |
| `humanoOIa` | En qué lado (A o B) va lo hecho por IA en cada ronda |
| `media` | Rutas de imágenes, audios y videos |
| `semaforoOrden` | Orden de los casos de S22. Por defecto `[1,2,3,4,5,6,8,7]`: el 7 (consejería) va al final, como piden las notas |
| `recortes` | Ids de slides a ocultar, por ejemplo `["s08", "s16", "s19", "s32"]` |

Mientras una URL sea un placeholder, el QR muestra "QR pendiente" en lugar de un código que no lleva a ningún lado.

**Ejemplos ya incluidos para "¿Humano o IA?"** (rondas imagen y video): `img-real.jpg`, `img-ia.jpg`, `video-real.mp4`, `video-ia.mp4`, de Wikimedia Commons con licencias que permiten publicarlos. Fuentes, licencias y atribuciones en `public/media/CREDITS.md`; el crédito aparece bajo cada opción al revelar (`config.json → creditos`).

**Archivos que sigues poniendo tú** en `public/media/` (o directo en `dist/presentacion/media/` sin recompilar). La lista está en `public/media/LEEME.txt`:
`audio-real.mp3` y `audio-clon.mp3` (solo tu propia voz; no los subas al repositorio público), `captura-prompt-pobre.png`, `captura-prompt-rctf.png`, `video-demo-talento.mp4`, `captura-alucinacion.png` (solo una captura real tuya) y `video-demo-lovable.mp4` (video del proceso, respaldo de S35).

**Por verificar antes de presentar** (también están en las notas): `{{VERIFICAR_META_AI_ACTIVO}}` (S08), `{{VERIFICAR_PLANES_GRATIS}}` (S31), `{{VERIFICAR_ESTADO_PL_ANTES_DEL_EVENTO}}` (S25), `{{CONFIRMAR_VERSION}}` (citas en Reina-Valera 1960).

## 6. Si vas atrasado

En vivo: **Alt + →** salta los pasos que falten de una slide. Si sabes de antemano que el espacio es más corto, usa `recortes` y `semaforoOrden` en `config.json`:

| Prioridad | Recorte | `config.json` |
|---|---|---|
| 1 | Omitir S08 | `"recortes": ["s08"]` |
| 2 | Solo 3 mitos (S17, S18, S20) | `"recortes": ["s16", "s19"]` (el contador "Mito n de N" se ajusta solo) |
| 3 | Semáforo con 5 casos | `"semaforoOrden": [1, 4, 6, 8, 7]` |
| 4 | Omitir S32 | `"recortes": ["s32"]` |

Nunca recortar: S14, S23, S28, S37–S39.

## 7. Modo ligero, movimiento reducido y rendimiento

- **M** apaga el fondo WebGL y cambia las animaciones por fundidos de 0,2 s. El texto queda igual.
- Si el sistema operativo tiene activado "reducir movimiento", la presentación arranca en modo ligero sola y sigue ese ajuste en vivo.
- Todo el texto es legible en menos de 800 ms tras el clic, también en los cambios de bloque con cortinilla (medido: 96–100 % del texto revelado a los 800 ms).
- Medido a 1920×1080: 60 fps estables en reposo, en las cortinillas y en la línea de tiempo, también con la CPU limitada a 4×. Si un equipo va lento, el fondo baja su resolución solo; si aun así no da, pulsa **M**.

## 8. Desarrollo

```bash
cd x10
npm install
npm run dev        # http://localhost:5173 con recarga en vivo
npm run build      # genera dist/ (QR incluidos)
npm run qr         # solo regenera los QR desde config.json
```

```
x10/
  index.html               esqueleto; las slides se insertan en <!-- @slides -->
  config.json              URLs, textos, medios, orden y recortes
  scripts/build-qr.js      QR en SVG desde config.json (librería qrcode)
  scripts/serve.js         servidor estático sin dependencias para dist/
  public/media/            fotos, audios y videos del expositor
  src/
    main.js                arranque: Reveal + GSAP + Three.js
    slides/                un archivo por bloque (b0-presesion.html … bx-opcional.html)
    styles/                tokens.css, theme-dark.css, theme-light.css, base.css, components.css, print.css
    js/core/               modos, navegación, motor de animación, transiciones, HUD, configuración
    js/fx/                 fondo WebGL y cortinilla entre bloques
    js/slides/             comportamiento de cada slide (odómetro, semáforo, línea de tiempo…)
    assets/qr/             QR generados
```

Cada slide declara su bloque (`data-block`), su fondo (`data-bg`: `field`, `cross`, `ten`, `multiply`) y su comportamiento (`data-ctrl`). Los textos que entran animados usan `data-split` (chars, words, lines) o `data-in`. Los pasos con clic son fragments de Reveal; el estado visible siempre se deriva de ellos, así que ir hacia atrás o saltar con **G** muestra la slide correcta.

## 9. Guiones de demo

### Demo "talento" (S27)

Claude o ChatGPT en el navegador, sesión ya iniciada. Usa el botón **Copiar prompt** de la slide. Ensayar al menos dos veces. Respaldo: tecla **2**.

### Caso real: la landing desde un solo prompt (S35–S36)

S35 muestra el prompt exacto (también en `docs/caso-landing-prompt.md`), S35c el ciclo y S36 el resultado con QR a https://x10-presentacion.vercel.app/. La landing la construyó un agente (Claude Code, modelo Claude Opus 5.5) a partir de ese prompt; el detalle de cómo lo hizo está en `apps/home/PROCESS.md`. Botón "Copiar prompt" en S35 por si quieres correrlo en vivo.

### Demo en vivo opcional con Lovable

Antes del evento: plan con créditos suficientes (el gratis de Lovable da 5 diarios que se reinician a las 7:00 p. m. hora de Bogotá), versiones de respaldo de A, B y C publicadas, video de 60–90 s, hotspot dedicado. Si tarda más de 3 minutos: tecla **4**, sin disculparse.

**Prompt 1, idea A (negocio)**
> Crea una página web de una sola página para {{NOMBRE_NEGOCIO}}, un {{TIPO_NEGOCIO}} en {{CIUDAD}}. Incluye: encabezado con el nombre y una frase de valor, sección de servicios con 3 tarjetas, sección "¿Por qué elegirnos?", preguntas frecuentes, botón flotante de WhatsApp y pie de página con datos de contacto de ejemplo. Estilo moderno y limpio, colores {{COLORES}}, tipografía legible, optimizada para celular. Todo el texto en español.

**Prompt 1, idea B (evento)**
> Crea una página para un evento llamado {{NOMBRE_EVENTO}}. Incluye: portada con fecha y lugar, cuenta regresiva, agenda por horas, sección de invitados con fotos de ejemplo, preguntas frecuentes y botón de inscripción. Estilo elegante, fondo oscuro con acentos dorados, optimizada para celular. Todo en español.

**Prompt 1, idea C (grupo)**
> Crea una app sencilla para organizar las reuniones semanales de un grupo pequeño: calendario de próximas reuniones, tema de cada reunión, lista de quién lleva qué (anfitrión, alimentos, música) y una sección de anuncios. Usa datos de ejemplo ficticios. Diseño amigable y optimizado para celular. Todo en español.

**Prompt 2 (iteración, bloque opcional, S41)**
> Agrega un formulario de contacto con nombre, servicio de interés y mensaje. Al enviarlo, abre WhatsApp con el mensaje ya armado.

**Alternativa sin Lovable:** pedirle a Claude que genere en vivo una línea de tiempo interactiva del contexto de Mateo 25 y Lucas 19.

## 10. Checklist técnico del día

- [ ] `dist/presentacion/index.html` abre con el wifi apagado.
- [ ] Vista del presentador probada (S), notas legibles, reloj visible.
- [ ] Proyector probado en tema claro y oscuro (T). Elegir uno.
- [ ] Modo ligero probado (M) por si el equipo del salón no da.
- [ ] Audio de S03 suena por el sistema del salón (clic previo en la ventana).
- [ ] Videos de respaldo (2 y 4) cargan y se reproducen.
- [ ] QR del playbook escaneable desde la última fila (ocupa más del 25 % del alto).
- [ ] PDF exportado en una memoria USB.
