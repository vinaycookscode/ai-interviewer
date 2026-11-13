"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { driveStatus, linkExpiry } from "@/lib/drives";
import { SLUG, joinState } from "@/lib/open-link";
import { createInterview } from "@/lib/candidate-invites";
import { aptitudeLink, interviewLink } from "@/lib/drive-mail";

type Result = { ok: true; next: string } | { error: "notFound" | "limited" | "invalid" | "OFF" | "SCHEDULED" | "CLOSED" | "STAFF" | "DOMAIN" | "FULL" };

/** Where a drive candidate goes next: the aptitude round, or their interview. Relative, so it works on any host. */
async function nextStep(dc: { id: string; interviewId: string | null }, aptitude: boolean): Promise<string> {
    if (aptitude && !dc.interviewId) return aptitudeLink(dc.id).replace(/^https?:\/\/[^/]+/, "");
    const iv = dc.interviewId ? await db.interview.findUnique({ where: { id: dc.interviewId }, select: { id: true, token: true } }) : null;
    return iv ? interviewLink(iv).replace(/^https?:\/\/[^/]+/, "") : "/candidate/dashboard";
}

/**
 * Join a drive through its open link (AIIN-168): a signed-in candidate picks their college and goes to the first round.
 * Someone already in continues where they left off, and no second interview is made (AC5). Rate limited per IP (AC9).
 */
export async function joinDrive(slug: string, input: { collegeId: string | null; roll: string }): Promise<Result> {
    const h = await headers();
    const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
    if (!(await checkRateLimit(`drive-join:${ip}`, 20, 1)).success) return { error: "limited" };
    const session = await auth();
    const user = session?.user;
    if (!user?.id || typeof slug !== "string" || !SLUG.test(slug)) return { error: "notFound" };
    const drive = await db.drive.findUnique({
        where: { openLinkSlug: slug },
        select: {
            id: true,
            jobId: true,
            employerId: true,
            draft: true,
            opensAt: true,
            closesAt: true,
            closedAt: true,
            openLinkOn: true,
            allowedDomains: true,
            joinCap: true,
            aptitudeEnabled: true,
            colleges: { select: { id: true } },
            _count: { select: { candidates: { where: { source: "OPEN_LINK" } } } },
        },
    });
    if (!drive) return { error: "notFound" };
    const existing = await db.driveCandidate.findUnique({ where: { driveId_userId: { driveId: drive.id, userId: user.id } }, select: { id: true, interviewId: true } });
    const me = await db.user.findUnique({ where: { id: user.id }, select: { email: true, role: true } });
    const state = joinState({
        on: drive.openLinkOn,
        status: driveStatus(drive, new Date()),
        inDrive: !!existing,
        role: me?.role ?? null,
        email: me?.email ?? null,
        domains: drive.allowedDomains,
        cap: drive.joinCap,
        joined: drive._count.candidates,
    });
    if (state === "CONTINUE") return existing ? { ok: true, next: await nextStep(existing, drive.aptitudeEnabled) } : { error: "invalid" };
    if (state !== "OPEN") return { error: state };

    const collegeId = typeof input?.collegeId === "string" && input.collegeId ? input.collegeId : null;
    if (collegeId && !drive.colleges.some((c) => c.id === collegeId)) return { error: "invalid" };
    if (drive.colleges.length && !collegeId) return { error: "invalid" };
    const roll = typeof input?.roll === "string" ? input.roll.replace(/\s+/g, " ").trim().slice(0, 40) : "";

    try {
        const dc = await db.driveCandidate.create({
            data: { driveId: drive.id, userId: user.id, driveCollegeId: collegeId, rollNumber: roll || null, source: "OPEN_LINK", stage: "OPENED" },
            select: { id: true, interviewId: true },
        });
        if (!drive.aptitudeEnabled) {
            const iv = await createInterview({ jobId: drive.jobId, candidateId: user.id, employerId: drive.employerId, expiresAt: linkExpiry(drive), driveId: drive.id });
            await db.driveCandidate.update({ where: { id: dc.id }, data: { interviewId: iv.id } });
            dc.interviewId = iv.id;
        }
        return { ok: true, next: await nextStep(dc, drive.aptitudeEnabled) };
    } catch {
        // Joined a moment ago in another tab: carry on with that one
        const again = await db.driveCandidate.findUnique({ where: { driveId_userId: { driveId: drive.id, userId: user.id } }, select: { id: true, interviewId: true } });
        return again ? { ok: true, next: await nextStep(again, drive.aptitudeEnabled) } : { error: "invalid" };
    }
}
