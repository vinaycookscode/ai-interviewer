// A candidate's own match % for jobs (AIIN-202): the stored match if there is one, worked out on the spot if not.
// Server only. Reads the candidate's skills, job titles, years and city: never a name or college.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { passesFilters, scoreMatch, type MatchJob, type MatchCandidate } from "@/lib/match-score";

export interface MyMatch {
    score: number;
    missing: string[];
    fits: boolean;
}

type Facts = { id: string; skills: unknown; experience: unknown; totalYears: number | null; city: string | null };

/** null when the candidate has no confirmed facts: there's nothing to match on yet. */
export async function myMatches(userId: string, jobs: (MatchJob & { id: string })[]): Promise<Map<string, MyMatch> | null> {
    const [facts] = await db.$queryRaw<Facts[]>(Prisma.sql`
        SELECT "id", "resumeFacts"->'skills' AS "skills", "resumeFacts"->'experience' AS "experience", "totalYears", "city"
        FROM "CandidateProfile" WHERE "userId" = ${userId} AND "factsConfirmedAt" IS NOT NULL`);
    if (!facts) return null;
    const out = new Map<string, MyMatch>();
    if (!jobs.length) return out;
    const names = (v: unknown, k: "name" | "title") => (Array.isArray(v) ? v.flatMap((x) => (x && typeof x === "object" && typeof (x as Record<string, unknown>)[k] === "string" ? [(x as Record<string, string>)[k]] : [])) : []);
    const c: MatchCandidate = { skills: names(facts.skills, "name"), roles: names(facts.experience, "title"), totalYears: facts.totalYears, city: facts.city };
    const ids = jobs.map((j) => j.id);
    const [stored, sims] = await Promise.all([
        db.jobMatch.findMany({ where: { candidateProfileId: facts.id, jobId: { in: ids } }, select: { jobId: true, score: true } }),
        db.$queryRaw<{ id: string; similarity: number }[]>(Prisma.sql`
            SELECT j."id", 1 - (j."embedding" <=> cp."embedding") AS "similarity"
            FROM "Job" j, "CandidateProfile" cp
            WHERE cp."id" = ${facts.id} AND j."id" = ANY(${ids}) AND j."embedding" IS NOT NULL AND cp."embedding" IS NOT NULL`),
    ]);
    const storedOf = new Map(stored.map((s) => [s.jobId, s.score]));
    const simOf = new Map(sims.map((s) => [s.id, Number(s.similarity)]));
    for (const j of jobs) {
        // Without embeddings, relevance counts as none: the score is still the same every time
        const r = scoreMatch(j, c, simOf.get(j.id) ?? 0.5);
        out.set(j.id, { score: storedOf.get(j.id) ?? r.score, missing: r.missing, fits: passesFilters(j, c) });
    }
    return out;
}
