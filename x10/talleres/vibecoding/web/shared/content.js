// Student-facing material from plan-clase-1.md (Materiales, bloques 2, 5 and 6).
// Pure data: content.test.mjs parses the plan and checks every string here
// against it, so edit the plan first and then this file.

/** El mapa de 5 piezas (bloque 2.2). `lahace`: hoy lo resuelve la herramienta. */
export const PIECES = [
  { id: 'front', name: 'Front', clase: 'Lo que la persona ve y toca', domicilios: 'El menú, el carrito, el botón "pedir"', pregunta: '¿Qué ve el usuario?' },
  { id: 'logica', name: 'Lógica', clase: 'Lo que pasa cuando toca algo', domicilios: 'Calcula el total, asigna el domiciliario', pregunta: '¿Qué hace la app por dentro?' },
  { id: 'datos', name: 'Base de datos', clase: 'Lo que la app recuerda cuando cierras la pestaña', domicilios: 'Pedidos, direcciones, usuarios', pregunta: '¿Qué guarda?' },
  { id: 'dominio', name: 'Dominio', clase: 'La dirección donde la gente la encuentra', domicilios: 'la-app.com', pregunta: '¿Dónde vive?', lahace: true },
  { id: 'repositorio', name: 'Repositorio', clase: 'El plano y el historial; lo que hace que sea tuya', domicilios: 'Cada versión del código, con fecha y autor', pregunta: '¿De quién es y cómo se deshace un cambio?', lahace: true },
];

export const LA_HERRAMIENTA = '(hoy lo resuelve la herramienta)';

/** Menú de proyectos: casos pequeños del sector público, para quien no trae idea. */
export const MENU = [
  {
    id: 'tablero',
    proyecto: 'Tablero de solicitudes',
    paraQuien: 'Una dependencia que recibe pedidos por correo o chat (sistemas, mantenimiento, jurídica)',
    acciones: ['Registrar solicitud', 'cambiar estado', 'ver lista con filtro'],
    guarda: 'Solicitud: título, descripción, dependencia, fecha, estado, solicitante',
  },
  {
    id: 'pqrsd',
    proyecto: 'Control de PQRSD',
    paraQuien: 'La ventanilla de atención al ciudadano de una alcaldía o entidad',
    acciones: ['Radicar PQRSD', 'ver cuántos días faltan para el vencimiento', 'marcar como respondida'],
    guarda: 'PQRSD: radicado, tipo, asunto, fecha de radicación, fecha límite, estado',
  },
  {
    id: 'prestamo',
    proyecto: 'Préstamo de equipos',
    paraQuien: 'Una oficina o un colegio público que comparte portátiles, videobeam o vehículo',
    acciones: ['Registrar préstamo', 'registrar devolución', 'ver qué está prestado y a quién'],
    guarda: 'Préstamo: equipo, responsable, fecha de salida, fecha de devolución, estado',
  },
  {
    id: 'turnos',
    proyecto: 'Turnos de atención',
    paraQuien: 'Una ventanilla de trámites o la recepción de un hospital público',
    acciones: ['Tomar turno', 'llamar al siguiente', 'ver turnos en espera'],
    guarda: 'Turno: número, trámite, hora de llegada, estado',
  },
  {
    id: 'inventario',
    proyecto: 'Inventario de insumos',
    paraQuien: 'El almacén de una secretaría o de un centro de salud',
    acciones: ['Registrar entrada', 'registrar salida a una dependencia', 'ver insumos bajo el mínimo'],
    guarda: 'Insumo: nombre, existencias, mínimo; movimiento: tipo, cantidad, dependencia, fecha',
  },
  {
    id: 'compromisos',
    proyecto: 'Compromisos de reunión',
    paraQuien: 'Un comité, un consejo directivo o un equipo de despacho',
    acciones: ['Registrar compromiso', 'asignar responsable y fecha', 'marcar como cumplido'],
    guarda: 'Compromiso: descripción, responsable, fecha límite, estado, reunión',
  },
  {
    id: 'visitas',
    proyecto: 'Agenda de visitas de campo',
    paraQuien: 'Un equipo de inspección, vigilancia y control o de visitas domiciliarias',
    acciones: ['Programar visita', 'registrar resultado', 'ver visitas de la semana'],
    guarda: 'Visita: dirección, fecha, responsable, resultado, estado',
  },
  {
    id: 'tramites',
    proyecto: 'Directorio de trámites',
    paraQuien: 'Ciudadanos que no saben a qué dependencia ir ni qué documentos llevar',
    acciones: ['Agregar trámite', 'buscar por nombre o dependencia', 'ver requisitos'],
    guarda: 'Trámite: nombre, dependencia, requisitos, horario, costo',
  },
];

export const REGLAS = [
  'Un cambio por mensaje.',
  'Describe lo que ves, no lo que crees que falla.',
  'Prueba antes de pedir lo siguiente.',
  'Si se rompió, vuelve a la versión anterior antes de arreglar.',
  'Nunca pegues datos reales.',
];

export const PROTOCOLO = [
  'Lee lo que dice la herramienta. Casi siempre dice qué pasó.',
  'Copia el mensaje de error tal cual y pídele que lo arregle. Sin interpretarlo.',
  'Si en dos intentos no lo arregla, vuelve a la versión anterior y pide el mismo cambio de otra forma, más pequeño.',
  'Si vuelve a fallar, anótalo para la clase 2 y sigue con el siguiente punto de control.',
];

export const SEGURIDAD = [
  'No pegar datos reales de personas, clientes ni de la empresa. Inventar nombres.',
  'No publicar una app con información sensible sin inicio de sesión. V1 no lo tiene; por eso V1 no lleva datos sensibles.',
  'No pegar contraseñas ni llaves de otros servicios en un mensaje a la herramienta.',
  'No conectar la app a cuentas reales (correo, pagos, bases de datos de la empresa) en esta etapa.',
];

/** The sentence the presenter repeats most (bloque 5, punto 3). */
export const FRASE_DATOS = 'Los datos deben guardarse en la base de datos, no en la memoria del navegador';

/** Puntos de control (bloque 5). */
export const CHECKPOINTS = [
  {
    n: 1,
    name: 'Carga la primera versión',
    prueba: 'La vista previa abre y se ve algo parecido a la spec.',
    falla: 'Copiar el mensaje de error tal cual y pedir que lo arregle. Dos intentos máximo; luego, versión anterior.',
  },
  {
    n: 2,
    name: 'La acción principal funciona',
    prueba: 'Ejecutar el escenario 1 de la spec, paso a paso.',
    falla: 'Describir lo que se ve, no lo que se cree que falla: "al presionar Enviar no pasa nada", no "el botón está mal programado".',
  },
  {
    n: 3,
    name: 'Guarda datos',
    prueba: 'La prueba de la pestaña: cerrar la pestaña, volver a abrir, ¿sigue ahí lo que registré?',
    falla: 'Mensaje exacto: "Los datos deben guardarse en la base de datos, no en la memoria del navegador". Es la frase que más repetirás.',
  },
  {
    n: 4,
    name: 'Publicada',
    prueba: 'Botón de publicar; copiar la URL; abrirla desde el celular.',
    falla: 'Si la publicación tarda, seguir al punto 5 y volver.',
  },
  {
    n: 5,
    name: 'Conectada a GitHub',
    prueba: 'Configuración del proyecto, conectar GitHub, ver el repositorio creado.',
    falla: 'Si no alcanza el tiempo, es tarea para la semana; el playbook lo explica con capturas.',
  },
];

export const checkpointName = (n) => CHECKPOINTS.find((c) => c.n === n)?.name ?? '';

/** Mesas de la clase 2 (propuesta de formato). `range`: puntos de control que caen en cada una. */
export const MESAS = [
  { id: 'no-funciona', name: 'No funciona', desc: 'protocolo de error aplicado', range: [1, 2] },
  { id: 'quiero-agregar', name: 'Quiero agregar', desc: 'nueva acción: se escribe primero en la spec, luego se pide', range: [3, 4] },
  { id: 'abrir-caja', name: 'Quiero abrir la caja', desc: 'repositorio y ruta B', range: [5, 5] },
];

/** Section ids the deck's QR codes point to (CONTRACT.md). */
export const LANDING_ANCHORS = ['encuesta', 'cinco-piezas', 'spec', 'menu', 'reglas', 'salida'];

/** Playbook ids owned by the playbook page (CONTRACT.md). Link only to these. */
export const PLAYBOOK_ANCHORS = [
  'empieza-aqui', 'vibe-coding', 'cinco-piezas', 'spec', 'prueba-del-adivino', 'plantilla',
  'cabecera', 'menu-de-proyectos', 'reglas-de-mesa', 'protocolo-de-error', 'seguridad',
  'ruta-a', 'ruta-b', 'caja-cerrada-o-abierta', 'clase-2', 'glosario',
];

export const PLAYBOOK = '/vibecoding/playbook/';
export const playbookUrl = (anchor) => {
  if (!PLAYBOOK_ANCHORS.includes(anchor)) throw new Error(`Unknown playbook anchor: ${anchor}`);
  return `${PLAYBOOK}#${anchor}`;
};

/** Only the presenter's name: Vibe Coding publishes no contact data. */
export const CONTACT = {
  expositor: 'Fabian Zapata',
};

/** Tesis of the class (bloque 1, minute 0:09). */
export const TESIS = 'Vibe coding no es pedir una app. Es describirla tan bien que la IA no tenga que adivinar.';

/** Tarea para la clase 2 (bloque 6). */
export const TAREA = [
  'Que tres personas reales usen la app esta semana. No familiares que dicen que todo está bien: personas que la necesitarían.',
  'Anotar qué falló, qué no entendieron y qué pidieron. Esa lista llega a la clase 2.',
  'Traer una lista de dudas, por tontas que parezcan. Las tontas son las que todos tienen.',
  'Opcional: leer la ruta B del playbook y crear cuenta en claude.ai. En la clase 2 abrimos la caja de un proyecto real.',
];

/** Cómo funciona la clase 2 (bloque 6). */
export const CLASE_2 =
  'Es una retro de fallos comunes, trabajo en grupos según el tipo de problema, y la apertura en vivo de la caja de uno de los proyectos. Lo que falló esta semana es el material.';
