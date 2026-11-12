"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { embedJob } from "@/lib/match-embeddings";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkRequirements, parseProposal, requirementsPrompt, type Requirements, type RequirementsError } from "@/lib/job-requirements";

const PROPOSALS_PER_HOUR = 20;

/** The signed-in employer's own job, not archived (AC4: anyone else's is not found). */
async function ownJob(jobId: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || typeof jobId !== "string") return null;
    const job = await db.job.findFirst({ where: { id: jobId, employerId: userId, archivedAt: null }, select: { id: true, title: true, description: true } });
    return job ? { ...job, userId } : null;
}

/**
 * Gemini's proposal for a job's requirements (AC1). Nothing is saved: the employer confirms it. If Gemini is down or
 * returns nothing usable, the form simply starts empty (AC3). One attempt, so it never loops on a rate limit.
 */
export async function proposeJobRequirements(jobId: string): Promise<{ ok: Requirements } | { error: "notFound" | "unavailable" | "tooMany" }> {
    const job = await ownJob(jobId);
    if (!job) return { error: "notFound" };
    if (!(await checkRateLimit(`job-req:${job.userId}`, PROPOSALS_PER_HOUR, 60)).success) return { error: "tooMany" };
    try {
        const model = await getGeminiModelInstance();
        const proposal = parseProposal((await model.generateContent(requirementsPrompt(job))).response.text());
        return proposal.mustHaveSkills.length || proposal.niceToHaveSkills.length ? { ok: proposal } : { error: "unavailable" };
    } catch (error) {
        console.error("Couldn't propose job requirements:", error);
        return { error: "unavailable" };
    }
}

/**
 * Save the requirements the employer confirmed. `publish` opens the job for matching, which needs a confirmed
 * must-have (AC2). Saving without publishing keeps the job's status.
 */
export async function saveJobRequirements(jobId: string, input: unknown, publish: boolean): Promise<{ ok: true } | { error: "notFound" | RequirementsError }> {
    const job = await ownJob(jobId);
    if (!job) return { error: "notFound" };
    const checked = checkRequirements(input, publish === true);
    if ("error" in checked) return checked;
    await db.job.update({
        where: { id: job.id },
        data: { ...checked.ok, requirementsConfirmedAt: new Date(), ...(publish === true ? { status: "OPEN" } : {}) },
    });
    // Embedded for matching once the response is sent (AIIN-194)
    after(() => embedJob(job.id));
    revalidatePath(`/dashboard/jobs/${job.id}`);
    revalidatePath("/dashboard/jobs");
    return { ok: true };
}
