# Tabla de recorte: de lo que pide el brief a lo que se construye hoy

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

Tabla de dos columnas con las filas del brief, seguida de una línea: "Propongo este recorte; dime qué se queda y qué sale". La persona decide. Lo que sale se anota en "Qué NO construimos" de la SPEC con su sustituto.
