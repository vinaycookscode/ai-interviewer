# Add a Service Layer and Versioned API
**Date:** 2026-10-24  
**Status:** Accepted — implementation pending  
**Deciders:** Engineering

## Context

Currently all business logic lives directly in `actions/` (Next.js Server Actions) and a handful of `app/api/` route handlers. Both call Prisma directly with no intermediate layer:

```
actions/interview-session.ts  →  db.interview.update(...)
actions/scoring.ts            →  db.answer.findUnique(...)
app/api/webhooks/razorpay/    →  db.subscription.update(...)
```

Two repository files (`lib/repositories/interview.repository.ts`, `lib/repositories/user.repository.ts`) and one service file (`lib/services/ai/resume-screener.service.ts`) exist but are **not used by any actions** — the actions bypass them and call Prisma directly.

Problems this causes:
1. **No external API.** There is no way for a future mobile app, a third-party integration, or any tool outside Next.js to interact with the product.
2. **Business logic is duplicated.** Interview completion logic exists in both `actions/interview-session.ts` and partially in `app/api/` routes.
3. **Hard to test.** Server Actions cannot be unit-tested in isolation because they mix auth, DB, and AI calls.
4. **No API versioning.** Any breaking change to action signatures requires frontend changes at the same time.

## Current API surface (what exists today)

| Route | Purpose | Quality |
|---|---|---|
| `app/api/auth/[...nextauth]` | NextAuth session | Framework-managed |
| `app/api/upload/documents` | Document upload to R2 | Calls Prisma directly |
| `app/api/upload/profile` | Profile image upload | Calls Prisma directly |
| `app/api/webhooks/razorpay` | Payment webhook | Calls Prisma directly |
| `app/api/placement/day/[day]` | Placement day data | Calls Prisma directly |
| `app/api/manual-regen` | Admin utility | Calls Prisma directly |
| `app/api/seed-*` | Dev seed scripts | Should not exist in production |

Everything else — interview flow, scoring, mock interviews, subscriptions, company prep, flashcards, mentors, offers — has **no API route at all**.

## Decision

Adopt a three-layer architecture:

```
Transport layer      Business logic       Data access
────────────────     ──────────────────   ──────────────────
actions/         →   lib/services/    →   lib/repositories/  →  Prisma  →  DB
app/api/v1/      →   lib/services/    →   lib/repositories/
```

**Rules:**
- `actions/` become thin: auth check + call the relevant service + return result to UI
- `app/api/v1/` are REST endpoints calling the same services — same logic, different transport
- `lib/services/` own all business logic: validation, AI calls, score computation, email notifications
- `lib/repositories/` own all Prisma queries: no raw `db.*` calls outside repositories
- Seed routes (`app/api/seed-*`) are removed from production builds via middleware or env guard

## Services to create

| Service file | Covers |
|---|---|
| `lib/services/interview.service.ts` | start, submitAnswer, gradeAnswer, complete, notifyEmployer |
| `lib/services/mock-interview.service.ts` | create, generateQuestions, saveAnswer, complete |
| `lib/services/scoring.service.ts` | gradeAnswer, computeAverageScore |
| `lib/services/subscription.service.ts` | activate, charge, cancel, downgrade |
| `lib/services/candidate.service.ts` | profile, onboarding, usage limits |
| `lib/services/company-prep.service.ts` | kit lookup, solution save |

## API routes to create under `app/api/v1/`

```
app/api/v1/
  interviews/
    route.ts                  GET  (list by token/candidate)
    [id]/
      route.ts                GET  (interview by id)
      start/route.ts          POST
      answer/route.ts         POST (submit + async grade)
      complete/route.ts       POST
      feedback/route.ts       GET
  jobs/
    route.ts                  GET, POST
    [id]/route.ts             GET, PUT, DELETE
  candidates/
    me/route.ts               GET (profile)
    me/profile/route.ts       PUT
  mock-interviews/
    route.ts                  POST (create)
    [id]/
      questions/route.ts      GET
      answer/route.ts         POST
      complete/route.ts       POST
  subscriptions/
    route.ts                  GET (current plan + usage)
    upgrade/route.ts          POST
```

## Consequences

**Easier:** External integrations (mobile app, partner tools) can call `api/v1/`. Business logic is testable. Changes to AI providers or DB schema are isolated to services/repositories.

**Harder:** More files and indirection. Server Actions currently work fine for the web UI — adding a service layer adds a step without immediate UI benefit. This is infrastructure work, not feature work.

## Progress

**2026-10-25:** Not started as a layer. Two pieces of business logic have moved out of actions as part of the security fixes and should become services when this work begins:
- `lib/grading.ts`: answer grading; the authorized `gradeAnswer` action is its only public entry point (AIIN-116).
- `lib/upload-validation.ts`: upload size and type checks (AIIN-28).

The ownership checks added under [Authorize every data access on the server](2026-10-24-authorize-every-data-access-on-the-server.md) are written per action today; the service layer is where they should end up.

## Alternatives considered

- **Keep Server Actions only** — works for the current web-only product, but blocks any external integration and keeps logic scattered
- **tRPC instead of REST** — type-safe end-to-end, but adds a dependency and is harder for external callers to use without the client
- **GraphQL** — overkill for the current scale and team size
