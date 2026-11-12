// Store a job's and a candidate's embedding for Talent Match (AIIN-194). Server only; callers have checked access.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { embed, vectorLiteral } from "@/lib/ai/embeddings";
import { checkFacts, isEmpty } from "@/lib/resume-facts";
import { jobText, profileText } from "@/lib/match-text";

/** Embed a job's confirmed requirements. Never throws: matching simply waits for the next confirm. */
export async function embedJob(jobId: string): Promise<boolean> {
    try {
        const job = await db.job.findUnique({
            where: { id: jobId },
            select: {
                title: true,
                mustHaveSkills: true,
                niceToHaveSkills: true,
                minYears: true,
                maxYears: true,
                workMode: true,
                location: true,
                requirementsConfirmedAt: true,
            },
        });
        if (!job?.requirementsConfirmedAt) return false;
        const [vector] = await embed([jobText(job)], "RETRIEVAL_DOCUMENT");
        await db.$executeRaw(Prisma.sql`UPDATE "Job" SET "embedding" = ${vectorLiteral(vector)}::vector WHERE "id" = ${jobId}`);
        return true;
    } catch (error) {
        console.error("Couldn't embed a job:", error);
        return false;
    }
}

/** Embed a candidate's confirmed facts and their resume with personal details removed. Never throws. */
export async function embedProfile(userId: string): Promise<boolean> {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { name: true, candidateProfile: { select: { resumeFacts: true, resumeText: true } } },
        });
        const facts = checkFacts(user?.candidateProfile?.resumeFacts ?? null);
        if (isEmpty(facts)) return false;
        const [vector] = await embed([profileText(facts, user?.candidateProfile?.resumeText ?? null, { name: user?.name })], "RETRIEVAL_DOCUMENT");
        await db.$executeRaw(Prisma.sql`UPDATE "CandidateProfile" SET "embedding" = ${vectorLiteral(vector)}::vector WHERE "userId" = ${userId}`);
        return true;
    } catch (error) {
        console.error("Couldn't embed a profile:", error);
        return false;
    }
}
