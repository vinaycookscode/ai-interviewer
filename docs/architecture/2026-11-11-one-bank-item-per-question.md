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

### Questions the candidate adds (AIIN-211)

- **Their own item every time,** keyed `self:<uuid>`. Two candidates, or one candidate twice, adding the same words is still two items: the notes and context differ.
- **Private.** The approved design says "It stays in your bank only", so nothing is shared. Suggesting a question to Company prep, without the candidate's name, belongs to the moderated path (AIIN-215), as a choice the candidate makes there.
- **The model answer is labelled AI-written** and stored apart from Company prep's reviewed answers (`aiAnswer`), so the two can't be confused. It's written after the response; if Gemini fails, the item simply has no answer.

### Search (AIIN-210)

- **Word matches, then matches by meaning.** A search matches words in the question, company, topic or tags. It then adds questions whose meaning is close: `BankItem.embedding` holds a `vector(768)` from Gemini `gemini-embedding-001`, compared with cosine distance in Postgres (pgvector), as the [Talent Match ADR](2026-10-26-talent-match-consent-and-computed-score.md) set out.
- **Embedded on first search, not on save.** The first search embeds the candidate's questions that have no embedding yet, up to 100 in one call. That covers the backfill and every new item without touching the save paths, and a candidate who never searches costs nothing.
- **A relative cut-off.** Gemini's similarities sit in a narrow band (0.51–0.70 for "caching" across unrelated and related questions). A match must score at least 0.60 and be within 0.06 of the best match. With that rule "caching" finds cache, memoisation, Redis and CDN questions, but not the behavioural ones. The rule is in `lib/bank/search.ts`, tested with measured scores.
- **Only the candidate's own items.** The page, the similarity query and every action filter on the signed-in user.
- **If Gemini fails,** the page shows word matches and says that search by meaning is unavailable.

## Consequences

**Easier:** The bank is full on day one, with no work from the candidate. Browsing, the review schedule and the prep set (AIIN-210–213) read one table.

**Harder:**
- Earlier answers to the same bank question are found through `MockAnswer.companyQuestionId`, not stored on the item.
- The fallback type rule is rough. Questions graded before this change, and any the grader doesn't label, may be filed as technical when they're behavioural.

## Alternatives considered

- **Match practice questions by text.** Rejected: Gemini rarely repeats wording, and near-duplicates would silently merge different questions.
- **A row per answer, grouped when shown.** Rejected: status, notes and the review schedule belong to the question, not to one attempt.
