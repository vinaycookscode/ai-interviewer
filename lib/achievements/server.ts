// Awards and loads badges and the 90-day certificate (AIIN-102). Rules in lib/achievements/rules.ts.
// No access checks: callers pass the session user's id.
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { dateDay } from "@/lib/daily-challenge/logic";
import {
    ACHIEVEMENTS,
    CERTIFICATE_MIN_DAYS,
    certificateCode,
    earnedKeys,
    isAchievementKey,
    longestRun,
    metricsFor,
    progressOf,
    type AchievementKey,
    type Metric,
    type Stats,
} from "@/lib/achievements/rules";

const checkpointDone = (userId: string, day: number) =>
    db.mockInterview.count({ where: { userId, checkpointDay: day, score: { not: null } } }).then((n) => Math.min(n, 1));

const LOADERS: Record<Metric, (userId: string) => Promise<number>> = {
    // The longest run of active days, or the plan's own record from before there was one streak
    async streak(userId) {
        const [days, plan] = await Promise.all([
            db.activityDay.findMany({ where: { userId }, select: { day: true } }),
            db.programEnrollment.aggregate({ where: { userId }, _max: { longestStreak: true } }),
        ]);
        return Math.max(longestRun(days.map((d) => dateDay(d.day))), plan._max.longestStreak ?? 0);
    },
    practice: (userId) => db.mockInterview.count({ where: { userId, score: { not: null } } }),
    async bestScore(userId) {
        const best = await db.mockInterview.aggregate({ where: { userId }, _max: { score: true } });
        return best._max.score ?? 0;
    },
    challenges: (userId) => db.dailyChallengeAnswer.count({ where: { userId } }),
    // Each plan checkpoint, once finished (AIIN-101)
    checkpoint30: (userId) => checkpointDone(userId, 30),
    checkpoint60: (userId) => checkpointDone(userId, 60),
    checkpoint90: (userId) => checkpointDone(userId, 90),
    // Problems where every test passed, in any language
    async problems(userId) {
        const solutions = await db.userCompanySolution.findMany({
            where: { userId, totalTests: { gt: 0 } },
            select: { questionId: true, passedTests: true, totalTests: true },
        });
        return new Set(solutions.filter((s) => s.passedTests === s.totalTests).map((s) => s.questionId)).size;
    },
    async flashcards(userId) {
        const reviews = await db.flashcardProgress.aggregate({ where: { userId }, _sum: { correctCount: true, incorrectCount: true } });
        return (reviews._sum.correctCount ?? 0) + (reviews._sum.incorrectCount ?? 0);
    },
};

async function loadStats<M extends Metric>(userId: string, metrics: M[]): Promise<Pick<Stats, M>> {
    const values = await Promise.all(metrics.map((m) => LOADERS[m](userId)));
    return Object.fromEntries(metrics.map((m, i) => [m, values[i]])) as Pick<Stats, M>;
}

/**
 * Stores any badge the candidate has now earned, once only. Call it after the action that can earn one, with the
 * metrics that action changed. Never throws: a badge must not break the action that earned it.
 * `seen` stores them without the "New badge" toast (for the backfill).
 */
export async function awardAchievements(userId: string, only?: Metric[], { seen = false } = {}) {
    try {
        const keys = earnedKeys(await loadStats(userId, metricsFor(only)));
        if (!keys.length) return;
        await db.userAchievement.createMany({
            data: keys.map((key) => ({ userId, key, seenAt: seen ? new Date() : null })),
            skipDuplicates: true,
        });
    } catch (error) {
        console.error("Awarding badges failed:", error);
    }
}

/** Issues the certificate for a finished 90-day plan, once. Returns its code, or null if the plan doesn't earn one. */
export async function issueCertificate(enrollmentId: string): Promise<string | null> {
    const enrollment = await db.programEnrollment.findUnique({
        where: { id: enrollmentId },
        select: {
            userId: true,
            status: true,
            certificate: { select: { id: true } },
            user: { select: { name: true, email: true } },
            program: { select: { name: true, durationDays: true } },
        },
    });
    if (!enrollment || enrollment.status !== "COMPLETED" || enrollment.program.durationDays < CERTIFICATE_MIN_DAYS) return null;
    if (enrollment.certificate) return enrollment.certificate.id;

    // The name the candidate gave, or the part of the email before the @ if they never did
    const name = enrollment.user.name?.trim() || enrollment.user.email.split("@")[0];
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            const created = await db.certificate.create({
                data: { id: certificateCode(randomBytes(8)), userId: enrollment.userId, enrollmentId, name, planName: enrollment.program.name },
                select: { id: true },
            });
            return created.id;
        } catch {
            // A code clash (rare) tries a new code; a second issue for the same plan finds the first
            const existing = await db.certificate.findUnique({ where: { enrollmentId }, select: { id: true } });
            if (existing) return existing.id;
        }
    }
    return null;
}

export interface BadgeView {
    key: AchievementKey;
    earnedAt: Date | null;
    progress: number | null;
    target: number;
}

/** Every badge, earned (newest first, with the date) then locked (with how far along). */
export async function loadBadges(userId: string) {
    const [rows, stats] = await Promise.all([
        db.userAchievement.findMany({ where: { userId }, select: { key: true, earnedAt: true } }),
        loadStats(userId, metricsFor()),
    ]);
    const earnedAt = new Map(rows.map((r) => [r.key, r.earnedAt]));
    const earned: BadgeView[] = [];
    const locked: BadgeView[] = [];
    for (const a of ACHIEVEMENTS) {
        const at = earnedAt.get(a.key);
        if (at) earned.push({ key: a.key, earnedAt: at, progress: null, target: a.target });
        else locked.push({ key: a.key, earnedAt: null, progress: progressOf(a, stats), target: a.target });
    }
    earned.sort((a, b) => b.earnedAt!.getTime() - a.earnedAt!.getTime());
    return { earned, locked, total: ACHIEVEMENTS.length };
}

/** The latest badge, for Today. */
export async function latestBadge(userId: string) {
    const rows = await db.userAchievement.findMany({ where: { userId }, orderBy: { earnedAt: "desc" }, take: 5, select: { key: true, earnedAt: true } });
    const row = rows.find((r) => isAchievementKey(r.key));
    return row ? { key: row.key as AchievementKey, earnedAt: row.earnedAt } : null;
}

/** Badges the toast hasn't shown yet, marked as shown now. */
export async function takeUnseenBadges(userId: string): Promise<AchievementKey[]> {
    const rows = await db.userAchievement.findMany({ where: { userId, seenAt: null }, orderBy: { earnedAt: "asc" }, select: { key: true } });
    if (!rows.length) return [];
    await db.userAchievement.updateMany({ where: { userId, seenAt: null, key: { in: rows.map((r) => r.key) } }, data: { seenAt: new Date() } });
    return rows.map((r) => r.key).filter(isAchievementKey);
}
