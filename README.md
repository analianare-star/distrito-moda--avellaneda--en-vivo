# Distrito Moda - Avellaneda en Vivo (Frontend)

SPA de live shopping mayorista. Tres roles con flujos distintos: cliente, tienda y admin.

## Que es / como funciona
- **Cliente**: navega vivos/tiendas/reels, interactua si esta logueado.
- **Tienda**: panel privado para agenda, reels, identidad, cupos y redes.
- **Admin**: panel de control para alta de tiendas, moderacion y operaciones.

La vista que ve cada usuario se decide por `GET /auth/me` (backend) y el token de Firebase.

## Stack
- React 19 + Vite 5
- TypeScript
- Firebase Auth (Google + Email/Clave)
- Tailwind CSS + Lucide

## Requisitos
- Node.js LTS

## Configuracion
Crear `.env.local` (o `.env.production`) con:
```
VITE_API_URL=http://localhost:3000
```
En produccion:
```
VITE_API_URL=https://avellaneda-backend.onrender.com
```

## Inicio rapido
1) `npm install`
2) `npm run dev`
3) Abrir `http://localhost:5173`

## Scripts utiles
- `npm run dev` - entorno local
- `npm run build` - build de produccion
- `npm run preview` - preview del build

## Estructura del repo
- `App.tsx` - orquestador de UI y roles
- `components/` - UI (modales, dashboards, tarjetas)
- `services/api.ts` - cliente HTTP y mapeos
- `firebase.ts` - auth (Google/email)
- `types.ts` / `constants.ts` - tipos y reglas UI

## Deploy (Firebase Hosting)
```
npm run build
npx firebase deploy --only hosting
```

## Documentacion funcional
- `MODELO_FINAL_CONGELADO.md`
- `PASO_4_CUPOS_COMPRAS.md`
- `PASO_5_AGENDA_NOTIFICACIONES.md`
- `PASO_6_RATINGS_REPORTS.md`
- `PASO_7_MOTOR_SANCIONES_AUDITORIA.md`
