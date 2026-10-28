# Environment Setup Guide

There is **one deployed environment: production**, from `main`. There's no preview environment for now ([ADR](architecture/2026-10-28-no-preview-environment.md)): changes are checked locally on a throwaway database ([`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md)), then merged into `main`. The Preview instructions below are kept for when a staging environment is set up again.

## Branch → Environment Mapping

| Git Branch | Environment | Database Branch | Vercel Environment |
|------------|-------------|-----------------|-------------------|
| `main`     | Production  | `production`    | Production        |
| `develop`  | Integration, not deployed | `development` (local use only) | — (no preview for now) |

## Neon Database Branches

- **Production**: `ep-delicate-firefly-adjnzpid.c-2.us-east-1.aws.neon.tech`
- **Development**: `ep-flat-paper-adc7d7ci.c-2.us-east-1.aws.neon.tech`

Both branches use Prisma migrations and were baselined on 2026-10-24 (see the [migrations ADR](architecture/2026-10-24-switch-to-prisma-migrations.md)). The production build runs `prisma migrate deploy` against production. The development branch is only used locally now (Option A in [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md)), so apply its migrations yourself when you use it.

## Vercel Environment Variables Setup

### Step 1: Go to Vercel Dashboard
1. Navigate to [vercel.com](https://vercel.com)
2. Select your project → **Settings** → **Environment Variables**

### Step 2: Configure DATABASE_URL

Add `DATABASE_URL` for **Production**. The build checks for `DATABASE_URL` right after `prisma generate` and stops with an explanation if it's missing (AIIN-115).

**For Production:**
- Variable: `DATABASE_URL`
- Value: `postgresql://neondb_owner:YOUR_PASSWORD@ep-delicate-firefly-adjnzpid.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Check: ✅ Production only

**For Preview** (only if a preview environment is set up again):
- Variable: `DATABASE_URL`
- Value: `postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-paper-adc7d7ci.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Check: ✅ Preview only

The build refuses to run migrations against the production endpoint unless Vercel says it is the production deploy (`VERCEL_ENV=production`). A Preview scoped to the production URL by mistake fails instead of migrating production.

### Step 3: Configure Branch Deployments
1. Go to **Settings** → **Git**
2. Set **Production Branch** to `main`
3. Vercel builds other branches (including `develop`) as Preview by default. With no preview environment, those builds stop at the `DATABASE_URL` check. To skip them, set **Ignored Build Step** so only `main` builds.

### Other Environment Variables

| Variable | Production | Preview (not in use) | Used for |
|---|---|---|---|
| `AUTH_SECRET` | ✅ | ✅ | NextAuth session signing |
| `AUTH_URL` | `https://getbacktou.com` | the preview URL | NextAuth's base URL for sign-in callbacks. NextAuth reads `AUTH_URL` first, then the older `NEXTAUTH_URL`; an environment that still sets `NEXTAUTH_URL` keeps working. Don't set both to different values. |
| `NEXT_PUBLIC_APP_URL` | `https://getbacktou.com` | the preview URL | Links in emails and the app |
| `APP_URL` | `https://getbacktou.com` | optional | Canonical URL for metadata, `robots.txt` and the sitemap (defaults to getbacktou.com) |
| `GEMINI_API_KEY` | ✅ | ✅ | Every AI feature (one server key; see the [Gemini ADR](architecture/2026-10-24-gemini-models-and-keys.md)) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | ✅ | ✅ | Invitation and notification emails |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | ✅ | ✅ | File storage (resumes, documents, offer letters) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | live keys | **test-mode** keys (`rzp_test_…`) | Checkout and the payment webhook |
| `DAY_TOKEN_SECRET` | optional | optional | Signs placement-programme day links; falls back to `AUTH_SECRET` |

Sign-in is email and password only. No OAuth provider is configured, so `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` aren't needed until Google sign-in is added (AIIN-54).

### Variables you should not set

- `ALLOW_PRODUCTION_DB=1` overrides the production-database guard for a single deliberate run. Never set it in Vercel or in a `.env` file.

## Storage: keep the R2 bucket private

Candidate documents (resumes, Aadhaar, PAN) are served through `GET /api/files/[...key]`, which checks who is asking (see the [authorization ADR](architecture/2026-10-24-authorize-every-data-access-on-the-server.md)).

After that change is deployed, **switch off public access on the R2 bucket** in the Cloudflare dashboard (AIIN-113). `R2_PUBLIC_URL` is still needed: stored file URLs use it as a prefix, and the files route derives the object key from them.

## Resetting Development Database

To sync development with production data:

```bash
neonctl branches reset br-aged-feather-adtfd3nk --project-id silent-voice-80918405 --parent
```

## Local Development

See [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md). In short:

- Put a non-production `DATABASE_URL` in `.env.local`, or use a throwaway local Postgres.
- The example files `.env.development.example` and `.env.production.example` list every variable.
- `npm run dev` refuses to start against the production database.
