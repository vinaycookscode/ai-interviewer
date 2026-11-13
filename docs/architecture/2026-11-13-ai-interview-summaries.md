# AI interview summaries, one per audience, and what candidates see
**Date:** 2026-11-13  
**Status:** Accepted · implemented (AIIN-41, AIIN-42)  
**Deciders:** Vinay

## Context

The report's summary was one of three fixed texts chosen by score band, so a candidate on 8.0 and one on 9.8 read the same words. The personality profile written from the answers was shown to the employer only. The interview audit (2026-10-24, findings 10 and 11) asked for a summary written from each candidate's answers, and for candidates to see how they came across.

## Decision

- **Written once, after every answer is scored.** When the grading queue first sets an interview's score (`finalizeInterviews`), one Gemini call writes two summaries from the answers, their scores and their feedback. Writing before every answer is scored would mean summarising half an interview, the same partial-result problem the queue exists to prevent (see `2026-11-13-grade-answers-through-a-queue.md`).
- **Two summaries, one per reader.** The candidate's is in the second person and ends with the one change that would lift their score most (`Interview.candidateSummary`). The employer's is in the third person, with no hire/reject recommendation (`Interview.feedback`, which shared shortlists already show). Each viewer is sent only their own (`actions/feedback.ts`). Both are in the interview's language. Prompt and parsing: `lib/interview-summary.ts`.
- **A busy model doesn't lose a summary.** 429 and 503 are retried three times in the call, and every grading run writes up to three summaries missed in the last day. For 15 minutes after scoring, the report says "U is writing your summary". After that, and for interviews from before this change, it falls back to the old band text rather than showing nothing.
- **Candidates see the profile, minus two things.** They see communication style, technical depth, confidence, strengths and growth areas. The culture-fit rating is the employer's judgement against their own culture, and the profile's paragraph is written about the candidate for the employer, so both stay with the employer. They are removed in the action, before the data leaves the server, not just hidden on the page.

## Consequences

- One more Gemini call per finished interview, paced by the same worker as grading.
- Summaries aren't rewritten when an answer is re-graded later ("Try again"); the first complete set stands.
- Background work has no request cookies, so it always uses the default Gemini model. The cookie-based model choice applies to requests only (fixed in AIIN-170, where reading the cookie in `after()` made background grading fail).

## Alternatives considered

- **One summary for both readers.** It's half the cost, but advice written to a candidate reads oddly to an employer, and a neutral third-person summary reads coldly to the candidate.
- **Write the summary at completion, in the candidate's request.** It's faster to appear, but would summarise unscored answers and keep the candidate waiting on Gemini, which the queue was built to avoid.
- **Show candidates the whole profile, culture fit included.** It's simpler and fully transparent, but the rating means little without the employer's context and invites argument over a number the candidate can't act on.
