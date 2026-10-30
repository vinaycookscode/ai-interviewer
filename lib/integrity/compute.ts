// Loads an interview's proctoring events, assesses them and stores the verdict (AIIN-177).
// Callers check access first: this reads any interview by id.
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { RULES_VERSION, assess, type IntegrityResult, type QuestionWindow } from "@/lib/integrity/verdict";

export interface IntegrityReport extends IntegrityResult {
    questions: QuestionWindow[];
}

export async function loadIntegrity(interviewId: string): Promise<IntegrityReport | null> {
    const interview = await db.interview.findUnique({
        where: { id: interviewId },
        select: {
            startedAt: true,
            createdAt: true,
            answers: { orderBy: { createdAt: "asc" }, select: { createdAt: true, question: { select: { text: true } } } },
            proctoringEvents: { orderBy: { timestamp: "asc" }, select: { type: true, timestamp: true } },
        },
    });
    if (!interview) return null;

    // Older interviews have no start time: the earliest thing we know of stands in for it
    const firstSeen = [interview.proctoringEvents[0]?.timestamp, interview.answers[0]?.createdAt].filter((d): d is Date => !!d);
    const start = interview.startedAt ?? (firstSeen.length ? new Date(Math.min(...firstSeen.map((d) => d.getTime()))) : interview.createdAt);

    // Question n is on screen from the previous answer (or the start) until it's answered
    const questions: QuestionWindow[] = interview.answers.map((a, i) => ({
        n: i + 1,
        text: a.question.text,
        shownAt: i === 0 ? start : interview.answers[i - 1].createdAt,
    }));

    const result = assess(
        interview.proctoringEvents.map((e) => ({ type: e.type, at: e.timestamp })),
        start,
        questions
    );
    return { ...result, questions };
}

/** Computes and stores the verdict; returns it. Used on completion, by the backfill script and when rules change. */
export async function storeIntegrity(interviewId: string): Promise<IntegrityReport | null> {
    const report = await loadIntegrity(interviewId);
    if (!report) return null;
    await db.interview.update({
        where: { id: interviewId },
        data: {
            integrityVerdict: report.verdict,
            integrityReasons: report.reasons as unknown as Prisma.InputJsonValue,
            integrityComputedAt: new Date(),
            integrityRulesVersion: RULES_VERSION,
        },
    });
    return report;
}
