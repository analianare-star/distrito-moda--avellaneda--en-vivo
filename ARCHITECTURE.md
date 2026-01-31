ARCHITECTURE - DISTRITO MODA / AVELLANEDA EN VIVO (2026)

Scope
- Frontend repo: C:\Users\Distrito Moda\Desktop\distrito-moda--avellaneda -en-vivo
- Backend repo:  C:\Users\Distrito Moda\Desktop\avellaneda-backend

High level goals
- Keep current behavior stable while improving structure.
- Organize code by domain and by role.
- Preserve API contracts and UX.

Frontend architecture (current)
- React + Vite + TypeScript + Tailwind + CSS Modules.
- Entry: App.tsx -> useAppShell -> RoleRouter -> features/*/View.
- "domains/" holds API modules by domain (HTTP client + domain calls).
- "features/*" holds role UIs (client, merchant, admin).
- Hooks by role live in features/*/hooks with re-exports in hooks/* for compatibility.
- Facades per role exist in features/<role>/index.ts to provide a single import path.

Backend architecture (current)
- Node + Express + Prisma + PostgreSQL.
- Routes in src/routes; each route imports domain controller.
- Domains live in src/domains/<name>/:
  - controller.ts (HTTP handlers)
  - service.ts (business logic)
  - repo.ts (DB client entry for the domain)
- Prisma schema in prisma/schema.prisma is the source of truth for data models.

Known non-breaking refactors completed
- Domain separation in front and back (structure only).
- API modules split by domain in the frontend.
- Facades per role in the frontend.
- Domain repo entry points in the backend (thin layer, ready to grow).

Constraints
- Do not change behavior while refactoring.
- Keep mobile UX intact.
- Preserve public API contracts.

Next steps (safe)
- Expand backend repo layer to move query blocks out of services (optional).
- Add domain docs per feature (streams, reels, payments, roles).
- Address product pending items (post-payment UX, overlay z-index, ledger/audit).
