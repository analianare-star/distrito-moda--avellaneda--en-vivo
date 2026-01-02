# PASO 6 - RATINGS Y REPORTS (sin codigo)

Este paso es SOLO especificacion y plan. No se ejecuta nada ni se modifica codigo.

## 1) Que se implementa (alcance)
- LiveRating con unicidad por cliente y live.
- LiveReport con unicidad por cliente y live.
- Reglas de validacion por estado del live y tolerancia de reportes.
- Impacto en ShopAggregate (ratingAvg, ratingCount).

## 2) Por que
- Evita fraude y duplicados.
- Asegura calidad de datos para ranking y confianza.
- Formaliza el circuito de reportes que activa sanciones.

## 3) Tablas/campos tocados (lista cerrada)
Nueva: LiveRating
- ratingId
- clientAuthUserId (FK a AuthUser.id; valida que exista registro en Client)
- liveId (FK a Live)
- shopId (FK a Shop)
- stars (1..5)
- createdAt

Nueva: LiveReport
- reportId
- clientAuthUserId (FK a AuthUser.id; valida que exista registro en Client)
- liveId (FK a Live)
- shopId (FK a Shop)
- reason (texto)
- comment (opcional)
- status (OPEN|VALIDATED|REJECTED)
- reviewedByAdminId (opcional)
- reviewedAt (opcional)
- createdAt

Agregado: ShopAggregate
- ratingAvg
- ratingCount

Compatibilidad
- Si existe tabla legacy Review/Report, se conserva sin cambios en este paso.

## 4) Validaciones / edge cases (reglas de negocio)
Acceso
- Solo CLIENT logueado puede crear Rating o Report.
- Visitante: bloqueado y se solicita login.

Rating
- Solo permitido si Live.status = FINISHED.
- Stars entre 1 y 5.
- Un cliente no puede calificar el mismo live dos veces.
- No se permite editar ni borrar rating (inmutabilidad).

Reportes
- Solo permitido si Live.status = LIVE.
- Si existe LIVE_GRACE en el futuro, tambien se permite en ese estado.
- Reportes en los primeros 5 minutos NO cuentan para penalizacion.
- Reportes validos (>= minuto 6) cuentan para el umbral.
- Un cliente no puede reportar el mismo live dos veces.

Regla de penalizacion (postergada)
- Paso 6 solo registra reportes y marca candidato a sancion.
- La accion automatica (MISSED + burn + suspension) la ejecuta el motor de sanciones del Paso 7.

Integridad de agregados
- Cada rating nuevo actualiza ShopAggregate (promedio y conteo).

## 5) Checklist de pruebas (paso a paso)
1) Cliente logueado intenta calificar live FINISHED -> OK.
2) Cliente logueado intenta calificar live LIVE/UPCOMING -> bloqueado.
3) Duplicar rating -> bloqueado por unicidad.
4) Cliente visitante intenta reportar -> bloqueado.
5) Cliente logueado reporta en minuto 0-5 -> se registra pero NO cuenta.
6) Cliente logueado reporta en minuto 6+ -> cuenta para umbral.
7) Al llegar a 5 reportes validos -> Live MISSED + suspension aplicada.

## 6) Rollback plan simple
- Eliminar LiveRating y LiveReport.
- Revertir unicidad y logica de bloqueos.
- Dejar ShopAggregate sin actualizaciones automaticas.

## 7) Decisiones y notas
- No se toca login ni endpoints publicos existentes.
- LiveRating y LiveReport se integran con AuthUser (no con User legacy).
