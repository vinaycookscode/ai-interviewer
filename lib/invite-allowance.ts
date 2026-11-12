// An employer's Talent Match invitation allowance this month (AIIN-201, AIIN-204). Server only.
import { db } from "@/lib/db";
import { invitesLeft, istMonthStart } from "@/lib/invitations";

/** The limit comes from the employer's active plan, or the Free plan without one; usage counts invitations sent. */
export async function inviteAllowance(employerId: string, now = new Date()): Promise<{ limit: number; used: number; left: number | null }> {
    const [sub, free, used] = await Promise.all([
        db.subscription.findFirst({ where: { userId: employerId, status: "ACTIVE" }, select: { plan: { select: { talentInvitesPerMonth: true } } } }),
        db.subscriptionPlan.findUnique({ where: { tier: "FREE" }, select: { talentInvitesPerMonth: true } }),
        db.application.count({ where: { employerId, invitedAt: { gte: istMonthStart(now) } } }),
    ]);
    const limit = sub?.plan.talentInvitesPerMonth ?? free?.talentInvitesPerMonth ?? 10;
    return { limit, used, left: invitesLeft(limit, used) };
}
