"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NOTE_MAX } from "@/lib/applications";
import { SEARCHABLE, cleanPhone } from "@/lib/job-search";

/**
 * Apply to an open job directly (AIIN-202): an application at Applied, from Direct. Applying is consent to this one
 * employer, so no "find me" opt-in is needed. A phone is required (AIIN-204) and saved on the profile.
 */
export async function applyToJob(input: { jobId: string; phone?: string; note?: string }): Promise<{ ok: true } | { error: "notFound" | "already" | "phone" | "note" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "CANDIDATE" || !input || typeof input.jobId !== "string") return { error: "notFound" };
    const job = await db.job.findFirst({ where: { id: input.jobId, ...SEARCHABLE }, select: { id: true, employerId: true } });
    if (!job) return { error: "notFound" };
    const phone = cleanPhone(input.phone);
    if (phone === undefined) return { error: "phone" };
    const note = typeof input.note === "string" ? input.note.trim() : "";
    if (note.length > NOTE_MAX) return { error: "note" };

    const existing = await db.application.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: userId } }, select: { id: true } });
    if (existing) return { error: "already" };

    await db.$transaction(async (tx) => {
        const app = await tx.application.create({
            data: { jobId: job.id, candidateId: userId, employerId: job.employerId, source: "DIRECT", stage: "APPLIED", coverNote: note || null, candidateSeenAt: new Date() },
            select: { id: true },
        });
        await tx.applicationEvent.create({ data: { applicationId: app.id, actorId: userId, toStage: "APPLIED", note: "Applied from job search" } });
        await tx.candidateProfile.upsert({ where: { userId }, update: { phone }, create: { userId, phone } });
    });
    revalidatePath("/candidate/jobs");
    revalidatePath(`/candidate/jobs/${job.id}`);
    revalidatePath("/candidate/applications");
    revalidatePath(`/dashboard/jobs/${job.id}/applications`);
    return { ok: true };
}
