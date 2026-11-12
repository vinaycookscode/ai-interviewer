"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { SHARE_DAYS, hashShareToken, newShareToken, shareExpiry, type ShareDays } from "@/lib/share-link";

const LABEL_MAX = 80;

async function employer() {
    const session = await auth();
    const user = session?.user;
    return user?.id && user.role === "EMPLOYER" ? user.id : null;
}

/**
 * Create a read-only link to a job's shortlist (AIIN-161). The link, with its token, is returned this once: only the
 * token's hash is stored (AC1). Another employer's job is not-found (AC8).
 */
export async function createShortlistShare(input: {
    jobId: string;
    label: string;
    includeOnHold: boolean;
    days: ShareDays;
}): Promise<{ ok: true; url: string } | { error: "notFound" | "invalid" }> {
    const userId = await employer();
    if (!userId || !input || typeof input.jobId !== "string") return { error: "notFound" };
    const label = typeof input.label === "string" ? input.label.trim() : "";
    if (!label || label.length > LABEL_MAX || !(SHARE_DAYS as readonly number[]).includes(input.days)) return { error: "invalid" };

    const job = await db.job.findFirst({ where: { id: input.jobId, employerId: userId, archivedAt: null }, select: { id: true } });
    if (!job) return { error: "notFound" };

    const token = newShareToken();
    await db.shortlistShare.create({
        data: {
            jobId: job.id,
            createdById: userId,
            tokenHash: hashShareToken(token),
            label,
            includeOnHold: input.includeOnHold === true,
            expiresAt: shareExpiry(input.days, new Date()),
        },
    });
    revalidatePath(`/dashboard/jobs/${job.id}`);
    return { ok: true, url: `${APP_URL}/share/${token}` };
}

/** Turn a link off (AC4). Only the job's employer can (AC8). */
export async function revokeShortlistShare(shareId: string): Promise<{ ok: boolean }> {
    const userId = await employer();
    if (!userId || typeof shareId !== "string") return { ok: false };
    const share = await db.shortlistShare.findFirst({ where: { id: shareId, job: { employerId: userId } }, select: { id: true, jobId: true } });
    if (!share) return { ok: false };
    await db.shortlistShare.update({ where: { id: share.id }, data: { revokedAt: new Date() } });
    revalidatePath(`/dashboard/jobs/${share.jobId}`);
    return { ok: true };
}
