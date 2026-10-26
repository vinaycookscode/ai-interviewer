# Local development

Run the app on your machine without touching production data or real payments.

> **Never point local development at production.** The local `.env` has held the production database URL and live Razorpay keys. `npm run dev` and the build's `prisma migrate deploy` refuse to run against the production Neon endpoint; see [the ADR](architecture/2026-10-24-keep-local-development-off-production.md). Don't work around the guard with `ALLOW_PRODUCTION_DB=1` unless you mean it.

## Option A: the development database (quickest)

Put the development branch URL in `.env.local` (it overrides `.env` for `next dev`):

```bash
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-paper-adc7d7ci.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

Then run `npm run dev` and open http://localhost:3000.

The development branch is shared, so don't use it for tests that create or delete a lot of data.

## Option B: a throwaway local database (safest)

Use this when you test sign-up, payments or anything destructive. Everything lives in one folder you can delete.

Requires Postgres 17 (`brew install postgresql@17`).

1. Create the database:

   ```bash
   PG=/opt/homebrew/opt/postgresql@17/bin
   DATA=~/tmp/aiin-pgdata
   LC_ALL=en_US.UTF-8 $PG/initdb -D $DATA -U postgres --auth=trust
   LC_ALL=en_US.UTF-8 $PG/pg_ctl -D $DATA -l $DATA.log -o "-p 5433 -c unix_socket_directories=''" -w start
   $PG/psql -h localhost -p 5433 -U postgres -c "create database aiin_local"
   ```

   `unix_socket_directories=''` makes Postgres listen on TCP only. It avoids socket-path length errors when the data folder is in a deep temporary path.

2. Apply migrations and seed the plans and feature flags. Both seed scripts load `.env` with `dotenv`, which never overrides a variable that's already set, so exporting `DATABASE_URL` first keeps them on the local database:

   ```bash
   export DATABASE_URL="postgresql://postgres@localhost:5433/aiin_local"
   npx prisma migrate deploy
   npx tsx scripts/seed-subscription-plans.ts
   node scripts/seed-features.js
   ```

   Check that the seeds went to the local database. Expect `3|8`:

   ```bash
   $PG/psql "$DATABASE_URL" -tAc 'select (select count(*) from "SubscriptionPlan"), (select count(*) from "FeatureFlag")'
   ```

3. Start the app with dummy keys for payments, email and storage, so nothing real can be charged, sent or uploaded:

   ```bash
   DATABASE_URL="postgresql://postgres@localhost:5433/aiin_local" \
   RAZORPAY_KEY_ID="rzp_test_localdisabled" RAZORPAY_KEY_SECRET="local-disabled" RAZORPAY_WEBHOOK_SECRET="local-disabled" \
   RESEND_API_KEY="re_local_disabled" \
   R2_ACCESS_KEY_ID="local-disabled" R2_SECRET_ACCESS_KEY="local-disabled" R2_ACCOUNT_ID="local-disabled" \
   R2_BUCKET_NAME="local-disabled" R2_PUBLIC_URL="http://localhost:3000/r2-disabled" \
   npm run dev
   ```

   What works this way:
   - **Works:** sign-up, sign-in and every screen.
   - **Stops:** paid checkout stops at Razorpay; emails and uploads fail quietly.
   - **AI features:** still need a real `GEMINI_API_KEY` (from `.env`).

4. When you're done:

   ```bash
   $PG/pg_ctl -D $DATA stop && rm -rf $DATA $DATA.log
   ```

To test checkout end to end, use Razorpay **test-mode** keys (`rzp_test_…`) instead of the dummy values, never live keys.

## Looking at production data (only when the owner decides to)

Sometimes the owner wants to see a change with real accounts and data before it ships. This is the exception the [production guard](architecture/2026-10-24-keep-local-development-off-production.md) allows for a deliberate one-off, and it's the owner's call each time. It was done this way on 2026-10-26, to check the Soft Glass build.

- **Switch off everything that reaches the outside world.** Override the Razorpay, Resend and R2 variables with dummy values (as in Option B) so nothing can charge a card, email a candidate or upload a file.
- **Keep sign-in local.** Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`, or sign-in redirects to the live domain.
- **Never run migrations or `npm run build` against production.** The dev server doesn't migrate. If `npx prisma migrate status` lists unapplied migrations, leave them for the real deploy.
- **Remember it's live data.** Starting a practice, inviting a candidate or editing a job writes real rows that users see. Read, don't change.
- **Clear the cache when switching databases.** Stop the server and delete `.next/dev` before restarting on a different database. A stale chunk shows up as `Cannot read properties of undefined (reading 'call')`.

## Checking a UI change

Every screen supports light and dark, from 320px phones to wide desktops. Before calling a UI change done:

- [ ] Light and dark both look right (theme switch in the header).
- [ ] At **320, 375, 768, 1024 and 1280px**, nothing overflows the page **or its own container**: a header row, a button row, a table. "No horizontal scroll" is not enough on its own.
- [ ] The keyboard reaches every control in visual order, with a visible focus ring.
- [ ] The browser console shows no errors.
- [ ] `npx tsc --noEmit -p .` passes.
- [ ] Every page you changed has been opened in the browser, not just type-checked. Some failures (a server page importing a value from a `"use client"` module) only show up at runtime.
- [ ] It matches the approved artboard on the [design canvas](https://claude.ai/artifact/Q1hFq3HP7UtDQ34dRQ17uQ).

The Soft Glass build guide has the details: [`docs/design/soft-glass.md`](design/soft-glass.md).

## Before committing

1. `npm run build` passes. It needs a reachable `DATABASE_URL` because it runs `prisma migrate deploy`: run it against the throwaway database, never production.
2. Use a conventional commit subject with the Kaam ticket, for example `fix: require interview ownership in grading (AIIN-116)`.
3. Update the ticket in Kaam (project AIIN) with what changed and how you checked it.
