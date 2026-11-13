"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { processGrading, retryFailedAnswers } from "@/lib/grading-queue";

/** "Try again" on an interview with answers that couldn't be scored: only those answers are queued again (AIIN-170 AC4). */
export async function retryScoring(interviewId: string): Promise<{ ok: true; count: number } | { error: "notFound" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || typeof interviewId !== "string") return { error: "notFound" };
    const iv = await db.interview.findFirst({ where: { id: interviewId, job: { employerId: userId } }, select: { id: true, jobId: true } });
    if (!iv) return { error: "notFound" };
    const count = await retryFailedAnswers(iv.id);
    if (count) after(() => processGrading());
    revalidatePath(`/dashboard/jobs/${iv.jobId}`);
    return { ok: true, count };
}
