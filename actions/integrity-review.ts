"use server";

import { revalidatePath } from "next/cache";
import { IntegrityReviewOutcome } from "@prisma/client";
import { db } from "@/lib/db";
import { requireEmployerInterview } from "@/lib/employer-access";
import { NOTE_LIMIT } from "@/lib/decision";

type Result = { success: true } | { error: string; field?: "note" };

/**
 * The employer's review of a flagged interview's integrity verdict (AIIN-179): No issue, or Confirmed concern with a
 * note. Only the employer who owns the job; anyone else gets not-found. Every review is kept, and the latest is current.
 */
export async function reviewIntegrity(interviewId: string, outcome: IntegrityReviewOutcome, note?: string): Promise<Result> {
    if (!Object.values(IntegrityReviewOutcome).includes(outcome)) return { error: "Choose No issue or Confirmed." };
    const cleanNote = typeof note === "string" ? note.trim() || null : null;
    if (outcome === "CONFIRMED" && !cleanNote) return { error: "Add a note saying what you confirmed.", field: "note" };
    if (cleanNote && cleanNote.length > NOTE_LIMIT) return { error: `Keep the note to ${NOTE_LIMIT} characters.`, field: "note" };

    const access = await requireEmployerInterview(interviewId);
    if (!access) return { error: "Interview not found." };
    const { interview, userId } = access;

    const flagged = await db.interview.findUnique({ where: { id: interview.id }, select: { integrityVerdict: true, integrityReasons: true } });
    if (interview.status !== "COMPLETED" || !flagged?.integrityVerdict || flagged.integrityVerdict === "NO_CONCERNS") {
        return { error: "Only a flagged interview can be reviewed." };
    }
    const reasonCodes = Array.isArray(flagged.integrityReasons)
        ? flagged.integrityReasons.flatMap((r) => (r && typeof r === "object" && "code" in r && typeof r.code === "string" ? [r.code] : []))
        : [];

    await db.$transaction([
        db.integrityReview.create({
            data: { interviewId: interview.id, outcome, note: cleanNote, verdict: flagged.integrityVerdict, reasonCodes, byUserId: userId },
        }),
        db.interview.update({ where: { id: interview.id }, data: { integrityReviewOutcome: outcome } }),
    ]);

    revalidatePath(`/interview/${interview.id}/feedback`);
    revalidatePath(`/dashboard/jobs/${interview.jobId}`);
    return { success: true };
}
