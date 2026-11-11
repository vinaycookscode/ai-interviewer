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
| 2026-10-25 | [One size scale and brand tokens for the app interior](2026-10-25-design-system-size-scale.md) | Accepted · implemented | AIIN-118–120 |
| 2026-10-25 | [Soft Glass: the product's design language](2026-10-25-soft-glass-design-language.md) | Accepted · core screens on `develop`, rest in progress | AIIN-122–139 |
| 2026-10-25 | [Employer accounts are invite-only](2026-10-25-employer-accounts-invite-only.md) | Accepted · implemented | AIIN-53 |
| 2026-10-25 | [Design every screen on the canvas before building it](2026-10-25-design-first-on-the-canvas.md) | Accepted · implemented | AIIN-142–148, 156, 186 |
| 2026-10-25 | [App shell: a floating header and a bottom tab bar instead of the sidebar](2026-10-25-app-shell-navigation.md) | Accepted · implemented | AIIN-125 |
| 2026-10-26 | [Send the client only what it needs: never whole user rows](2026-10-26-send-the-client-only-what-it-needs.md) | Accepted · implemented | AIIN-187 |
| 2026-10-26 | [Talent Match: opt-in, anonymous until applied, a computed match %](2026-10-26-talent-match-consent-and-computed-score.md) | Proposed · not started | AIIN-190, AIIN-206 |
| 2026-10-28 | [No preview environment for now: check locally, deploy to production](2026-10-28-no-preview-environment.md) | Accepted | AIIN-115 |
| 2026-10-29 | [The Free plan includes 2 practice interviews a month](2026-10-29-free-plan-includes-practice.md) | Accepted · implemented | AIIN-189 |
| 2026-10-30 | [The integrity verdict: plain rules over the events we already capture](2026-10-30-integrity-verdict-rules.md) | Accepted · implemented | AIIN-177 |
| 2026-10-30 | [Where candidate code runs: hosting the code execution engine](2026-10-30-code-execution-hosting.md) | Accepted · implemented (our own Piston, Oracle free tier; revised 2026-11-01) | AIIN-105 |
| 2026-10-30 | [One streak for the whole app, counted in IST days](2026-10-30-one-streak-in-ist-days.md) | Accepted · implemented | AIIN-99, AIIN-67 |
| 2026-10-30 | [Badges are stored once earned; the certificate is a public, unguessable page](2026-10-30-badges-and-public-certificates.md) | Accepted · implemented | AIIN-102, AIIN-101 |
| 2026-10-30 | [Ask U: a narrow context, stored chats, a daily limit checked before Gemini](2026-10-30-ai-coach-context-and-quota.md) | Accepted · implemented | AIIN-100 |
| 2026-10-30 | [A coding problem is published only when its solution passes every test](2026-10-30-publish-only-checked-problems.md) | Accepted · implemented | AIIN-107, 219, 220 |
| 2026-10-30 | [The weekly report: Vercel Cron, behind a secret, never sent twice](2026-10-30-weekly-email-via-vercel-cron.md) | Accepted · implemented, first send 2026-11-02 | AIIN-103 |
| 2026-11-01 | [Neon is the only database; no unused integrations on the Vercel project](2026-11-01-neon-is-the-only-database.md) | Accepted · implemented | — |
| 2026-11-01 | [Integrity checks and candidate data: agreement first, only what was agreed, kept for a year](2026-11-01-integrity-checks-and-candidate-data.md) | Accepted · implemented | AIIN-176 |
| 2026-11-02 | [Deleting an account: at once, everything of the candidate's, employer records kept anonymised](2026-11-02-deleting-an-account.md) | Accepted · implemented | AIIN-58 |
| 2026-11-02 | [Best solutions: written by AI, shown only if they pass every test, after the candidate has tried](2026-11-02-best-solutions-checked-before-shown.md) | Accepted · implemented | AIIN-221 |
| 2026-11-11 | [The Question Bank: one item per question, filled by what the candidate already does](2026-11-11-one-bank-item-per-question.md) | Accepted · implemented | AIIN-209, AIIN-210 |

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
