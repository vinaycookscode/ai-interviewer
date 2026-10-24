# Feature 11 — Mentor Matching
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Connecting candidates with industry mentors

---

## What This Feature Does

Candidates can browse available mentors (filtered by company, role, skills). Mentors create profiles with their background. Mentorships are initiated and tracked. The feature is in the schema and actions but appears to be early-stage.

---

## Flow Map (Current)

```
Mentor
  └─ Creates MentorProfile (company, role, experience, skills, bio, linkedin)
  └─ Sets isAvailable flag

Candidate
  └─ Views available mentors (getAvailableMentors)
  └─ Requests mentorship (requestMentorship)

System
  └─ Mentorship record created with status PENDING
  └─ No visible notification to mentor
  └─ No communication channel
```

---

## Finding 1 — Mentor Has No Way to Be Notified of Requests (P1 Product)

**File:** `actions/mentorship.ts` → `requestMentorship`

When a candidate requests a mentorship, a `Mentorship` record is created with status `PENDING`. There is no email or notification sent to the mentor. The mentor must proactively log in and check for pending requests.

The mentor discovery and matching flow is complete on the candidate side but has no feedback loop to the mentor.

**Decision:** Send an email to the mentor when a new mentorship request is received. Include the candidate's name, role interest, and a link to accept or decline. Use the existing Resend email flow.

---

## Finding 2 — No Communication Channel Between Mentor and Mentee (P1 Product Gap)

Once a mentorship is `ACTIVE`, there is no in-product way for the mentor and mentee to communicate. There are no sessions, no notes, no messages.

A mentorship with no communication mechanism is just a database record. The mentor and mentee would have to exchange contact details outside the product, which means the product provides no ongoing value after the initial match.

**Decision:** Two paths:
1. **Minimal**: Add a "Session Notes" field where either party can log meeting notes after each session. Low effort, high retention value.
2. **Full**: Integrate Calendly or Google Calendar for session scheduling. Out of scope for current phase.

Start with minimal: session log with date, duration, and notes. Both parties can view all sessions.

---

## Finding 3 — No Mentor Verification (P2 Trust)

Anyone can create a mentor profile claiming to be a "Senior Engineer at Google." There is no verification step — no email domain check, no LinkedIn verification, no admin approval.

A candidate who connects with a fake mentor loses trust in the product.

**Decision:** Add a mentor application flow with admin approval. When a mentor submits their profile, status is `PENDING_REVIEW`. An admin reviews and approves. Approved mentors appear in the directory. Send a verification email to the mentor's company email if provided.

---

## Finding 4 — getAvailableMentors Has No Pagination (P2 Performance)

**File:** `actions/mentorship.ts`

```ts
return db.mentorProfile.findMany({
    where: { isAvailable: true },
    ...
    orderBy: { createdAt: "desc" }
});
```

All available mentors are returned in one query. As the mentor count grows, this query returns unbounded results to the client.

**Decision:** Add `take` and `cursor` pagination. Default to 20 mentors per page. Add filters (by skill, company, experience level) at the query level, not the client level.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | No notification to mentor on new request | P1 product | Low | Email notification via Resend on mentorship request |
| 2 | No communication channel after match | P1 product | Medium | Session log with date, duration, notes |
| 3 | No mentor profile verification | P2 trust | Medium | Admin approval flow for mentor profiles |
| 4 | getAvailableMentors has no pagination | P2 performance | Low | Cursor-based pagination; 20 per page |

---

## Recommendation

Like Study Squad, Mentor Matching is not production-ready. The mentor receives no notification, and after acceptance there is nothing to do inside the product. Both features should be hidden from non-beta users until the minimum interaction loop (notify → communicate → log sessions) is in place.
