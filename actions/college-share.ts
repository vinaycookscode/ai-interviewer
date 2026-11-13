"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { enqueue, processOutbox } from "@/lib/outbox";
import { OFFICER_TEMPLATE } from "@/lib/drive-email";
import { hashShareToken, newShareToken } from "@/lib/share-link";
import { cleanEmail, defaultExpiry, pickedExpiry } from "@/lib/college-share";

async function employer() {
    const session = await auth();
    const user = session?.user;
    return user?.id && user.role === "EMPLOYER" ? user.id : null;
}

/**
 * Make a read-only link to one college's students in a drive, for its placement officer (AIIN-173). With `email`, it's
 * also sent there through the outbox. The link, with its token, is returned this once: only the hash is stored. Another
 * employer's college is not-found (AC7).
 */
export async function createCollegeShare(input: {
    collegeId: string;
    showShortlisted: boolean;
    until: string;
    email?: string;
}): Promise<{ ok: true; url: string; sentTo: string | null } | { error: "notFound" | "invalid" | "email" }> {
    const userId = await employer();
    if (!userId || !input || typeof input.collegeId !== "string") return { error: "notFound" };
    const college = await db.driveCollege.findFirst({
        where: { id: input.collegeId, drive: { employerId: userId } },
        select: {
            id: true,
            name: true,
            drive: { select: { id: true, name: true, closesAt: true, job: { select: { title: true, employer: { select: { name: true } } } } } },
        },
    });
    if (!college) return { error: "notFound" };

    const now = new Date();
    const expiresAt = input.until ? pickedExpiry(input.until, college.drive.closesAt, now) : defaultExpiry(college.drive.closesAt, now);
    if (!expiresAt) return { error: "invalid" };
    const wantsEmail = typeof input.email === "string" && input.email.trim() !== "";
    const to = wantsEmail ? cleanEmail(input.email) : null;
    if (wantsEmail && !to) return { error: "email" };

    const token = newShareToken();
    const url = `${APP_URL}/share/college/${token}`;
    await db.collegeShare.create({
        data: { driveCollegeId: college.id, createdById: userId, tokenHash: hashShareToken(token), showShortlisted: input.showShortlisted === true, sentTo: to, expiresAt },
    });
    if (to) {
        // Remember the address for next time
        await db.driveCollege.update({ where: { id: college.id }, data: { placementOfficerEmail: to } });
        await enqueue([
            {
                to,
                template: OFFICER_TEMPLATE,
                payload: {
                    company: college.drive.job.employer.name?.trim() || "The employer",
                    drive: college.drive.name,
                    job: college.drive.job.title,
                    college: college.name,
                    expiresAt: expiresAt.toISOString(),
                    link: url,
                },
            },
        ]);
        after(() => processOutbox());
    }
    revalidatePath(`/dashboard/drives/${college.drive.id}`);
    return { ok: true, url, sentTo: to };
}

/** Turn a placement officer's link off (AC4). Only the drive's employer can (AC7). */
export async function revokeCollegeShare(shareId: string): Promise<{ ok: boolean }> {
    const userId = await employer();
    if (!userId || typeof shareId !== "string") return { ok: false };
    const share = await db.collegeShare.findFirst({
        where: { id: shareId, driveCollege: { drive: { employerId: userId } } },
        select: { id: true, driveCollege: { select: { driveId: true } } },
    });
    if (!share) return { ok: false };
    await db.collegeShare.update({ where: { id: share.id }, data: { revokedAt: new Date() } });
    revalidatePath(`/dashboard/drives/${share.driveCollege.driveId}`);
    return { ok: true };
}
