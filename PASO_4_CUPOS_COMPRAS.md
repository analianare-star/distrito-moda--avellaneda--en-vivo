# PASO 4 - CUPOS Y COMPRAS (sin codigo)

Este paso es SOLO especificacion y plan. No se ejecuta nada ni se modifica codigo.

## 1) Que se implementa (alcance)
- Introduccion de QuotaWallet y QuotaTransaction como fuente unica de cupos.
- Introduccion de PurchaseRequest para compras y aprobaciones.
- Migracion de cupos legacy (Shop.streamQuota, Shop.reelQuota) a QuotaWallet.
- Reglas de consumo: base primero, extra despues.
- Bloqueo de compra de VIVOS si Shop.status = AGENDA_SUSPENDED.

## 2) Por que
- Trazabilidad y consistencia de cupos para agenda, sanciones y compras.
- Evitar inconsistencias por campos sueltos en Shop.
- Permitir auditoria (ledger) de consumos y reposiciones.

## 3) Tablas/campos tocados (lista cerrada)
Nueva: QuotaWallet
- shopId (FK 1-1)
- weeklyLiveBaseLimit (0/1/3 segun plan)
- weeklyLiveUsed
- weeklyLiveWeekKey
- liveExtraBalance
- reelDailyLimit (1/3/5 segun plan)
- reelDailyUsed
- reelDailyDateKey
- reelExtraBalance

Nueva: QuotaTransaction
- txnId
- shopId
- resource (LIVE|REEL)
- direction (CREDIT|DEBIT)
- amount
- reason (PLAN_BASE|PURCHASE|MANUAL_COMP|MISSED_BURN|CANCEL_BURN|REPROGRAM|ADMIN_OVERRIDE|EXPIRED_REEL|LEGACY_MIGRATION)
- refType (PURCHASE|LIVE|ADMIN|SYSTEM)
- refId
- actorType (ADMIN|SHOP|SYSTEM)
- actorId
- createdAt

Nueva: PurchaseRequest
- purchaseId
- shopId
- type (LIVE_PACK|REEL_PACK|PLAN_UPGRADE)
- quantity
- status (PENDING|APPROVED|REJECTED|CANCELLED)
- createdAt
- approvedAt
- approvedByAdminId
- paymentProofUrl (opcional)
- notes (opcional)

Shop (legacy)
- streamQuota y reelQuota se mantienen SOLO para compatibilidad durante transicion.

## 4) Validaciones / edge cases (reglas de negocio)
Planes y limites
- ESTANDAR: 0 vivos base/semana; reels diarios 1.
- ALTA: 1 vivo base/semana; reels diarios 3.
- MAXIMA: 3 vivos base/semana; reels diarios 5.

Nota: si hoy el enum de Shop.plan no se llama asi (ej: BASIC/PREMIUM/PRO),
NO renombrar todavia. Solo mapear los planes actuales al limite correspondiente.

Consumo
- Base se consume primero; extra solo cuando base = 0.

Regla BASE (use-it-or-lose-it)
- Los vivos base semanales no se acumulan entre semanas.
- Al cerrar la semana (weeklyLiveWeekKey) el contador se resetea al limite base del plan.
- Cupos base no usados se pierden (no se transfieren).

Regla EXTRA (acumulativo)
- Los vivos EXTRA son acumulativos y no vencen.
- El saldo EXTRA queda en liveExtraBalance y se consume solo si BASE = 0.

Reinicio
- Vivos: reset semanal por weeklyLiveWeekKey.
- Reels: reset diario por reelDailyDateKey.

Compra
- Compra de vivos bloqueada si Shop.status = AGENDA_SUSPENDED y/o agendaSuspendedUntil > now.
- Compra de reels permitida aun con suspension.

Registro obligatorio
- Toda modificacion de cupos genera QuotaTransaction.

Compatibilidad
- Mientras existan campos legacy, deben mantenerse sincronizados.

Cambio de plan
- El nuevo weeklyLiveBaseLimit aplica a partir del proximo ciclo semanal (no en la semana en curso).
- El nuevo reelDailyLimit aplica a partir del proximo dia (no en el dia en curso).
- Decision intencional para evitar inconsistencias y reclamos retroactivos.

Estandar de email tecnico (consistencia)
- Se usa un unico dominio fijo: shop_{shopId}@invalid.local.
- No mezclar dominios (evitar @local.invalid).
- Aplica a backfill y creacion.

## 5) Checklist de pruebas (paso a paso)
1) Crear QuotaWallet para todas las Shops existentes.
2) Validar que el saldo inicial coincide con streamQuota y reelQuota.
3) Agendar un vivo:
   - si base > 0 => decrementa base.
   - si base = 0 y extra > 0 => decrementa extra.
4) Comprar vivos:
   - Shop ACTIVE => PurchaseRequest creada.
   - Shop AGENDA_SUSPENDED => bloqueado.
5) Comprar reels: permitido siempre.
6) Confirmar que cada consumo crea QuotaTransaction.
7) Verificar reset semanal (vivos) y diario (reels) con key de fecha.
8) Cambiar plan y verificar que los limites nuevos se aplican solo al proximo ciclo/dia.

## 6) Rollback plan simple
- Eliminar QuotaWallet, QuotaTransaction, PurchaseRequest.
- Volver a consumir streamQuota y reelQuota desde Shop.
- Quitar sincronizacion con wallet.
