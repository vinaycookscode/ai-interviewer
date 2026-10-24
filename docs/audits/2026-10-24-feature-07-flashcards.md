# Feature 07 — Flashcards (Spaced Repetition)
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Leitner box spaced repetition system for interview concept review

---

## What This Feature Does

Candidates review topic-based flashcard decks (system-provided or user-created). Each card is assigned to a Leitner box (1–5). Correct answers advance the card to the next box; wrong answers reset it to box 1. Box intervals determine when a card is due again (box 1: daily, box 5: every 16 days).

---

## Flow Map (Current)

```
Candidate
  └─ Views decks (system public + own custom)
  └─ Selects a deck → starts a review session
  └─ For each due card:
       └─ Shows question
       └─ Candidate marks: Correct / Incorrect
       └─ updateCardProgress() → moves card to next/reset box
       └─ Sets nextReviewAt based on BOX_INTERVALS
  └─ Session ends when no due cards remain

Data
  └─ FlashcardDeck (isPublic, userId)
  └─ Flashcard (question, answer, deckId)
  └─ FlashcardProgress (userId, cardId, box, nextReviewAt)
```

---

## Finding 1 — getDecks() Has N+1 Query Pattern (P1 Performance)

**File:** `actions/flashcards.ts` → `getDecks`

```ts
const decksWithProgress = await Promise.all(
    decks.map(async (deck) => {
        const progress = await db.flashcardProgress.findMany({
            where: { userId: ..., card: { deckId: deck.id } }
        });
        ...
    })
);
```

For each deck returned in the first query, a separate `findMany` query is run for that deck's progress. With 20 decks, this fires 21 database queries per page load. This is the classic N+1 problem.

**Decision:** Fetch all progress for the user in one query and aggregate in memory:
```ts
const allProgress = await db.flashcardProgress.findMany({
    where: { userId: session.user.id },
    include: { card: { select: { deckId: true } } }
});
const progressByDeck = groupBy(allProgress, p => p.card.deckId);
```
Then compute `masteredCount` from `progressByDeck[deck.id]` without any additional queries.

---

## Finding 2 — seed-flashcards API Route Should Not Exist in Production (P1 Security)

**File:** `app/api/seed-flashcards/route.ts`

A seed route accessible at `/api/seed-flashcards` can populate the database with flashcard data. If this route is reachable in production without authentication, anyone can reset or overwrite the flashcard database.

This is the same class of issue as the other `app/api/seed-*` routes identified in the service layer ADR.

**Decision:** Add an `ADMIN` role check at the top of the route. Additionally, wrap all seed routes in a `NODE_ENV !== 'production'` guard. Track removal in the service layer ADR.

---

## Finding 3 — Due Date Logic Does Not Account for Time of Day (P2 Bug)

**File:** `actions/flashcards.ts`

Box intervals are set as integer days. `nextReviewAt` is presumably set to `new Date(Date.now() + days * 24 * 60 * 60 * 1000)`. This means a card reviewed at 10 AM is due the next day at 10 AM, not at the start of the next day.

For a spaced repetition system, the natural expectation is "cards due today" means all cards due on today's calendar date. If a user reviews a deck at 10 PM, cards won't be due until 10 PM the following evening.

**Decision:** Set `nextReviewAt` to midnight of the target date in the user's timezone (`Asia/Kolkata`). "Due today" means any card with `nextReviewAt <= end of today`.

---

## Finding 4 — No AI-Generated Cards from User Content (P2 Product Gap)

Users can create custom decks, but they must add cards manually (question + answer). There is no path to say "generate flashcards from this job description" or "generate cards for system design concepts."

Gemini could generate 20 flashcards for any topic in a single prompt. This is a high-value, low-cost feature addition.

**Decision:** Add a "Generate with AI" button on the deck creation screen. Input: topic or pasted text. Gemini returns an array of `{question, answer}` pairs. User reviews and saves them. This makes the flashcard feature significantly more useful without requiring the user to know what questions to ask.

---

## Finding 5 — No Session Summary After Review (P2 UX)

When all due cards in a session are reviewed, the feature presumably shows "No cards due." There is no summary: "You reviewed 12 cards. 9 correct (75%). 3 cards reset to box 1." The candidate has no feedback on their session performance.

**Decision:** After completing a review session, show a summary card: cards reviewed, accuracy percentage, cards advanced (moved to higher boxes), and cards reset. This is motivating and informative.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | N+1 query in getDecks() | P1 performance | Low | Single progress query + in-memory aggregation |
| 2 | seed-flashcards route accessible in production | P1 security | Trivial | Add ADMIN check + NODE_ENV guard |
| 3 | Due date not timezone-aware | P2 bug | Low | Set nextReviewAt to midnight IST of target date |
| 4 | No AI card generation from topic/text | P2 product | Medium | "Generate with AI" using Gemini |
| 5 | No session summary after completion | P2 UX | Low | Post-session summary card with accuracy and progress |
