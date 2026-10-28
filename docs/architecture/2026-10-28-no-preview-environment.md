# No preview environment for now: check locally, deploy to production
**Date:** 2026-10-28  
**Status:** Accepted  
**Deciders:** Vinay

## Context

`develop` was meant to deploy to a Vercel Preview environment backed by the development Neon branch (`ep-flat-paper`). Preview never had a `DATABASE_URL`, so every Preview build failed (AIIN-115). Setting it up properly also needs the Preview copies of every other variable (auth, Gemini, Resend, R2, Razorpay test keys) and keeping them in step.

Meanwhile, the checks that matter now run locally. Every change is built and clicked through on a throwaway database with payments, email and uploads switched off ([`docs/LOCAL_DEVELOPMENT.md`](../LOCAL_DEVELOPMENT.md)). Flows that touch outside services are tested end to end against local stand-ins: email through a local capture server, and the Razorpay webhook with a local secret. That's how AIIN-16, AIIN-21, AIIN-25, AIIN-110 and AIIN-112 were verified on 2026-10-28.

## Decision

- **No Preview environment for now.** `develop` is the integration branch; it isn't deployed.
- **Check locally, then release to production** by merging `develop` into `main` and pushing. The production build applies migrations (`prisma migrate deploy`) as before.
- **The production guards stay:** `npm run dev` and a non-production build still refuse the production database ([ADR](2026-10-24-keep-local-development-off-production.md)).
- **Preview builds still triggered by Vercel** stop at `require-database-url.mjs` ("DATABASE_URL is not set") without touching anything. To stop them, skip non-production branches in Vercel → Settings → Git → Ignored Build Step.
- AIIN-115 is closed by this decision.

## Consequences

**Easier:** One environment to configure and keep in step. No half-configured Preview that fails on every push.

**Harder:**
- Nothing between a laptop and production. A problem that only shows on Vercel (an environment variable, an edge or runtime difference) is found in production.
- Real payments can't be tried end to end before release: production has live Razorpay keys, and there's nowhere to use test keys except locally.
- Shareable review links for a change don't exist; review happens on the design canvas and locally.

**Mitigations:** check every change locally, as `AGENTS.md` requires (build, browser, light and dark, keyboard), and run the post-deployment checklist in [`DEPLOYMENT.md`](../../DEPLOYMENT.md) after each release.

**Revisit when:** a second developer joins, payments change, or a release breaks something that a staging run would have caught. Then set up Preview as [`docs/ENVIRONMENT_SETUP.md`](../ENVIRONMENT_SETUP.md) describes and reopen AIIN-115.

## Alternatives considered

- **Configure Preview now.** It's the safer pipeline, but it costs setup and upkeep for every variable while there's one developer and every change is already checked locally.
- **A separate staging project.** The same costs plus a second domain; not worth it yet.
