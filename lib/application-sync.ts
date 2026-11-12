// Keep applications in step with AI interviews (AIIN-195). Server only; callers have checked the employer owns the job.
import { db } from "@/lib/db";
import { stageFromDecision, type Stage } from "@/lib/applications";

/** An invitation to an AI interview is an application at Applied (existing flows keep working). Never moves one back. */
export async function ensureApplication(jobId: string, candidateId: string, employerId: string): Promise<void> {
    try {
        await db.application.upsert({
            where: { jobId_candidateId: { jobId, candidateId } },
            update: {},
            create: { jobId, candidateId, employerId, source: "INVITED", stage: "APPLIED" },
        });
    } catch (error) {
        console.error("Couldn't create an application:", error);
    }
}

/**
 * An AI interview decision moves its application, which holds the outcome: Shortlisted to Screening, Rejected to
 * Rejected, On hold to on hold. Each move is in the history, by the same employer. Never throws.
 */
export async function syncDecision(
    interviewIds: string[],
    decision: "UNDECIDED" | "SHORTLISTED" | "ON_HOLD" | "REJECTED",
    actorId: string,
    note: string | null,
): Promise<void> {
    if (!interviewIds.length) return;
    try {
        const interviews = await db.interview.findMany({ where: { id: { in: interviewIds } }, select: { jobId: true, candidateId: true } });
        const apps = await db.application.findMany({
            where: { OR: interviews.map((i) => ({ jobId: i.jobId, candidateId: i.candidateId })) },
            select: { id: true, stage: true, onHold: true },
        });
        const writes = apps.flatMap((a) => {
            const to = stageFromDecision(decision, a.stage as Stage);
            const hold = decision === "ON_HOLD";
            if (!to && hold === a.onHold) return [];
            return [
                db.application.update({
                    where: { id: a.id },
                    data: { onHold: hold, ...(to ? { stage: to, stageChangedAt: new Date(), ...(to === "REJECTED" ? { rejectionReason: note } : {}) } : {}) },
                }),
                db.applicationEvent.create({
                    data: {
                        applicationId: a.id,
                        actorId,
                        fromStage: to ? a.stage : null,
                        toStage: to,
                        note: note ?? (hold ? "Put on hold from the AI interview" : "From the AI interview decision"),
                    },
                }),
            ];
        });
        if (writes.length) await db.$transaction(writes);
    } catch (error) {
        console.error("Couldn't move applications after a decision:", error);
    }
}
