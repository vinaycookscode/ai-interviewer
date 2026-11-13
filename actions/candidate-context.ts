"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const MAX = 500;

/**
 * The candidate's side of what was flagged in their interview (AIIN-185). Only the interview's own candidate can send
 * it (AC5), only once the interview is finished, and only once: it's shown to the employer as sent.
 */
export async function sendCandidateContext(interviewId: string, text: string): Promise<{ ok: true } | { error: "notFound" | "invalid" | "sent" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || typeof interviewId !== "string") return { error: "notFound" };
    const note = typeof text === "string" ? text.replace(/\r\n/g, "\n").trim() : "";
    if (!note || note.length > MAX) return { error: "invalid" };

    const interview = await db.interview.findFirst({
        where: { id: interviewId, candidateId: userId, status: "COMPLETED" },
        select: { id: true },
    });
    if (!interview) return { error: "notFound" };

    // Only the first send counts, even if two arrive together
    const { count } = await db.interview.updateMany({
        where: { id: interview.id, candidateContextAt: null },
        data: { candidateContext: note, candidateContextAt: new Date() },
    });
    if (!count) return { error: "sent" };
    revalidatePath(`/interview/${interview.id}/flags`);
    return { ok: true };
}
