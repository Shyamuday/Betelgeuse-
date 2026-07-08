# features/

Each sub-folder is a self-contained **feature module** — a group of components, services, and templates that belong to one user-facing area.

## Current structure

```
features/
  blog/               ← Blog list + blog detail pages (public)
```

## Convention

- One folder per feature domain (e.g. `blog`, `patient-dashboard`, `treatments`, `auth`)
- Components, templates, and feature-level services live together in the same folder
- Feature components import shared utilities from `../../core/` and shared UI from `../../shared/`
- Barrel `index.ts` files are optional — prefer direct named imports for tree-shakability

## Migration status

The following areas are candidates for migration from the root `app/` folder into `features/`:

| Feature | Status |
|---------|--------|
| `blog` | ✅ Moved |
| `patient-dashboard` | Pending |
| `treatments` | Pending |
| `public-pages` (about, faq, careers, etc.) | Pending |
| `auth` | Already in `auth/` sub-folder |
| `account` | Already in `account/` sub-folder |
