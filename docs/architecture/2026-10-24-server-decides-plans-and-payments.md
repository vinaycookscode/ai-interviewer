# The server decides plans and payments
**Date:** 2026-10-24  
**Status:** Accepted — implemented (AIIN-24, AIIN-25, AIIN-110, AIIN-112)  
**Deciders:** Engineering

## Context

- `verifyAndActivateSubscription` trusted the client's `planId` and `billingPeriod`, so a user could pay for the cheapest plan and activate any plan (AIIN-25).
- A payment could be replayed on another account, because activation ran before the payment was recorded (AIIN-25).
- The Razorpay webhook caught database errors and answered `200`, so Razorpay never retried a failed event (AIIN-110). It also had a `GET` handler that revealed the endpoint (AIIN-24).
- The plan a visitor picked on the pricing page was passed through sign-up "encrypted" with a `NEXT_PUBLIC` key that had a hardcoded fallback, so the encryption protected nothing (AIIN-112).

## Decision

1. **Plan choice is a hint, not a price.** The landing page passes `?plan=PRO&period=YEARLY` as plain query parameters. `readPlanSelection()` in `lib/plan-selection.ts` accepts only known values. It preselects a plan in the UI; prices and activation are always decided on the server. `lib/encryption.ts` is deleted.
2. **Activation is bound to the paid order.**
   - The server fetches the Razorpay order and requires its server-set notes to match the session user, plan and billing period.
   - It records the order's amount instead of recomputing it.
   - It rejects a payment ID that is already recorded, and activates and records the payment in one transaction.
   - Signatures are compared in constant time.
3. **Webhooks fail loudly and apply once.**
   - Real failures return `500` so Razorpay retries.
   - Conditions a retry can't fix (no subscription row, no user ID) are acknowledged.
   - Payments are upserted by `razorpayPaymentId`, so a redelivered event doesn't duplicate.
   - The webhook route accepts `POST` only.

## Consequences

**Easier:** Paying for one plan can only ever activate that plan, once, for the payer. Webhook outages heal themselves through Razorpay's retries.

**Harder:** Checkout can't be exercised locally without Razorpay test keys; local testing uses dummy keys and stops at checkout (see [`docs/LOCAL_DEVELOPMENT.md`](../LOCAL_DEVELOPMENT.md)).

**Still to verify with test keys:** AIIN-25's end-to-end checkout path is In Review until it has been run against Razorpay test mode.

## Alternatives considered

- **Keep encrypting the plan parameter with a server-only key.** It would still only carry a preference; validating against known values is simpler and just as safe.
- **Swallow webhook errors but alert on them.** Retries are free and automatic; alerts need someone to replay events by hand.
