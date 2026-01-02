# PASO 7 - MOTOR DE SANCIONES Y AUDITORIA (sin codigo)

Este paso es SOLO especificacion y plan. No se ejecuta nada ni se modifica codigo.

## 1) Que se implementa (alcance)
- Motor de sanciones para Lives candidatos por reportes.
- AgendaSuspension como historial de sanciones.
- LiveScheduleEvent para trazabilidad de cambios de agenda.
- AuditLog para acciones de Admin/Shop/System.

## 2) Por que
- Separa moderacion de sancion (menos riesgo operacional).
- Aporta trazabilidad completa para soporte y disputas.
- Permite reprogramaciones con reglas claras y auditable.

## 3) Tablas/campos tocados (lista cerrada)
Nueva: AgendaSuspension
- suspensionId
- shopId (FK a Shop)
- startAt
- endAt
- reason
- createdByAdminId (opcional)
- createdAt

Nueva: LiveScheduleEvent
- eventId
- liveId
- shopId
- action (CREATE|EDIT|CANCEL|AUTO_REPROGRAM|SET_PENDING_REPROGRAM|ADMIN_OVERRIDE|AUTO_START|AUTO_FINISH)
- fromScheduledAt (opcional)
- toScheduledAt (opcional)
- reason (opcional)
- actorType (ADMIN|SHOP|SYSTEM)
- actorId (opcional)
- createdAt

Nueva: AuditLog
- auditId
- actorType (ADMIN|SHOP|SYSTEM)
- actorId (opcional)
- action (texto)
- entityType (SHOP|LIVE|REEL|PURCHASE|SUSPENSION|NOTIFICATION)
- entityId (opcional)
- meta (JSON)
- createdAt

Compatibilidad
- No se eliminan ni alteran tablas existentes.

## 4) Validaciones / edge cases (reglas de negocio)
Motor de sanciones
- Insumo: LiveReport VALIDATED (Paso 6) con userId no nulo.
- Umbral: 5 reportes validos (CLIENT logueado, >= minuto 6).
- Ventana: el minuto 6 se calcula desde Live.startTime; si startTime es null, usar Live.scheduledAt como fallback.
- Accion: marcar Live como MISSED y ocultarlo.
- Campos exactos en Live: status = MISSED, hidden = true, endTime = now(), visibilityReason = "Reportes validados" (opcional).
- Consumir cupo: MISSED_BURN (segun reglas de cupos).
- Suspender agenda:
  - Plan ESTANDAR/ALTA: 7 dias.
  - Plan MAXIMA: 4 dias.
- Campos exactos en Shop: status = AGENDA_SUSPENDED, statusChangedAt = now(), agendaSuspendedUntil = endAt, agendaSuspendedReason = "Reportes validados".
- Crear AgendaSuspension y AuditLog correspondiente.
- Idempotencia:
  - Si Live ya esta MISSED/BANNED/CANCELLED/FINISHED, no volver a sancionar.
  - Antes de crear MISSED_BURN, verificar si existe QuotaTransaction con refType = LIVE y refId = liveId.
  - Si ya existe una AgendaSuspension activa superpuesta para la Shop, no crear otra.

Reprogramacion por sancion (regla final)
- Al suspender agenda, NO buscar slot libre automaticamente.
- Aplicar solo a Lives UPCOMING con scheduledAt entre now() y agendaSuspendedUntil.
- Mover vivos a semana inmediata siguiente.
- Si hay conflicto -> status = PENDING_REPROGRAMMATION.
- Campos exactos cuando hay conflicto: pendingReprogramNote = "Conflicto de agenda por sancion", reprogramReason = "Sancion de agenda", reprogramBatchId = <uuid>.
- Campos exactos cuando NO hay conflicto: scheduledAt reprogramado, originalScheduledAt (si es null), reprogramReason = "Sancion de agenda", reprogramBatchId = <uuid>.
- La resolucion queda en la tienda al volver:
  - Confirmar
  - Reprogramar manual
  - Cancelar sin penalizacion
- Ventana de resolucion: 48 horas luego de recuperar la cuenta.
  Pasado ese plazo => MISSED_BURN.

AuditLog (trazabilidad)
- Registrar acciones de:
  - Suspender/levantar agenda
  - Reprogramaciones automaticas
  - Overrides admin
  - Cambios de status en Live
- LiveScheduleEvent minimos:
  - AUTO_FINISH al marcar MISSED (reason: "Reportes validados")
  - AUTO_REPROGRAM al mover fecha
  - SET_PENDING_REPROGRAM al dejar PENDING_REPROGRAMMATION

## 5) Checklist de pruebas (paso a paso)
1) Crear 5 reportes VALIDATED para un Live LIVE.
2) Ejecutar motor -> Live pasa a MISSED.
3) Se crea AgendaSuspension (endAt segun plan).
4) Se registra QuotaTransaction MISSED_BURN.
5) Vivos futuros pasan a semana siguiente o PENDING_REPROGRAMMATION.
6) Al levantar suspension, ventana 48h activa.
7) Si no se resuelve en 48h -> MISSED_BURN.
8) AuditLog registra cada accion clave.

## 6) Rollback plan simple
- Desactivar motor de sanciones.
- Revertir cambios de status en Lives afectados (manual).
- No eliminar AuditLog ni LiveScheduleEvent en entornos productivos; solo en testing controlado.

## 7) Decisiones y notas
- Motor de sanciones se ejecuta por job/cron (no en request).
- No se toca login ni endpoints publicos existentes.
- Compatibilidad as-is: hoy /streams/:id/report aplica sancion inline. Para activar el motor del Paso 7, esa sancion inline debe quedar desactivada o el motor debe correr en modo solo auditoria.
- Nota legacy: la tabla Penalty queda en desuso cuando se implemente AgendaSuspension + AuditLog. No crear nuevas Penalty desde el motor.
