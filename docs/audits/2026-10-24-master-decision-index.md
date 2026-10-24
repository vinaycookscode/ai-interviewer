# Master Decision Index
**Date:** 2026-10-24  
**Scope:** All 12 features + infrastructure  
**Purpose:** Single reference for all decisions made in the 2026-10-24 analysis session

---

## Documents in This Analysis

| Doc | Scope |
|-----|-------|
| `2026-10-24-product-audit.md` | 360° audit, 29 findings, overall score 52/100 |
| `2026-10-24-ux-design-audit.md` | UX/design audit, 10 findings, score 38/100 |
| `2026-10-24-speech-audit.md` | Speech technology audit — recommendation: Deepgram + Google TTS |
| `2026-10-24-feature-01-ai-interview-session.md` | Interview flow end-to-end, 15 findings |
| `2026-10-24-feature-02-mock-practice-interview.md` | Mock interview, 10 findings |
| `2026-10-24-feature-03-auth-onboarding.md` | Auth, JWT, onboarding, 9 findings |
| `2026-10-24-feature-04-resume-screener.md` | Resume AI analysis, 7 findings |
| `2026-10-24-feature-05-placement-program.md` | 90-day bootcamp, 7 findings |
| `2026-10-24-feature-06-company-prep.md` | Company interview kits, 5 findings |
| `2026-10-24-feature-07-flashcards.md` | Spaced repetition, 5 findings |
| `2026-10-24-feature-08-subscriptions-payments.md` | Razorpay billing, 6 findings |
| `2026-10-24-feature-09-offer-tracker.md` | Job offer management, 5 findings |
| `2026-10-24-feature-10-study-squad.md` | Peer groups, 3 findings |
| `2026-10-24-feature-11-mentor-matching.md` | Mentor directory, 4 findings |
| `2026-10-24-feature-12-analytics-dashboard.md` | Analytics, 6 findings |

ADRs (in `docs/architecture/`):
| Doc | Decision |
|-----|----------|
| `2026-10-24-switch-to-prisma-migrations.md` | Replace `db push` with `migrate deploy` |
| `2026-10-24-api-and-service-layer.md` | Three-layer architecture: actions → services → repositories |

---

## P0 Issues — Fix Before Next Deploy

| Issue | File | Feature |
|-------|------|---------|
| `prisma db push --accept-data-loss` in build script — data loss on every deploy | `package.json` | Infrastructure |
| React hooks called after conditional return | `interview-session.tsx:94` | F01 |
| Mock interview evaluation prompt uses question text as role name | `actions/mock-interview.ts` → `saveMockAnswer` | F02 |
| AI code analysis in Company Prep is a fake string-matching heuristic | `company-problem-solver.tsx` → `analyzeCode` | F06 |

---

## P1 Issues — High Priority

### Security
- Token validation null bypass: null-token interviews are publicly accessible (F01)
- Email notifications use raw HTML interpolation — XSS risk (F01)
- Day token secret has insecure fallback string in source code (F05)
- `startTask`/`completeTask` lack ownership verification (F05)
- Webhook GET handler reveals endpoint existence (F08)
- Webhook signature verification — audit required (F08)
- `seed-flashcards` route may be accessible in production (F07)
- Gemini API key stored plaintext (F03)

### Performance
- JWT callback hits the database on every request (F03)
- Rate limiting uses PostgreSQL (F03)
- Dashboard fetches all interviews without pagination (F12)
- Resume re-fetched from R2 on every analysis (F04)
- N+1 query in `getDecks()` (F07)

### Correctness
- `completeInterview` race condition: averages score before last answer is graded (F01)
- Gemini retries without recursion depth limit (F01, F02)
- Grading blocks UI between questions (F01)
- Questions not stored at mock interview creation — lost on page refresh (F02)

### UX
- Onboarding wizard exists but is never triggered after registration (F03)
- No Google OAuth (F03)
- Employer signup silently creates a Candidate account (F03)
- Non-responsive fixed 450px+350px interview grid (F01)
- No browser compatibility check for SpeechRecognition (F01)
- `checkApiStatus` always returns `available: true` (F02)

---

## P2 Issues — Medium Priority (by feature)

**F01 — Interview Session**
- Feedback summary is 3 hardcoded text buckets; should be AI-generated per candidate
- Personality profile hidden from candidates (only employers see it)
- `useProctoring` has stale closure (needs `useCallback`)
- GazeTracker WASM assets load from jsDelivr CDN at runtime
- "Back to Dashboard" routes to wrong path

**F02 — Mock Interview**
- Difficulty is unvalidated string (should be enum)
- Preset card colors hardcoded; not in token system
- No session resumption after browser close

**F03 — Auth**
- No email verification
- Password reset has no rate limit
- Generic "Something went wrong" for all non-credential errors

**F04 — Resume Screener**
- Analysis results never persisted (no history)
- `Promise.withResolvers` polyfill patches global
- No file size / MIME type validation on direct upload

**F05 — Placement Program**
- Token validation is O(N) brute force (should be O(1))
- Adjacent day tokens pre-generated and sent to client props
- Streak logic not timezone-aware (IST vs UTC)
- Task content is untyped Json (no validation)

**F06 — Company Prep**
- Company card colors hardcoded by slug in page file

**F07 — Flashcards**
- Due date not timezone-aware

**F08 — Payments**
- Plan limits stored as untyped Json
- Free tier returns synthetic subscription object (duck-typed)
- Cancellation removes access immediately (no grace period)
- No invoice / receipt download

**F09 — Offer Tracker**
- Offer letters stored as public permanent R2 URLs
- No total compensation calculation displayed
- No deadline reminder notification

**F10 — Study Squad**
- No real collaborative functionality — should be hidden until minimum interaction model is built

**F11 — Mentor Matching**
- No notification to mentor on new mentorship request
- No communication channel after mentor accepts
- No mentor profile verification
- Should be hidden behind feature flag until interaction loop is complete

**F12 — Analytics**
- Landing page stats are hardcoded, not real data
- DashboardRefresher polls unconditionally
- DailyStat table may not be populated

---

## Deferred — Significant Effort

| Item | Feature | Notes |
|------|---------|-------|
| Replace Web Speech API with Deepgram STT | Speech | See dedicated speech audit |
| Replace speechSynthesis with Google TTS Neural2 | Speech | See dedicated speech audit |
| Record and store candidate audio to R2 | Speech | Requires Deepgram migration first |
| Code execution against test cases in Company Prep | F06 | Evaluate client-side JS eval vs. Judge0 |
| Employer aggregate view per job (all candidates ranked) | F12 | Medium effort |
| Full mentor + squad interaction model | F10, F11 | High effort; hide features until ready |
| Google OAuth | F03 | Low effort but cross-cutting |

---

## Quick Wins (Low effort, immediate impact)

1. Remove `--accept-data-loss` from build script → switch to `migrate deploy`
2. Fix `saveMockAnswer` prompt — pass `role` parameter
3. Remove `analyzeCode` fake AI function — stub with Gemini call
4. Remove webhook GET handler
5. Remove hardcoded day token secret fallback
6. Fix "Back to Dashboard" href in `permission-check.tsx`
7. Paginate dashboard query to 10 interviews
8. Add browser compatibility check before interview starts
9. Store role in JWT at sign-in time (remove DB query per request)
10. Add file size + MIME validation to document upload endpoints

---

## Design Decisions (from UX audit)

1. **P1** — Define `--brand` and `--brand-foreground` CSS tokens; replace 200+ hardcoded emerald/cyan/teal classes
2. **P1** — Fix light mode in sidebar and interview session (currently hardcoded dark values)
3. **P2** — Redesign landing page: remove animated blobs, add real product screenshot as hero
4. **P2** — Wire `CareerWizard` to post-registration flow (new user → onboarding)
5. **P2** — Clean up header: remove Gemini model selector and role badge
6. **P3** — Redesign empty states with illustrations and action prompts
7. **P3** — Reduce sidebar from 12 equal-weight items to 6-7 with clear hierarchy
8. **P4** — Align landing page and app interior visual register (currently feel like two products)

---

## Architecture Decisions (ADRs)

1. Switch from `prisma db push` to `prisma migrate deploy` — **accepted**, implementation pending
2. Add service layer (`lib/services/`) and versioned API (`app/api/v1/`) — **accepted**, implementation pending
3. Move rate limiting from PostgreSQL to Upstash Redis — **proposed**, not yet an ADR
4. Choose STT/TTS services (Deepgram / Google TTS Neural2) — **proposed**, see speech audit
