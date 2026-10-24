# Feature 02 — Mock / Practice Interview
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Candidate self-initiated practice sessions (no employer, no invite)

---

## What This Feature Does

A candidate picks a role and difficulty level, the platform generates 5 questions via Gemini, the candidate answers each via voice (Web Speech API), receives per-answer scoring, and sees a summary at the end. No employer is involved. Usage is gated behind PRO subscription.

---

## Flow Map (Current)

```
Candidate
  └─ /candidate/practice (PracticeView)
       └─ Pick role (text input or quick-start preset)
       └─ Pick difficulty (Junior / Mid / Senior)
       └─ createMockInterview() → db.mockInterview.create
       └─ router.push(/candidate/practice/[id])

  └─ /candidate/practice/[id] (PracticeSession component)
       └─ generateMockQuestions(role, difficulty) → Gemini
       └─ For each question:
            └─ speakQuestion() → window.speechSynthesis
            └─ SpeechRecognition → transcript
            └─ saveMockAnswer() → Gemini score → db.mockAnswer.create
       └─ completeMockInterview() → avg score + Gemini summary → db.mockInterview.update

  └─ /candidate/practice/[id]/result
       └─ Show score, per-answer breakdown, overall feedback
```

---

## Finding 1 — Critical Bug: Evaluation Prompt Uses Question as Role Name (P0)

**File:** `actions/mock-interview.ts` → `saveMockAnswer`

```ts
const prompt = `
  Question: ${question}
  Candidate Answer: ${transcript}
  
  Evaluate this answer for a ${question} role.
```

The template variable `${question}` is used in two places: correctly as the question text, and incorrectly as the job role name. The evaluation prompt tells Gemini to evaluate the answer "for a [full question text] role" — e.g., "Evaluate this answer for a Tell me about a time you faced a challenge role."

Gemini will attempt to parse this as a role name, producing either confused or generic feedback. Every mock interview answer is evaluated with a broken context prompt.

**Decision:** Pass `role` as a parameter to `saveMockAnswer`. The function signature becomes `saveMockAnswer(mockInterviewId, role, question, transcript, audioUrl?)`. The prompt line becomes `Evaluate this answer for a ${role} role.`

---

## Finding 2 — Questions Generated at Session Time, Not Stored (P1)

**File:** `actions/mock-interview.ts` → `generateMockQuestions`, `app/candidate/practice/[id]/page.tsx`

Questions are generated fresh on every page load via `generateMockQuestions(role, difficulty)` called from the `PracticeSession` client component. They are never persisted to the database.

Consequences:
- If the page refreshes mid-session, a new set of 5 questions is generated — the candidate loses their progress context
- There is no way to show the candidate "here are the questions you answered" on the results page, because the questions live only in client state
- `MockAnswer.question` stores the question text inline, which is the only way the results page can reconstruct what was asked — but a page refresh between questions would generate different question text for the same answer record

**Decision:** Store questions at session creation time. Add a `questions Json` field to `MockInterview`. Populate it in `createMockInterview` (generate questions, store them, return the session ID). `PracticeSession` reads questions from the DB, not from Gemini at load time. Questions are stable for the life of the session.

---

## Finding 3 — Same Infinite Recursion Risk as Real Interview (P1)

**File:** `actions/mock-interview.ts` → `generateMockQuestions`

On a 429 error, the code calls `handleRateLimit()` and then calls `generateMockQuestions(role, difficulty)` with no depth guard — identical to the bug in `lib/gemini.ts` documented in Feature 01, Finding 8.

**Decision:** Same fix: add `retries` parameter (default 0, max 3). After max retries, return fallback questions with `isFallback: true`. The fallback question set already exists in the code — just gate it properly.

---

## Finding 4 — Practice Uses Same Speech Implementation Divergence (P1)

**File:** `components/practice/practice-session.tsx` (uses `useSpeechToText`, `useTextToSpeech` hooks)

The practice session correctly uses the hook-based speech implementation. The real interview session does not (it has an inline reimplementation). This is the other side of the divergence documented in Feature 01, Finding 3.

When the real interview session is unified onto the hooks, both features will share one implementation. No change needed here beyond ensuring the hooks remain the single source of truth.

---

## Finding 5 — No Session Resumption (P1 UX)

If a candidate starts a mock interview and closes the browser, they lose all progress. The `db.mockInterview` record exists with no `score` (so it's not marked complete), but when they return to `/candidate/practice/[id]`, a new question set is generated (see Finding 2) and their previous answers are orphaned.

The result page at `/candidate/practice/[id]/result` shows the answers stored in `MockAnswer`, so partial sessions would show incomplete results if the page redirect logic didn't block it.

Current logic in `page.tsx`:
```ts
if (mockInterview.score) {
    redirect(`/candidate/practice/${id}/result`);
}
```
A session with no score (not completed) just restarts from scratch.

**Decision:** When returning to an in-progress session, check if `MockAnswer` records already exist. If they do, resume from the last unanswered question rather than regenerating all questions. This requires questions to be stored at creation (Finding 2).

---

## Finding 6 — Difficulty Options Are Strings, Not an Enum (P2)

**File:** `actions/mock-interview.ts`, `prisma/schema.prisma`

`MockInterview.difficulty` is `String` in the schema. The UI offers "Junior", "Mid", "Senior" but nothing enforces these values. Gemini prompts use whatever string is passed. A developer could create a session with `difficulty: "Legendary"` and Gemini would silently accept it.

**Decision:** Add a `Difficulty` enum to the Prisma schema (`JUNIOR`, `MID`, `SENIOR`) and use it on `MockInterview.difficulty`. The UI values map to enum values at creation time.

---

## Finding 7 — Quick-Start Presets Have Hardcoded Colors (P2 Design)

**File:** `components/candidate/practice-view.tsx`

Each quick-start role card has its own hardcoded gradient and glow color:

```ts
gradient: "from-blue-500 to-cyan-400",
bg: "from-blue-500/10 to-cyan-400/5",
glow: "hover:shadow-blue-500/20",
border: "hover:border-blue-500/30",
```

Four cards × four color classes each = 16 hardcoded color references in a single array. These do not respond to the brand token system. When brand colors are unified (UX audit P1), these cards will need manual updates.

**Decision:** Replace per-card color classes with semantic variants (`variant: "blue" | "violet" | "orange" | "emerald"`) and define them in a single map object. The card component reads from the map. One place to change when colors change.

---

## Finding 8 — `checkApiStatus` Always Returns `available: true` (P2)

**File:** `actions/mock-interview.ts` → `checkApiStatus`

```ts
export async function checkApiStatus() {
    try {
        const status = await getAIStatus();
        if (status.allModelsExhausted) {
            return {
                available: true,   // ← available is true even when all models exhausted
                usingFallback: true,
                ...
            };
        }
        return { available: true };
    } catch (error: any) {
        return {
            available: true,   // ← available is true even on error
            usingFallback: true,
            ...
        };
    }
}
```

The function never returns `available: false`. The page that checks `if (!apiStatus.available)` to show a "Service Unavailable" error will never trigger. The UI always shows as available, and when AI actually fails, the candidate silently gets fallback questions with no explanation unless the `usingFallback` flag is surfaced separately.

**Decision:** Return `available: false` when the service cannot provide meaningful AI responses (not just fallback). Distinguish between degraded (fallback questions, AI scoring unavailable) and completely unavailable. Show a visible degraded-mode banner, not a hard block.

---

## Finding 9 — Mock Interview Results Are Not Linked to Real Interview History (P2)

**File:** Schema — `MockInterview` has no relation to `Interview`

Mock interviews and real interviews are completely separate data islands. A candidate who does 10 practice sessions and 3 real interviews cannot see their improvement trajectory across both. The dashboard shows them separately with no connection.

The `CandidateProfile` stores `averageScore` and `totalInterviews` — it's unclear whether mock interviews contribute to these metrics.

**Decision:** Decide explicitly whether mock interview scores should feed into `CandidateProfile.averageScore`. If yes, update `incrementUsage` and profile recalculation to include mock interviews. If no (mocks are practice, not performance), keep them separate but surface them on the dashboard under a "Practice History" section distinct from "Interview Results."

---

## Finding 10 — No Topic / Skill Category Filter (P3 UX)

The current mock interview only takes a role (free text or preset) and a difficulty level. There is no way for a candidate to say "I want to practice system design questions" or "only behavioral questions" or "focus on SQL."

Candidates use mock interviews to target weak areas, but the tool gives them no control over question type.

**Decision:** Add a `questionType` field to the mock interview creation form: Behavioral, Technical, System Design, Case Study, Mixed (default). Pass it to the Gemini prompt. This is a high-value UX addition with minimal backend work.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | Evaluation prompt uses question text as role name | P0 bug | Trivial | Pass `role` as param to `saveMockAnswer` |
| 2 | Questions generated fresh each load, never stored | P1 | Low | Store questions in `MockInterview.questions Json` at creation |
| 3 | Infinite recursion on 429 in generateMockQuestions | P1 | Low | Add retries param (max 3) |
| 4 | Speech divergence (practice uses hooks, interview doesn't) | P1 | Medium | Unify on hooks (fix is in Feature 01) |
| 5 | No session resumption | P1 UX | Low | Resume from last unanswered question (requires Finding 2) |
| 6 | Difficulty is unvalidated string | P2 | Low | Add Difficulty enum to schema |
| 7 | Preset card colors are hardcoded | P2 | Low | Use variant map, not inline color classes |
| 8 | checkApiStatus always returns available: true | P2 | Low | Return accurate availability; show degraded-mode banner |
| 9 | Mock and real interview scores are disconnected | P2 | Low | Decide contribution to CandidateProfile; document in schema |
| 10 | No question type filter | P3 UX | Low | Add questionType field (Behavioral / Technical / System Design / Mixed) |

---

## What Good Looks Like (Target State)

1. **Bug-free scoring** — evaluation prompt passes the actual role name, not the question text
2. **Stable sessions** — questions stored at creation, resumable after browser close
3. **Question targeting** — candidate chooses topic area, difficulty, and question type before starting
4. **Visible degraded mode** — when Gemini is rate-limited, show a banner ("Using offline questions — AI scoring unavailable") rather than silently substituting
5. **Unified practice history** — mock scores feed into the candidate's improvement dashboard with a clear "Practice vs. Real" distinction

---

## Dependencies

- Speech unification: tracked in Feature 01 and `docs/audits/2026-10-24-speech-audit.md`
- Schema migrations: tracked in `docs/architecture/2026-10-24-switch-to-prisma-migrations.md`
