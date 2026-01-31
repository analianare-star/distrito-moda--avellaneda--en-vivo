CONTRACTS (HIGH-LEVEL)

Source of truth
- Backend: prisma/schema.prisma
- Frontend types: types.ts

API base
- Front uses VITE_API_URL or http://localhost:3000

Core resources (routes)
- /auth
  - GET /auth/me
- /clients
  - GET /clients/me
  - POST /clients/me
  - POST /clients/me/favorites/:shopId
  - DELETE /clients/me/favorites/:shopId
  - POST /clients/me/reminders/:streamId
  - DELETE /clients/me/reminders/:streamId
- /shops
  - GET /shops
  - GET /shops/:id
  - POST /shops (admin)
  - PUT /shops/:id
  - DELETE /shops/:id (admin)
  - POST /shops/:id/buy-stream-quota
  - POST /shops/:id/buy-reel-quota
  - POST /shops/:id/assign-owner
  - POST /shops/:id/accept
  - POST /shops/:id/activate
  - POST /shops/:id/reject
  - POST /shops/:id/suspend-agenda
  - POST /shops/:id/lift-suspension
  - POST /shops/:id/reset-password
- /streams
  - GET /streams
  - GET /streams/:id
  - GET /streams/:id/calendar.ics
  - POST /streams
  - PUT /streams/:id
  - DELETE /streams/:id
  - POST /streams/:id/live
  - POST /streams/:id/continue
  - POST /streams/:id/finish
  - POST /streams/:id/report
  - POST /streams/:id/rate
  - POST /streams/:id/like
  - POST /streams/:id/cancel
  - POST /streams/:id/ban (admin)
  - POST /streams/run-lifecycle (admin)
- /reels
  - GET /reels
  - GET /reels/admin (admin)
  - GET /reels/shop/:shopId
  - POST /reels
  - POST /reels/:id/hide (admin)
  - POST /reels/:id/reactivate (admin)
  - POST /reels/:id/view
- /reports (admin)
  - GET /reports
  - POST /reports/:id/resolve
  - POST /reports/:id/reject
- /purchases (admin + shop)
  - GET /purchases
  - GET /purchases/shop/:shopId
  - POST /purchases/:id/approve
  - POST /purchases/:id/reject
- /notifications
  - GET /notifications (admin)
  - GET /notifications/:userId
  - POST /notifications/:userId/read-all
  - POST /notifications/:id/read
  - POST /notifications/run (admin)
- /payments
  - POST /payments/mercadopago/preference
  - POST /payments/mercadopago/confirm
  - POST /payments/mercadopago/webhook
- /system
  - GET /system/status (admin)
- /testpanel
  - GET /testpanel (admin)
  - POST /testpanel/reset (admin)

Frontend adapters (non-breaking rules)
- updateShop uses a whitelist payload (avoid sending full shop objects).
- fetchShops and fetchStreams map backend fields into frontend shape.
- WhatsApp numbers are only shown to logged-in users; API strips them for guests.

Notes
- Keep contract shapes stable when refactoring structure.
- If a field is added or renamed, update both mapper and type definitions.
