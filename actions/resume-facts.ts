"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { embedProfile } from "@/lib/match-embeddings";
import { matchNow } from "@/lib/matching";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { getFromR2 } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { pdfText } from "@/lib/resume-text";
import { ownFileKey } from "@/lib/storage-key";
import { EMPTY_FACTS, MIN_RESUME_TEXT, checkFacts, factsPrompt, isEmpty, parseFacts, pendingFrom, type ResumeFacts } from "@/lib/resume-facts";

const READS_PER_HOUR = 10;

/** The signed-in candidate only (AC4: nobody else's resume or facts, ever). */
async function me() {
    const session = await auth();
    const id = session?.user?.id;
    return id && session.user.role === "CANDIDATE" ? id : null;
}

export type ReadResult = { ok: { pending: ResumeFacts } } | { error: "noResume" | "noText" | "unavailable" | "tooMany" | "unauthorized" };

/**
 * Read the candidate's current resume and propose facts (AC1). Confirmed facts stay as they are; only new ones wait
 * to be checked. A PDF with no text (a scan) is recorded as read, so the page can say so and offer the form (AC3).
 */
export async function readMyResume(): Promise<ReadResult> {
    const userId = await me();
    if (!userId) return { error: "unauthorized" };
    const user = await db.user.findUnique({ where: { id: userId }, select: { resumeUrl: true, candidateProfile: { select: { resumeFacts: true } } } });
    const key = ownFileKey(user?.resumeUrl, process.env.R2_PUBLIC_URL, userId);
    if (!key) return { error: "noResume" };
    if (!(await checkRateLimit(`resume-read:${userId}`, READS_PER_HOUR, 60)).success) return { error: "tooMany" };

    // Storage down or the file gone: say "try again" and leave the resume unread, rather than call it a scan
    const file = await getFromR2(key).catch((error) => {
        console.error("Couldn't fetch the resume to read it:", error);
        return null;
    });
    if (!file) return { error: "unavailable" };
    const resumeText = await pdfText(file.body);
    const readable = resumeText.length >= MIN_RESUME_TEXT;
    const base = { resumeText: readable ? resumeText : null, resumeReadAt: new Date() };

    let pending: ResumeFacts | null = null;
    if (readable) {
        try {
            const model = await getGeminiModelInstance();
            const proposed = parseFacts((await model.generateContent(factsPrompt(resumeText))).response.text());
            pending = pendingFrom(checkFacts(user?.candidateProfile?.resumeFacts ?? EMPTY_FACTS), proposed);
        } catch (error) {
            console.error("Couldn't read resume facts:", error);
        }
    }
    const proposedFacts = pending && !isEmpty(pending) ? (pending as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
    await db.candidateProfile.upsert({ where: { userId }, update: { ...base, proposedFacts }, create: { userId, ...base, proposedFacts } });
    revalidatePath("/candidate/profile/facts");
    if (!readable) return { error: "noText" };
    return pending ? { ok: { pending } } : { error: "unavailable" };
}

/**
 * Save what the candidate confirmed and what still waits (AC2: their edits are what's stored). City and total years
 * are copied to the profile's own columns for matching; notice period is the candidate's own answer.
 */
export async function saveMyFacts(input: {
    confirmed: unknown;
    pending: unknown;
    noticePeriodDays?: unknown;
}): Promise<{ ok: true } | { error: "unauthorized" | "invalid" }> {
    const userId = await me();
    if (!userId) return { error: "unauthorized" };
    if (!input || typeof input !== "object") return { error: "invalid" };
    const confirmed = checkFacts(input.confirmed);
    const pending = pendingFrom(confirmed, checkFacts(input.pending));
    const notice =
        input.noticePeriodDays === null || input.noticePeriodDays === undefined || input.noticePeriodDays === "" ? null : Number(input.noticePeriodDays);
    if (notice !== null && !(Number.isInteger(notice) && notice >= 0 && notice <= 365)) return { error: "invalid" };

    const data = {
        resumeFacts: confirmed as unknown as Prisma.InputJsonValue,
        proposedFacts: isEmpty(pending) ? Prisma.DbNull : (pending as unknown as Prisma.InputJsonValue),
        factsConfirmedAt: new Date(),
        city: confirmed.city,
        totalYears: confirmed.totalYears,
        noticePeriodDays: notice,
    };
    await db.candidateProfile.upsert({ where: { userId }, update: data, create: { userId, ...data } });
    // Embedded for matching once the response is sent (AIIN-194)
    after(async () => {
        await embedProfile(userId);
        await matchNow("PROFILE", userId);
    });
    revalidatePath("/candidate/profile/facts");
    revalidatePath("/candidate/profile");
    return { ok: true };
}
