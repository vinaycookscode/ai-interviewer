"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NOTE_MAX } from "@/lib/applications";
import { discoverableWhere } from "@/lib/discovery";
import { cleanPhone } from "@/lib/job-search";
import { inviteAllowance } from "@/lib/invite-allowance";
import { cleanInviteMessage, inviteExpiry, inviteOpen } from "@/lib/invitations";

/**
 * Invite a matched candidate to apply (AIIN-201): an application at Invited, anonymous until they accept. Only for a
 * current match of the employer's own open job, never a candidate who blocked them (AC4), and only within the month's
 * allowance, checked here on the server (AC3).
 */
export async function inviteToApply(input: {
    jobId: string;
    candidateProfileId: string;
    message?: string;
}): Promise<{ ok: true; left: number | null } | { error: "notFound" | "limit" | "already" | "message" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || !input || typeof input.jobId !== "string" || typeof input.candidateProfileId !== "string")
        return { error: "notFound" };
    const message = cleanInviteMessage(input.message);
    if (message === undefined) return { error: "message" };

    // A current match, of a candidate still findable by this employer (blocks and opt-outs apply here too)
    const match = await db.jobMatch.findFirst({
        where: {
            jobId: input.jobId,
            employerId: userId,
            candidateProfileId: input.candidateProfileId,
            job: { status: "OPEN", archivedAt: null },
            candidateProfile: discoverableWhere(userId),
        },
        select: { jobId: true, candidateProfile: { select: { userId: true } } },
    });
    if (!match) return { error: "notFound" };
    const candidateId = match.candidateProfile.userId;
    if (await db.application.findUnique({ where: { jobId_candidateId: { jobId: match.jobId, candidateId } }, select: { id: true } }))
        return { error: "already" };

    const now = new Date();
    const allowance = await inviteAllowance(userId, now);
    if (allowance.left === 0) return { error: "limit" };

    await db.$transaction(async (tx) => {
        const app = await tx.application.create({
            data: {
                jobId: match.jobId,
                candidateId,
                employerId: userId,
                source: "INVITED",
                stage: "INVITED",
                inviteMessage: message,
                invitedAt: now,
                inviteExpiresAt: inviteExpiry(now),
            },
            select: { id: true },
        });
        await tx.applicationEvent.create({ data: { applicationId: app.id, actorId: userId, toStage: "INVITED", note: "Invited to apply from matches" } });
    });
    revalidatePath(`/dashboard/jobs/${match.jobId}/matches`);
    revalidatePath(`/dashboard/jobs/${match.jobId}/applications`);
    revalidatePath("/candidate/invitations");
    return { ok: true, left: allowance.left === null ? null : allowance.left - 1 };
}

/**
 * Accept (with a phone, required, and an optional note) or decline an invitation (AIIN-201). Accepting moves it to
 * Applied and lets the employer see who you are (AC1); declining keeps you anonymous to them (AC2).
 */
export async function respondToInvitation(input: {
    id: string;
    accept: boolean;
    phone?: string;
    note?: string;
}): Promise<{ ok: true } | { error: "notFound" | "expired" | "phone" | "note" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "CANDIDATE" || !input || typeof input.id !== "string" || typeof input.accept !== "boolean")
        return { error: "notFound" };
    const app = await db.application.findFirst({
        where: { id: input.id, candidateId: userId, stage: "INVITED" },
        select: { id: true, jobId: true, stage: true, inviteExpiresAt: true },
    });
    if (!app) return { error: "notFound" };
    if (!inviteOpen(app, new Date())) return { error: "expired" };

    if (!input.accept) {
        await db.$transaction([
            db.application.update({ where: { id: app.id }, data: { stage: "DECLINED", stageChangedAt: new Date(), candidateSeenAt: new Date() } }),
            db.applicationEvent.create({ data: { applicationId: app.id, actorId: userId, fromStage: "INVITED", toStage: "DECLINED", note: "Not interested" } }),
        ]);
    } else {
        const phone = cleanPhone(input.phone);
        if (phone === undefined) return { error: "phone" };
        const note = typeof input.note === "string" ? input.note.trim() : "";
        if (note.length > NOTE_MAX) return { error: "note" };
        await db.$transaction([
            db.application.update({
                where: { id: app.id },
                data: { stage: "APPLIED", stageChangedAt: new Date(), coverNote: note || null, candidateSeenAt: new Date() },
            }),
            db.applicationEvent.create({
                data: { applicationId: app.id, actorId: userId, fromStage: "INVITED", toStage: "APPLIED", note: "Accepted the invitation" },
            }),
            db.candidateProfile.upsert({ where: { userId }, update: { phone }, create: { userId, phone } }),
        ]);
    }
    revalidatePath("/candidate/invitations");
    revalidatePath("/candidate/applications");
    revalidatePath(`/dashboard/jobs/${app.jobId}/applications`);
    return { ok: true };
}
