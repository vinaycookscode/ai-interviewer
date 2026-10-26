# Architecture Decision Records (ADRs)

This directory records significant technical decisions made on this project — what was decided, why, and what alternatives were considered.

## Index

| Date | Decision | Status | Tickets |
|---|---|---|---|
| 2026-10-24 | [Switch from db push to prisma migrate](2026-10-24-switch-to-prisma-migrations.md) | Accepted · implemented | AIIN-15 |
| 2026-10-24 | [Add a service layer and versioned API](2026-10-24-api-and-service-layer.md) | Accepted · not started | — |
| 2026-10-24 | [Keep local development off the production database](2026-10-24-keep-local-development-off-production.md) | Accepted · implemented | AIIN-114, AIIN-115 |
| 2026-10-24 | [Authorize every data access on the server](2026-10-24-authorize-every-data-access-on-the-server.md) | Accepted · implemented | AIIN-20, 28, 108, 113, 116, 117 |
| 2026-10-24 | [The server decides plans and payments](2026-10-24-server-decides-plans-and-payments.md) | Accepted · implemented | AIIN-24, 25, 110, 112 |
| 2026-10-24 | [Keep the role in the JWT, recheck every 5 minutes](2026-10-24-session-role-in-jwt.md) | Accepted · implemented | AIIN-30 |
| 2026-10-24 | [Gemini: one server key, a safe default model, bounded retries](2026-10-24-gemini-models-and-keys.md) | Accepted · implemented | AIIN-27, 37, 109, 111 |
| 2026-10-24 | [Track work in Kaam](2026-10-24-track-work-in-kaam.md) | Accepted | — |
| 2026-10-25 | [One size scale and brand tokens for the app interior](2026-10-25-design-system-size-scale.md) | Accepted · implemented, uncommitted | AIIN-118–120 |
| 2026-10-25 | [Soft Glass: the product's design language](2026-10-25-soft-glass-design-language.md) | Accepted · core screens on `develop`, rest in progress | AIIN-122–139 |
| 2026-10-25 | [Employer accounts are invite-only](2026-10-25-employer-accounts-invite-only.md) | Accepted · implemented | AIIN-53 |
| 2026-10-25 | [Design every screen on the canvas before building it](2026-10-25-design-first-on-the-canvas.md) | Accepted · implemented | AIIN-142–148, 156, 186 |
| 2026-10-25 | [App shell: a floating header and a bottom tab bar instead of the sidebar](2026-10-25-app-shell-navigation.md) | Accepted · implemented | AIIN-125 |
| 2026-10-26 | [Send the client only what it needs: never whole user rows](2026-10-26-send-the-client-only-what-it-needs.md) | Accepted · implemented | AIIN-187 |

Proposals that aren't ADRs yet (Upstash rate limiting, Deepgram and Google TTS) are listed in `docs/audits/2026-10-24-master-decision-index.md`.

## Format

Each ADR is a markdown file named `YYYY-MM-DD-short-title.md`, dated the day the decision was made. Add a row to the index above when you add one. When a decision changes, write a new ADR and mark the old one **Superseded by …** rather than rewriting it.

## Template

```markdown
# Title
**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Superseded  
**Deciders:** [names]

## Context
What is the problem or situation that prompted this decision?

## Decision
What was decided?

## Consequences
What becomes easier or harder as a result?

## Alternatives considered
What else was on the table and why was it not chosen?
```

## Why ADRs

When a new engineer joins, or when you revisit a decision six months later, the code shows *what* was built but not *why*. ADRs answer the why. Keep them short — the goal is a record, not a design doc.
