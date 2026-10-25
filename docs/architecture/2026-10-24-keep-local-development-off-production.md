# Keep local development off the production database
**Date:** 2026-10-24  
**Status:** Accepted — implemented (AIIN-114, AIIN-115)  
**Deciders:** Engineering

## Context

The local `.env` pointed at the production Neon branch (`ep-delicate-firefly`). That meant:

- `npm run dev` read and wrote live user data.
- `npm run build` runs `prisma migrate deploy`, so a local build could apply migrations to production.
- `.env` also held live Razorpay keys, so testing checkout locally could create real orders.

Separately, Vercel Preview builds had no `DATABASE_URL`. `prisma.config.ts` falls back to `localhost` so that `prisma generate` works without a database, which made the missing variable surface as a confusing `P1001: Can't reach database server at localhost:5432`.

## Decision

1. **Guard script.** `scripts/guard-production-db.mjs` runs before `next dev` and before `prisma migrate deploy`.
   - It resolves `DATABASE_URL` the way each command does: `next dev` lets `.env.local` override `.env`; Prisma reads `.env` only.
   - It refuses to continue when the host is the production endpoint, unless `VERCEL_ENV=production` (the real production deploy) or `ALLOW_PRODUCTION_DB=1` (a deliberate one-off).
2. **Fail fast without a database.** `scripts/require-database-url.mjs` runs right after `prisma generate` in the build and stops with instructions when `DATABASE_URL` is unset.
3. **Test locally on a throwaway database.** Local testing uses a disposable Postgres with the migrations applied and plans and feature flags seeded, plus dummy Razorpay, Resend and R2 values. See [`docs/LOCAL_DEVELOPMENT.md`](../LOCAL_DEVELOPMENT.md).

The build script is now:

```
prisma generate && node scripts/require-database-url.mjs && node scripts/guard-production-db.mjs build && prisma migrate deploy && next build --webpack
```

## Consequences

**Easier:** A local mistake can no longer reach production data or the production schema. A missing Preview `DATABASE_URL` fails with a message that says what to set.

**Harder:** Running against production on purpose (for example a one-off data check) needs `ALLOW_PRODUCTION_DB=1`. Local testing needs a local or development database set up first.

**Still open:** Vercel Preview still needs `DATABASE_URL` set to the development branch (`ep-flat-paper`), scoped to Preview (AIIN-115). Until then, Preview builds stop at the new check.

## Alternatives considered

- **Only fix `.env` by hand.** Nothing would stop the next copy of a production URL into a local file.
- **Block by `NODE_ENV`.** `next build` runs with `NODE_ENV=production` locally too, so it can't tell a laptop from Vercel. `VERCEL_ENV` can.
- **Separate Neon credentials with no write access for local use.** Worth doing later; it doesn't stop migrations run with the owner role from `.env`.
