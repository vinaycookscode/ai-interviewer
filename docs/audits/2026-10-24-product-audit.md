# Product Audit — Get Back To U
**Date:** 2026-10-24  
**Audited by:** Claude Sonnet 4.6 (AI Engineer review)  
**Branch:** develop  
**Overall Score:** 52 / 100

---

## Summary

The core AI interview loop is functional. The DB schema is thoughtful and the feature surface is ambitious — placement programs, study squads, flashcards, mentor matching. However, critical production risks, a broken interview UX, and several silent runtime bugs would cause real failures at scale.

| Layer | Score | Status |
|---|---|---|
| UX / Product | 44/100 | 🔴 Critical gaps |
| Frontend Code | 55/100 | 🟡 Bugs present |
| AI Pipeline | 50/100 | 🟡 Silent errors |
| Database | 58/100 | 🟡 Schema risks |
| Security | 42/100 | 🔴 IDOR risk |
| Deployment | 35/100 | 🔴 Data loss risk |

---

## 🚨 P0 — Fix Before Next Production Push

These must be resolved before the next deploy to main.

### INF-01 / DB-01 · `prisma db push --accept-data-loss` runs on every build
**File:** `package.json:7`

The build script is:
```
"build": "prisma generate && prisma db push --accept-data-loss && next build"
```

This runs on every Vercel deploy. `prisma db push --accept-data-loss` is documented by Prisma as a **prototyping-only** command that silently drops columns and tables to force schema alignment. In production, any schema change can permanently delete user data with no warning and no rollback.

**Fix:** Switch to proper migrations.
```bash
# Locally
npx prisma migrate dev --name <description>
# In CI / production build script
npx prisma migrate deploy
```
Commit the `prisma/migrations/` directory to the repo.

---

### FE-01 · React Rules of Hooks violation in InterviewSession
**File:** `components/interview/interview-session.tsx:94`

There is an early `return` (the "no questions" guard) inside the component body before all hook declarations are complete. React requires hooks to be called unconditionally on every render. This causes a "Rendered fewer hooks than expected" crash under certain render sequences.

**Fix:** Move the guard to after all hooks, or extract it into a wrapper component.

---

### AI-02 · Wrong variable in mock interview evaluation prompt
**File:** `actions/mock-interview.ts:189`

```ts
// BUG: `question` is the full question text, not the role
const prompt = `Evaluate this answer for a ${question} role.`
```

The variable `question` (the full question text, potentially 200+ characters) is interpolated where the job role belongs. Every mock interview score is evaluated against nonsense context. Pass the `role` from `MockInterview.role` into `saveMockAnswer` and use it here.

---

### AI-01 · Infinite recursion in Gemini rate-limit fallback
**File:** `lib/gemini.ts:101`, `actions/mock-interview.ts:120`

Both `generateInterviewQuestions` and `generateMockQuestions` call themselves recursively on a 429 error after switching models, with no depth counter or base case. If the new model is also rate-limited, recursion continues until stack overflow.

**Fix:** Add a `retryCount = 0` parameter and cap at 1.
```ts
async function generateInterviewQuestions(jobDesc: string, retryCount = 0): Promise<string[]> {
  // ...
  if (error.status === 429 && retryCount < 1) {
    const result = await handleRateLimit(modelName);
    if (result.switched) return generateInterviewQuestions(jobDesc, retryCount + 1);
  }
  throw new Error(result.message);
}
```

---

### SEC-01 · Identity documents (PAN, Aadhaar) exposed via direct S3 URLs
**File:** `components/interview/interview-session.tsx:745`

PAN and Aadhaar images are rendered with `<img src={userDocuments.panUrl}>` using direct S3 object URLs stored in the `User` table. If these are standard (non-pre-signed) S3 URLs, anyone who extracts the URL from browser DevTools has permanent, unauthenticated access to KYC documents.

**Fix:** Generate pre-signed URLs with a short TTL (≤15 minutes) at retrieval time using `@aws-sdk/client-s3` `getSignedUrl`. Never store or pass the direct object URL to the client.

---

### SEC-02 · User Gemini API keys stored plaintext in the database
**File:** `prisma/schema.prisma:51` — `User.geminiApiKey String?`

**Fix:** Use the existing `lib/encryption.ts` (AES-256) to encrypt on write and decrypt on read.

---

### FE-02 · Interview session completely non-responsive
**File:** `components/interview/interview-session.tsx:529`

```ts
// These break below ~1100px
"grid-cols-[450px_1fr_350px]"  // coding layout
"grid-cols-[1fr_420px]"         // non-coding layout
```

The primary product feature is unusable on tablets and all mobile devices. Needs a responsive rewrite using `grid-cols-1 md:grid-cols-2 xl:grid-cols-[450px_1fr_350px]`.

---

## 🟡 Section 1 — UX / Product (Score: 44/100)

### UX-01 · No onboarding for new users
A freshly registered candidate sees "Welcome back" and three empty metric tiles. `CandidateProfile.onboardingComplete` exists in the schema and `career-wizard.tsx` exists in components — neither is wired into the first-login flow. New users have no idea what to do.

### UX-02 · No per-question timer in the interview session
No countdown, no suggested duration, no guidance on answer length. This directly hurts AI evaluation quality — candidates stop recording either too early (30s) or too late (10 min).

### UX-03 · Fullscreen gate shows a Square icon (reads as "stop")
`components/interview/interview-session.tsx:484` — The fullscreen prompt uses `<Square />` from lucide-react. It should be `<Maximize2 />`. The button label "Return to Full Screen & Start" implies the interview already started.

### UX-04 · No pre-interview hardware check
No camera/mic verification before the interview starts. This is a primary cause of "interview not recorded" support issues. A 30-second hardware check page before camera permission would eliminate most of them.

### UX-05 · Sidebar nav fatigue — 7 of 12 items are Pro-locked for free users
Free-tier users see most sidebar items as locked or leading to stub pages (Study Squad, Mentor Matching have no real functionality yet). The nav implies a finished product the features don't deliver.

### UX-06 · Landing page stats are hardcoded placeholder values
Static stat values served from the translation file. If these numbers aren't real, they destroy trust. Use real DB counts or remove the stats section.

### UX-07 · Study Squad and Mentor Matching are stub features
Both exist in schema and sidebar navigation, but there is no real-time communication, no scheduler, and no mentor session booking UI. Hide behind a "Coming soon" gate rather than routing to empty pages.

### UX-08 · Document reference panel shown even with no documents
The third column ("Reference Docs") always renders and shows "No documents uploaded" for most candidates. Move to a slide-out drawer.

---

## 🟡 Section 2 — Frontend Code (Score: 55/100)

### FE-03 · Monaco editor and MediaPipe face mesh loaded unconditionally
Both are large resources (~8MB for face mesh model files) loaded regardless of question type. `isCodingQuestion` already exists — guard both imports behind it.

### FE-04 · InterviewCard typed as `any`
`app/candidate/dashboard/page.tsx` — `InterviewCard` accepts `interview: any`. Use the Prisma-generated type to enable compile-time checks.

### FE-05 · Grading blocks the UI — no optimistic advancement
After stopping recording, `submitAnswer` and `gradeAnswer` are called serially before moving to the next question. The user waits 2–5 seconds per answer. Since the score is not shown during the interview, grading should be fully async/background — advance immediately, grade in the background.

### FE-06 · Sidebar profile completion fetches on every navigation
`CandidateSidebar` calls `getUserProfile()` in a `useEffect` with `pathname` as a dependency. Use SWR with stale-while-revalidate instead.

### FE-07 · Transcript area has no auto-scroll to bottom
The transcript card has `overflow-y-auto` but no auto-scroll. New transcribed text appears at the bottom while the user sees the top.

---

## 🟡 Section 3 — AI Pipeline (Score: 50/100)

### AI-03 · Follow-up question generation is dead (commented-out) code
`actions/interview-session.ts:55–76` — Full follow-up generation is wrapped in a block comment. The `generateFollowUp` function in `lib/ai-context.ts` exists but is never called. Either remove it or build it properly.

### AI-04 · All AI calls are synchronous with no streaming
`model.generateContent()` is called with no streaming, causing 2–5 second silent pauses during the interview. Use `generateContentStream` for question readback and feedback display.

### AI-05 · Rate-limit fallback logic duplicated across 4+ files
The same 429-detection pattern is copy-pasted into `gemini.ts`, `mock-interview.ts`, and at least two action files. Centralize into a `withGeminiRetry(fn)` wrapper.

### AI-06 · No quality monitoring on AI scoring
No logging of model used, score distribution, or feedback quality over time. Unable to detect scoring drift after model changes.

### AI-07 · Question generation hardcodes 8 questions for all job types
The prompt always generates exactly 8 questions regardless of interview type. Employer should be able to configure count and type ratio per Job.

---

## 🟡 Section 4 — Database (Score: 58/100)

### DB-02 · Rate limiting stored in PostgreSQL — should be Redis/KV
The `RateLimit` table creates unnecessary write contention. Replace with Vercel KV (Upstash Redis).

### DB-03 · VisitorLocation uniqueness on countryCode only — city data is broken
`@@unique([countryCode])` means all visits from India resolve to one row. City and coordinate data is silently overwritten. Fix the unique key to include city, or rethink the model.

### DB-04 · Answer and ProctoringEvent tables grow unbounded
No archival strategy. Add soft-delete or a scheduled job to move records older than N days to cold storage.

### DB-05 · Missing composite index: FlashcardProgress userId + nextReview
The spaced-repetition query needs `@@index([userId, nextReview])` for efficient filtering.

### DB-06 · MockAnswer stores question text directly — denormalized
No way to analyze question quality or deduplicate AI-generated questions across interviews. Store questions in a `MockQuestion` table or a JSON field on `MockInterview`.

---

## 🔴 Section 5 — Security (Score: 42/100)

*(P0 items SEC-01 and SEC-02 documented above)*

### SEC-03 · Interview token is nullable — authorization inconsistent
`Interview.token String? @unique` — if a token was never generated (null), the interview page may load for any authenticated user who knows the interview ID. Token presence must be enforced server-side.

### SEC-04 · Copy-paste prevention is trivially bypassable
The `use-copy-paste-prevention` hook is a UX deterrent, not a security control. Do not use it as evidence of cheating in proctoring reports.

### SEC-05 · No error monitoring in production
No Sentry or equivalent. Silent failures in server actions (score computation, payment webhooks, interview completions) are invisible to the team. Add Sentry's Next.js SDK.

---

## 🔴 Section 6 — Deployment (Score: 35/100)

*(P0 item INF-01 documented above)*

### INF-02 · Single Gemini API key — no rotation or key pool
All AI calls share one key. Support a pool of keys to reduce rate-limit failures.

### INF-03 · No CI pipeline
Deploys run via Vercel CLI with no automated lint, type-check, or test gate. A broken build only fails when the developer notices it locally.

### INF-04 · Email notifications use raw interpolated HTML strings
`actions/interview-session.ts:132` — User-supplied values are interpolated directly into HTML email bodies with no escaping. Use React Email or escape user values.

### INF-05 · No database connection pooling for serverless
Vercel serverless + raw Postgres connections = connection exhaustion under moderate load. Configure Prisma Accelerate or PgBouncer. The `@prisma/adapter-pg` dependency is already installed, suggesting this was planned.

---

## ✅ What's Working Well

- **DB schema** — thoughtful, forward-looking, good normalization
- **Interview session UI design** — dark mode, emerald accent, glassmorphism — creates the right atmosphere for a high-stakes assessment
- **Gemini model fallback system** — the concept is correct (rate-limit detection → model rotation → admin config). Just needs deduplication and recursion guard
- **Feature flags** — `FeatureFlag` table + `User.features` JSON override + `feature-gate.tsx` is the right architecture
- **i18n** — wired end-to-end with `next-intl`, multilingual speech recognition is a genuine differentiator for the Indian market

---

## Recommended Fix Order

1. `INF-01` — Switch to `prisma migrate deploy` immediately
2. `FE-01` — Fix hooks violation in InterviewSession
3. `AI-02` — Fix wrong variable in mock interview prompt
4. `AI-01` — Add retry depth guard to prevent infinite recursion
5. `SEC-01` — Pre-sign all document URLs
6. `FE-02` — Make interview session responsive
7. `SEC-02` — Encrypt user API keys at rest
8. `UX-01` — Wire up onboarding flow (components already exist)
9. Everything else in priority order
