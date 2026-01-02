# PASO 5 - AGENDA Y NOTIFICACIONES (sin codigo)

Este paso es SOLO especificacion y plan. No se ejecuta nada ni se modifica codigo.

## 1) Que se implementa (alcance)
- Reminder (recordatorios cliente) como fuente unica de agenda cliente.
- Notification (cola interna) para avisos internos.
- Reglas de agenda: crear/cancelar recordatorios y actualizacion por cambios en Live.
- Procesamiento de notificaciones en cola (estado QUEUED -> SENT/FAILED) via processor cron/manual.

## 2) Por que
- Permite recordatorios 15 min antes sin depender de UI solamente.
- Centraliza notificaciones y evita duplicados.
- Soporta cambios de horario/cancelaciones sin inconsistencias.

## 3) Tablas/campos tocados (lista cerrada)
Nueva: Reminder
- reminderId
- clientAuthUserId (FK a AuthUser.id; valida que exista registro en Client)
- liveId (FK a Live)
- notifyAt (DateTime)
- status (ACTIVE|CANCELED|SENT)
- createdAt

Nueva: Notification
- notificationId
- recipientType (SHOP|CUSTOMER|ADMIN)
- recipientId
- type (SHOP_LIVE_1H|CUSTOMER_LIVE_15M|LIVE_CHANGED|LIVE_CANCELED|AGENDA_SUSPENDED|PURCHASE_APPROVED)
- dedupeKey (string) o unicidad equivalente
- title
- body
- payload (JSON)
- scheduledAt
- sentAt
- status (QUEUED|SENT|FAILED|CANCELED)
- createdAt

Compatibilidad
- Si existe tabla legacy Agenda/Notification, se conserva sin cambios.
- La nueva Agenda cliente se basa en Reminder.

## 4) Validaciones / edge cases (reglas de negocio)
Acceso
- Solo cliente logueado puede crear/cancelar Reminder.
- Visitante: se bloquea y se solicita login.

Estado del Live (enums exactos)
- Reminder solo si Live.status = UPCOMING.
- Si Live pasa a CANCELLED, BANNED o MISSED -> Reminder pasa a CANCELED.
- Si Live pasa a PENDING_REPROGRAMMATION -> Reminder pasa a CANCELED (se debe crear otro luego).

Unicidad
- Un cliente no puede crear el mismo Reminder dos veces.
- Regla: UNIQUE(clientAuthUserId, liveId).

Idempotencia de notificaciones
- Cancelaciones y cambios deben ser idempotentes.
- Si un Live cambia horario varias veces, no se crean notificaciones duplicadas.
- Regla: Notification debe tener dedupeKey o unicidad por
  (recipientType, recipientId, type, liveId, scheduledAt).

Horario de notificacion
- notifyAt = scheduledAt - 15 minutos (CUSTOMER_LIVE_15M).
- SHOP_LIVE_1H = scheduledAt - 60 minutos.
- Si notifyAt queda en el pasado al crear -> status = SENT (no se encola).

Actualizacion por cambios
- Si Live cambia de horario: actualizar notifyAt y Notification.scheduledAt.
- Si Live cambia de estado: cancelar reminders y encolar LIVE_CHANGED o LIVE_CANCELED.

Google Calendar (externo)
- No requiere tabla adicional.
- La UI genera el link/calendario usando datos de Live.

## 5) Checklist de pruebas (paso a paso)
1) Cliente logueado crea reminder para Live UPCOMING -> se crea Reminder ACTIVE.
2) Cliente no logueado intenta -> bloqueado.
3) Duplicar reminder mismo live -> bloqueado por unicidad.
4) Editar horario del live -> notifyAt se actualiza.
5) Cancelar live -> reminder pasa a CANCELED y notificacion LIVE_CANCELED queda QUEUED.
6) Crear live nuevo -> notificacion SHOP_LIVE_1H queda QUEUED.
7) Verificar que notifyAt no quede en pasado; si queda, status = SENT.

## 6) Rollback plan simple
- Eliminar Reminder y Notification nuevas.
- Volver a usar la agenda legacy (si existia).
- Eliminar cola de notificaciones y procesador.

## 7) Decisiones y notas
- La tabla legacy no se borra en este paso.
- Reminder y Notification son nuevas y no rompen endpoints publicos.
- No se toca login ni /shops, /streams, /reels.
- Notification es cola interna (no envia push/email/whatsapp en este paso).
- El canal real queda post-fase.
