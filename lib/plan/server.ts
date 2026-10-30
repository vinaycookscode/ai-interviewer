// The plan's streak and checkpoints (AIIN-101). No access checks: callers pass ids they've checked.
import { db } from "@/lib/db";
import { istDay } from "@/lib/ist";
import { recordActivity } from "@/lib/daily-challenge/server";
import { awardAchievements } from "@/lib/achievements/server";
import { phaseStart, phaseTopics, type CheckpointResult } from "@/lib/plan/checkpoints";

/** A plan task or checkpoint was done today: the plan's own streak, the app-wide streak and its badges. */
export async function markPlanActive(userId: string, enrollmentId: string) {
    const enrollment = await db.programEnrollment.findUnique({
        where: { id: enrollmentId },
        select: { streak: true, longestStreak: true, lastActiveAt: true },
    });
    if (enrollment) {
        // Days are counted in IST, so 11:30 PM one evening and 9 AM the next morning are consecutive days (AIIN-67)
        const now = new Date();
        const daysSinceLastActive = istDay(now) - istDay(enrollment.lastActiveAt);
        // The first task starts the streak, even on the day of enrolling; the same day changes nothing; a gap restarts it
        const streak =
            enrollment.streak === 0 ? 1 : daysSinceLastActive === 0 ? enrollment.streak : daysSinceLastActive === 1 ? enrollment.streak + 1 : 1;
        await db.programEnrollment.update({
            where: { id: enrollmentId },
            data: { streak, longestStreak: Math.max(streak, enrollment.longestStreak), lastActiveAt: now },
        });
    }
    // The app-wide streak counts plan tasks and the daily challenge alike (AIIN-99)
    await recordActivity(userId);
    await awardAchievements(userId, ["streak"]);
}

/** The plan's checkpoint interviews: started ones have no score yet. */
export async function loadCheckpoints(enrollmentId: string): Promise<(CheckpointResult & { id: string })[]> {
    const rows = await db.mockInterview.findMany({
        where: { enrollmentId, checkpointDay: { not: null } },
        select: { id: true, checkpointDay: true, score: true, createdAt: true, answers: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
    });
    return rows.map((r) => ({
        id: r.id,
        day: r.checkpointDay!,
        score: r.score,
        // When the last answer went in: the day it was finished
        doneAt: r.score === null ? null : (r.answers[0]?.createdAt ?? r.createdAt),
    }));
}

/** What a checkpoint covers: the topics of the days since the one before. */
export async function checkpointTopics(programId: string, day: number): Promise<string[]> {
    const modules = await db.programModule.findMany({
        where: { programId, dayNumber: { gte: phaseStart(day), lt: day } },
        orderBy: { dayNumber: "asc" },
        select: { title: true },
    });
    return phaseTopics(modules.map((m) => m.title));
}
