# Feature 09 — Offer Tracker
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Candidate job offer management — add, compare, accept/decline, track deadline

---

## What This Feature Does

Candidates track job offers they receive. Each offer records company, role, location, base salary, bonus, stocks, deadline, joining date, and offer letter URL. Candidates can accept, decline, or mark offers pending. The UI shows salary comparisons and a deadline countdown.

---

## Flow Map (Current)

```
Candidate
  └─ /candidate/offers
       └─ Lists all offers (OffersClient)
       └─ Add offer → form with salary, company, deadline
       └─ Update status (PENDING / ACCEPTED / DECLINED)
       └─ Delete offer
       └─ Upload offer letter → R2
  └─ Salary displayed as Indian format (₹ Lakh / Crore)
```

---

## Finding 1 — No Offer Comparison View (P1 Product Gap)

The offer tracker stores multiple offers but there is no side-by-side comparison. Candidates with two or three offers cannot see them aligned. The list view shows one offer at a time.

This is the primary use case of an offer tracker — "should I take Amazon or Google?" — and it is not supported.

**Decision:** Add a comparison view that aligns 2–3 selected offers in columns: base, bonus, stocks, total comp, location, deadline. This is pure presentation — the data is already in the model.

---

## Finding 2 — Total Compensation Is Not Computed (P2)

**File:** `app/candidate/offers/client.tsx`

`baseSalary`, `bonus`, and `stocks` are stored separately. The UI shows them as separate line items but there is no `totalCompensation` calculation displayed anywhere. A candidate comparing a ₹20L base + ₹4L bonus + ₹10L stocks offer against a ₹30L base offer cannot see the total comp at a glance.

**Decision:** Compute `totalComp = baseSalary + (bonus ?? 0) + (stocks ?? 0)` and display it prominently on each offer card and in the comparison view.

---

## Finding 3 — Deadline Countdown Is Visual Only (P2)

Offer deadlines are stored and displayed, but there is no notification system. A candidate who adds an offer with a 7-day deadline gets no reminder as the deadline approaches.

**Decision:** Send an email reminder 48 hours before each offer deadline. Use a scheduled job or check deadlines on dashboard load. The `Resend` email service is already in use.

---

## Finding 4 — Offer Letter Upload Stores Direct R2 URL (P2 Security)

**File:** Related upload action

Offer letters are uploaded to Cloudflare R2 and the direct object URL is stored in `JobOffer.offerLetterUrl`. This URL is accessible to anyone who has it — there is no expiry, no access control.

An offer letter contains sensitive personal information: CTC, joining date, employee ID, full legal name. These documents should not be publicly accessible via a guessable (or leaked) URL.

**Decision:** When serving offer letters, generate a pre-signed R2 URL with a short TTL (e.g., 15 minutes) rather than storing and serving the permanent public URL. The stored value should be the R2 object key, not the public URL.

---

## Finding 5 — No Export / Share Feature (P3)

Candidates sometimes need to share their offer details with a family member, mentor, or recruiter for negotiation advice. There is no way to export or share an offer summary.

**Decision:** Add a "Share summary" button that generates a read-only shareable link with sanitized offer details (no personal document, just the numbers). Link expires in 7 days.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | No side-by-side offer comparison | P1 product | Medium | Comparison view for 2-3 selected offers |
| 2 | Total compensation not computed | P2 | Low | Display totalComp = base + bonus + stocks |
| 3 | No deadline reminder notification | P2 | Medium | Email reminder 48h before deadline via Resend |
| 4 | Offer letters stored as public permanent R2 URLs | P2 security | Low | Store object key; serve via pre-signed URL with TTL |
| 5 | No export or share feature | P3 | Medium | Shareable read-only link, 7-day expiry |
