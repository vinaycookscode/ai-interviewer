# Feature 08 — Subscriptions & Payments
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Razorpay subscription billing, plan management, usage limits, webhook handling

---

## What This Feature Does

Three-tier subscription system (FREE / PRO / PREMIUM). Razorpay handles recurring billing. Webhook events update subscription status in the DB. Usage limits are enforced per-feature via a `UsageRecord` table and an in-app limit configuration.

---

## Flow Map (Current)

```
Candidate
  └─ Views subscription plans
  └─ Clicks upgrade → createSubscription() → Razorpay order created
  └─ Razorpay checkout → payment

Webhook (Razorpay → /api/webhooks/razorpay)
  └─ subscription.activated → update Subscription to ACTIVE
  └─ subscription.charged → create Payment record, renew period
  └─ subscription.cancelled → update Subscription to CANCELLED
  └─ subscription.halted → update Subscription to HALTED

Usage gating
  └─ checkUsageLimit(feature) → reads UsageRecord for current month
  └─ incrementUsage(feature) → writes UsageRecord
  └─ Plan limits are stored in SubscriptionPlan.limits Json
```

---

## Finding 1 — Webhook Has a GET Handler Returning Plain Text (P1 Security)

**File:** `app/api/webhooks/razorpay/route.ts`

```ts
export async function GET() {
    return Response.json({ message: "webhook endpoint is active" });
}
```

A `GET /api/webhooks/razorpay` returns a public `{"message": "webhook endpoint is active"}`. This:
- Confirms to any observer that this endpoint exists and is active
- Helps attackers map the attack surface
- Serves no legitimate purpose

Webhook endpoints should return 404 or 405 on non-POST requests, revealing nothing about the endpoint.

**Decision:** Remove the `GET` handler entirely.

---

## Finding 2 — Webhook Signature Verification Needs Confirmation (P1 Security)

Razorpay provides webhook signature verification via HMAC-SHA256 of the raw request body + `X-Razorpay-Signature` header. If this verification is missing, any HTTP client can post forged events to the webhook and activate subscriptions for free.

The action `actions/subscription.ts` and the webhook route need to be verified to include:
```ts
const signature = request.headers.get("x-razorpay-signature");
const rawBody = await request.text();
razorpay.webhooks.verify(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET);
```

**Decision:** Audit the webhook route to confirm signature verification is present. If absent, add it immediately — this is a P0 billing security issue.

---

## Finding 3 — Usage Limits Stored in SubscriptionPlan.limits Json (P2)

Usage limits per feature are stored as untyped `Json` in the plan record. If the JSON shape changes or a key is misspelled, `checkUsageLimit` silently fails or returns wrong values. There is no TypeScript enforcement on what the limits object looks like.

**Decision:** Define a TypeScript interface for plan limits:
```ts
interface PlanLimits {
    mock_interview: number;
    resume_analysis: number;
    cover_letter: number;
    // etc.
}
```
Validate the limits JSON against this interface when a plan is created or updated. Use Zod for runtime validation in `checkUsageLimit`.

---

## Finding 4 — Free Tier Returns a Fake Subscription Object (P2)

**File:** `actions/subscription.ts` → `getCurrentSubscription`

When a user has no subscription record, the function returns a manually constructed object:
```ts
return {
    plan: freePlan,
    status: "ACTIVE",
    isFree: true,
    currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    ...
};
```

This synthetic object looks like a subscription but isn't one. Code that calls `getCurrentSubscription()` receives a duck-typed object and must check `isFree` to know whether it's real. Any code that forgets the `isFree` check treats free users as paid subscribers.

**Decision:** Return `null` for free users. Callers check `if (!subscription || subscription.isFree)` explicitly. Or: create a real free-tier `Subscription` record at registration time — this is cleaner and removes the synthetic object pattern.

---

## Finding 5 — No Grace Period After Cancellation (P2 Product)

When `subscription.cancelled` webhook fires, the subscription is immediately set to `CANCELLED`. If a user cancels mid-month, they lose access immediately rather than at the end of the billing period they paid for.

**Decision:** On cancellation, set `cancelAtPeriodEnd = true` and keep the subscription `ACTIVE` until `currentPeriodEnd`. Only then move to `CANCELLED`. Razorpay provides `cancel_at_cycle_end` for this. The webhook `subscription.cancelled` fires at actual cancellation — in the interim, the subscription stays active.

---

## Finding 6 — No Invoice / Receipt Download (P2 UX)

The `Payment` model stores `razorpayPaymentId`, `amount`, `status`, and `createdAt`. But there is no UI for a candidate to download a payment receipt or invoice.

Indian GST requirements mean candidates or their employers may need invoices for reimbursement. The `Payment` table has the data; the UI just needs a download link.

**Decision:** Add a "Billing History" section in the candidate settings page. List payments with date, amount, and a "Download Receipt" link. If Razorpay provides receipt URLs, link directly. Otherwise generate a simple HTML-to-PDF invoice.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | Webhook GET handler reveals endpoint | P1 security | Trivial | Remove GET handler |
| 2 | Webhook signature verification — audit required | P1 security | Low | Verify HMAC check is in place; add if missing |
| 3 | Plan limits as untyped Json | P2 | Low | Define PlanLimits interface; validate with Zod |
| 4 | Free tier returns synthetic subscription object | P2 | Low | Create real free Subscription at registration, or return null |
| 5 | Cancellation removes access immediately | P2 product | Low | cancelAtPeriodEnd flow; keep active until period end |
| 6 | No payment receipt download | P2 UX | Medium | Billing history page with receipt links |
