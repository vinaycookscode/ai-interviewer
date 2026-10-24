# Feature 05 — Placement Program (90-Day Bootcamp)
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Structured multi-day program with daily tasks, streaks, and progress tracking

---

## What This Feature Does

A structured placement preparation program (e.g., 90-day bootcamp). Candidates enroll in a program, complete daily tasks (quizzes, coding problems, mock interviews, reading), track streaks, and advance day by day. Day content is served via a tokenized API route to prevent skipping ahead.

---

## Flow Map (Current)

```
Candidate
  └─ Enrolls in PlacementProgram
  └─ /candidate/placement-program/[slug]?d=[dayToken]
       └─ Server page loads enrollment + current day data
       └─ ProgramDashboardClient renders TaskList
            └─ useSWR polls /api/placement/day/[day]?enrollmentId=...&token=...
            └─ Pre-fetches adjacent days in useEffect
       └─ Tasks: startTask() → completeTask() server actions
       └─ advanceToNextDay() when all tasks complete
       └─ Streak counter tracks consecutive daily completions

Day token system
  └─ HMAC-SHA256(enrollmentId + dayNumber + secret) → first 16 chars
  └─ validateDayToken() iterates day 1..90 to brute-check all possible days
```

---

## Finding 1 — Day Token Validation Is O(N) Brute Force (P1 Security/Performance)

**File:** `actions/placement-program.ts` → `validateDayToken`

```ts
for (let day = 1; day <= maxDay; day++) {
    const validToken = await generateDayToken(enrollmentId, day);
    if (validToken === token) return day;
}
return null;
```

To validate a single day token, the code generates HMAC tokens for every day from 1 to `maxDay` (default 90) and compares each one. This means:
- Every API request to `/api/placement/day/[day]` runs up to 90 HMAC computations
- The day number is already in the URL path — so the validation is computing all 90 tokens just to verify what the URL already states

This is backwards. The token should encode the day number, not require brute-force discovery of it.

**Decision:** Change the token scheme. The token validates (enrollment + day) together:
```ts
function generateDayToken(enrollmentId: string, day: number): string {
    return hmac(`${enrollmentId}:${day}`, secret).slice(0, 16);
}

function validateDayToken(enrollmentId: string, day: number, token: string): boolean {
    return generateDayToken(enrollmentId, day) === token;
}
```

The `day` parameter comes from the URL path — pass it directly to validation. O(1) instead of O(N).

---

## Finding 2 — Default Token Secret Is a Hardcoded String (P1 Security)

**File:** `actions/placement-program.ts`

```ts
const DAY_TOKEN_SECRET = process.env.DAY_TOKEN_SECRET || 'bootcamp-default-secret-change-in-production';
```

If `DAY_TOKEN_SECRET` is not set in the environment, the fallback `'bootcamp-default-secret-change-in-production'` is used. Anyone who reads this source code (it's on GitHub or visible to any developer) can generate valid day tokens for any enrollment. The token system's security depends entirely on this secret being set in the environment.

**Decision:** Remove the fallback string. If `DAY_TOKEN_SECRET` is not set, throw at startup: `throw new Error("DAY_TOKEN_SECRET environment variable is required")`. Add it to the `.env.example` file. This is a fail-secure pattern — better to fail loudly than to silently use a known secret.

---

## Finding 3 — `startTask` Action Has No Authorization Check (P1 Security)

**File:** `actions/placement-program.ts` → `startTask`

The `startTask` and `completeTask` actions accept `enrollmentId` and `taskId` as parameters. If there is no ownership check — verifying that the authenticated user owns the enrollment — a candidate could start or complete tasks in another user's enrollment by guessing their enrollment ID.

Enrollment IDs are cuid() values, so guessing is impractical, but relying on entropy for authorization is not a security pattern. Authorization should be explicit.

**Decision:** In `startTask` and `completeTask`, verify that the enrollment belongs to the current session user before updating:
```ts
const enrollment = await db.programEnrollment.findUnique({
    where: { id: enrollmentId, userId: session.user.id }
});
if (!enrollment) return { error: "Unauthorized" };
```

---

## Finding 4 — Adjacent Day Pre-fetching Is Unauthenticated (P2)

**File:** `components/candidate/placement-program/[slug]/client.tsx`

```ts
useEffect(() => {
    if (currentViewDay > 1 && prevDayToken) {
        fetch(`/api/placement/day/${currentViewDay - 1}?enrollmentId=...&token=${prevDayToken}`);
    }
    ...
}, [currentViewDay, ...]);
```

The pre-fetch fires client-side `fetch()` calls to populate the SWR cache for adjacent days. These calls hit the API route which presumably validates the token. This is fine — but the token from `prevDayToken` is passed as a prop from the server page, meaning the server pre-generates tokens for days the user hasn't reached yet and sends them to the client.

If someone intercepts or inspects the page props (e.g., from `__NEXT_DATA__`), they can get the token for the next day before completing the current one.

**Decision:** Do not pre-generate next-day tokens in server props. Pre-fetch only previously completed days (previous day token is fine). For the next day: generate the token only after `advanceToNextDay()` succeeds, returned from the server action.

---

## Finding 5 — Streak Logic Is Not Timezone-Aware (P2 Bug)

**File:** `actions/placement-program.ts`

Streak counting presumably uses `lastActiveAt` timestamps to determine if a candidate completed tasks on consecutive calendar days. If the comparison uses UTC timestamps but the candidate is in IST (UTC+5:30), a task completed at 11 PM IST is recorded as the next UTC day. A candidate who completes tasks at 11:30 PM every day could find their streak broken because consecutive local days are not consecutive UTC days.

For an Indian product, IST timezone handling in streak logic is not optional.

**Decision:** Store and compare dates in the user's local timezone. Add `timezone String @default("Asia/Kolkata")` to `User` or derive it from the candidate profile. Use `date-fns-tz` for date arithmetic in streak calculations.

---

## Finding 6 — Task Content Is Stored as Raw JSON (P2 Maintainability)

**File:** Prisma schema — `DailyTask.content Json`

Task content (reading material, quiz questions, coding problems) is stored as untyped `Json`. There is no schema validation on what this JSON contains. A quiz task and a coding task can have completely different shapes in the same column.

If a task's content JSON is malformed or missing expected fields, the UI will fail silently or throw a runtime error when the component tries to access `task.content.questions[0]`.

**Decision:** Define TypeScript interfaces for each task type's content shape (`QuizContent`, `CodingContent`, `ReadingContent`, `MockContent`). Add a Zod schema for each and validate on read in the `TaskModal` component. If content doesn't match the expected shape, show a fallback error state instead of crashing.

---

## Finding 7 — No Progress Analytics for Admins (P2 Product)

The placement program has `ProgramEnrollment` with `currentDay`, `streak`, `longestStreak`, `status`. But there is no admin view showing:
- How many users are enrolled per program
- Average completion rate by day (where do users drop off?)
- Streak distribution

Without this data, improving the program is guesswork.

**Decision:** Build a simple admin analytics query that returns: total enrollments, active enrollments by day bucket (days 1–10, 11–30, 31–60, 61–90), average streak, and completion rate. This can be a read-only admin page with no interactive elements.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | Token validation is O(N) brute force | P1 | Low | Pass day number to validation; O(1) HMAC compare |
| 2 | Default token secret is a known string | P1 security | Trivial | Remove fallback; throw if env var missing |
| 3 | startTask / completeTask lack ownership check | P1 security | Low | Verify enrollmentId belongs to session.user.id |
| 4 | Next-day tokens pre-generated and sent to client | P2 security | Low | Only send tokens for completed days; generate next-day token after advancement |
| 5 | Streak logic not timezone-aware | P2 bug | Low | Use IST-aware date comparison for streaks |
| 6 | Task content is untyped Json | P2 | Low | Define content interfaces per TaskType; validate with Zod on read |
| 7 | No admin analytics on program completion | P2 product | Medium | Admin dashboard: enrollment count, day-by-day drop-off, streak distribution |

---

## What Good Looks Like (Target State)

1. **O(1) token validation** — single HMAC compare, no loop
2. **Fail-secure secrets** — missing env var throws at startup
3. **Explicit ownership checks** — every mutation verifies the user owns the enrollment
4. **IST-aware streaks** — no phantom streak breaks for Indian users at midnight UTC
5. **Typed task content** — malformed content shows a graceful error, not a crash
6. **Admin visibility** — program managers can see where users drop off and fix those days

---

## Dependencies

- Schema migrations: `docs/architecture/2026-10-24-switch-to-prisma-migrations.md`
