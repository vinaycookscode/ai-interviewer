// The daily challenge's data: today's question, the candidate's answer, the streak (AIIN-99).
// No access checks: callers pass the session user's id.
import { db } from "@/lib/db";
import { evaluateAnswer } from "@/lib/gemini";
import { CHALLENGE_TYPES, dailyStreak, dateDay, dayDate, istDay, pickQuestion, trackFor, weekDays, type Track } from "@/lib/daily-challenge/logic";

export const ANSWER_LIMIT = 2000;

/** Marks today as active for the streak: a plan task or the challenge. */
export async function recordActivity(userId: string, now = new Date()) {
    const day = dayDate(istDay(now));
    await db.activityDay.upsert({ where: { userId_day: { userId, day } }, create: { userId, day }, update: {} });
}

/** The streak, this week's active days and whether today counts yet. */
export async function loadStreak(userId: string, now = new Date()) {
    const today = istDay(now);
    const rows = await db.activityDay.findMany({
        where: { userId, day: { gte: dayDate(today - 400) } },
        select: { day: true },
    });
    const days = rows.map((r) => dateDay(r.day));
    const set = new Set(days);
    return {
        streak: dailyStreak(days, today),
        week: weekDays(today).map((day) => ({ day, done: set.has(day), isToday: day === today, future: day > today })),
        doneToday: set.has(today),
    };
}

export async function todaysQuestion(userId: string, now = new Date()) {
    const profile = await db.candidateProfile.findUnique({ where: { userId }, select: { primaryRole: true } });
    const track: Track = trackFor(profile?.primaryRole);
    const pool = await db.companyQuestion.findMany({
        where: { type: { in: [...CHALLENGE_TYPES] }, difficulty: { in: ["EASY", "MEDIUM"] }, answer: { not: null }, status: "PUBLISHED" },
        select: { id: true, type: true, question: true, roles: true },
    });
    const picked = pickQuestion(istDay(now), track, pool);
    if (!picked) return null;
    const question = await db.companyQuestion.findUnique({
        where: { id: picked.id },
        select: { id: true, type: true, question: true, tags: true, answer: true },
    });
    return question && { ...question, track };
}

/** Asks U to score an answer against the model answer. Leaves it ungraded if Gemini is busy, to retry later. */
export async function gradeChallenge(answerId: string) {
    const row = await db.dailyChallengeAnswer.findUnique({
        where: { id: answerId },
        select: { answer: true, score: true, question: { select: { question: true, answer: true } } },
    });
    if (!row || row.score !== null) return;
    try {
        const evaluation = await evaluateAnswer(
            `${row.question.question}\n\nModel answer, for the grader only: ${row.question.answer ?? ""}`,
            row.answer
        );
        // evaluateAnswer reports a failure as score 0 with the error as feedback: leave it ungraded and retry later
        if (!(evaluation.score >= 1)) return;
        const score = Math.min(10, Math.round(evaluation.score));
        await db.dailyChallengeAnswer.update({ where: { id: answerId }, data: { score, feedback: evaluation.feedback } });
    } catch (error) {
        console.error("Daily challenge grading failed; will retry:", error);
    }
}

/** Today's answer (graded if it can be now) and the last 7 days before today. */
export async function loadAnswers(userId: string, now = new Date()) {
    const today = dayDate(istDay(now));
    let todays = await db.dailyChallengeAnswer.findUnique({
        where: { userId_day: { userId, day: today } },
        select: { id: true, answer: true, score: true, feedback: true, questionId: true },
    });
    if (todays && todays.score === null) {
        await gradeChallenge(todays.id);
        todays = await db.dailyChallengeAnswer.findUnique({
            where: { id: todays.id },
            select: { id: true, answer: true, score: true, feedback: true, questionId: true },
        });
    }
    const history = await db.dailyChallengeAnswer.findMany({
        where: { userId, day: { lt: today, gte: dayDate(istDay(now) - 7) } },
        orderBy: { day: "desc" },
        select: { day: true, score: true, question: { select: { type: true, tags: true } } },
    });
    return { todays, history };
}
