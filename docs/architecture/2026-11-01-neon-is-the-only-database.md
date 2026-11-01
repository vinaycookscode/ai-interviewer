# Neon is the only database; no unused integrations on the Vercel project
**Date:** 2026-11-01  
**Status:** Accepted · implemented  
**Deciders:** Vinay

## Context

The 2026-11-01 release failed before building, with Vercel's message "Resource provisioning failed". A Prisma Postgres database had been attached to the Vercel project through the marketplace in November 2025. It had had zero operations since at least July, and it had gone into an error state. Vercel won't deploy a project while an attached integration resource is broken, so an unused database blocked every production deploy, including redeploying the previous release.

The app reads only `DATABASE_URL`, which points at the Neon production branch (`ep-delicate-firefly`). `prisma.config.ts` uses nothing else.

## Decision

- **Neon is the production database, through `DATABASE_URL` alone.**
- **The Prisma Postgres integration is disconnected from the project.** Disconnecting removed its unused `POSTGRES_URL` and `PRISMA_DATABASE_URL` variables; `DATABASE_URL` and every other variable stayed. The database itself still exists in Vercel Storage and can be deleted.
- **Nothing is attached to the Vercel project unless the app uses it.** An integration that provisions resources is a dependency of every deploy, even when no code reads it.
- **When a deploy fails with no build log,** check the project's integrations and Storage first (the deployment's `errorMessage` via Vercel's API, or its page).

## Consequences

**Easier:** Deploys depend on one database. The environment variables match what the code reads.

**Harder:** Nothing new; the leftover Prisma database should be deleted to finish the clean-up.

## Alternatives considered

- **Repair the Prisma Postgres resource:** it holds no data the app uses, so a repair would only keep a dead dependency.
- **Move to Prisma Postgres:** no reason to; Neon works, and it's where the data is.

## Related

- [Keep local development off the production database](2026-10-24-keep-local-development-off-production.md): the same production endpoint, guarded locally. The one-off badge backfill on 2026-11-01 ran against it deliberately, at the owner's request, as that ADR allows.
