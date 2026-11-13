// Aptitude attempts on the server (AIIN-169). The server owns the deadline and the scoring; correct answers never leave it.
import { db } from "@/lib/db";
import { drawAttempt, readAnswers, scoreAttempt } from "@/lib/aptitude";
import { linkExpiry } from "@/lib/drives";
import { createInterview } from "@/lib/candidate-invites";

/** Start the attempt: draw this candidate's questions and set the deadline. A second call returns the same attempt. */
export async function startAttempt(dc: { id: string; drive: { aptitudeTestId: string | null } }) {
    const existing = await db.aptitudeAttempt.findUnique({ where: { driveCandidateId: dc.id }, select: { id: true } });
    if (existing) return existing.id;
    if (!dc.drive.aptitudeTestId) throw new Error("No aptitude test");
    const test = await db.aptitudeTest.findUnique({
        where: { id: dc.drive.aptitudeTestId },
        select: { id: true, durationMinutes: true, shuffle: true, sections: { select: { id: true, askCount: true, order: true } } },
    });
    if (!test) throw new Error("Test not found");
    const pool = await db.aptitudeQuestion.findMany({
        where: { testId: test.id, checked: true, retiredAt: null },
        select: { id: true, sectionId: true, options: true },
    });
    const draw = drawAttempt(test.sections, pool.map((q) => ({ id: q.id, sectionId: q.sectionId, options: q.options.length })), test.shuffle);
    const now = new Date();
    try {
        const [attempt] = await db.$transaction([
            db.aptitudeAttempt.create({
                data: { driveCandidateId: dc.id, testId: test.id, questionIds: draw.questionIds, optionOrders: draw.optionOrders, deadline: new Date(now.getTime() + test.durationMinutes * 60_000) },
                select: { id: true },
            }),
            db.driveCandidate.update({ where: { id: dc.id }, data: { stage: "APTITUDE_STARTED" } }),
        ]);
        return attempt.id;
    } catch {
        // Started by another tab a moment ago
        const again = await db.aptitudeAttempt.findUnique({ where: { driveCandidateId: dc.id }, select: { id: true } });
        if (!again) throw new Error("Couldn't start the attempt");
        return again.id;
    }
}

/** Save one answer as the original option index, atomically, while the attempt is open. */
export async function saveAnswer(attemptId: string, questionId: string, option: number): Promise<boolean> {
    const n = await db.$executeRaw`
        UPDATE "AptitudeAttempt"
        SET answers = answers || jsonb_build_object(${questionId}::text, ${option}::int), "updatedAt" = (now() AT TIME ZONE 'UTC')
        WHERE id = ${attemptId} AND "submittedAt" IS NULL AND ${questionId} = ANY("questionIds")`;
    return n === 1;
}

/**
 * Score an attempt once: on submit, or the first time anything reads it after the deadline (AC4). Passing creates the
 * interview straight away and opens it (AC1); not passing creates none (AC2). Safe to call twice.
 */
export async function finishAttempt(attemptId: string): Promise<void> {
    const now = new Date();
    // Claim it: only the first caller scores
    const claimed = await db.aptitudeAttempt.updateMany({ where: { id: attemptId, submittedAt: null }, data: { submittedAt: now } });
    if (claimed.count !== 1) return;
    const a = await db.aptitudeAttempt.findUnique({
        where: { id: attemptId },
        select: {
            questionIds: true,
            answers: true,
            driveCandidate: {
                select: {
                    id: true,
                    userId: true,
                    interviewId: true,
                    drive: { select: { id: true, jobId: true, employerId: true, aptitudeCutoff: true, closesAt: true, closedAt: true } },
                },
            },
        },
    });
    if (!a) return;
    const key = new Map((await db.aptitudeQuestion.findMany({ where: { id: { in: a.questionIds } }, select: { id: true, correctIndex: true } })).map((q) => [q.id, q.correctIndex]));
    const dc = a.driveCandidate;
    const result = scoreAttempt(a.questionIds, readAnswers(a.answers, a.questionIds), key, dc.drive.aptitudeCutoff ?? 100);
    await db.aptitudeAttempt.update({ where: { id: attemptId }, data: { score: result.score, total: result.total, percent: result.percent, passed: result.passed } });
    if (!result.passed) {
        await db.driveCandidate.update({ where: { id: dc.id }, data: { stage: "APTITUDE_FAILED" } });
        return;
    }
    const interview = dc.interviewId
        ? { id: dc.interviewId }
        : await createInterview({ jobId: dc.drive.jobId, candidateId: dc.userId, employerId: dc.drive.employerId, expiresAt: linkExpiry(dc.drive), driveId: dc.drive.id });
    await db.driveCandidate.update({ where: { id: dc.id }, data: { stage: "APTITUDE_PASSED", interviewId: interview.id } });
}

/** Score attempts whose deadline (plus grace) passed with nobody there; the daily cron calls this. */
export async function finishExpiredAttempts(): Promise<number> {
    const due = await db.aptitudeAttempt.findMany({ where: { submittedAt: null, deadline: { lt: new Date(Date.now() - 30_000) } }, select: { id: true }, take: 500 });
    for (const a of due) await finishAttempt(a.id);
    return due.length;
}
