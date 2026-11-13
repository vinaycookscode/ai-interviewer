# Queue outbound email in the database

**Date:** 2026-11-13  
**Status:** Accepted · implemented (AIIN-167)  
**Deciders:** Vinay (approved on his instruction to go ahead with Sprint 8)

## Context

Invitations used to be sent with Resend inside the employer's request, one email at a time. A hiring drive invites hundreds of students at once: 500 sends in one request time out, hit Resend's limit of 2 requests a second, and any failure is lost with nothing to show the employer. The ticket also assumed a Vercel Cron every minute, but this project's Vercel plan only runs crons once a day.

## Decision

- **Every drive email is a row in `OutboundEmail`** (status QUEUED, SENDING, SENT, FAILED or BOUNCED, attempts, last error, provider id). The request only queues rows; it never sends.
- **A worker (`lib/outbox.ts`) sends due rows in batches of 100** through Resend's batch endpoint, with 0.6 seconds between calls. It uses **permissive validation**, so one invalid address fails on its own and the other 99 go out. A refused batch (rate limit, outage) is retried with backoff (1, 2, 4, 8 minutes), and after 5 attempts the row is FAILED with its error.
- **Rows are claimed atomically** with `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING`, so two workers running together never send the same email. A row left SENDING for 10 minutes (a worker that died) is queued again.
- **The worker runs in three places:**
  - in `after()` straight after emails are queued;
  - after the drive page is served whenever emails are waiting;
  - from a daily cron (`/api/cron/outbox`, CRON_SECRET), which also queues the 24-hour reminders.

  This replaces the per-minute cron we can't have.
- **Reminders** go to candidates whose interview hasn't started, for drives closing within the next 30 hours. A `dedupeKey` per candidate makes it one reminder, however often the job runs.
- **Bounces and spam complaints** arrive on `/api/webhooks/resend`, verified with Svix using `RESEND_WEBHOOK_SECRET`. Anything unsigned or wrongly signed gets 401 and changes nothing.
- Times in raw SQL are compared with `now() AT TIME ZONE 'UTC'`, because Prisma stores UTC without a zone and a database's time zone may differ.

## Consequences

- Sending is reliable and visible: the drive page shows sent, waiting, failed and bounced counts, with "Resend" for one candidate or all failed ones.
- With a daily cron, a retry waits for the next drive page view or the next daily run. If that's too slow, a paid plan's per-minute cron can call the same route without code changes.
- The reminder goes out up to 30 hours before closing, at the daily run, instead of exactly 24 hours before.
- Other bulk emails (for example the bulk decision emails, AIIN-159) can move to the outbox by adding a template.
- Locally, `RESEND_BASE_URL` points at a capture server, so nothing reaches real addresses.
