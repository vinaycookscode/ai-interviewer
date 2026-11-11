# The Question Bank: one item per question, filled by what the candidate already does
**Date:** 2026-11-11  
**Status:** Accepted · implemented (AIIN-209)  
**Deciders:** Vinay

## Context

The Question Bank (epic AIIN-206) collects every question a candidate has faced or saved, with their latest answer and what to fix, so they can practise it again before a real interview. Questions arrive from several places: practice answers (Gemini's questions and the bank's HR question, AIIN-208), questions saved from Company prep, and later AI interviews, real interviews and recommendations. The same Company prep question can arrive more than once: saved, then asked in a practice, then practised again.

## Decision

- **One `BankItem` per candidate and question,** unique on `userId` + `sourceKey`:
  - A Company prep question is keyed `cq:<id>`, however it arrives. Saving it twice, or practising a saved question, updates the same item.
  - A question Gemini wrote for one practice is keyed `mock:<answer id>`. Gemini's wording differs every time, so matching on text would merge unrelated questions or miss real repeats.
- **Filled without asking.** Every saved practice answer adds or updates its item and links the latest answer, for its score and feedback. A saved question that gets practised moves from New to Practising. The answer is saved even if this step fails.
- **Saving from Company prep is one quiet button** (approved "Save to my bank" artboards). It needs the same access as the page: company prep on, a paid plan, a published question.
- **Type in four buckets: HR, technical, coding, aptitude.** A Company prep question keeps its type, with group discussion counted as HR. For a practice question, the grader now names the type in the same call that scores the answer. A rule on the question's opening words is the fallback, and the backfill uses it too.
- **Deleting an item never touches its answers.** Links are `SET NULL`. Deleting the account deletes the bank.
- **Backfilled in the migration.** Every existing practice answer became an item, and repeats of a bank question collapsed into one item on the latest answer.
- **Only the links that something fills.** The ticket also listed `answerId` (AI interviews) and `applicationId` (Talent Match). They come with the tickets that fill them; the `INTERVIEW`, `SELF_ADDED` and `RECOMMENDED` sources are already in the enum.

## Consequences

**Easier:** The bank is full on day one, with no work from the candidate. Browsing, the review schedule and the prep set (AIIN-210–213) read one table.

**Harder:**
- Earlier answers to the same bank question are found through `MockAnswer.companyQuestionId`, not stored on the item.
- The fallback type rule is rough. Questions graded before this change, and any the grader doesn't label, may be filed as technical when they're behavioural.

## Alternatives considered

- **Match practice questions by text.** Rejected: Gemini rarely repeats wording, and near-duplicates would silently merge different questions.
- **A row per answer, grouped when shown.** Rejected: status, notes and the review schedule belong to the question, not to one attempt.
