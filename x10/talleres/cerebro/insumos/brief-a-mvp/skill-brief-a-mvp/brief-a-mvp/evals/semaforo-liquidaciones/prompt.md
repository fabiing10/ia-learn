---
tags: [brief-a-mvp]
max_turns: 20
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write]
---

Este es el brief de mi grupo del taller. Voy a construir en Claude Code, nunca he construido software y tengo una sesión de 90 minutos. Dame el MVP y los prompts.

| Campo | Contenido |
|---|---|
| Nombre y entidad | Semáforo de Liquidaciones Contractuales. Oficina de contratación de una entidad pública colombiana. |
| Usuario | Abogado o profesional de la oficina de contratación responsable del cierre (liquidación) de contratos y convenios. Necesita saber, por contrato, si requiere liquidación, en qué etapa del plazo está y qué documentos faltan. Le frustra abrir cada expediente para verificarlo manualmente y enterarse tarde de los vencimientos. |
| Problema | La información del cierre contractual está dispersa (contrato, actas, informes, pólizas, certificaciones). Calcular los términos y verificar la completitud documental toma entre una y dos horas por contrato, y con frecuencia los plazos se vencen sin que nadie lo note, con riesgo de pérdida de competencia, hallazgos de los órganos de control y saldos sin definir. |
| Reto | ¿Cómo podríamos ayudar a la oficina de contratación a ver en segundos qué contratos están próximos a vencer su plazo de liquidación y qué documentos faltan en cada uno, sin sustituir la revisión jurídica? |
| Solución | Una herramienta de IA que consolide el inventario contractual desde SECOP y las bases de la entidad, calcule los términos de liquidación y genere alertas por correo, revise la documentación del expediente contra listas de chequeo, analice la consistencia de valores, pagos y garantías, genere actas de liquidación, oficios y requerimientos, consulte la normativa y jurisprudencia aplicable y produzca informes de seguimiento e indicadores. |
| Flujo principal | 1. Se consolida el inventario de contratos. 2. La herramienta calcula los términos y alerta. 3. Revisa el expediente e identifica faltantes. 4. Genera los documentos de liquidación. 5. El profesional revisa, valida y tramita. |
| Qué NO hará | No decide si procede la liquidación ni declara la pérdida de competencia. No firma, radica ni notifica. |
| Datos | Contratos y convenios de la entidad (número, contratista, objeto, valor, plazo, fechas, supervisor, estado), documentos del expediente, informes de supervisión, garantías. |
| Humano responsable | El profesional de la oficina de contratación revisa cada caso, decide y tramita. |
| Cómo sabremos que funciona | Reducción del tiempo de revisión por contrato y cero plazos de liquidación vencidos sin alerta. |
