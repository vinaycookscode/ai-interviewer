// Compute and store Talent Match matches (AIIN-199). Server only.
// AC4: no query here reads a name, gender, age or college: candidates come in as skills, job titles, years and city.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { discoverableWhere } from "@/lib/discovery";
import { SCORER_VERSION, parseReasons, passesFilters, plainReasons, reasonsPrompt, scoreMatch, withMissing, type MatchCandidate, type MatchJob } from "@/lib/match-score";

const POOL = 200;
const WITH_AI_REASONS = 20;

type Row = { id: string; userId: string; skills: unknown; experience: unknown; totalYears: number | null; city: string | null; similarity: number };

function candidateFrom(r: Row): MatchCandidate {
    const skills = Array.isArray(r.skills) ? r.skills.flatMap((s) => (s && typeof s === "object" && typeof (s as { name?: unknown }).name === "string" ? [(s as { name: string }).name] : [])) : [];
    const roles = Array.isArray(r.experience) ? r.experience.flatMap((e) => (e && typeof e === "object" && typeof (e as { title?: unknown }).title === "string" ? [(e as { title: string }).title] : [])) : [];
    return { skills, roles, totalYears: r.totalYears, city: r.city };
}
const factLines = (c: MatchCandidate) => [c.skills.length ? `Skills: ${c.skills.join(", ")}` : "", ...c.roles.slice(0, 3).map((t) => `Worked as ${t}`), c.totalYears !== null ? `${c.totalYears} years of work` : ""].filter(Boolean);

const jobSelect = { id: true, title: true, employerId: true, status: true, archivedAt: true, requirementsConfirmedAt: true, mustHaveSkills: true, niceToHaveSkills: true, minYears: true, maxYears: true, workMode: true, location: true } as const;

/** Every match for one job: discoverable candidates, hard filters, the top 200 by similarity, scored. */
export async function matchJob(jobId: string): Promise<number> {
    const job = await db.job.findUnique({ where: { id: jobId }, select: jobSelect });
    const embedded = job ? (await db.$queryRaw<{ ok: boolean }[]>(Prisma.sql`SELECT "embedding" IS NOT NULL AS ok FROM "Job" WHERE "id" = ${jobId}`))[0]?.ok : false;
    if (!job || job.status !== "OPEN" || job.archivedAt || !job.requirementsConfirmedAt || !embedded) {
        await db.jobMatch.deleteMany({ where: { jobId } });
        return 0;
    }
    // Who this employer may find: the one shared rule (AIIN-198), ids only
    const allowed = await db.candidateProfile.findMany({ where: discoverableWhere(job.employerId), select: { id: true }, take: 20_000 });
    const ids = allowed.map((a) => a.id);
    const rows = ids.length
        ? await db.$queryRaw<Row[]>(Prisma.sql`
            SELECT cp."id", cp."userId", cp."resumeFacts"->'skills' AS "skills", cp."resumeFacts"->'experience' AS "experience",
                   cp."totalYears", cp."city", 1 - (cp."embedding" <=> j."embedding") AS "similarity"
            FROM "CandidateProfile" cp, "Job" j
            WHERE j."id" = ${jobId} AND cp."id" = ANY(${ids}) AND cp."embedding" IS NOT NULL
            ORDER BY "similarity" DESC, cp."id" ASC
            LIMIT ${POOL}`)
        : [];

    const m: MatchJob = { ...job, workMode: job.workMode };
    const scored = rows.flatMap((r) => {
        const c = candidateFrom(r);
        if (!passesFilters(m, c)) return [];
        const result = scoreMatch(m, c, Number(r.similarity));
        return [{ r, c, result, reasons: plainReasons(m, c, result) }];
    });
    scored.sort((a, b) => b.result.score - a.result.score || a.r.id.localeCompare(b.r.id));

    // Reasons from AI for the top 20, each resting on a confirmed fact; missing must-haves always stay named (AC2)
    const top = scored.slice(0, WITH_AI_REASONS);
    if (top.length) {
        try {
            // Short numbered keys: models copy "c3" reliably, longer codes less so
            const people = top.map((s, i) => ({ code: `c${i + 1}`, lines: factLines(s.c) }));
            const model = await getGeminiModelInstance();
            const ai = parseReasons((await model.generateContent(reasonsPrompt(job, people))).response.text(), people.map((p) => p.code));
            for (const [i, s] of top.entries()) {
                const r = ai.get(`c${i + 1}`);
                if (r) s.reasons = withMissing(r, s.result.missing);
            }
        } catch (error) {
            console.error("Match reasons from AI failed; plain reasons kept:", error);
        }
    }

    const now = new Date();
    await db.$transaction([
        db.jobMatch.deleteMany({ where: { jobId, candidateProfileId: { notIn: scored.map((s) => s.r.id) } } }),
        ...scored.map((s) =>
            db.jobMatch.upsert({
                where: { jobId_candidateProfileId: { jobId, candidateProfileId: s.r.id } },
                update: { score: s.result.score, parts: { ...s.result.parts }, reasons: s.reasons, scorerVersion: SCORER_VERSION, computedAt: now, employerId: job.employerId },
                create: { jobId, candidateProfileId: s.r.id, employerId: job.employerId, score: s.result.score, parts: { ...s.result.parts }, reasons: s.reasons, scorerVersion: SCORER_VERSION, computedAt: now },
            })
        ),
    ]);
    return scored.length;
}

/** One candidate's matches across open jobs: on confirming facts or opting in. Plain reasons; a job's run adds AI ones. */
export async function matchProfile(userId: string): Promise<number> {
    const p = await db.candidateProfile.findFirst({ where: { userId, discoverable: true, factsConfirmedAt: { not: null } }, select: { id: true } });
    if (!p) {
        await removeProfileMatches(userId);
        return 0;
    }
    const jobs = await db.$queryRaw<{ id: string; similarity: number }[]>(Prisma.sql`
        SELECT j."id", 1 - (j."embedding" <=> cp."embedding") AS "similarity"
        FROM "Job" j, "CandidateProfile" cp
        WHERE cp."id" = ${p.id} AND cp."embedding" IS NOT NULL AND j."embedding" IS NOT NULL
          AND j."status" = 'OPEN' AND j."archivedAt" IS NULL AND j."requirementsConfirmedAt" IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM "CandidateBlock" b WHERE b."candidateId" = ${userId} AND b."employerId" = j."employerId")
        ORDER BY "similarity" DESC, j."id" ASC
        LIMIT ${POOL}`);
    const [facts] = await db.$queryRaw<Row[]>(Prisma.sql`
        SELECT "id", "userId", "resumeFacts"->'skills' AS "skills", "resumeFacts"->'experience' AS "experience", "totalYears", "city", 0 AS "similarity"
        FROM "CandidateProfile" WHERE "id" = ${p.id}`);
    const c = candidateFrom(facts);
    const details = await db.job.findMany({ where: { id: { in: jobs.map((j) => j.id) } }, select: jobSelect });
    const byId = new Map(details.map((d) => [d.id, d]));
    const kept = jobs.flatMap((j) => {
        const d = byId.get(j.id);
        if (!d) return [];
        const m: MatchJob = { ...d, workMode: d.workMode };
        if (!passesFilters(m, c)) return [];
        const result = scoreMatch(m, c, Number(j.similarity));
        return [{ d, result, reasons: plainReasons(m, c, result) }];
    });
    const now = new Date();
    await db.$transaction([
        db.jobMatch.deleteMany({ where: { candidateProfileId: p.id, jobId: { notIn: kept.map((k) => k.d.id) } } }),
        ...kept.map((k) =>
            db.jobMatch.upsert({
                where: { jobId_candidateProfileId: { jobId: k.d.id, candidateProfileId: p.id } },
                update: { score: k.result.score, parts: { ...k.result.parts }, reasons: k.reasons, scorerVersion: SCORER_VERSION, computedAt: now },
                create: { jobId: k.d.id, candidateProfileId: p.id, employerId: k.d.employerId, score: k.result.score, parts: { ...k.result.parts }, reasons: k.reasons, scorerVersion: SCORER_VERSION, computedAt: now },
            })
        ),
    ]);
    return kept.length;
}

/** Out of every match list at once: turned off, or facts withdrawn (AIIN-198 AC2). */
export async function removeProfileMatches(userId: string, employerId?: string): Promise<void> {
    await db.jobMatch.deleteMany({ where: { candidateProfile: { userId }, ...(employerId ? { employerId } : {}) } });
}

// ---- The queue: run right away after the change, retried by the daily cron ----

export async function queueMatch(kind: "JOB" | "PROFILE", targetId: string): Promise<void> {
    await db.matchTask.upsert({ where: { kind_targetId: { kind, targetId } }, update: { lockedAt: null }, create: { kind, targetId } });
}

/** Run up to `limit` queued tasks. A task that fails five times is dropped and logged. Never throws. */
export async function runMatchTasks(limit = 10): Promise<{ done: number; failed: number }> {
    let done = 0, failed = 0;
    const stale = new Date(Date.now() - 10 * 60 * 1000);
    const tasks = await db.matchTask.findMany({ where: { OR: [{ lockedAt: null }, { lockedAt: { lt: stale } }] }, orderBy: { createdAt: "asc" }, take: limit });
    for (const t of tasks) {
        const lock = await db.matchTask.updateMany({ where: { id: t.id, OR: [{ lockedAt: null }, { lockedAt: { lt: stale } }] }, data: { lockedAt: new Date(), attempts: { increment: 1 } } });
        if (!lock.count) continue;
        try {
            if (t.kind === "JOB") await matchJob(t.targetId);
            else await matchProfile(t.targetId);
            await db.matchTask.delete({ where: { id: t.id } });
            done++;
        } catch (error) {
            failed++;
            console.error(`Match task ${t.kind} ${t.targetId} failed:`, error);
            if (t.attempts + 1 >= 5) await db.matchTask.delete({ where: { id: t.id } }).catch(() => undefined);
            else await db.matchTask.update({ where: { id: t.id }, data: { lockedAt: null } }).catch(() => undefined);
        }
    }
    return { done, failed };
}

/** Queue and run straight away, so a new job's matches exist within seconds (AC3). Never throws. */
export async function matchNow(kind: "JOB" | "PROFILE", targetId: string): Promise<void> {
    try {
        await queueMatch(kind, targetId);
        await runMatchTasks(5);
    } catch (error) {
        console.error("Couldn't run matching:", error);
    }
}
