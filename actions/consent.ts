"use server";

// Agreeing to (or declining) the integrity checks before an interview (AIIN-176). Public endpoints: each acts only on
// the signed-in candidate's own interview, before it's finished and while its link is valid.
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CHECKS, NOTICE_VERSION, noticeLanguage } from "@/lib/integrity/notice";

async function ownOpenInterview(interviewId: string) {
    const session = await auth();
    if (!session?.user?.id || typeof interviewId !== "string") return null;
    const interview = await db.interview.findFirst({
        where: { id: interviewId, candidateId: session.user.id },
        select: { id: true, status: true, expiresAt: true },
    });
    if (!interview || interview.status === "COMPLETED") return null;
    if (interview.expiresAt && interview.expiresAt < new Date()) return null;
    return interview;
}

/** Records agreement to this notice version, with the checks it listed, the time, IP and user agent. */
export async function acceptConsent(interviewId: string, language: string): Promise<{ ok: boolean }> {
    const interview = await ownOpenInterview(interviewId);
    if (!interview) return { ok: false };

    const h = await headers();
    const ipAddress = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim().slice(0, 64) || null;
    const userAgent = h.get("user-agent")?.slice(0, 300) || null;

    // Agreeing twice to the same version keeps the first record
    await db.interviewConsent.upsert({
        where: { interviewId_noticeVersion: { interviewId, noticeVersion: NOTICE_VERSION } },
        update: {},
        create: { interviewId, noticeVersion: NOTICE_VERSION, checks: [...CHECKS], language: noticeLanguage(language), ipAddress, userAgent },
    });
    await db.interview.update({ where: { id: interviewId }, data: { consentDeclinedAt: null } });
    return { ok: true };
}

/** Saying no writes no consent: it marks the interview so the employer can see it and offer another way. */
export async function declineConsent(interviewId: string): Promise<{ ok: boolean }> {
    const interview = await ownOpenInterview(interviewId);
    if (!interview) return { ok: false };
    await db.interview.update({ where: { id: interviewId }, data: { consentDeclinedAt: new Date() } });
    return { ok: true };
}
