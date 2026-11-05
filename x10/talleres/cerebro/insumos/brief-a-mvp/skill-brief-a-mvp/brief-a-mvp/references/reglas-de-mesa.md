# Reglas de mesa y protocolo de error

Las usa el paso 9 de la skill. Tomadas de Cerebro (x10.expert/cerebro), sin cambios. Son para cuando ya se está construyendo.

## Reglas de mesa

1. Un cambio por mensaje.
2. Describe lo que ves, no lo que crees que falla.
3. Prueba antes de pedir lo siguiente.
4. Si se rompió, vuelve a la versión anterior antes de arreglar.
5. Nunca pegues datos reales.

## Protocolo de error

1. Lee lo que dice la herramienta. Casi siempre dice qué pasó.
2. Copia el mensaje de error tal cual y pídele que lo arregle. Sin interpretarlo.
3. Si en dos intentos no lo arregla, vuelve a la versión anterior y pide el mismo cambio de otra forma, más pequeño.
4. Si vuelve a fallar, anótalo y sigue con el siguiente punto de control.

## Qué no hacer (seguridad)

- No pegar datos reales de personas, clientes ni de la entidad. Inventar nombres.
- No publicar una app con información sensible sin inicio de sesión. V1 no lo tiene; por eso V1 no lleva datos sensibles.
- No pegar contraseñas ni llaves de otros servicios en un mensaje a la herramienta.
- No conectar la app a cuentas reales (correo, pagos, bases de datos de la entidad) en esta etapa.
