# Feature 12 — Analytics & Dashboard
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Candidate performance dashboard, employer results view, admin analytics

---

## What This Feature Does

The candidate dashboard shows upcoming interviews, past interview history, performance metrics (average score, readiness), and a refresh mechanism. The employer view shows candidate results. An admin layer tracks usage statistics.

---

## Finding 1 — Dashboard Fetches All Interviews Without Pagination (P1 Performance)

**File:** `app/candidate/dashboard/page.tsx`

The dashboard fetches all past interviews for the user in a single query with no `take` limit:

```ts
const interviews = await db.interview.findMany({
    where: { candidateId: session.user.id },
    include: { job: true, answers: true },
    orderBy: { createdAt: 'desc' }
});
```

For a candidate with 50+ interviews, this returns all records with all their answers (potentially 400+ rows) on every dashboard load. The `InterviewCard` type is also typed as `any`, providing no compile-time safety.

**Decision:** Paginate dashboard queries. Default to 10 recent interviews; show a "Load more" button. Type `InterviewCard` with a proper interface. Separate the `answers` fetch from the list view — list shows only header fields; answers load on demand.

---

## Finding 2 — DashboardRefresher Polls on Every Page Load (P1 Performance)

**File:** `components/candidate/dashboard-refresher.tsx`

A `DashboardRefresher` component (likely using `router.refresh()` or `revalidatePath`) runs on mount to detect pending score updates. This unconditional refresh fires on every dashboard load, even when there are no pending interviews.

**Decision:** Only trigger the refresh when there is at least one interview with `status: 'IN_PROGRESS'` or `score: null`. Pass a `hasPendingInterviews` prop from the server component. The refresher only activates when this is true.

---

## Finding 3 — Stats Tiles Show Static Data (P1 Product)

The landing page (`app/page.tsx`) shows stats like "10,000+ interviews conducted" and "95% success rate." These are translation-file values — hardcoded strings — not real data from the database.

Even the candidate dashboard's "Readiness Score" and aggregate metrics may be computed simplistically without the depth to be meaningful.

**Decision:** 
- Landing page stats: compute real counts from the DB (total completed interviews, registered users, average score). Cache the result for 1 hour. Show real numbers.
- Candidate readiness score: define a documented formula that combines interview count, average score, practice sessions, and streak. Show the formula components so the candidate knows how to improve.

---

## Finding 4 — No Employer Analytics View (P2 Product Gap)

Employers who have invited multiple candidates have no aggregate view. They cannot see:
- How candidates ranked against each other across the same job
- Average score for a specific job posting
- Score distribution (histogram) to calibrate what a good score means for their role

The feedback page shows one candidate at a time. There is no "here are all 8 candidates for this job, ranked" view.

**Decision:** Add an employer results page per job:
- Table of all candidates for that job with their scores
- Score distribution chart
- "Top candidate" highlighted
- CSV export

This directly serves the employer's hiring decision workflow.

---

## Finding 5 — No Candidate Progress Trend Over Time (P2 Product)

A candidate who takes 5 practice sessions and 2 real interviews has no view showing their score improvement over time. Each interview is shown as a card with a score, but there is no graph showing the trajectory.

**Decision:** Add a simple line chart on the dashboard showing score trend over the last 10 sessions (mock + real). This is high-motivation data — candidates improve when they see the trend moving up.

---

## Finding 6 — DailyStat Table Exists But Is Not Clearly Populated (P2)

**File:** Prisma schema — `DailyStat` model

The schema has a `DailyStat` model (presumably for admin analytics) but it is unclear what populates it — no action or cron job is visibly writing to it. If it's not being populated, it is dead data infrastructure.

**Decision:** Audit where `DailyStat` is written. If nothing writes to it, either implement the writer (a daily aggregation job that summarizes `UsageRecord` data) or drop the table.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | Dashboard fetches all interviews, no pagination | P1 | Low | Paginate to 10; type InterviewCard properly |
| 2 | DashboardRefresher polls unconditionally | P1 | Low | Only activate when hasPendingInterviews |
| 3 | Landing page stats are hardcoded; dashboard metrics shallow | P1 product | Medium | Real DB counts on landing; documented readiness score formula |
| 4 | No employer aggregate view per job | P2 product | Medium | Employer results table + score distribution per job posting |
| 5 | No candidate progress trend chart | P2 UX | Low | Score trend line chart over last 10 sessions |
| 6 | DailyStat table may not be populated | P2 | Low | Audit writes; implement or drop |

---

## What Good Looks Like (Target State)

1. **Paginated dashboard** — fast loads regardless of interview history length
2. **Real stats everywhere** — landing page numbers come from the DB; no hardcoded claims
3. **Candidate growth story** — score trend visible; readiness score explained and actionable
4. **Employer hiring workflow** — all candidates for a job in one view, sortable by score
