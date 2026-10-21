// Catalogs of the Cerebro Jurídico workshop, as plain data. Text is verbatim from
// plan-taller.md (section noted on each export); only list items were split and
// capitalised. Pure ES module: no DOM, no Vite aliases, so Node tests, the
// landing and the playbook can all import it.
//
// Shape (see CONTRACT.md):
//   ROLES            [{ id, label, sistema, buenTrabajo: [..], nuncaDelego }]
//   AREAS            [{ id, label, sistema, fuentes: [..] }]
//   TAREAS           [{ id, label, prueba, skill: { titulo, slug, descripcion, cuando?, texto } }]
//   CONFIDENCIALIDAD [{ id, label, corto, que, modelo, reglas: [..], sistema }]
//   TONOS            [{ id, label, instruccion, formato }]
//   HERRAMIENTAS     [{ id, label }]
//   RUTAS_CARGA      [{ id, herramienta, label, pasos: [..], nota? }]
//   PREGUNTA_PRUEBA  string (the contracts test, projected in the workshop)
//   ESPERADO         { con: [..], sin: [..] } what to look for in the test
//   PRIVACIDAD       [{ id, herramienta, label, entrena, apagar, sinRastro?, ojo, fuente }]
//   INSTALAR_SKILL   { pasos: [..], nota }
//   POSICIONES       [{ id, label, fila, opciones: [{ id, label, verde, amarillo, rojo }] }]
//   PERFIL_LAURA     the preloaded example profile
//
// Profile shape (what the landing stores in localStorage `cj-perfil`):
//   { nombre: string, ciudad: string, rol: id|null, areas: [id], tareas: [id] (max 3),
//     herramientas: [id], confidencialidad: id|null, tono: id|null, nuncaDelego: string,
//     posiciones: { [POSICIONES id]: option id } (only the ones set) }

// §6.5 — `sistema` is the role description inside the system block,
// `nuncaDelego` the default decision the role never delegates (no final period).
export const ROLES = [
  {
    id: 'litigante',
    label: 'Litigante independiente',
    sistema: 'abogado/a litigante con práctica propia',
    buenTrabajo: [
      'Precisión procesal (términos, recursos, oportunidad)',
      'Jurisprudencia de la corporación correcta según la jurisdicción',
      'Escritos listos para radicar (estructura del CGP o del CPACA, pretensiones claras, pruebas enumeradas)',
    ],
    nuncaDelego: 'La estrategia procesal: qué pretender, qué recurso interponer y cuándo',
  },
  {
    id: 'firma',
    label: 'Abogado/a de firma',
    sistema: 'abogado/a en una firma, con entregables para socios y clientes',
    buenTrabajo: [
      'Memorandos con estructura fija (problema jurídico, marco, análisis, conclusión, riesgos)',
      'Contratos revisados contra las posiciones de la firma',
      'Trazabilidad: cada afirmación con fuente verificada antes de llegar al socio',
    ],
    nuncaDelego: 'La posición final que se le comunica al cliente',
  },
  {
    id: 'inhouse',
    label: 'In-house',
    sistema: 'abogado/a interno de una empresa',
    buenTrabajo: [
      'Respuestas rápidas y accionables para el negocio, en lenguaje claro',
      'Riesgo primero (qué puede pasar, probabilidad, qué hacemos)',
      'Contratos revisados contra el playbook de la compañía',
    ],
    nuncaDelego: 'Aprobar o firmar un contrato, o cerrar una posición de riesgo',
  },
  {
    id: 'publico',
    label: 'Sector público',
    sistema: 'abogado/a en una entidad pública',
    buenTrabajo: [
      'CPACA y contratación estatal (Ley 80 de 1993, Ley 1150 de 2007, SECOP) como marco por defecto',
      'Peticiones y PQRS clasificadas por tipo con el término correcto',
      'Actos administrativos motivados, con competencia y procedimiento verificados',
    ],
    nuncaDelego: 'Expedir, firmar o notificar un acto administrativo',
  },
  {
    id: 'docente',
    label: 'Docente o estudiante',
    sistema: 'docente, investigador/a o estudiante de derecho',
    buenTrabajo: [
      'Rigor en fuentes (cita completa y verificable, ratio vs. obiter)',
      'Explicaciones pedagógicas con ejemplos',
      'Honestidad sobre lo no resuelto',
    ],
    nuncaDelego: 'Evaluar o calificar un argumento ajeno',
  },
  {
    id: 'legaltech',
    label: 'Emprendedor/a legaltech',
    sistema: 'fundador/a o líder de producto en una legaltech',
    buenTrabajo: [
      'Traducir reglas jurídicas a flujos (entradas, decisiones, salidas, excepciones)',
      'Cumplimiento de datos (Ley 1581) en cada flujo',
      'Lo que el producto promete, probado antes de prometerlo',
    ],
    nuncaDelego: 'Lo que el producto le promete al usuario sobre un resultado jurídico',
  },
];

// §6.6 — `sistema` is the lower-case form used in "con práctica en …" (§6.10),
// keeping acronyms (M&A, PI) in capitals.
export const AREAS = [
  {
    id: 'civil',
    label: 'Civil y comercial',
    sistema: 'civil y comercial',
    fuentes: [
      'Código Civil (Ley 57 de 1887)',
      'Código de Comercio (Decreto 410 de 1971)',
      'Código General del Proceso (Ley 1564 de 2012)',
      'Ley 2213 de 2022 (virtualidad y expediente digital)',
    ],
  },
  {
    id: 'laboral',
    label: 'Laboral y seguridad social',
    sistema: 'laboral y seguridad social',
    fuentes: [
      'Código Sustantivo del Trabajo (Decreto 2663 de 1950)',
      'Código Procesal del Trabajo y de la Seguridad Social (Decreto 2158 de 1948)',
      'Ley 100 de 1993',
      'Reforma laboral reciente: verificar número, año y vigencia antes de citarla',
    ],
  },
  {
    id: 'penal',
    label: 'Penal',
    sistema: 'penal',
    fuentes: [
      'Código Penal (Ley 599 de 2000)',
      'Código de Procedimiento Penal (Ley 906 de 2004)',
      'Código Penitenciario y Carcelario (Ley 65 de 1993)',
    ],
  },
  {
    id: 'administrativo',
    label: 'Administrativo y contratación pública',
    sistema: 'administrativo y contratación pública',
    fuentes: [
      'CPACA (Ley 1437 de 2011), reformado por la Ley 2080 de 2021',
      'Ley 80 de 1993 y Ley 1150 de 2007',
      'Decreto 1082 de 2015',
      'Ley 1755 de 2015 (derecho de petición)',
    ],
  },
  {
    id: 'constitucional',
    label: 'Constitucional y tutelas',
    sistema: 'constitucional y tutelas',
    fuentes: [
      'Constitución Política de 1991',
      'Decreto 2591 de 1991 (acción de tutela)',
      'Ley 1755 de 2015',
      'Sentencia T-323 de 2024 (uso de IA en decisiones judiciales)',
    ],
  },
  {
    id: 'tributario',
    label: 'Tributario',
    sistema: 'tributario',
    fuentes: [
      'Estatuto Tributario (Decreto 624 de 1989)',
      'Decreto 1625 de 2016',
      'Reformas tributarias recientes: verificar vigencia año a año',
    ],
  },
  {
    id: 'societario',
    label: 'Societario y M&A',
    sistema: 'societario y M&A',
    fuentes: [
      'Código de Comercio, Libro II',
      'Ley 222 de 1995',
      'Ley 1258 de 2008 (SAS)',
      'Circulares de la Superintendencia de Sociedades',
    ],
  },
  {
    id: 'pi',
    label: 'PI y tecnología',
    sistema: 'PI y tecnología',
    fuentes: [
      'Decisión Andina 486 de 2000',
      'Ley 23 de 1982 y Decisión Andina 351 de 1993',
      'Ley 1581 de 2012 y Decreto 1377 de 2013',
      'Ley 527 de 1999',
    ],
  },
  {
    id: 'familia',
    label: 'Familia',
    sistema: 'familia',
    fuentes: ['Código Civil, Libro I', 'Ley 1098 de 2006', 'Ley 2213 de 2022'],
  },
  {
    id: 'financiero',
    label: 'Financiero y regulatorio',
    sistema: 'financiero y regulatorio',
    fuentes: [
      'EOSF (Decreto 663 de 1993)',
      'Decreto 2555 de 2010',
      'Circular Básica Jurídica de la Superintendencia Financiera',
    ],
  },
  {
    id: 'datos',
    label: 'Datos y cumplimiento',
    sistema: 'datos y cumplimiento',
    fuentes: [
      'Ley 1581 de 2012 y Decreto 1377 de 2013',
      'Ley 1266 de 2008',
      'Guías y circulares de la SIC (Delegatura de Protección de Datos)',
    ],
  },
];

// §6.13 — the workshop test: a task, not a trivia question. The answer depends on
// the lawyer's own positions (02_PLAYBOOK), which no search engine can find.
export const PREGUNTA_PRUEBA =
  'Represento a EL CONTRATISTA. Revisa esta cláusula del contrato que nos enviaron para firmar: "EL CONTRATISTA responderá de manera ilimitada por todos los daños, directos o indirectos, que se deriven de la ejecución del contrato, y mantendrá indemne a LA CONTRATANTE frente a cualquier reclamación, sin límite de cuantía." ¿La acepto?';

// §6.3 tasks mapped one-to-one to the §6.7 skills. `skill.texto` is the skill body
// verbatim (hard line wraps kept) after its optional "Cuándo:" line, which lives
// in `skill.cuando`. `slug` and `descripcion` make it an installable skill
// (skills.js); `prueba` is the test prompt the landing offers for that task. The peticiones skill carries the coordinator's fact-check of
// 20 Oct 2026 (art. 14 and 21 CPACA, art. 5 Decreto 491), which supersedes the plan.
export const TAREAS = [
  {
    id: 'contratos',
    label: 'Contratos',
    prueba: PREGUNTA_PRUEBA,
    skill: {
      titulo: 'Revisión de contratos con semáforo',
      slug: 'revision-de-contratos',
      descripcion: 'Revisa contratos o cláusulas con mi semáforo de posiciones (verde, amarillo, rojo), propone redacción para lo rojo y se detiene en YO DECIDO. Úsala al revisar o negociar.',
      cuando: 'cualquier contrato que deba revisar o negociar.',
      texto: `1. YO entrego: el contrato anonimizado (CLIENTE-01 / CONTRAPARTE-01, sin NIT ni cédulas),
   a quién represento y el objetivo de la negociación en una línea.
2. IA hace: lista todas las cláusulas y clasifica cada una como [VERDE] estándar,
   [AMARILLO] negociar o [ROJO] inaceptable, según mis posiciones de abajo. Para cada
   [ROJO] propone redacción alternativa y explica el riesgo en dos líneas.
3. YO DECIDO: qué cedo, qué negocio y qué es innegociable.
4. VERIFICO: leí completas las cláusulas [VERDE] (la IA no las lee por mí) y comprobé
   las normas imperativas que no admiten pacto en contrario (consumidor, laboral, datos).

Mis posiciones (edita esta tabla; es el corazón de la skill). Si una cláusula encaja en
dos filas, usa la más específica y di cuál aplicaste:

| Cláusula | VERDE | AMARILLO | ROJO |
|---|---|---|---|
| Limitación de responsabilidad | Tope igual al valor del contrato, recíproco | Tope inferior o no recíproco | Sin tope para mi cliente o exclusión total para la contraparte |
| Indemnidad | Recíproca y limitada a reclamos de terceros | Unilateral pero acotada | Unilateral e ilimitada |
| Terminación | Preaviso de 30 días y causales objetivas | Preaviso menor o causales abiertas | Unilateral sin preaviso solo para la contraparte |
| Confidencialidad | Recíproca, 2 a 5 años, excepciones estándar | Plazo indefinido | Unilateral |
| Propiedad intelectual | Cada parte conserva lo preexistente; entregables se ceden contra pago | Cesión sin licencia de retorno | Cesión total de lo preexistente |
| Datos personales | Roles definidos (responsable / encargado) conforme a la Ley 1581 de 2012 | Sin rol definido | Transferencia sin autorización ni contrato de transmisión |
| Ley y jurisdicción | Ley colombiana; jueces o arbitraje en mi ciudad | Arbitraje en otra ciudad | Ley y foro extranjeros sin justificación |
| Cláusula penal | Proporcional y reducible | Alta pero acotada | Acumulable con perjuicios sin límite |`,
    },
  },
  {
    id: 'jurisprudencia',
    label: 'Jurisprudencia',
    prueba: 'Aplica mi skill de jurisprudencia: ¿qué ha dicho la Corte Constitucional sobre el derecho de petición ante particulares desde 2015? Quiero la tabla.',
    skill: {
      titulo: 'Investigación de jurisprudencia',
      slug: 'investigacion-de-jurisprudencia',
      descripcion: 'Busca jurisprudencia colombiana en las relatorías oficiales y la entrega en una tabla con enlace por fila; distingue ratio de obiter. Úsala al investigar una línea.',
      texto: `Regla de oro: la IA busca y enlaza; la fuente oficial confirma. Una fila sin enlace oficial no existe.
1. YO entrego: el problema jurídico en una frase, la jurisdicción (Corte Constitucional,
   Corte Suprema y su sala, Consejo de Estado y su sección, tribunales) y el periodo.
2. IA hace: si puede buscar en internet, busca en las relatorías oficiales y entrega una
   tabla: corporación, sentencia, radicado, fecha, M.P., tesis en una línea y enlace
   oficial. Si no puede buscar, no llena filas de memoria: entrega las líneas
   jurisprudenciales probables, los descriptores de búsqueda y la tabla vacía.
3. YO: abro cada enlace y confirmo que la sentencia existe y dice lo que la tabla dice.
4. IA hace: con lo que confirmé, distingue ratio decidendi de obiter dicta y marca
   contradicciones entre sentencias.
5. VERIFICO: cada fila de la tabla tiene un enlace oficial que yo abrí. Una fila sin
   enlace no existe.

Prompt de arranque: "Busca en las relatorías oficiales la jurisprudencia sobre este
problema y dame la tabla con un enlace oficial por fila. Si no puedes buscar, no cites:
dame los descriptores y la tabla vacía. Problema: ..."`,
    },
  },
  {
    id: 'demandas',
    label: 'Demandas y contestaciones',
    prueba: 'CLIENTE-01 vendió mercancía a CONTRAPARTE-01 y tiene tres facturas vencidas sin pagar por $40 millones. Tengo las facturas y los correos de cobro. Prepárame el borrador de la demanda.',
    skill: {
      titulo: 'Borrador de demanda o contestación',
      slug: 'borrador-de-demanda',
      descripcion: 'Arma el esqueleto de una demanda o contestación según la norma procesal, con [PENDIENTE] donde falten datos, y se detiene antes de la estrategia. Úsala al preparar un escrito.',
      texto: `1. YO entrego: hechos en viñetas (anonimizados), pretensión principal, jurisdicción y
   tipo de proceso, pruebas con las que cuento.
2. IA hace: arma el esqueleto según la norma procesal aplicable (art. 82 del CGP para
   demandas civiles; CPACA para lo contencioso): juez, partes, hechos numerados,
   pretensiones, fundamentos de derecho (solo normas de 03_FUENTES.md), pruebas, anexos,
   notificaciones. Deja [PENDIENTE] donde falte un dato.
3. YO DECIDO: la estrategia (pretensiones subsidiarias, excepciones, medidas cautelares).
4. VERIFICO: competencia y cuantía, caducidad o prescripción, requisitos formales, y cada
   norma citada abierta en la fuente.`,
    },
  },
  {
    id: 'peticiones',
    label: 'Peticiones y PQRS',
    prueba: 'Recibí esta petición el 1 de octubre de 2026: "Solicito copia del contrato de prestación de servicios que la entidad firmó con CONTRATISTA-01." Prepárame la respuesta.',
    skill: {
      titulo: 'Derechos de petición y PQRS',
      slug: 'derechos-de-peticion',
      descripcion: 'Clasifica un derecho de petición o PQRS, identifica el término aplicable, revisa la competencia y propone una respuesta de fondo; se detiene en YO DECIDO.',
      texto: `1. YO entrego: el texto de la petición (anonimizado) y la fecha de radicación.
2. IA hace: clasifica el tipo (información, documentos, consulta, queja, reclamo,
   sugerencia); identifica el término aplicable según 03_FUENTES.md (art. 14 del CPACA,
   sustituido por el art. 1 de la Ley 1755 de 2015); verifica competencia y, si no soy
   competente, redacta la remisión y el aviso al peticionario (art. 21: dentro de los
   5 días siguientes si es escrita, de inmediato si es verbal); propone un borrador de
   respuesta de fondo, clara, congruente y completa.
3. YO DECIDO: la posición de fondo y si existe reserva legal que justifique negar algo.
4. VERIFICO: el término con calendario de días hábiles y festivos; que la respuesta
   resuelva todo lo pedido; firma y notificación por el canal correcto.

Trampa conocida: muchas IA responden con los términos ampliados del art. 5 del Decreto
491 de 2020 (30, 20 y 35 días), derogado por la Ley 2207 de 2022. Si la IA los cita,
está desactualizada.`,
    },
  },
  {
    id: 'expedientes',
    label: 'Expedientes',
    prueba: 'Arma la ficha del expediente con estas actuaciones: [pega aquí dos o tres actuaciones de un caso tuyo, con fechas y con códigos en lugar de nombres].',
    skill: {
      titulo: 'Ficha de expediente',
      slug: 'ficha-de-expediente',
      descripcion: 'Arma la ficha de un expediente anonimizado: partes por códigos, actuaciones, términos que corren, pruebas y riesgos, cada dato con su folio. Úsala al revisar un expediente.',
      texto: `1. YO entrego: las piezas del expediente (PDF o texto), anonimizadas y en orden
   cronológico.
2. IA hace: una ficha con partes (por códigos), radicado, despacho, etapa procesal,
   línea de tiempo de actuaciones, última actuación, términos que corren, pruebas
   practicadas y pendientes, riesgos. Cada dato con el folio o la página de donde salió.
3. YO DECIDO: la próxima actuación.
4. VERIFICO: fechas y folios contra el expediente; que ningún término venza antes de la
   próxima revisión.`,
    },
  },
  {
    id: 'terminos',
    label: 'Términos',
    prueba: 'En un proceso verbal (CGP) me notificaron por estado el lunes 19 de octubre de 2026 un auto que corre traslado por 10 días. ¿Cuándo vence?',
    skill: {
      titulo: 'Cálculo y vigilancia de términos',
      slug: 'calculo-de-terminos',
      descripcion: 'Calcula un término procesal explicando el conteo día por día y deja una fila para el calendario; pide confirmar festivos y vacancia judicial. Úsala al contar un término.',
      texto: `1. YO entrego: la actuación, la fecha de notificación o del estado, el tipo de proceso y
   la norma que fija el término (desde 03_FUENTES.md).
2. IA hace: calcula el vencimiento explicando el conteo día por día, indica desde cuándo
   corre (ejecutoria, notificación, estado) y produce una fila lista para mi calendario.
3. YO DECIDO: nada aquí; es un cálculo. Pero lo firmo yo.
4. VERIFICO: días hábiles con el calendario oficial de festivos del año (la IA no lo
   conoce con certeza), horario judicial y vacancia judicial. Un término mal contado no
   tiene segunda oportunidad.`,
    },
  },
  {
    id: 'duediligence',
    label: 'Due diligence',
    prueba: 'Vamos a revisar una SAS para una compra de acciones. Dame el checklist por bloques y la matriz de hallazgos vacía.',
    skill: {
      titulo: 'Due diligence por bloques',
      slug: 'due-diligence',
      descripcion: 'Organiza una due diligence por bloques y produce la matriz de hallazgos con documento, página y severidad. Úsala al revisar un data room.',
      texto: `1. YO entrego: el tipo de operación, la lista de documentos del data room (anonimizada)
   y el nivel de materialidad.
2. IA hace: checklist por bloque (societario, contratos relevantes, laboral, tributario,
   litigios, propiedad intelectual, datos personales, ambiental si aplica); lee cada
   documento que le pase y produce una matriz de hallazgos: hallazgo, documento y página,
   severidad (alta / media / baja), recomendación.
3. YO DECIDO: la materialidad final y qué va al informe.
4. VERIFICO: cada hallazgo alto contra el documento original; consultas en RUES,
   Supersociedades y Rama Judicial hechas por mí o por un conector verificado.`,
    },
  },
  {
    id: 'conceptos',
    label: 'Conceptos',
    prueba: 'Un cliente pregunta si puede terminar antes de tiempo un contrato de arrendamiento de local comercial. Hazme el concepto.',
    skill: {
      titulo: 'Concepto jurídico',
      slug: 'concepto-juridico',
      descripcion: 'Redacta un concepto jurídico con estructura fija: problema, marco, análisis, conclusión, riesgos y lo que falta confirmar. Úsala cuando un cliente pide un concepto.',
      texto: `1. YO entrego: la pregunta del cliente, los hechos relevantes y las normas que ya
   identifiqué.
2. IA hace: estructura fija: (1) problema jurídico, (2) marco normativo solo con
   03_FUENTES.md, (3) análisis con supuestos explícitos, (4) conclusión, (5) riesgos y
   escenarios, (6) lo que no sabe o necesito confirmar.
3. YO DECIDO: la conclusión y el nivel de certeza que comunico.
4. VERIFICO: cada norma y sentencia abierta en la fuente; que los supuestos sean ciertos.`,
    },
  },
  {
    id: 'clientes',
    label: 'Comunicación con clientes',
    prueba: 'Explícale a CLIENTE-01, gerente de una pyme, que el juzgado negó la medida cautelar que pedimos y qué sigue.',
    skill: {
      titulo: 'Explicarle al cliente',
      slug: 'explicar-al-cliente',
      descripcion: 'Traduce una decisión o un documento técnico para el cliente: correo de seis líneas y explicación en lenguaje claro, sin prometer resultados. Úsala al comunicar algo.',
      texto: `1. YO entrego: la decisión o el documento técnico y quién es el cliente (empresario,
   persona natural, área interna).
2. IA hace: dos versiones: un correo de seis líneas y una explicación extendida en
   lenguaje claro, sin prometer resultados, plazos ni la reacción de terceros, con los
   próximos pasos y lo que necesito del cliente.
3. YO DECIDO: qué nivel de riesgo comunico y en qué términos.
4. VERIFICO: que ninguna frase prometa un resultado ni revele información de otro cliente.`,
    },
  },
  {
    id: 'contenido',
    label: 'Contenido jurídico',
    prueba: 'Convierte esta providencia en un hilo para LinkedIn: [pega aquí el texto completo de una providencia].',
    skill: {
      titulo: 'De la providencia al contenido',
      slug: 'providencia-a-contenido',
      descripcion: 'Convierte una providencia o norma completa en una ficha y tres formatos de contenido, con la cita completa y el aviso de que no es asesoría. Úsala al publicar.',
      texto: `1. YO entrego: la providencia o norma completa (nunca el resumen de otra persona) y el
   formato de salida (hilo, guion de video, artículo).
2. IA hace: ficha de la providencia (corporación, número, fecha, M.P., radicado, tesis en
   dos líneas) y luego tres formatos de contenido, con la cita completa al inicio y un
   cierre de "esto no es asesoría".
3. YO DECIDO: el ángulo y qué publico.
4. VERIFICO: la cita en la relatoría oficial; que la tesis sea ratio y no un salvamento
   de voto; que no haya datos personales de las partes.`,
    },
  },
];

export const MAX_TAREAS = 3;

// The lawyer's own thresholds for the contracts skill. Each option rewrites one row
// of the positions table (VERDE | AMARILLO | ROJO); the first option of each is the
// row the plan ships. The dry runs of 20 Oct 2026 showed the brain only changes the
// AI's verdict when a row differs from general practice, so this is where the
// lawyer's criterion gets written in thirty seconds.
export const POSICIONES = [
  {
    id: 'responsabilidad',
    label: 'Tope de responsabilidad que acepto para mi cliente',
    fila: 'Limitación de responsabilidad',
    opciones: [
      { id: 'contrato', label: 'Igual al valor del contrato', verde: 'Tope igual al valor del contrato, recíproco', amarillo: 'Tope inferior o no recíproco', rojo: 'Sin tope para mi cliente o exclusión total para la contraparte' },
      { id: 'doble', label: 'Hasta el doble del contrato', verde: 'Tope hasta el doble del valor del contrato, recíproco', amarillo: 'Tope superior al doble, o no recíproco', rojo: 'Sin tope para mi cliente o exclusión total para la contraparte' },
      { id: 'directo', label: 'Igual al contrato y solo daño directo', verde: 'Tope igual al valor del contrato, recíproco, limitado al daño directo y previsible', amarillo: 'Tope igual al contrato que incluye lucro cesante o daño indirecto', rojo: 'Sin tope, o tope superior al contrato con daños indirectos' },
    ],
  },
  {
    id: 'confidencialidad',
    label: 'Plazo de confidencialidad que acepto',
    fila: 'Confidencialidad',
    opciones: [
      { id: 'cinco', label: 'Hasta 5 años', verde: 'Recíproca, 2 a 5 años, excepciones estándar', amarillo: 'Plazo indefinido', rojo: 'Unilateral' },
      { id: 'dos', label: 'Hasta 2 años', verde: 'Recíproca, hasta 2 años, excepciones estándar', amarillo: 'Recíproca, de 3 a 5 años', rojo: 'Unilateral o indefinida' },
      { id: 'indefinido', label: 'Indefinido si es recíproca', verde: 'Recíproca, cualquier plazo, con excepciones estándar', amarillo: 'Recíproca sin excepciones estándar', rojo: 'Unilateral' },
    ],
  },
  {
    id: 'datos',
    label: 'Datos personales de terceros',
    fila: 'Datos personales',
    opciones: [
      { id: 'roles', label: 'Basta con roles definidos', verde: 'Roles definidos (responsable / encargado) conforme a la Ley 1581 de 2012', amarillo: 'Sin rol definido', rojo: 'Transferencia sin autorización ni contrato de transmisión' },
      { id: 'transmision', label: 'Exijo contrato de transmisión firmado', verde: 'Roles definidos (responsable / encargado) y contrato de transmisión firmado', amarillo: 'Roles definidos, sin contrato de transmisión', rojo: 'Acceso a datos personales de terceros sin roles definidos ni contrato de transmisión' },
    ],
  },
  {
    id: 'penal',
    label: 'Cláusula penal que acepto',
    fila: 'Cláusula penal',
    opciones: [
      { id: 'proporcional', label: 'Proporcional y reducible', verde: 'Proporcional y reducible', amarillo: 'Alta pero acotada', rojo: 'Acumulable con perjuicios sin límite' },
      { id: 'diez', label: 'Hasta 10 %, no acumulable', verde: 'Hasta el 10 % del valor del contrato, no acumulable con perjuicios', amarillo: 'Entre el 10 % y el 20 %, o acumulable con tope', rojo: 'Más del 20 %, o acumulable con perjuicios sin límite' },
      { id: 'veinte', label: 'Hasta 20 %, no acumulable', verde: 'Hasta el 20 % del valor del contrato, no acumulable con perjuicios', amarillo: 'Más del 20 % pero acotada', rojo: 'Acumulable con perjuicios sin límite' },
    ],
  },
];

// §6.8 (reglas, sistema) and §3.11 (que, modelo). `sistema` is rule 4 of the system block.
export const CONFIDENCIALIDAD = [
  {
    id: 'publica',
    label: 'Pública o propia',
    corto: 'Pública o propia',
    que: 'Normas, sentencias, tus plantillas, tus escritos sin datos de terceros',
    modelo: 'Cualquiera',
    reglas: [
      'Lo que proceso es público o de mi autoría. Aun así, no subo datos personales que no sean necesarios',
    ],
    sistema:
      'Puedes trabajar con los documentos que te comparto. Si detectas datos personales innecesarios, avísame antes de usarlos.',
  },
  {
    id: 'reservada',
    label: 'Reservada (datos de terceros)',
    corto: 'Reservada',
    que: 'Expedientes con partes identificables, contratos con NIT',
    modelo: 'Nube con anonimización (CLIENTE-01, CONTRAPARTE-01) y plan que no entrene con tus datos',
    reglas: [
      'Anonimizo antes de subir (nombres, cédulas, NIT, direcciones, correos, radicados con nombres); uso códigos (CLIENTE-01, CONTRAPARTE-01, TESTIGO-A)',
      'No subo documentos completos a cuentas gratuitas; reviso que la cuenta no entrene con mis datos',
      'Los expedientes con reserva legal (penal en investigación, familia, menores) no entran a ninguna IA en la nube',
    ],
    sistema:
      'Asume que todo lo que te paso viene anonimizado con códigos (CLIENTE-01, CONTRAPARTE-01). Si ves nombres, cédulas o NIT reales, detente y pídeme que los reemplace antes de continuar, y no repitas esos datos en tu respuesta.',
  },
  {
    id: 'sensible',
    label: 'Altamente sensible (secreto profesional)',
    corto: 'Altamente sensible',
    que: 'Estrategia del cliente, penal en investigación, familia, menores',
    modelo: 'Modelo local, o plan empresarial con contrato de no retención',
    reglas: [
      'Nada bajo secreto profesional entra a una IA en la nube con cuenta personal',
      'Opciones válidas: modelo local, o plan empresarial con contrato de no retención firmado por la firma o entidad',
      'El cerebro se usa igual: cambia el modelo, no el método',
    ],
    sistema:
      'Trabajas en un entorno restringido. Nunca me pidas datos de identificación de personas; si los necesitas para razonar, usa marcadores genéricos. Si una tarea exige datos que no puedo darte, dime cómo haría el análisis yo mismo. Si ves datos personales o sensibles reales, detente, no los repitas y pídeme marcadores.',
  },
];

// §6.9 — rule 5 of the system block: "Tono: {instruccion} Formato: {formato}".
export const TONOS = [
  {
    id: 'formal',
    label: 'Formal y técnico',
    instruccion: 'Formal y técnico, con terminología jurídica precisa, sin adornos',
    formato: 'Párrafos numerados; referencias cortas en el texto y las citas completas en un bloque propio al final del desarrollo, justo antes de la sección «Verificación pendiente»',
  },
  {
    id: 'didactico',
    label: 'Claro y didáctico',
    instruccion: 'Claro y didáctico; explica cada término técnico la primera vez que aparece',
    formato: 'Resumen en exactamente tres líneas numeradas (1, 2, 3) al inicio y luego el desarrollo con subtítulos',
  },
  {
    id: 'ejecutivo',
    label: 'Directo y ejecutivo',
    instruccion: 'Directo y ejecutivo: conclusión primero, sustento después',
    formato: 'Primero la conclusión en una sola línea; inmediatamente después, máximo cinco viñetas de sustento; solo después tablas, borradores y detalles; riesgos al final',
  },
];

// §6.3 — "ninguna" is exclusive with the others.
export const HERRAMIENTAS = [
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'ninguna', label: 'Ninguna' },
];

// §6.12, updated with the coordinator's tool check of 20 Oct 2026. `herramienta`
// links a route to the HERRAMIENTAS id it serves; `nota` is an optional caveat.
export const RUTAS_CARGA = [
  {
    id: 'claude',
    herramienta: 'claude',
    label: 'Claude (Proyectos)',
    pasos: [
      'Proyectos → «+ Nuevo proyecto» → nombre «Cerebro jurídico».',
      '«Establecer instrucciones del proyecto»: pegar el bloque de instrucciones de sistema.',
      'Base de conocimiento, botón «+»: subir los cinco `.md` (o pegar su contenido como texto).',
      'Cada chat dentro del proyecto arranca con el cerebro cargado.',
    ],
    nota: 'Funciona en el plan gratuito, con un máximo de 5 proyectos.',
  },
  {
    id: 'chatgpt',
    herramienta: 'chatgpt',
    label: 'ChatGPT (Proyectos)',
    pasos: [
      'Proyectos → Nuevo proyecto → «Cerebro jurídico».',
      'Instrucciones: menú ••• del proyecto → «Project settings»; pegar el bloque de sistema.',
      'Archivos: subir los cinco `.md`. El plan gratuito admite hasta 5 archivos por proyecto: caben.',
    ],
    nota: 'Las cuentas personales ya no pueden crear GPT personalizados, y todos los GPT personalizados se retiran el 11 de diciembre de 2026 (pasan a plugins); el proyecto es la ruta.',
  },
  {
    id: 'gemini',
    herramienta: 'gemini',
    label: 'Gemini (Gems; skills desde noviembre)',
    pasos: [
      'Gems → Nueva Gem → «Cerebro jurídico».',
      'Instrucciones: pegar el bloque de sistema.',
      'Conocimiento → Agregar archivos: subir los cinco `.md`.',
    ],
    nota: 'Desde noviembre de 2026 Google retira las Gems de las cuentas personales y las convierte automáticamente en skills (para mayores de 18 años). Tu Gem pasa sola; el bloque de sistema y los archivos siguen sirviendo.',
  },
  {
    id: 'copilot',
    herramienta: 'copilot',
    label: 'Copilot (Microsoft 365)',
    pasos: [
      'Guardar los archivos en una carpeta de SharePoint u OneDrive.',
      'Referenciarlos en la conversación; usar el bloque de sistema como primer mensaje.',
    ],
  },
  {
    id: 'local',
    herramienta: null,
    label: 'Modelo local (LM Studio u Ollama)',
    pasos: [
      'Instalar y descargar un modelo abierto con buen español (7 a 14 mil millones de parámetros corre en un portátil reciente).',
      'System prompt = bloque de sistema; primer mensaje = los archivos.',
      'Más lento y menos preciso que la nube; nada sale del equipo. El protocolo de verificación aplica igual.',
    ],
  },
];

// When the Claude, ChatGPT and Gemini routes were last checked against the live apps.
export const RUTAS_VERIFICADAS = 'Rutas de Claude, ChatGPT y Gemini verificadas el 20 de octubre de 2026; los menús y lo que incluye cada plan cambian.';

// §4.4 — first paragraph of the universal load path.
export const INTRO_CARGA =
  'Este es mi cerebro jurídico. Léelo completo. Antes de responder cualquier cosa, confírmame en tres líneas: quién soy, cuáles son mis líneas rojas y cómo vas a verificar tus respuestas. Luego espera mi primera pregunta.';

// §6.13 — what to look for when the test runs with and without the brain. The
// difference is procedural (criterion, stop points, links), so it does not depend
// on the model getting the law wrong.
export const ESPERADO = {
  con: [
    'Sigue los pasos de tu skill, en orden.',
    'Aplica tus posiciones y tu formato, no la práctica general.',
    'Pide lo que falta en vez de inventarlo ([PENDIENTE]).',
    'Se detiene en YO DECIDO y te devuelve la decisión.',
    'Cada cita lleva su enlace oficial y cierra con «Verificación pendiente».',
  ],
  sin: [
    'Responde con la práctica promedio, no con la tuya.',
    'Decide por ti o se queda en «depende».',
    'Cita sin enlace o no dice qué verificar.',
  ],
};

// What each account does with what you upload. Official privacy pages, checked on
// 20 Oct 2026 (labels are the English UI ones; the Spanish UI translates them).
export const PRIVACIDAD = [
  {
    id: 'claude',
    herramienta: 'claude',
    label: 'Claude · Free, Pro y Max',
    entrena: 'Sí, salvo que lo apagues.',
    apagar: 'Configuración → Privacidad → «Help improve our AI models»: desactívalo.',
    sinRastro: 'Chat incógnito (ícono de fantasma al abrir un chat nuevo fuera de un proyecto): nunca se usa para entrenar.',
    ojo: 'El pulgar arriba o abajo envía la conversación completa y Anthropic la guarda hasta 5 años, aunque hayas apagado el entrenamiento.',
    fuente: 'https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training',
  },
  {
    id: 'chatgpt',
    herramienta: 'chatgpt',
    label: 'ChatGPT · Free, Go, Plus y Pro',
    entrena: 'Sí, por defecto.',
    apagar: 'Configuración → Controles de datos → «Improve the model for everyone»: desactívalo.',
    sinRastro: 'Chat temporal (Nuevo chat → Temporal): no se usa para entrenar y se borra en 30 días.',
    ojo: 'El pulgar arriba o abajo permite que OpenAI entrene con esa conversación, aunque hayas apagado la opción.',
    fuente: 'https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance',
  },
  {
    id: 'gemini',
    herramienta: 'gemini',
    label: 'Gemini · cuenta personal',
    entrena: 'Sí, mientras «Keep Activity» esté activado; viene activado para mayores de 18 años.',
    apagar: 'myactivity.google.com/product/gemini → «Keep Activity»: desactívalo.',
    sinRastro: 'Chat temporal: se guarda hasta 72 horas y no se usa para entrenar.',
    ojo: 'Revisores humanos leen algunas conversaciones y las guardan hasta 3 años, aunque borres tu actividad. Google pide no escribir nada confidencial.',
    fuente: 'https://support.google.com/gemini/answer/13594961',
  },
  {
    id: 'empresa',
    herramienta: null,
    label: 'Claude Team o Enterprise · ChatGPT Business o Enterprise',
    entrena: 'No.',
    apagar: 'Nada que apagar. El administrador puede desactivar los pulgares de calificación.',
    ojo: 'Es la opción para trabajar con documentos de clientes, siempre anonimizados y con el contrato de la firma.',
    fuente: 'https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training',
  },
];

export const PRIVACIDAD_VERIFICADA =
  'Verificado el 20 de octubre de 2026 en las páginas oficiales de Anthropic, OpenAI y Google. Los nombres de los menús están en inglés; en la interfaz en español aparecen traducidos.';

// How to install a skill ZIP in Claude (support.claude.com 12512180, 20 Oct 2026).
export const INSTALAR_SKILL = {
  pasos: [
    'En Claude, Configuración → Capacidades: activa «Code execution and file creation». Las skills lo necesitan.',
    'Customize → Skills → botón «+» → «Create skill» → «Upload a skill».',
    'Sube el ZIP de la skill tal como lo descargaste, sin descomprimirlo.',
    'Actívala en la lista. Claude la usa sola cuando aparece la tarea, en cualquier chat.',
  ],
  nota: 'Disponible en todos los planes de Claude, también el gratuito. En Team y Enterprise puedes compartirla con tu equipo o publicarla para toda la organización. Verificado el 20 de octubre de 2026.',
};

// §3.13, with the coordinator's fact-check of 20 Oct 2026 (T-323 principles,
// PCSJA24-12243 scope). ABA 512 is comparative and stays in the playbook.
export const MARCO_COLOMBIANO = [
  {
    instrumento: 'Sentencia T-323 de 2024 (Corte Constitucional, 2 ago. 2024, M.P. Juan Carlos Cortés González)',
    fija: 'La IA puede apoyar, no sustituir el razonamiento humano. Fija doce principios: transparencia, responsabilidad, privacidad, no sustitución de la racionalidad humana, seriedad y verificación, prevención de riesgos, igualdad y equidad, control humano, regulación ética, adecuación a buenas prácticas, seguimiento continuo e idoneidad. Ordenó al CSJ expedir lineamientos en cuatro meses',
    cerebro: 'Puntos YO DECIDO en cada skill; cierre "Verificación pendiente"; reglas de anonimización',
  },
  {
    instrumento: 'Acuerdo PCSJA24-12243 (CSJ, 16 dic. 2024)',
    fija: 'Lineamientos para el uso responsable, seguro y ético de la IA generativa en la Rama Judicial. Obliga a magistrados, jueces y empleados de la Rama: verificación humana; deber de informar el uso de IA (herramienta, modelo, fecha y propósito); evitar chatbots generales en versiones gratuitas; no ingresar datos personales, sensibles o confidenciales en herramientas que los retengan o reentrenen',
    cerebro: 'Niveles de confidencialidad; modelo local para reserva',
  },
  {
    instrumento: 'Ley 1581 de 2012 y Decreto 1377 de 2013',
    fija: 'Protección de datos personales',
    cerebro: 'Regla de anonimización antes de subir',
  },
  {
    instrumento: 'Art. 74 C.P. y Ley 1123 de 2007',
    fija: 'Secreto profesional inviolable; deberes del abogado',
    cerebro: 'Línea roja: nada bajo secreto profesional en nube con cuenta personal',
  },
];

// §14 — official sources to verify against.
export const FUENTES_OFICIALES = [
  { label: 'SUIN-Juriscol (normas)', url: 'https://www.suin-juriscol.gov.co/' },
  { label: 'Secretaría del Senado (leyes)', url: 'http://www.secretariasenado.gov.co/' },
  { label: 'Relatoría Corte Constitucional', url: 'https://www.corteconstitucional.gov.co/relatoria/' },
  { label: 'Relatoría Corte Suprema de Justicia', url: 'https://www.cortesuprema.gov.co/' },
  { label: 'Relatoría Consejo de Estado', url: 'https://www.consejodeestado.gov.co/' },
  { label: 'Rama Judicial, consulta de procesos', url: 'https://consultaprocesos.ramajudicial.gov.co/' },
];

// §4.3 / §6.11 — Laura, litigante civil y constitucional.
export const PERFIL_LAURA = Object.freeze({
  nombre: 'Laura',
  rol: 'litigante',
  areas: Object.freeze(['civil', 'constitucional']),
  tareas: Object.freeze(['contratos', 'jurisprudencia', 'peticiones']),
  herramientas: Object.freeze(['claude', 'chatgpt']),
  confidencialidad: 'reservada',
  tono: 'didactico',
  nuncaDelego: 'Decidir si presento el recurso o acepto la conciliación',
});

export const PERFIL_VACIO = Object.freeze({
  nombre: '',
  rol: null,
  areas: Object.freeze([]),
  tareas: Object.freeze([]),
  herramientas: Object.freeze([]),
  confidencialidad: null,
  tono: null,
  nuncaDelego: '',
});

export const DISCLAIMER =
  'Las normas citadas son semilla para verificación en fuente oficial; no constituyen asesoría jurídica.';
