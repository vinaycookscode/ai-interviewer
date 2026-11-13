"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { driveStatus } from "@/lib/drives";
import { canAnswer, originalOption } from "@/lib/aptitude";
import { finishAttempt, saveAnswer, startAttempt } from "@/lib/aptitude-attempts";

type Result = { ok: true } | { error: "notFound" | "notOpen" | "timeUp" | "invalid" };

/** The signed-in candidate's own place in a drive; anyone else's is not found. */
async function ownPlace(driveCandidateId: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof driveCandidateId !== "string") return null;
    return db.driveCandidate.findFirst({
        where: { id: driveCandidateId, userId },
        select: { id: true, drive: { select: { draft: true, opensAt: true, closesAt: true, closedAt: true, aptitudeEnabled: true, aptitudeTestId: true } } },
    });
}

/** The signed-in candidate's own attempt. */
async function ownAttempt(attemptId: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof attemptId !== "string") return null;
    return db.aptitudeAttempt.findFirst({
        where: { id: attemptId, driveCandidate: { userId } },
        select: { id: true, deadline: true, submittedAt: true, questionIds: true, optionOrders: true },
    });
}

/** Start the timed round. Only while the drive is live; starting twice returns the same attempt. */
export async function startAptitude(driveCandidateId: string): Promise<Result> {
    const dc = await ownPlace(driveCandidateId);
    if (!dc || !dc.drive.aptitudeEnabled || !dc.drive.aptitudeTestId) return { error: "notFound" };
    const existing = await db.aptitudeAttempt.findUnique({ where: { driveCandidateId: dc.id }, select: { id: true } });
    if (!existing && driveStatus(dc.drive, new Date()) !== "LIVE") return { error: "notOpen" };
    await startAttempt(dc);
    return { ok: true };
}

/**
 * Save the option the candidate chose, by its position on their screen. Mapped to the real option here, so the browser
 * never learns which is which. Refused after the deadline plus 30 seconds (AC5), which also scores the attempt.
 */
export async function answerAptitude(attemptId: string, questionId: string, shown: number): Promise<Result> {
    const a = await ownAttempt(attemptId);
    if (!a) return { error: "notFound" };
    if (a.submittedAt) return { error: "timeUp" };
    if (!canAnswer(a.deadline, new Date())) {
        await finishAttempt(a.id);
        return { error: "timeUp" };
    }
    const i = a.questionIds.indexOf(questionId);
    const orders = Array.isArray(a.optionOrders) ? (a.optionOrders as number[][]) : [];
    const option = i >= 0 ? originalOption(orders[i], shown) : null;
    if (option === null) return { error: "invalid" };
    return (await saveAnswer(a.id, questionId, option)) ? { ok: true } : { error: "invalid" };
}

/** Submit now (or let the timer do it). Scores straight away. */
export async function submitAptitude(attemptId: string): Promise<Result> {
    const a = await ownAttempt(attemptId);
    if (!a) return { error: "notFound" };
    await finishAttempt(a.id);
    return { ok: true };
}

/** The candidate left the tab during the round; the employer sees the count (like the interview's proctoring). */
export async function noteTabSwitch(attemptId: string): Promise<Result> {
    const a = await ownAttempt(attemptId);
    if (!a || a.submittedAt) return { error: "notFound" };
    await db.aptitudeAttempt.update({ where: { id: a.id }, data: { tabSwitches: { increment: 1 } } });
    return { ok: true };
}
