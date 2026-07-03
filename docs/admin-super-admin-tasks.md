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

## Phase C — Later (not in scope unless requested)

| # | Task | Notes |
|---|------|-------|
| C1 | Lab referrals admin UI | Skipped — no referral commission model |
| C2 | Case Analysis AI / clinical media | Skipped — no AI for now |
| C3 | Inventory stock levels per branch | Needs store-scoped stock API for admin |
| C4 | Notification templates / broadcast | New subsystem |
| C5 | Audit log retention / RBAC matrix | Compliance hardening |

---

## Implementation order

1. B1 Audit CSV export  
2. B2 Consultation status override  
3. B3 Platform admin users  
4. B4 Supplier directory  
5. B5 Medicine catalog  

---

## Document history

| Date | Change |
|------|--------|
| 2026-07-03 | Phase B complete (B1–B5) |
