"use server";

import { revalidatePath } from "next/cache";
import { HiringDecision } from "@prisma/client";
import { db } from "@/lib/db";
import { requireEmployerInterview } from "@/lib/employer-access";
import { NOTE_LIMIT } from "@/lib/decision";

type Result = { success: true } | { error: string; field?: "note" };

/**
 * Records the employer's hiring decision on a finished interview, with an optional note,
 * and adds it to the interview's history in the same transaction (AIIN-157).
 */
export async function setInterviewDecision(interviewId: string, decision: HiringDecision, note?: string): Promise<Result> {
    if (!Object.values(HiringDecision).includes(decision)) return { error: "Choose a decision." };

    const cleanNote = note?.trim() || null;
    if (cleanNote && cleanNote.length > NOTE_LIMIT) return { error: `Keep the note to ${NOTE_LIMIT} characters.`, field: "note" };

    const access = await requireEmployerInterview(interviewId);
    if (!access) return { error: "Interview not found." };
    const { interview, userId } = access;

    if (interview.status !== "COMPLETED") return { error: "You can decide once the interview is finished." };
    if (interview.decision === decision && !cleanNote) return { success: true };

    await db.$transaction([
        db.interview.update({
            where: { id: interview.id },
            data: { decision, decisionAt: new Date(), decisionById: userId },
        }),
        db.interviewDecisionEvent.create({
            data: { interviewId: interview.id, from: interview.decision, to: decision, note: cleanNote, byUserId: userId, source: "MANUAL" },
        }),
    ]);

    revalidatePath(`/interview/${interview.id}/feedback`);
    revalidatePath(`/dashboard/jobs/${interview.jobId}`);
    revalidatePath("/dashboard/candidates");
    return { success: true };
}
