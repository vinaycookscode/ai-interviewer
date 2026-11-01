# The weekly report is sent by Vercel Cron, behind a secret, and never twice
**Date:** 2026-10-30  
**Status:** Accepted · implemented (AIIN-103); first send due 2026-11-02  
**Deciders:** Vinay

## Context

Candidates who practised recently get a Monday report on their week. Sending email to every active candidate needs a scheduler, a way to keep strangers from triggering it, and a guarantee that a retry never sends anyone two copies.

## Decision

- **Vercel Cron calls `/api/cron/weekly-report` every Monday at 03:30 UTC (09:00 IST),** as set in `vercel.json`. There's no separate worker or queue.
- **The route needs `CRON_SECRET`.** Vercel sends it as `Authorization: Bearer …`. Without it, or with a wrong one, the route returns 401.
  - **Lesson, 2026-11-01:** the variable hadn't been added to Production, so the first Monday would have been refused. Any new cron needs its secret set in Vercel *and* a redeploy before its first run.
- **Each week is claimed before sending.** `WeeklyReport` holds one row per user per week, claimed before the email goes out, so a rerun never sends twice. Emails go through Resend in batches of 100, and a failed batch releases its claims.
- **Who gets one:** only candidates who practised in the last four weeks. A quiet week gets a short "We missed you"; after four quiet weeks, nothing.
- **Unsubscribing:** every email has a signed unsubscribe link (no sign-in) and the RFC 8058 one-click header. A switch on the profile turns the email back on.
- **The report itself** is a pure builder (`lib/weekly-report/report.ts`, tested) that renders HTML and plain text.

## Consequences

**Easier:** Nothing extra to host. Reruns are safe. The rules are unit-tested apart from sending.

**Harder:** One route call must finish within the function's limit (`maxDuration` 300 s); at a few thousand recipients it will need to be split into pages or a queue. Vercel Cron on the Hobby plan has limits on how many crons and how often they run.

## Alternatives considered

- **A queue and worker:** more reliable at scale, but another service to run before we need it.
- **Send from the browser or on sign-in:** not a schedule, and misses exactly the people who stopped coming back.
