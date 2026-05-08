# Web and mobile deployment from the same code

Vitalis uses **one Angular application per audience** (patient, doctor, admin). Each app is built once and deployed **as a website** (static hosting) and **packaged as a native shell** (Ionic + Capacitor) without duplicating business logic.

## Architecture

| Audience | Source app | Website output | Mobile wrapper |
|----------|------------|----------------|----------------|
| Patient | `apps/web` | Static files from `ng build` | `apps/mobile-patient` |
| Doctor | `apps/doctor-web` | Same | `apps/mobile-doctor` |
| Admin | `apps/admin-web` | Same | `apps/mobile-admin` |

The folders under `apps/mobile-*` are **thin Capacitor projects**. Their WebView loads the **production build** of the matching Angular app copied into `www/browser`. The placeholder Ionic pages under `mobile-*/src` are only relevant if you run `ionic serve` inside the shell; **store builds should always run `build:spa` + `sync`** so patients and staff see the real Vitalis UI.

## Web deployment

1. Set production values in each app’s `src/environments/environment.prod.ts` (API base URL, Supabase URL/key as needed).
2. From the app directory, build with the default configuration (typically `base href="/"`):

   ```bash
   npm run build --prefix apps/web
   npm run build --prefix apps/doctor-web
   npm run build --prefix apps/admin-web
   ```

3. Upload the build output to your host. With the Angular application builder, artifacts usually land under `dist/<project>/browser` when no custom `outputPath` is set; if your `angular.json` only sets `browser`, check the CLI output for **Output location**.

4. Configure the host to serve `index.html` for client-side routes (SPA fallback).

5. Run the API (`apps/api`) on a reachable HTTPS origin and ensure CORS allows your web origins if the browser calls the API from a different domain.

## Mobile deployment (Capacitor)

Mobile builds use the **same** Angular source but a **relative base href** so assets resolve inside the WebView.

### Per-app commands

From repository root:

```bash
# Patient — builds apps/web into mobile-patient/www, then updates Android/iOS assets
npm run mobile:patient:sync

# Doctor
npm run mobile:doctor:sync

# Admin
npm run mobile:admin:sync
```

Equivalent from each mobile directory:

```bash
npm run sync --prefix apps/mobile-patient
```

`sync` runs `build:spa` (production Angular build with `--base-href ./` and output under `../mobile-*/www`) and then `npx cap sync`.

### Native projects

- **Android:** after sync, open `apps/mobile-*/android` in Android Studio, set signing, then build an AAB/APK for Play Console.
- **iOS (macOS only):** from each `apps/mobile-*` folder, run `npx cap add ios` once if the `ios` folder is not present, then `npx cap open ios` and archive in Xcode.

### App identifiers

Configured in each `capacitor.config.ts`:

- Patient: `in.vitaliscare.patient` — **Vitalis Patient**
- Doctor: `in.vitaliscare.doctor` — **Vitalis Doctor**
- Admin: `in.vitaliscare.admin` — **Vitalis Admin**

## Environments and secrets

- **Never** commit production API keys or secrets; use CI variables or host-specific env injection.
- Patient, doctor, and admin SPAs read `environment.prod.ts` at **build time**. Rebuild (web and/or mobile) when URLs or feature flags change.
- The API (`apps/api`) uses its own environment (e.g. `JWT_SECRET`, database URL, Razorpay, Twilio) on the server, independent of the front-end build.

## Repository hygiene

- `apps/mobile-*/www/` is **gitignored**; it is produced by `build:spa` / `sync`.
- Generated Android build folders may be ignored per root `.gitignore`; commit the **Capacitor Android project** so CI and teammates can open/sync without re-running `cap add android`.

## CI suggestion

- **Web:** lint + build `apps/web`, `apps/doctor-web`, `apps/admin-web`; optionally upload artifacts to hosting.
- **Mobile:** optionally add a job that runs `npm run mobile:patient:sync` (etc.) on a runner with Android SDK **or** only verifies `build:spa` and relies on local/Xcode workflows for store binaries.

## Quick reference

| Goal | Command |
|------|---------|
| Develop patient site | `npm run dev:web` |
| Ship patient site | `npm run build --prefix apps/web` → deploy output |
| Ship patient app binary | `npm run mobile:patient:sync` → Android Studio / Xcode |

Same pattern for `doctor-web` / `mobile-doctor` and `admin-web` / `mobile-admin`.

## Tooling (lint & format)

- **Lint:** Every app under `apps/*` uses the same pattern: `npm run lint` runs **`tsc -p tsconfig.app.json --noEmit`** (API uses project `tsconfig` via its script). Ionic shells no longer use ESLint for CI.
- **Format:** Repo-wide Prettier lives at **`.prettierrc`** (root). From the monorepo root, after `npm install`: **`npm run format`** (write) or **`npm run format:check`** (CI-style check). Paths are scoped in **`.prettierignore`** (e.g. `node_modules`, `www`, native projects).
