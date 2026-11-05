# Adaptación por herramienta

La usa el paso 8 de la skill. Cada bloque da: la instrucción técnica de cabecera (va al inicio del Prompt 1 y se recuerda en los demás), cómo se persiste, cómo se descarga, cómo se retrocede y qué advertir. Elegir un solo bloque.

## Lovable (caja cerrada)

- **Cabecera:** "Construye una app web React de una sola página. Sin backend, sin Supabase, sin autenticación, sin API keys. Los datos de ejemplo van en el código. Interfaz en español."
- **Persistencia (capa 6):** localStorage con try/catch; exportar/importar JSON.
- **Descargas:** funcionan con un enlace normal (Blob).
- **Retroceder:** historial de versiones de Lovable; "vuelve a la versión anterior".
- **Advertir:** si Lovable ofrece conectar Supabase o login, decir que no en el MVP.

## Claude Code o Codex (caja abierta, local)

- **Cabecera:** "Construye un único archivo `index.html` con HTML, CSS y JavaScript dentro, sin dependencias externas (o como máximo una hoja de estilos por CDN). Sin backend, sin base de datos, sin login, sin API keys. Se abre con doble clic en el navegador. Interfaz en español."
- **Carga de la SPEC:** guardar `SPEC.md` en la carpeta y pedir "Lee @SPEC.md".
- **Persistencia:** localStorage con try/catch; exportar/importar JSON.
- **Descargas:** funcionan con un enlace normal.
- **Retroceder:** "deshaz los cambios del último prompt" o git si existe.
- **Advertir:** usar el modo local ("This computer" en Codex), no el modo cloud; el resultado es un archivo en la carpeta, no una página publicada.

## Claude (artifact en claude.ai)

- **Cabecera:** "Crea un único artifact HTML de una sola página (HTML, CSS y JavaScript en el mismo archivo). Sin backend, sin APIs externas, sin login, sin claves. Datos de ejemplo en el código. Interfaz en español. Más adelante te pediré guardar datos en el almacenamiento del artifact y un botón de descarga con la capacidad de descargas."
- **Persistencia (capa 6):** "guarda los datos en el almacenamiento del artifact en modo compartido, para que no se pierdan al recargar y para que quien reciba el link vea el mismo inventario; si no está disponible, modo solo lectura con aviso". No usar localStorage.
- **Descargas:** la página no puede iniciar descargas por sí misma; pedir "un botón que use la capacidad de descargas del artifact; si no está disponible, ocúltalo".
- **Confirmaciones:** no usar `confirm()` ni `alert()`; la confirmación va dentro de la página.
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
- "No agregues funcionalidades, pantallas ni campos que no te pedí. Si falta información para hacerlo, pregúntame antes de asumir."
