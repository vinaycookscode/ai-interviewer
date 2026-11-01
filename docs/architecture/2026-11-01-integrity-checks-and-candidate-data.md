# Integrity checks and candidate data: agreement first, only what was agreed, kept for a year
**Date:** 2026-11-01  
**Status:** Accepted · implemented (AIIN-176)  
**Deciders:** Vinay

## Context

Employer interviews already track whether the candidate leaves the tab or full screen, tries to copy or paste, uses shortcuts or developer tools, connects a second screen, and whether a face is in front of the camera and looking away. The integrity verdict (AIIN-177, [ADR](2026-10-30-integrity-verdict-rules.md)) is built on these events. Until now the candidate was never told any of this, or asked. India's Digital Personal Data Protection Act 2023 expects notice and consent before personal data is processed, and candidates can't trust a process they can't see.

## Decision

- **A notice before anything is checked.** After the documents step and before the camera is even asked for, the candidate reads what is checked, why, what's kept and for how long, and who sees it. Then they choose "I agree and start" or "I don't agree".
  - The two choices are equally prominent.
  - The notice is in English, Hindi or Marathi: it opens in the interview's language and can be switched.
- **The notice is versioned in code.** `lib/integrity/notice.ts` holds the text, the list of checks and `NOTICE_VERSION`. Changing what's checked or what's said means bumping the version.
  - Anyone who hasn't started yet is asked again.
  - An interview already under way is never stopped halfway.
- **Agreement is recorded.** `InterviewConsent` holds one row per interview and notice version: the checks listed, the language, the time, the IP address and the user agent. Agreeing twice keeps the first record.
- **Saying no records no consent.** The interview doesn't start, and `Interview.consentDeclinedAt` lets the employer see it and offer another way. The link stays valid until it expires, so the candidate can change their mind.
- **Only what was agreed is stored.** `startInterview` refuses to start without an agreement. `logProctoringEvent` stores an event only when the candidate agreed to its check (`EVENT_CHECK` maps each event type to one, and a test fails if a new event type has none). Future checks (camera snapshots, identity) must add their check to the notice and pass the same gate.
- **The employer sees that, and when.** The integrity section shows "Agreed on …", "Didn't agree on …" or "No agreement on record". It never shows the IP or the user agent, which exist only as the record of agreement.
- **Kept for a year.** A daily cron (`/api/cron/retention`, behind `CRON_SECRET`) deletes proctoring events older than 365 days, as the notice says. Agreement records stay with the interview.
- **Nothing records video, audio or photos.** Camera presence and gaze run on the candidate's device. The notice says so, and any change to that is a new notice version.

## Consequences

**Easier:** Every integrity signal now rests on a recorded, versioned agreement. Adding a check is an explicit change: copy, version, gate.

**Harder:**
- Interviews from before 1 November 2026 have no agreement on record, and the report says so.
- Hindi and Marathi copy must be reviewed by a native speaker before it can be trusted.
- After a year the event timeline is gone. The stored verdict remains, but a rules change can't recompute it from events: the report should then say the details were deleted (the "evidence deleted" state on the canvas).
- There is no privacy policy page in the app yet. The notice carries the facts until one is written and reviewed.

## Alternatives considered

- **One "I accept the terms" checkbox at sign-up:** not specific to the interview or its checks, and not informed consent.
- **Notice without a choice:** honest, but a candidate who objects has no way to say so, and the employer never learns why they didn't start.
- **Gate only on the client:** the server actions are public endpoints ([ADR](2026-10-24-authorize-every-data-access-on-the-server.md)), so the gate must be on the server too.
