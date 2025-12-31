# MODELO FINAL CONGELADO (Paso 1)

Documento unificado y final del modelo de datos. No hay codigo. Solo definiciones.

## 0) Objetivo
Congelar el modelo para soportar, sin ambiguedades:
- Perfil Cliente (visitante + logueado)
- Perfil Tienda (panel, cupos, vivos, reels, sanciones)
- Perfil Admin (verificacion, moderacion, override, compras, auditoria)
- Agenda de vivos, reprogramaciones y penalizaciones

## 1) Lista cerrada de entidades / tablas
Identidad y roles:
- AuthUser
- Client
- Shop
- Admin

Contenido y agenda:
- Live (Vivo / Stream)
- Reel

Interacciones cliente:
- Reminder
- Favorite
- Like
- LiveRating
- LiveReport
- ReelView

Operaciones de negocio:
- QuotaWallet
- QuotaTransaction
- PurchaseRequest

Moderacion y auditoria:
- AgendaSuspension
- LiveScheduleEvent
- AuditLog
- Notification

Agregados:
- ShopAggregate

## 2) Enums y estados finales (sin abreviaciones ambiguas)
AuthUser.userType:
- CLIENT
- SHOP
- ADMIN

AuthUser.status:
- ACTIVE
- SUSPENDED

Admin.role:
- SUPERADMIN
- MODERATOR

Admin.adminStatus:
- ACTIVE
- SUSPENDED

Shop.plan:
- ESTANDAR
- ALTA
- MAXIMA

Shop.status:
- PENDING_VERIFICATION
- ACTIVE
- AGENDA_SUSPENDED
- HIDDEN
- BANNED

Live.status:
- UPCOMING
- LIVE
- FINISHED
- MISSED
- CANCELLED
- BANNED
- PENDING_REPROGRAMMATION

Reel.status:
- ACTIVE
- EXPIRED
- HIDDEN

PurchaseRequest.status:
- PENDING
- APPROVED
- REJECTED
- CANCELLED

PurchaseRequest.type:
- LIVE_PACK
- REEL_PACK
- PLAN_UPGRADE

Reminder.status:
- ACTIVE
- CANCELED
- SENT

Notification.type:
- SHOP_LIVE_1H
- CUSTOMER_LIVE_15M
- LIVE_CHANGED
- LIVE_CANCELED
- AGENDA_SUSPENDED
- PURCHASE_APPROVED

Notification.status:
- QUEUED
- SENT
- FAILED
- CANCELED

LiveReport.status:
- OPEN
- VALIDATED
- REJECTED

QuotaTransaction.resource:
- LIVE
- REEL

QuotaTransaction.direction:
- CREDIT
- DEBIT

QuotaTransaction.reason:
- PLAN_BASE
- PURCHASE
- MANUAL_COMP
- MISSED_BURN
- CANCEL_BURN
- REPROGRAM
- ADMIN_OVERRIDE
- EXPIRED_REEL

QuotaTransaction.actorType:
- ADMIN
- SHOP
- SYSTEM

## 3) Relaciones funcionales (lenguaje de negocio)
AuthUser y perfiles:
- Cada AuthUser tiene exactamente un perfil: Client o Shop o Admin.
- Client, Shop y Admin son 1-1 con AuthUser.

Shop y contenido:
- Una Shop crea muchos Lives y muchos Reels.
- Un Live pertenece a una Shop.
- Un Reel pertenece a una Shop.

Cliente e interacciones:
- Un Client puede marcar Shops como Favorite.
- Un Client puede dar Like a Shop/Live/Reel.
- Un Client puede dejar LiveRating en un Live.
- Un Client puede enviar LiveReport sobre un Live.
- Un Client puede crear Reminders de Lives.
- Un Client puede ver Reels (ReelView).
- Un Client puede Compartir Shops y Lives (share nativo).
- Un Client puede Descargar la Tarjeta Digital de la Shop.

Cupos y compras:
- Cada Shop tiene un QuotaWallet (1-1).
- Cada movimiento genera un QuotaTransaction.
- Una PurchaseRequest pertenece a una Shop y puede ser aprobada por un Admin.

Agenda y sanciones:
- AgendaSuspension pertenece a una Shop.
- Una suspension puede ser creada por Admin o por el sistema.
- LiveScheduleEvent registra cada cambio de agenda (crear, editar, cancelar, reprogramar, override).

Auditoria y notificaciones:
- AuditLog registra acciones de Admin/Shop/System sobre Shop/Live/Reel.
- Notification pertenece a un destinatario (Client/Shop/Admin).

Agregados:
- ShopAggregate guarda ratingAvg y ratingCount por Shop.

## 4) Reglas de negocio criticas y edge cases (sin implementacion)
Identidad:
- Email unico.
- Usuario SUSPENDED no puede ejecutar acciones sensibles.
- No se permite un AuthUser con multiples perfiles.

Cliente:
- Visitante puede ver contenido pero NO puede: WhatsApp, reportar, calificar, favoritos cloud, recordatorios.
- Cliente logueado habilita: WhatsApp, reportes, ratings, favoritos y recordatorios.
- Compartir (vivos/tiendas) esta habilitado para ambos estados.
- Descargar Tarjeta Digital requiere datos completos de Shop.

Recordatorios (interno y externo):
- Interno: se usa Reminder para notificacion del sistema (ej. 15 min antes).
- Externo: la UI ofrece "Agregar a Google Calendar" usando datos de Live (titulo, fecha y hora exacta).
- No requiere tabla adicional ni persistencia extra en DB.

WhatsApp (privacidad y plan):
- La restriccion es de servidor: si no corresponde, los numeros NO viajan en el JSON.
- Limite por plan: ESTANDAR 1, ALTA 2, MAXIMA 3.

Cupos:
- ESTANDAR: 0 vivos base/semana.
- ALTA: 1 vivo base/semana.
- MAXIMA: 3 vivos base/semana.
- Extra se consume solo si el base es 0.
- Reels diarios se reinician cada 24h; reels extras no expiran.
- Agenda suspendida bloquea comprar/editar/agendar/cancelar vivos.

Agenda:
- Maximo 1 vivo por dia por tienda.
- Maximo 7 vivos por semana (base + extras).
- Live UPCOMING puede editarse/cancelarse si no hay suspension.
- Live LIVE/FINISHED/MISSED no se edita ni cancela.

Reportes:
- Solo CLIENT logueado cuenta para penalizacion.
- Reportes dentro de los 5 minutos de gracia no penalizan.
- 5 reportes validos => Live MISSED + perdida de cupo + suspension.

Ratings:
- Solo logueados.
- Solo vivos finalizados.
- Un cliente solo puede calificar un live una vez.

Reels:
- Expiran a las 24h exactas.
- Reels ocultos por admin no aparecen.

Tarjeta Digital (origen de datos):
- La Tarjeta siempre se construye con datos de la entidad Shop.
- El rating mostrado se toma de ShopAggregate (ratingAvg, ratingCount).

## 5) Ajustes quirurgicos integrados (ultimo acuerdo)
Shop.status vs agenda:
- Shop puede estar ACTIVE para el publico, pero con agenda bloqueada por AGENDA_SUSPENDED.

QuotaTransaction.reason:
- Agregar EXPIRED_REEL para registrar expiracion por ciclo de 24h.

Privacidad WhatsApp:
- No basta ocultar el boton en UI. Si no corresponde, NO se devuelven numeros desde la API.

PENDING_REPROGRAMMATION y cupos:
- El estado PENDING_REPROGRAMMATION congela el cupo.
- El cupo se quema (MISSED_BURN) si la tienda no resuelve la reprogramacion tras recuperar su cuenta
  o si el live se pierde por responsabilidad directa.
- Ventana de resolucion: 48 horas despues de recuperar la cuenta. Pasado ese plazo => MISSED_BURN.

Consistencia de reportes:
- Solo reportes de CLIENT logueado disparan penalizacion despues de la gracia de 5 min.

Integracion con data existente:
- AuthUser es la base prioritaria.
- Se debe mapear data actual (Shop/Stream/Reel) a la nueva identidad sin perdida de integridad.

## 6) Checklist de consistencia (sin codigo)
Compatibilidad:
- El modelo permite convivir con data actual (Shop, Stream, Reel).
- AuthUser se agrega sin romper flujos existentes.

Flujos cubiertos:
- Cliente: ver, seguir, agendar recordatorio, reportar, calificar.
- Cliente: compartir y agregar a Google Calendar desde el Live.
- Tienda: editar datos y redes, agendar vivos, subir reels, suspension y reprogramacion.
- Admin: activar/rechazar tienda, suspender agenda, override, moderar reels, aprobar compras.

Reglas criticas:
- WhatsApp solo logueado + limite por plan (servidor).
- Suspension bloquea agenda y compra de vivos.
- Reportes validos => MISSED + penalizacion.
- Reprogramacion con conflicto => PENDING_REPROGRAMMATION.
- Cambios directos por SQL en Shop.status requieren resync/backfill; no es bug.

## 7) POST-FASE (no critico ahora)
- Integracion real de pagos.
- Notificaciones push/email reales (solo estructura por ahora).
- Moderacion automatica de multimedia (IA).
- Metricas en tiempo real (viewersCount real).
