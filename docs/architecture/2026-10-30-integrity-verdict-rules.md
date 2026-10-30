# The integrity verdict: plain rules over the events we already capture
**Date:** 2026-10-30  
**Status:** Accepted · implemented (thresholds to be reviewed by Vinay)  
**Deciders:** Vinay

## Context

The interview page logged proctoring events (tab switches, window blurs, full-screen exits, blocked copy, paste and shortcuts, developer-tools shortcuts, more than one screen) for every interview, but nothing showed them. Employers asked which interviews to look at closely (AIIN-177).

The raw events were not usable as they were:
- One exit fires both a window blur and a tab switch.
- Returns weren't logged, so time away couldn't be measured.
- Copy, cut, right-click and paste were one event type.
- Interviews had no start time to measure from.

## Decision

- **Three verdicts with listed reasons,** from one pure module, `lib/integrity/verdict.ts`, unit-tested at every boundary (`npm test`):
  - *Strong concerns:* more than 5 times away, more than 2 minutes away in total, the developer-tools shortcut, or more than 2 paste attempts.
  - *Worth a look:* 3 to 5 times away, more than 30 seconds away in total, one full-screen exit longer than 10 seconds, or 1 to 2 paste attempts.
  - *No concerns:* anything else.
  - A verdict lists only the reasons that produced it.
- **Clean-up before scoring:**
  - A blur and a tab switch within 2 seconds of each other are one "left the interview".
  - Each leave ends at the next return, which gives the time away.
  - Each event belongs to the question on screen at the time: from the previous answer, or the start, until the question's own answer.
- **Capture fills the gaps:**
  - Returns (`TAB_RETURN`, `WINDOW_FOCUS`, `FULLSCREEN_ENTER`) are logged, but don't count as warnings.
  - Paste is its own type (`PASTE`).
  - `Interview.startedAt` is set on the first start.
  - The server accepts only known event types.
- **Stored for lists:** `integrityVerdict`, `integrityReasons` and `integrityRulesVersion` are written when an interview completes.
  - The report recomputes a verdict stored under older rules.
  - `scripts/compute-integrity.ts` backfills finished interviews.
- **Employer only, and never shared:**
  - The candidate's report doesn't show it.
  - It's kept out of the report PDF.
  - There is no share link or CSV export yet. When one is built, it must leave integrity out.
- **Wording is factual.** The developer-tools event is the blocked shortcut, so it reads "Tried to open browser developer tools", not "Opened". Camera signals are logged but not used yet.

## Consequences

**Easier:** Employers get a verdict with its reasons, a summary, and a timeline grouped by question. To change a rule, edit one tested module and bump `RULES_VERSION`.

**Harder:**
- Interviews from before this change have no returns or start time.
  - Their time away shows as "Not recorded", and the earliest event or answer stands in for the start.
  - A blocked paste was logged as `COPY_PASTE` then, so it isn't counted.
- The thresholds are judgement calls. A notification or a slow connection can cause a time away, which is why the section says these are prompts to look closer, not a judgement.

## Alternatives considered

- **A numeric "integrity score":** rejected, because it suggests precision the signals don't have. Words with reasons are honest about what was seen.
- **Asking an AI to judge the events:** rejected for now. The rules must be explainable to candidates and employers, and must give the same answer every time.
