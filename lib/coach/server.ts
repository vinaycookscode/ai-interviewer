// Ask U's data: what it knows about the candidate, the daily message limit, and the chats (AIIN-100).
// No access checks: callers pass the session user's id.
import { PlanTier } from "@prisma/client";
import { db } from "@/lib/db";
import { istDay, startOfIstDay } from "@/lib/ist";
import { loadStreak } from "@/lib/daily-challenge/server";
import { HISTORY_LIMIT, type AnswerFact, type CoachFacts } from "@/lib/coach/context";

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** The candidate's own path, scores, plan and streak. Nothing else: no contact details, documents or employer data. */
export async function loadCoachFacts(userId: string): Promise<CoachFacts> {
    const [user, practice, interviews, enrollment, inProgress, streak] = await Promise.all([
        db.user.findUnique({
            where: { id: userId },
            select: { name: true, candidateProfile: { select: { primaryRole: true, skills: true, careerGoals: true } } },
        }),
        db.mockInterview.findMany({
            where: { userId, score: { not: null } },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { role: true, score: true, createdAt: true, answers: { where: { score: { gt: 0 } }, select: { question: true, score: true } } },
        }),
        db.interview.findMany({
            where: { candidateId: userId, status: "COMPLETED", score: { not: null } },
            orderBy: { completedAt: "desc" },
            take: 3,
            select: { score: true, completedAt: true, createdAt: true },
        }),
        db.programEnrollment.findFirst({
            where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
            orderBy: { lastActiveAt: "desc" },
            select: { currentDay: true, programId: true, program: { select: { name: true, durationDays: true } } },
        }),
        db.interview.count({ where: { candidateId: userId, status: "IN_PROGRESS" } }),
        loadStreak(userId),
    ]);

    const todayModule = enrollment
        ? await db.programModule.findUnique({
              where: { programId_dayNumber: { programId: enrollment.programId, dayNumber: enrollment.currentDay } },
              select: { title: true },
          })
        : null;

    const extremes = (answers: { question: string; score: number | null }[]) => {
        const scored = answers.filter((a): a is AnswerFact => a.score !== null).sort((a, b) => b.score - a.score);
        if (scored.length < 2) return { strongest: null, weakest: scored[0] ?? null };
        return { strongest: scored[0], weakest: scored[scored.length - 1] };
    };

    const profile = user?.candidateProfile;
    return {
        firstName: user?.name?.trim().split(/\s+/)[0] || null,
        role: profile?.primaryRole || null,
        skills: profile?.skills ?? [],
        goal: profile?.careerGoals || null,
        practice: practice.map((p) => ({ role: p.role, score: p.score!, when: shortDate.format(p.createdAt), ...extremes(p.answers) })),
        interviews: interviews.map((i) => ({ score: i.score!, when: shortDate.format(i.completedAt ?? i.createdAt) })),
        plan: enrollment
            ? { name: enrollment.program.name, day: enrollment.currentDay, total: enrollment.program.durationDays, todayTopic: todayModule?.title ?? null }
            : null,
        streak: streak.streak,
        interviewInProgress: inProgress > 0,
    };
}

const FEATURE = "coach_message";

export interface CoachQuota {
    limit: number;
    used: number;
    left: number;
    free: boolean;
    /** Midnight IST, when the count starts again. */
    resetAt: Date;
}

async function dailyLimit(userId: string) {
    const subscription = await db.subscription.findUnique({ where: { userId }, select: { status: true, plan: { select: { tier: true, coachMessagesPerDay: true } } } });
    if (subscription?.status === "ACTIVE") return { limit: subscription.plan.coachMessagesPerDay, free: subscription.plan.tier === PlanTier.FREE };
    const free = await db.subscriptionPlan.findUnique({ where: { tier: PlanTier.FREE }, select: { coachMessagesPerDay: true } });
    return { limit: free?.coachMessagesPerDay ?? 10, free: true };
}

/** Today's messages, counted per IST day. Deleting a chat doesn't give them back. */
export async function loadQuota(userId: string, now = new Date()): Promise<CoachQuota> {
    const today = istDay(now);
    const [{ limit, free }, record] = await Promise.all([
        dailyLimit(userId),
        db.usageRecord.findUnique({ where: { userId_featureType_periodStart: { userId, featureType: FEATURE, periodStart: startOfIstDay(today) } }, select: { usageCount: true } }),
    ]);
    const used = record?.usageCount ?? 0;
    return { limit, used, left: Math.max(0, limit - used), free, resetAt: startOfIstDay(today + 1) };
}

/** Takes one of today's messages, or returns null at the limit. Safe when two arrive at once. */
export async function takeMessage(userId: string, now = new Date()): Promise<CoachQuota | null> {
    const today = istDay(now);
    const periodStart = startOfIstDay(today);
    const { limit } = await dailyLimit(userId);
    const record = await db.usageRecord.upsert({
        where: { userId_featureType_periodStart: { userId, featureType: FEATURE, periodStart } },
        create: { userId, featureType: FEATURE, periodStart, periodEnd: startOfIstDay(today + 1), usageCount: 1 },
        update: { usageCount: { increment: 1 } },
        select: { usageCount: true },
    });
    if (record.usageCount > limit) {
        await db.usageRecord.update({ where: { userId_featureType_periodStart: { userId, featureType: FEATURE, periodStart } }, data: { usageCount: { decrement: 1 } } });
        return null;
    }
    return loadQuota(userId, now);
}

/** The candidate's own chat, or null: another user's id is not found. */
export function ownConversation(userId: string, id: string) {
    return db.coachConversation.findFirst({ where: { id, userId }, select: { id: true, title: true } });
}

/** The last messages of a chat, oldest first, for Gemini. */
export async function recentMessages(conversationId: string) {
    const rows = await db.coachMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
        select: { role: true, content: true },
    });
    return rows.reverse();
}
