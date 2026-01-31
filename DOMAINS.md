DOMAINS MAP (FRONT + BACK)

Frontend domains (distrito-moda--avellaneda -en-vivo)
- features/client
  - ClientView + client hooks (actions, selectors, gate, view actions)
- features/merchant
  - MerchantView + merchant hooks (actions)
- features/admin
  - AdminView + admin hooks (preview)
- domains/*
  - API modules by business domain:
    - auth, clients, shops, streams, reels, reports, purchases, payments,
      notifications, system, testpanel

Frontend facades
- features/client/index.ts
- features/merchant/index.ts
- features/admin/index.ts

Backend domains (avellaneda-backend)
- src/domains/auth
- src/domains/clients
- src/domains/shops
- src/domains/streams
- src/domains/reels
- src/domains/reviews
- src/domains/reports
- src/domains/agenda
- src/domains/notifications
- src/domains/purchases
- src/domains/payments
- src/domains/penalties
- src/domains/storage
- src/domains/system
- src/domains/testpanel

Backend structure pattern
- controller.ts: HTTP entry
- service.ts: business logic
- repo.ts: DB entry (Prisma client wrapper)

Notes
- Domain names align with Prisma models and API routes.
- Re-exports exist to keep compatibility with legacy import paths.
