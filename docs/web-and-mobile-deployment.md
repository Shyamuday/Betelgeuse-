# Web and mobile deployment from the same code

Vitalis uses **one Angular application per audience**. Each app is built once and deployed **as a website** (static hosting) and, where applicable, **packaged as a native shell** (Ionic + Capacitor) without duplicating business logic.

## Architecture

| Audience | Source app | Website | Mobile wrapper (Capacitor 8) |
|----------|------------|---------|------------------------------|
| Patient | `apps/user-web` | `ng build` → `dist/user-web/browser` | `apps/mobile-patient` |
| Doctor | `apps/doctor-web` | Same | `apps/mobile-doctor` |
| Platform admin | `apps/admin-web` | Same (also embedded in operations) | `apps/mobile-admin` |
| Operations staff | `apps/operations-web` | Port 5800 — **web only** (no store shell yet) | — |

The folders under `apps/mobile-*` are **thin Ionic/Capacitor projects**. Their WebView loads the **production build** of the matching Angular app copied into `www/browser`. Placeholder pages under `mobile-*/src` are only for `ionic serve` inside the shell; **store builds must run `sync`** so users see the real Vitalis UI.

> **Note:** `apps/web` is a legacy patient fork from an older branch. Use **`apps/user-web`** for patient web and mobile.

## Web deployment

1. Set production values in each app’s `src/environments/environment.prod.ts` (API base URL, etc.).
2. Build from the repository root:

   ```bash
   npm run build:user
   npm run build:doctor
   npm run build:operations
   ```

3. Deploy the build output (`dist/<project>/browser`) to static hosting with SPA fallback (`index.html` for client routes).
4. Run the API (`apps/api`) on HTTPS and allow your web origins in CORS.

## Mobile deployment (Capacitor)

Mobile builds use the **same** Angular source with **`--base-href ./`** so assets resolve inside the WebView.

### Commands (from repository root)

```bash
# Patient — builds user-web into mobile-patient/www, then cap sync
npm run mobile:patient:sync
npm run mobile:patient:android   # open Android Studio

# Doctor
npm run mobile:doctor:sync
npm run mobile:doctor:android

# Platform admin (admin-web SPA, not operations-web)
npm run mobile:admin:sync
npm run mobile:admin:android
```

Equivalent from each mobile directory:

```bash
npm run sync --prefix apps/mobile-patient
```

`sync` runs `build:spa` (production Angular build with `--base-href ./` and output under `apps/mobile-*/www`) and then `npx cap sync`.

### Native projects

- **Android:** after sync, open `apps/mobile-*/android` in Android Studio, configure signing, build AAB/APK.
- **iOS (macOS only):** run `npx cap add ios` once if needed, then `npx cap open ios` and archive in Xcode.

### App identifiers (`capacitor.config.ts`)

| Shell | Bundle ID | Store name |
|-------|-----------|------------|
| `mobile-patient` | `in.vitaliscare.patient` | Vitalis Patient |
| `mobile-doctor` | `in.vitaliscare.doctor` | Vitalis Doctor |
| `mobile-admin` | `in.vitaliscare.admin` | Vitalis Admin |

Patient mobile uses the **`mobile-patient`** shell only (not an in-app Capacitor config under `user-web`).

## Environments and secrets

- **Never** commit production API keys or secrets; use CI variables or host env injection.
- SPAs read `environment.prod.ts` at **build time**. Rebuild web and/or mobile when URLs or feature flags change.
- The API uses its own env (`JWT_SECRET`, `DATABASE_URL`, Razorpay, Twilio), independent of front-end builds.

## Repository hygiene

- `apps/mobile-*/www/` is **gitignored**; produced by `build:spa` / `sync`.
- Commit Capacitor **Android** project folders so teammates can sync without re-running `cap add android`.

## CI suggestion

- **Web:** lint + `npm run build:all` (user-web, doctor-web, operations-web).
- **Mobile:** optionally verify `npm run mobile:patient:sync` on a runner with Android SDK, or only run `build:spa` in CI and leave store binaries to local/Xcode workflows.

## Quick reference

| Goal | Command |
|------|---------|
| Develop patient site | `npm run dev:user` |
| Ship patient site | `npm run build:user` → deploy `dist/user-web/browser` |
| Ship patient app | `npm run mobile:patient:sync` → Android Studio / Xcode |
| Develop doctor site | `npm run dev:doctor` |
| Ship doctor app | `npm run mobile:doctor:sync` |
| Operations staff portal | `npm run dev:operations` (web only, port 5800) |
| Platform admin mobile | `npm run mobile:admin:sync` |

## Tooling

- **Lint:** `npm run lint` per app (`tsc -p tsconfig.app.json --noEmit` for Angular apps).
- **Format:** root Prettier (`.prettierrc`) — `npm run format` / `format:check` when configured at root.
