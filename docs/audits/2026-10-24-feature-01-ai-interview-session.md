# Feature 01 — AI Interview Session
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** End-to-end employer-creates-job → candidate-takes-interview → scoring → feedback

---

## What This Feature Does

An employer creates a job, the platform generates interview questions via Gemini, a candidate receives a link, takes the interview in a browser with camera/mic, and receives a scored feedback report. The employer can view results.

---

## Flow Map (Current)

```
Employer
  └─ Creates job (job title, description, required skills, experience level)
  └─ Platform generates 8 questions via Gemini
  └─ Employer invites candidate (email, optionally with token)

Candidate
  └─ Opens /interview/[id]?token=...
  └─ Server validates: auth → token → scheduling window → document requirements
  └─ LanguageSelector (choose interview language)
  └─ PermissionCheck (camera/mic check + audio visualizer preview)
  └─ InterviewSession (797-line client component)
       └─ speakQuestion() → window.speechSynthesis
       └─ SpeechRecognition inline → transcript
       └─ submitAnswer() server action → db.answer.create
       └─ gradeAnswer() → Gemini → db.answer.update (score, feedback)
  └─ completeInterview() → compute avg score → generatePersonalityProfile → email employer

Employer
  └─ Opens /interview/[id]/feedback
  └─ Sees score, per-answer breakdown, personality profile
```

---

## Finding 1 — React Rules of Hooks Violation (P0 Bug)

**File:** `components/interview/interview-session.tsx:94`

The component has a conditional early return before several `useEffect` and `useRef` hooks:

```tsx
if (!interview || !questions || questions.length === 0) {
    return <div>Loading...</div>;  // ← early return at line 94
}

// ... hooks declared AFTER this return
const recognitionRef = useRef(null);
useEffect(() => { ... }, []);
```

React's rules require all hooks to be called unconditionally, in the same order, on every render. This conditional return means on certain renders hooks are skipped, which causes React to misalign the hook call stack and can produce silent state corruption or crashes.

**Decision:** Move the early return to after all hook declarations, or split the component into a loading wrapper and a loaded inner component.

---

## Finding 2 — Non-Responsive Fixed Layout (P1 UI)

**File:** `components/interview/interview-session.tsx`

The interview session uses a fixed three-column grid:

```tsx
className="grid grid-cols-[450px_1fr_350px]"
```

This hardcodes a 450px left column and 350px right column. On any screen narrower than ~900px the layout overflows horizontally. Mobile and tablet candidates cannot use the interview. There is no responsive breakpoint.

**Decision:** Replace with `grid-cols-1 md:grid-cols-[450px_1fr_350px]`. The left panel (camera/visualizer) stacks above the question/answer area on mobile, with the right panel (transcript) moving below.

---

## Finding 3 — Inline Speech Implementation Bypasses Existing Hooks (P1)

**Files:** `components/interview/interview-session.tsx`, `hooks/use-speech-to-text.ts`, `hooks/use-text-to-speech.ts`

The interview session reimplements speech from scratch inline — its own `recognitionRef`, its own `speakQuestion()`, its own restart-on-`onend` logic — while the practice session uses the clean reusable hooks. Two divergent implementations of the same functionality.

The inline version also misses language switching that the hooks support.

**Decision:** Refactor the interview session to use `useSpeechToText` and `useTextToSpeech`. This unifies the implementation, removes the duplication, and is a prerequisite for replacing the underlying Web Speech API with Deepgram/Google TTS (see speech audit). Tracked in `docs/audits/2026-10-24-speech-audit.md`.

---

## Finding 4 — Grading Blocks the UI (P1)

**File:** `actions/interview-session.ts` → `submitAnswer`

After a candidate submits each answer, `gradeAnswer()` is called synchronously before the server action returns. Gemini evaluation can take 2–5 seconds per answer. The candidate sees a frozen UI waiting for scoring before they can proceed to the next question.

**Decision:** Make grading async and fire-and-forget at submission time. Show "Scoring..." in the feedback card and update via polling or server-sent event when the score arrives. The candidate should move to the next question immediately.

---

## Finding 5 — Race Condition in completeInterview (P1 Bug)

**File:** `actions/interview-session.ts` → `completeInterview`

When the interview ends, `completeInterview` immediately computes the average score across all answers. But if the last answer's `gradeAnswer()` hasn't finished (because grading is async), that answer's score is `null` at the time of averaging, and the final score is wrong.

The feedback action (`actions/feedback.ts`) handles this partially — it recalculates and patches the score if it finds `null` — but this is a workaround, not a fix.

**Decision:** `completeInterview` should wait for all in-flight grading tasks to finish before computing the final score. Alternatively, always compute the final score lazily on the feedback page and never store it at completion time.

---

## Finding 6 — Token Validation Has a Null Bypass (P1 Security)

**File:** `app/interview/[id]/page.tsx`

```ts
if (interview.token && interview.token !== token) {
    redirect('/unauthorized');
}
```

The condition `interview.token &&` means: if the token on the interview is `null`, skip the check entirely. Any interview where no token was set is accessible to anyone with the interview ID — no token required.

In the schema, `token` is `String? @unique` (nullable). Interviews created without a token (e.g., open-link interviews) are fully public by design, but there is no explicit flag for "this is intentionally public." The current logic makes all null-token interviews silently public.

**Decision:** Add an `isPublic Boolean @default(false)` field to the `Interview` model. The token check becomes:

```ts
if (!interview.isPublic && interview.token !== token) {
    redirect('/unauthorized');
}
```

Null-token interviews default to private (access denied). An employer must explicitly mark an interview as public.

---

## Finding 7 — Email Notification Uses Raw HTML String Interpolation (P1 Security)

**File:** `actions/interview-session.ts` → `completeInterview`

The employer notification email is built with raw string interpolation:

```ts
html: `<p>Hello ${employerName},</p><p>${candidateName} has completed...</p>`
```

If either name contains HTML characters (`<`, `>`, `&`, `"`), the email renders broken or can inject content. Candidate names, in particular, come from user input.

**Decision:** HTML-encode all interpolated values before building email strings. Or switch to a React-based email template library (e.g., `@react-email/components`) where encoding is handled automatically.

---

## Finding 8 — Gemini Question Generation Has No Recursion Guard (P1)

**File:** `lib/gemini.ts` → `generateInterviewQuestions`

On a 429 rate-limit error, the function calls `handleRateLimit()` and then calls itself with no depth counter. This is infinite recursion. Under sustained rate limiting, the call stack grows until it throws `Maximum call stack size exceeded`.

**Decision:** Add a `retries` parameter (default 0, max 3). After max retries, throw a `RateLimitExceeded` error with a user-facing message.

---

## Finding 9 — Questions Are Hardcoded to 8 (P2)

**File:** `lib/gemini.ts`

The Gemini prompt hardcodes "Generate exactly 8 interview questions." The `Interview` model has no `questionCount` field. Employers cannot configure the number of questions for a role.

**Decision:** Add `questionCount Int @default(8)` to the `Job` model. Pass it through to the Gemini prompt. Allow employers to set 5–15 questions per role.

---

## Finding 10 — Feedback Page Has Hardcoded Summary Text (P2)

**File:** `app/interview/[id]/feedback/page.tsx`

The feedback summary is a static string chosen by score threshold:

```ts
if (score >= 8) summary = "Outstanding performance. The candidate demonstrated..."
else if (score >= 6) summary = "Strong performance. The candidate showed..."
// etc.
```

Three buckets (8+, 6–8, below 6) produce the same summary for every candidate in each bucket. A candidate who scored 8.0 and one who scored 9.8 get identical feedback.

**Decision:** Generate the feedback summary as part of `completeInterview` using Gemini, personalised to the candidate's actual answers, job role, and score pattern. Store it in a new `feedbackSummary String?` field on `Interview`. Fall back to the template text if generation fails.

---

## Finding 11 — Personality Profile Is Employer-Only (P2 UX)

**File:** `app/interview/[id]/feedback/page.tsx`

The personality profile (generated by Gemini from the candidate's answers) is shown only when the viewer is an employer. Candidates do not see it.

The profile includes things like communication style, problem-solving approach, and cultural fit indicators — information the candidate would find genuinely useful for self-improvement.

**Decision:** Show the personality profile to candidates as well. Candidates should see the full picture of how they came across. The employer view can be the same or show an employer-specific framing.

---

## Finding 12 — "Back to Dashboard" Points to Wrong Route (P2)

**File:** `components/interview/permission-check.tsx`

The "Back to Dashboard" button links to `/dashboard`, which redirects to either the employer or candidate dashboard. But the candidate is always in a candidate context at this point. The link should be `/candidate/dashboard`.

**Decision:** Fix the href. Minor but creates a flash-of-redirect on every back navigation.

---

## Finding 13 — Proctoring Hook Has Stale Closure on addWarning (P2)

**File:** `hooks/use-proctoring.ts`

The `useEffect` that sets up event listeners (`visibilitychange`, `blur`, `fullscreenchange`) closes over `addWarning` but excludes it from the dependency array to avoid infinite re-subscription. The ESLint disable comment acknowledges this. A proper fix is to wrap `addWarning` in `useCallback` with `setWarnings` in its deps (stable ref), then include it in the effect deps.

**Decision:** Wrap `addWarning` in `useCallback`. Remove the eslint-disable comment.

---

## Finding 14 — GazeTracker WASM Assets Load from jsdelivr at Runtime (P2)

**File:** `components/interview/gaze-tracker.tsx`

```ts
locateFile: (file: string) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`
```

The local script is self-hosted (`/mediapipe/face_mesh/face_mesh.js`) but the WASM binary assets it loads are fetched from jsDelivr at runtime. If jsDelivr is unavailable (corporate firewall, outage, slow CDN), the gaze tracker fails silently. The candidate gets no warning, and proctoring records no gaze events.

**Decision:** Self-host the WASM assets alongside the JS. Add them to `public/mediapipe/face_mesh/`. Update `locateFile` to use `/mediapipe/face_mesh/${file}`.

---

## Finding 15 — No Browser Compatibility Check Before Interview Starts (P2)

**File:** `components/interview/permission-check.tsx`

The permission check tests camera and mic access but never checks whether `window.SpeechRecognition` or `window.webkitSpeechRecognition` exists. On Firefox, the interview will appear to start normally but transcription will silently fail — the candidate's answers will be empty strings.

**Decision:** Add a browser check in `permission-check.tsx`. If `SpeechRecognition` is not available, show: "This interview requires Google Chrome or Microsoft Edge. Your browser (Firefox) does not support voice input." Do not allow the candidate to proceed.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | Hooks called after conditional return | P0 bug | Low | Split into loading wrapper + loaded inner component |
| 2 | Fixed 450px+350px grid, no mobile | P1 UI | Low | Responsive grid with md: breakpoint |
| 3 | Inline speech, bypasses hooks | P1 | Medium | Unify on useSpeechToText / useTextToSpeech |
| 4 | Grading blocks UI between questions | P1 | Medium | Fire-and-forget grade, show async "Scoring..." state |
| 5 | Race condition: score averages before last grade | P1 bug | Low | Lazy score at feedback time, never at completion |
| 6 | Null token bypass = any interview accessible | P1 security | Low | Add isPublic flag; token check always enforced |
| 7 | Email uses raw HTML interpolation | P1 security | Low | HTML-encode all user values in email templates |
| 8 | Gemini retries without depth limit | P1 | Low | Add retries param (max 3), throw on exhaustion |
| 9 | Question count hardcoded to 8 | P2 | Low | Add questionCount to Job model |
| 10 | Feedback summary is 3 hardcoded buckets | P2 | Medium | Generate per-candidate summary via Gemini at completion |
| 11 | Personality profile hidden from candidates | P2 UX | Low | Show to candidate too |
| 12 | "Back to Dashboard" routes to wrong path | P2 | Trivial | Fix href to /candidate/dashboard |
| 13 | useProctoring stale closure | P2 | Low | useCallback on addWarning |
| 14 | GazeTracker WASM loads from jsdelivr | P2 | Low | Self-host WASM assets in /public |
| 15 | No SpeechRecognition browser check | P2 | Low | Gate interview start on SpeechRecognition availability |

---

## What Good Looks Like (Target State)

1. **Mobile-first interview session** — camera stacked above question area on phone, full three-column on desktop
2. **Async grading** — candidate moves between questions instantly; scores appear when ready
3. **Single speech implementation** — one set of hooks used everywhere, backed by Deepgram STT (when migrated)
4. **Audio recorded and stored** — candidate's audio saved to R2, employer can replay
5. **Security tightened** — explicit isPublic flag, HTML-encoded emails, depth-limited Gemini retries
6. **Browser gate** — non-Chrome users get a clear error before the interview starts, not a silent failure
7. **Full feedback for candidates** — personality profile + AI-generated personalised summary, not bucket text

---

## Dependencies

- Speech migration: tracked in `docs/audits/2026-10-24-speech-audit.md`
- Service layer: tracked in `docs/architecture/2026-10-24-api-and-service-layer.md`
- Design system tokens: tracked in `docs/audits/2026-10-24-ux-design-audit.md`
