# Switch from db push to prisma migrate
**Date:** 2026-10-24  
**Status:** Accepted  
**Deciders:** Engineering

## Context

The current build script runs `prisma db push --accept-data-loss` on every Vercel deploy. This is a prototyping-only command that silently drops columns and tables to force schema alignment. Any schema change on a production deploy can permanently delete user data with no warning and no rollback path.

Identified in the 2026-10-24 product audit as the highest-severity infrastructure finding.

## Decision

Switch to Prisma's migration system:

1. Generate the initial migration from the schema without touching any database (do **not** use `migrate dev` here: on a database that already has data it detects drift and offers to reset it):
   ```
   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o prisma/migrations/0_init/migration.sql
   ```
2. Commit the `prisma/migrations/` directory to the repo (including `migration_lock.toml`)
3. Baseline every existing database once, so `migrate deploy` treats `0_init` as already applied:
   ```
   DATABASE_URL="<database url>" npx prisma migrate resolve --applied 0_init
   ```
   Done for production (`ep-delicate-firefly`) on 2026-10-24. Development (`ep-flat-paper`) still needs it before its next deploy.
4. Change the build script from:
   ```
   prisma generate && prisma db push --accept-data-loss && next build
   ```
   to:
   ```
   prisma generate && prisma migrate deploy && next build
   ```
5. All future schema changes go through `prisma migrate dev` locally, with the generated migration file committed before deploying

## Consequences

**Easier:** Schema changes are auditable, reversible, and safe to deploy. New environments (staging, dev) can be set up reliably with `migrate deploy`.

**Harder:** Schema changes require an extra step (running migrate dev and committing the file). Forgetting to do this before deploying will cause the deploy to fail rather than silently mutating data — which is the correct behavior.

## Alternatives considered

- **Keep db push, just remove --accept-data-loss** — Still not safe for production; db push is non-deterministic on existing databases
- **Manual SQL migrations** — More control, but Prisma's generated migrations are sufficient and reduce maintenance burden
