# Consolidated frontend apps

The platform uses **3 primary web portals** (+ API).

## App map

| Portal | App folder | Port | Includes |
|--------|------------|------|----------|
| **Patient** | `apps/user-web` | 4200 | Patient mobile/web (Capacitor) |
| **Clinical** | `apps/doctor-web` | 4202 | Doctor consultations |
| **Operations** | `apps/operations-web` | 5800 | All staff, partners, store counter, store manager, embedded admin |
| **Admin UI source** | `apps/admin-web` | — | Compiled into operations-web at `/admin/*` |
| **API** | `apps/api` | 4000 | Backend |

Legacy per-role apps (`hr-web`, `partners-web`, `store`, etc.) have been **removed**. Root `dev:*` scripts alias to `dev:operations`.

## Auth model

- Login: `POST /auth/staff-login` with email + password (platform users and store staff)
- Session: `GET /me` for platform users; store staff receive capabilities in the login response
- Nav from `libs/platform-nav` filtered by capabilities

## Dev commands

```bash
npm run dev:operations   # http://localhost:5800 — everything except patient/doctor
npm run dev:admin        # alias → operations-web
npm run dev:doctor       # http://localhost:4202
npm run dev:user         # http://localhost:4200
```

## Store staff

- Counter: `staff@ranchi.vitalis.local` → `/store/dashboard`
- Manager: `manager@ranchi.vitalis.local` → `/store-manager/dashboard`
- No PIN login — email + password only

## Migration status

- [x] Single operations portal (staff + partners + store)
- [x] Email/password auth for store staff
- [x] Full admin console embedded at `/admin/*`
- [x] Legacy app folders removed
- [x] CI builds consolidated apps only
