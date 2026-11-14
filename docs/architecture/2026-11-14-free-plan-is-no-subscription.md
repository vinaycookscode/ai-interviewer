# The Free plan is the absence of a subscription
**Date:** 2026-11-14  
**Status:** Accepted · implemented (AIIN-70)  
**Deciders:** Vinay

## Context

`getCurrentSubscription()` built a fake, "ACTIVE" subscription for people without one, with `isFree: true`. Every caller had to remember to check `isFree`; one that didn't would treat a Free user as paying. Eight pages repeated the same three-part check. The subscriptions audit (2026-10-24, finding 4) offered two fixes: return nothing for Free users, or create a real Free subscription at sign-up.

## Decision

- **No subscription row means Free.** `getCurrentSubscription()` returns `null` when there's no row, and never invents one.
- **One check.** `isFreeUser(subscription)` in `lib/free-user.ts` is Free when there's no subscription, no plan, or the Free tier. Every paid-feature gate uses it; the returned `isFree` field is gone.
- Plan limits were already typed columns on `SubscriptionPlan`, so the audit's other point needed no change.

## Consequences

- A Free user has no `Subscription` row, as before; Razorpay checkout and webhooks are unchanged.
- Pages that show plan details treat "no subscription" as Free (the pricing page marks Free as the current plan).

## Alternatives considered

- **A real Free subscription for everyone.** It's uniform, but it needs a migration and backfill for every existing account, has to be created at every sign-up path (including invitations and the open drive link), and changes what the Razorpay webhook updates. That's more risk than the problem warrants.
