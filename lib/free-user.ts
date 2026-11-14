// Whether someone is on the Free plan (AIIN-70). One check, used wherever a paid feature is gated.
import { PlanTier } from "@prisma/client";

/** Free when there's no subscription, or it's on the Free tier. */
export function isFreeUser(subscription: { plan: { tier: PlanTier } | null } | null | undefined): boolean {
    return !subscription || !subscription.plan || subscription.plan.tier === PlanTier.FREE;
}
