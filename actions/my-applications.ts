"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CLOSED, type Stage } from "@/lib/applications";

async function candidate() {
    const session = await auth();
    const id = session?.user?.id;
    return id && session.user.role === "CANDIDATE" ? id : null;
}

/** Withdraw one of your own applications at any open stage (AC2). The employer then sees Withdrawn and can't move it. */
export async function withdrawMyApplication(id: string): Promise<{ ok: true } | { error: "notFound" | "closed" }> {
    const userId = await candidate();
    if (!userId || typeof id !== "string") return { error: "notFound" };
    const app = await db.application.findFirst({ where: { id, candidateId: userId }, select: { id: true, stage: true, jobId: true } });
    if (!app) return { error: "notFound" };
    if (CLOSED.includes(app.stage as Stage)) return { error: "closed" };
    await db.$transaction([
        db.application.update({ where: { id: app.id }, data: { stage: "WITHDRAWN", stageChangedAt: new Date(), onHold: false, candidateSeenAt: new Date() } }),
        db.applicationEvent.create({
            data: { applicationId: app.id, actorId: userId, fromStage: app.stage, toStage: "WITHDRAWN", note: "Withdrawn by the candidate" },
        }),
    ]);
    revalidatePath("/candidate/applications");
    revalidatePath(`/dashboard/jobs/${app.jobId}/applications`);
    return { ok: true };
}

/** Turn application emails on or off. */
export async function setApplicationEmails(on: boolean): Promise<{ ok: true } | { error: "notFound" }> {
    const userId = await candidate();
    if (!userId || typeof on !== "boolean") return { error: "notFound" };
    await db.user.update({ where: { id: userId }, data: { applicationEmails: on } });
    revalidatePath("/candidate/applications");
    return { ok: true };
}
