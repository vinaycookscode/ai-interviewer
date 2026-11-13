# Grade answers through a queue

**Date:** 2026-11-13  
**Status:** Accepted · implemented (AIIN-170, AIIN-171)  
**Deciders:** Vinay (approved on his instruction to go ahead with Sprint 9)

## Context

Answers were graded with Gemini inside the candidate's requests: each after it was submitted, and anything left over all at once (`Promise.all`) when the interview finished. A hiring drive finishes hundreds of interviews in an hour. That bursts past Gemini's rate limit and slows the candidate's last click. Worse, `evaluateAnswer` turned a rate limit or error into a **score of 0**, so a failure could quietly become a real score in the average.

## Decision

- **Every answer is queued** (`Answer.gradingStatus`: PENDING, GRADING, DONE, FAILED, with attempts, `gradeAfter` and the last error). Finishing an interview only marks it COMPLETED, so the candidate's request returns at once.
- **One worker at a time across all servers,** using a short lease row in `RateLimit` (`grading-worker`). It grades 4 answers at a time, paced to `GRADING_RATE_PER_MINUTE` (60 by default), so the whole app stays under Gemini's limit. Answers are claimed atomically (`FOR UPDATE SKIP LOCKED`, stamping the claim time), so no answer is graded twice. A claim stuck for 10 minutes is released.
- **Failures throw** (`evaluateAnswer(…, strict)`) and are retried with backoff (30 s, 1, 2, 4 minutes). After 5 attempts the answer is FAILED, and the employer sees "Couldn't score N answers" with "Try again", which re-queues only those answers.
- **An interview's score is set only when every answer is DONE.** The formula is unchanged: the average of the scored answers, with answers under 10 characters unscored and left out. Until then lists show "Scoring", and the candidate sees "Your results will be ready shortly".
- **The worker runs** after each answer is submitted, after an interview finishes, when a drive page is viewed with answers waiting, and from the daily cron (`/api/cron/outbox`).
- **When a drive interview's score is first set,** its auto-shortlist runs (AIIN-171):
  - at or above the cutoff, it's Shortlisted, or On hold when the integrity verdict has strong concerns;
  - a person's decision is never overwritten;
  - it never rejects.

  Lowering the cutoff only applies when the employer presses "Apply the cutoff to undecided candidates".
- Existing answers were marked DONE by the migration, so history is never re-graded.

## Consequences

- No zeros from outages, and no partial averages on the ranked list.
- Scores arrive a little after the interview ends: seconds when the queue is quiet, longer during a drive's peak, paced by the rate limit.
- Practice sessions still grade inline with the old non-strict behaviour (low volume).
- `scripts/load-test-grading.ts` checks 300 interviews (1,500 answers) against a stub with a rate limit, on a local database only.
