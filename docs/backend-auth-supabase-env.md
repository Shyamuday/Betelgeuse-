# Backend Auth + Supabase Env Setup

Use this guide for the current Vitalis architecture where:

- Angular apps call `apps/api` for auth and business APIs.
- Prisma uses Supabase Postgres as the database.

## 1) Required Supabase values

From Supabase dashboard:

- Project URL (example: `https://<project-ref>.supabase.co`)
- Publishable anon key (frontend-safe)
- Service role key (backend only, secret)
- Postgres connection URI for Prisma (`DATABASE_URL`)

## 2) Configure frontend (`apps/web`)

Set only public values in:

- `apps/web/src/environments/environment.ts`
- `apps/web/src/environments/environment.prod.ts`

Expected shape:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000',
  supabaseUrl: 'https://<project-ref>.supabase.co',
  supabaseAnonKey: '<publishable-anon-key>'
};
```

Do not put `DATABASE_URL` or service role key in frontend files.

## 3) Configure backend (`apps/api/.env`)

Set secrets in `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="change-this-before-production"
PORT=4000
WEB_ORIGIN="http://localhost:4200"
DEV_OTP="123456"
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
GOOGLE_CLIENT_ID=""
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Important:

- URL-encode special characters in DB password (`@`, `#`, `%`, `/`, `:`).
- `.env` values must not contain trailing commas.
- Use `DATABASE_URL="..."` format (no extra spaces before/after `=`).

## 4) Set/Reset Supabase DB password

In Supabase:

1. `Project Settings` -> `Database`
2. Set or reset database password
3. Wait 1-2 minutes
4. Copy URI from `Connection string` and update `DATABASE_URL`

## 5) Run Prisma sync

From `apps/api`:

```powershell
npm run prisma:migrate
npm run prisma:generate
```

## 6) If you get P1001 (cannot reach DB)

If direct host/port `5432` is blocked on your network:

- Use Supabase Session Pooler URI (`:6543`) for runtime connectivity:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<DB_PASSWORD>@<pooler-host>:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

Notes:

- `prisma migrate dev` works best with direct DB access.
- Pooler URI is commonly used where direct TCP access is restricted.

## 7) Auth-specific checklist

For backend auth flow to work:

- `JWT_SECRET` is set in `apps/api/.env`
- `WEB_ORIGIN` matches the web app URL
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in backend
- Frontend points to API via `apiUrl`
- Frontend keeps only `supabaseUrl` and `supabaseAnonKey` as public config
