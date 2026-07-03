# Super Admin Panel — Task Tracker

Operational checklist for giving `admin-web` full platform control. Work through in order.

**Legend:** ✅ Done · 🔄 In progress · ⬜ Pending

---

## Phase A — Foundation (completed)

| # | Task | API | UI | Status |
|---|------|-----|-----|--------|
| A1 | Store edit (name, address, phone, active) | `PATCH /hr/stores/:id` | Stores page | ✅ |
| A2 | Store staff roster + activate/deactivate | `GET /hr/stores/:id`, `PATCH /hr/store/staff/:id/status` | Stores page | ✅ |
| A3 | Register patient + global patient search | `POST /admin/patients`, `GET /admin/patients/search` | Consumers page | ✅ |
| A4 | Purchase orders list + create | `GET/POST /admin/purchase-orders` | Purchase Orders page | ✅ |
| A5 | Outstanding payments view | `GET /admin/finance/outstanding` | Finance → Outstanding tab | ✅ |
| A6 | Fix doctor activate/deactivate | `PUT /admin/doctors/:id/status` | Doctors page | ✅ |
| A7 | Suppliers + medicines lookup for POs | `GET /admin/suppliers`, `GET /admin/medicines` | Purchase Orders create form | ✅ |

---

## Phase B — Super-admin power (completed)

| # | Task | API | UI | Status |
|---|------|-----|-----|--------|
| B1 | Audit log CSV export | `GET /admin/audit-logs?export=csv` | Audit Trail page | ✅ |
| B2 | Consultation status override / cancel | `PATCH /admin/consultations/:id/status` | Consultations page | ✅ |
| B3 | Platform admin user management | `GET/POST /admin/admins`, `PATCH .../status` | Admin Users page | ✅ |
| B4 | Supplier directory CRUD | `GET/POST /admin/suppliers`, `PATCH /admin/suppliers/:id` | Suppliers page | ✅ |
| B5 | Medicine catalog admin | `GET/POST /admin/medicines`, `PUT /admin/medicines/:id` | Medicines page | ✅ |

---

## Phase C — Extended platform control

| # | Task | API | UI | Status |
|---|------|-----|-----|--------|
| C1 | Lab referrals admin UI | — | — | ⏭ Skipped |
| C2 | Case Analysis AI / clinical media | — | — | ⏭ Skipped |
| C3 | Inventory stock levels per branch | `GET /admin/inventory/overview`, `GET .../stores/:id/stock` | Inventory page | ✅ |
| C4 | Notification templates / broadcast | `GET/POST/PATCH /admin/notifications/templates`, `POST /admin/notifications/broadcast` | Notifications page | ✅ |
| C5 | Audit log retention / RBAC matrix | `GET/POST /admin/audit-retention/*`, `GET /admin/rbac/matrix` | Security page | ✅ |

---

## Future (optional)

| # | Task | Notes |
|---|------|-------|
| F1 | ~~Patient in-app notification inbox~~ | ✅ Done — all apps have bell + inbox API |
| F2 | Admin inventory adjustments | Read-only overview; store managers adjust stock locally |
| F3 | Real-time socket push in bell UI | ✅ Done — `socket.io-client` in all apps; bell listens for `notification:new` |

---

## Phase D — Portal user management (completed)

| # | Task | API | UI | Status |
|---|------|-----|-----|--------|
| D1 | Ecosystem portal users (6 roles) | `GET/POST/PATCH /admin/ecosystem-users` | Portal Users page | ✅ |
| D2 | Staff & partner portal users | `GET/POST/PATCH /admin/portal-users` | Portal Users → Staff / Partner tabs | ✅ |
| D3 | Corporate enrollments admin | `GET/POST/DELETE .../corporates/:id/enrollments` | Portal Users → Corporate tab | ✅ |
| D4 | Insurance claims oversight | `GET /admin/ecosystem-users/insurance/claims` | Portal Users → Insurance tab | ✅ |

---

## Implementation order

**Phase A–B:** stores, patients, POs, finance, audit, consultations, admins, suppliers, medicines  
**Phase C:** inventory overview → notification templates/broadcast → security (RBAC + retention)

---

## Document history

| Date | Change |
|------|--------|
| 2026-07-03 | Phase B complete (B1–B5) |
| 2026-07-03 | Platform in-app notifications (inbox API + bell in all 19 web apps) |
| 2026-07-03 | Portal Users admin (ecosystem + staff/partner + corporate enrollments + insurance claims) |
| 2026-07-03 | Socket push in notification bell across all apps |
