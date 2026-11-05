# Semáforo de Liquidaciones Contractuales

## Contexto
Entidad: oficina de contratación de una entidad pública colombiana (ejemplo ficticio).
Usuario: abogado o profesional de la oficina de contratación responsable del cierre (liquidación) de contratos y convenios.
Hoy revisa manualmente cada expediente para saber si el contrato requiere liquidación, cuándo vence el plazo para liquidarlo y qué documentos faltan. Le toma entre 1 y 2 horas por contrato y con frecuencia los plazos se vencen sin que nadie lo note.

## Qué construimos (alcance del MVP)
Una aplicación web de una sola página, sin backend, sin base de datos externa, sin login, sin API keys. Los datos de ejemplo viven dentro del código. Idioma de la interfaz: español.
Resuelve exactamente esto: "Cuando el abogado de contratación abre la herramienta, ve en segundos qué contratos están próximos a vencer su plazo de liquidación, qué documentos faltan en cada uno, y puede generar el oficio de requerimiento de documentos al contratista."

## Qué NO construimos
- No se conecta a SECOP, Orfeo, correo, OneDrive ni bases institucionales.
- No lee PDF ni documentos; los datos se registran en formularios o se cargan desde un JSON exportado por la misma app.
- No decide, firma, notifica ni radica nada. Solo calcula, alerta y redacta borradores.
- No usa IA para calcular plazos, estados o listas de chequeo. Todo eso son reglas explícitas (abajo).
- No gestiona usuarios ni permisos.

## Entrada (modelo de datos)
Un **contrato** tiene estos campos:
- `numero`: texto (ej. "IDU-OBRA-001-2025")
- `contratista`: texto (nombre ficticio)
- `objeto`: texto corto
- `tipo`: una de ["Obra", "Suministro", "Consultoría", "Interventoría", "Prestación de servicios profesionales", "Convenio"]
- `valor`: número (pesos colombianos)
- `fecha_inicio`: fecha
- `fecha_terminacion`: fecha (fin del plazo de ejecución)
- `plazo_liquidacion_pactado_meses`: número o vacío (si el contrato pactó un plazo para liquidar)
- `supervisor`: texto
- `estado_ejecucion`: una de ["En ejecución", "Terminado"]
- `estado_liquidacion`: una de ["No requiere", "Pendiente", "En trámite", "Liquidada bilateral", "Liquidada unilateral"]
- `fecha_liquidacion`: fecha o vacío
- `documentos`: lista de chequeo con el estado de cada documento (ver reglas R7-R9): cada ítem tiene `nombre` y `estado` en ["Sí", "No", "N/A"]
- `observaciones`: texto libre
- `validado_por_humano`: verdadero/falso (por defecto falso)

### Datos de ejemplo (10 contratos ficticios; fechas en formato AAAA-MM-DD)
| numero | contratista | tipo | valor | fecha_inicio | fecha_terminacion | plazo pactado (meses) | estado_ejecucion | estado_liquidacion | fecha_liquidacion | supervisor |
|---|---|---|---|---|---|---|---|---|---|---|
| OBRA-001-2025 | Constructora Andina S.A.S. | Obra | 2.450.000.000 | 2025-09-15 | 2026-09-15 | 6 | Terminado | Pendiente | | Carlos Méndez |
| SUM-014-2025 | Suministros del Norte Ltda. | Suministro | 180.000.000 | 2025-11-20 | 2026-05-20 | (vacío) | Terminado | Pendiente | | Laura Pineda |
| CONS-007-2022 | Estudios Urbanos Consultores S.A. | Consultoría | 620.000.000 | 2022-10-01 | 2023-06-30 | (vacío) | Terminado | Pendiente | | Jorge Ruiz |
| PS-102-2026 | Ana María Torres | Prestación de servicios profesionales | 54.000.000 | 2026-02-01 | 2026-10-30 | (vacío) | Terminado | No requiere | | Patricia Gómez |
| CONV-003-2026 | Alcaldía Municipal de Villanueva | Convenio | 900.000.000 | 2026-03-01 | 2027-02-28 | (vacío) | En ejecución | Pendiente | | Carlos Méndez |
| INT-005-2025 | Interventorías Técnicas del Oriente S.A.S. | Interventoría | 310.000.000 | 2025-11-20 | 2026-07-20 | 5 | Terminado | Pendiente | | Laura Pineda |
| OBRA-009-2026 | Vías y Puentes del Sur S.A.S. | Obra | 1.780.000.000 | 2026-02-28 | 2026-10-28 | 4 | Terminado | En trámite | | Jorge Ruiz |
| SUM-021-2025 | Dotaciones Institucionales S.A.S. | Suministro | 95.000.000 | 2025-10-10 | 2026-02-10 | (vacío) | Terminado | Pendiente | | Patricia Gómez |
| CONS-011-2025 | Planeación Estratégica Consultores Ltda. | Consultoría | 240.000.000 | 2025-09-01 | 2026-03-01 | (vacío) | Terminado | Liquidada bilateral | 2026-06-15 | Carlos Méndez |
| CONV-008-2026 | Fundación Cultura Viva | Convenio | 450.000.000 | 2026-01-15 | 2026-10-01 | (vacío) | Terminado | Pendiente | | Laura Pineda |

Para la lista de chequeo documental, asignar estados variados: OBRA-001 con 2 documentos en "No"; SUM-014 con 1 en "No"; CONV-008 con 4 en "No"; OBRA-009 con todo en "Sí"; el resto, mezcla razonable.

## Criterios / reglas (simplificadas para el MVP; el área jurídica debe validarlas antes de uso real)

**R1. ¿Requiere liquidación?**
Si `tipo` es "Prestación de servicios profesionales" → NO requiere liquidación (estado "No requiere", sin plazos ni semáforo).
Cualquier otro tipo → SÍ requiere liquidación.

**R2. Fecha límite de liquidación bilateral (de mutuo acuerdo).**
Si `plazo_liquidacion_pactado_meses` tiene valor → `fecha_terminacion` + ese número de meses.
Si está vacío → `fecha_terminacion` + 4 meses.

**R3. Fecha límite de liquidación unilateral.**
Fecha límite bilateral (R2) + 2 meses.

**R4. Fecha máxima (pérdida de competencia).**
Fecha límite unilateral (R3) + 24 meses.

**R5. Etapa vigente** (solo si requiere liquidación, `estado_ejecucion` = "Terminado" y `estado_liquidacion` no es "Liquidada ..."):
- Si hoy ≤ fecha límite bilateral → etapa "Bilateral"; días restantes = fecha límite bilateral − hoy.
- Si hoy > fecha límite bilateral y hoy ≤ fecha límite unilateral → etapa "Unilateral"; días restantes = fecha límite unilateral − hoy.
- Si hoy > fecha límite unilateral y hoy ≤ fecha máxima → etapa "Extemporánea (dentro de los 2 años)"; días restantes = fecha máxima − hoy.
- Si hoy > fecha máxima → etapa "Competencia perdida"; días restantes = 0.
Si `estado_ejecucion` = "En ejecución" → etapa "En ejecución" (aún no corre el plazo); mostrar fecha límite bilateral proyectada.

**R6. Semáforo** (según etapa y días restantes):
- Verde: días restantes > 60.
- Amarillo: 31 a 60 días.
- Naranja: 1 a 30 días.
- Rojo: etapa "Extemporánea" (ya se vencieron bilateral y unilateral, pero aún hay competencia).
- Negro: etapa "Competencia perdida".
- Gris: "No requiere", "Liquidada bilateral/unilateral" o "En ejecución".
"Hoy" es la fecha del sistema del navegador.

**R7. Lista de chequeo documental base (aplica a todos los que requieren liquidación):**
1. Acta de inicio
2. Informes de supervisión o interventoría
3. Acta de terminación / recibo final
4. Informe final del contratista
5. Certificación de pagos y balance financiero
6. Certificación de aportes a seguridad social y parafiscales
7. Garantías actualizadas para la etapa de liquidación

**R8. Documentos adicionales por tipo:**
- Obra: + Acta de entrega y recibo de obra; + Amparo de estabilidad de obra actualizado.
- Consultoría e Interventoría: + Entregables / productos aprobados por el supervisor.
- Convenio: + Informe de ejecución de recursos; + Acta de reintegro de saldos y rendimientos financieros.
- Suministro: sin adicionales.

**R9. Completitud documental** = (documentos en "Sí") / (documentos aplicables, excluyendo "N/A") × 100, redondeado.

**R10. Prioridad de atención** (orden de la lista): primero Negro, luego Rojo, Naranja, Amarillo, Verde, Gris. Dentro del mismo color, menor número de días restantes primero; empate → mayor valor primero.

## Salida
- **Pantalla 1 – Inventario:** tabla con columnas: Semáforo (círculo de color), Número, Contratista, Tipo, Valor, Fecha terminación, Etapa vigente, Días restantes, Fecha límite de la etapa, Completitud documental (%), Estado liquidación, Validado (✓). Ordenada por R10. Filtros por tipo, semáforo y estado de liquidación. Buscador por número o contratista.
- **Pantalla 2 – Ficha del contrato:** todos los campos, las tres fechas límite calculadas (bilateral, unilateral, máxima) con la etapa vigente resaltada, la lista de chequeo editable (Sí/No/N/A por documento), porcentaje de completitud, campo de observaciones, y botón "Marcar como validado por humano".
- **Pantalla 3 – Tablero:** contadores por color de semáforo, número de contratos con competencia perdida, valor total en riesgo (suma del valor de Rojo + Negro), lista "Top 5 más urgentes".
- **Documento – Oficio de requerimiento de documentos:** generado desde la ficha, en texto plano, con: ciudad y fecha de hoy, destinatario (contratista), referencia (número y objeto), párrafo que informa la etapa de liquidación y su fecha límite, lista numerada de documentos faltantes (los que están en "No"), plazo de entrega de diez (10) días hábiles, y bloque de firma "[Nombre y cargo del funcionario]". Botón "Copiar al portapapeles" y "Descargar .txt".

## Validación humana
El usuario puede editar cualquier campo, cambiar el estado de cada documento, escribir observaciones y marcar el contrato como "Validado por humano". La herramienta nunca cambia `estado_liquidacion` por sí sola; solo sugiere la etapa y el semáforo.

## Criterio de éxito (casos de prueba con "hoy" = 2026-11-05)
1. SUM-014-2025: etapa "Unilateral", fecha límite 2026-11-20, 15 días, semáforo Naranja.
2. CONS-007-2022: etapa "Competencia perdida", semáforo Negro.
3. SUM-021-2025: etapa "Extemporánea", semáforo Rojo, fecha máxima 2028-08-10.
4. INT-005-2025: etapa "Bilateral", fecha límite 2026-12-20, 45 días, Amarillo.
5. PS-102-2026: "No requiere", Gris, sin plazos.
6. CONS-011-2025: "Liquidada bilateral", Gris.
7. OBRA-001-2025: etapa "Bilateral", fecha límite 2027-03-15, Verde, completitud menor a 100 % y el oficio lista exactamente los 2 documentos en "No".
