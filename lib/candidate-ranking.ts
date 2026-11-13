// A job's candidates ranked by score, with filters and paging from the URL (AIIN-158).
import { Prisma, type HiringDecision, type IntegrityReviewOutcome, type IntegrityVerdict } from "@prisma/client";
import { scoringState, type ScoringState } from "@/lib/grading-rules";
import { db } from "@/lib/db";
import { PAGE_SIZE, type RankingFilters, type Sort } from "@/lib/candidate-filters";

function searchWhere(q: string): Prisma.InterviewWhereInput {
    return q
        ? { candidate: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } }
        : {};
}

function withinDate(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** The ranked list's sorts; the CSV export uses the same (AIIN-162). */
export const RANKING_ORDER: Record<Sort, Prisma.InterviewOrderByWithRelationInput[]> = {
    // Highest first; a tie goes to whoever finished earlier
    score: [{ score: { sort: "desc", nulls: "last" } }, { completedAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    finished: [{ completedAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    name: [{ candidate: { name: { sort: "asc", nulls: "last" } } }, { candidate: { email: "asc" } }, { id: "asc" }],
};

export interface RankedRow {
    id: string;
    rank: number;
    name: string | null;
    email: string;
    score: number | null;
    low: number | null;
    high: number | null;
    strongest: string | null;
    weakest: string | null;
    decision: HiringDecision;
    /** Null until the verdict is computed on completion (AIIN-177, AIIN-178). */
    integrity: IntegrityVerdict | null;
    /** The employer's latest review of the verdict (AIIN-179) */
    review: IntegrityReviewOutcome | null;
    completedAt: Date | null;
    /** Scored, still being scored, or with answers that couldn't be scored (AIIN-170): never ranked on a partial average */
    scoring: ScoringState;
    failed: number;
}

/** Every finished interview's rank by score among all of the job's, whatever the filters: a candidate keeps their rank. */
export async function rankOfAll(jobId: string): Promise<Map<string, number>> {
    const ranks = await db.$queryRaw<{ id: string; rank: bigint }[]>`
        SELECT "id", ROW_NUMBER() OVER (ORDER BY "score" DESC NULLS LAST, "completedAt" ASC NULLS LAST, "id" ASC) AS "rank"
        FROM "Interview"
        WHERE "jobId" = ${jobId} AND "status" = 'COMPLETED'`;
    return new Map(ranks.map((r) => [r.id, Number(r.rank)]));
}

/** The job's finished interviews that match the ranked list's filters: the list, and "Select all matching" (AIIN-159). */
export function rankingWhere(jobId: string, f: RankingFilters): Prisma.InterviewWhereInput {
    return {
        jobId,
        status: "COMPLETED",
        ...(f.decisions.length ? { decision: { in: f.decisions } } : {}),
        ...(f.min ? { score: { gte: f.min } } : {}),
        ...(f.within ? { completedAt: { gte: withinDate(f.within) } } : {}),
        ...(f.integrity ? { integrityVerdict: f.integrity } : {}),
        ...searchWhere(f.q),
    };
}

/**
 * One page of the job's finished interviews, ranked by score among all of them (so a candidate keeps
 * their rank under any filter or sort). The caller has already checked the employer owns the job.
 */
export async function loadRanking(jobId: string, f: RankingFilters) {
    const where = rankingWhere(jobId, f);

    const [total, rows, rankOf, decisions] = await Promise.all([
        db.interview.count({ where }),
        db.interview.findMany({
            where,
            orderBy: RANKING_ORDER[f.sort],
            skip: (f.page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                score: true,
                decision: true,
                integrityVerdict: true,
                integrityReviewOutcome: true,
                completedAt: true,
                candidate: { select: { name: true, email: true } },
                personalityProfile: { select: { strengths: true, weaknesses: true } },
            },
        }),
        rankOfAll(jobId),
        db.interview.groupBy({ by: ["decision"], where: { jobId, status: "COMPLETED" }, _count: { _all: true } }),
    ]);

    const spreads = rows.length
        ? await db.answer.groupBy({
              by: ["interviewId"],
              where: { interviewId: { in: rows.map((r) => r.id) }, score: { not: null } },
              _min: { score: true },
              _max: { score: true },
          })
        : [];
    const spreadOf = new Map(spreads.map((s) => [s.interviewId, s]));
    const unscored = rows.filter((r) => r.score === null).map((r) => r.id);
    const grading = unscored.length
        ? await db.answer.groupBy({ by: ["interviewId", "gradingStatus"], where: { interviewId: { in: unscored }, gradingStatus: { not: "DONE" } }, _count: { _all: true } })
        : [];
    const gradingOf = (id: string, failed: boolean) =>
        grading.filter((g) => g.interviewId === id && (g.gradingStatus === "FAILED") === failed).reduce((n, g) => n + g._count._all, 0);

    const ranked: RankedRow[] = rows.map((r) => ({
        id: r.id,
        rank: rankOf.get(r.id) ?? 0,
        name: r.candidate.name,
        email: r.candidate.email,
        score: r.score,
        low: spreadOf.get(r.id)?._min.score ?? null,
        high: spreadOf.get(r.id)?._max.score ?? null,
        strongest: r.personalityProfile?.strengths[0] ?? null,
        weakest: r.personalityProfile?.weaknesses[0] ?? null,
        decision: r.decision,
        integrity: r.integrityVerdict,
        review: r.integrityReviewOutcome,
        completedAt: r.completedAt,
        scoring: scoringState({ score: r.score, pending: gradingOf(r.id, false), failed: gradingOf(r.id, true) }),
        failed: gradingOf(r.id, true),
    }));

    const counts = Object.fromEntries(decisions.map((d) => [d.decision, d._count._all])) as Partial<Record<HiringDecision, number>>;
    return { total, rows: ranked, finished: rankOf.size, counts };
}

/** Unfinished interviews for the job: listed below the ranking, unranked. */
export function unfinishedWhere(jobId: string, f: RankingFilters): Prisma.InterviewWhereInput {
    const status = f.status === "in_progress" ? "IN_PROGRESS" : f.status === "pending" ? "PENDING" : undefined;
    return { jobId, ...(status ? { status } : { status: { in: ["PENDING", "IN_PROGRESS"] } }), ...searchWhere(f.q) };
}

export interface JobRanking {
    id: string;
    title: string;
    finished: number;
    unfinished: number;
    rows: { id: string; rank: number; name: string | null; email: string; score: number | null; decision: HiringDecision }[];
}

/**
 * Every open job of the employer with its top finished candidates, for the Candidates page (AIIN-217). Ranks are each
 * job's own, computed over all its finished interviews exactly as on the job page, so a filter never changes a rank.
 * Jobs with the latest finish come first.
 */
export async function loadRankingByJob(employerId: string, f: { q: string; decision: HiringDecision | null }, perJob: number): Promise<JobRanking[]> {
    const jobs = await db.job.findMany({ where: { employerId, archivedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } });
    if (!jobs.length) return [];
    const jobIds = jobs.map((j) => j.id);

    const [ranks, matching, unfinished] = await Promise.all([
        db.$queryRaw<{ id: string; jobId: string; rank: bigint; completedAt: Date | null }[]>`
            SELECT "id", "jobId", "completedAt",
                   ROW_NUMBER() OVER (PARTITION BY "jobId" ORDER BY "score" DESC NULLS LAST, "completedAt" ASC NULLS LAST, "id" ASC) AS "rank"
            FROM "Interview"
            WHERE "jobId" IN (${Prisma.join(jobIds)}) AND "status" = 'COMPLETED'`,
        db.interview.findMany({
            where: { jobId: { in: jobIds }, status: "COMPLETED", ...(f.decision ? { decision: f.decision } : {}), ...searchWhere(f.q) },
            select: { id: true, jobId: true, score: true, decision: true, candidate: { select: { name: true, email: true } } },
        }),
        db.interview.groupBy({ by: ["jobId"], where: { jobId: { in: jobIds }, status: { in: ["PENDING", "IN_PROGRESS"] } }, _count: { _all: true } }),
    ]);

    const rankOf = new Map(ranks.map((r) => [r.id, Number(r.rank)]));
    const finishedBy = new Map<string, number>();
    const latestBy = new Map<string, number>();
    for (const r of ranks) {
        finishedBy.set(r.jobId, (finishedBy.get(r.jobId) ?? 0) + 1);
        const t = r.completedAt?.getTime() ?? 0;
        if (t > (latestBy.get(r.jobId) ?? 0)) latestBy.set(r.jobId, t);
    }
    const unfinishedBy = new Map(unfinished.map((u) => [u.jobId, u._count._all]));

    return jobs
        .map((job) => ({
            id: job.id,
            title: job.title,
            finished: finishedBy.get(job.id) ?? 0,
            unfinished: unfinishedBy.get(job.id) ?? 0,
            rows: matching
                .filter((m) => m.jobId === job.id)
                .map((m) => ({ id: m.id, rank: rankOf.get(m.id) ?? 0, name: m.candidate.name, email: m.candidate.email, score: m.score, decision: m.decision }))
                .sort((a, b) => a.rank - b.rank)
                .slice(0, perJob),
        }))
        .sort((a, b) => (latestBy.get(b.id) ?? 0) - (latestBy.get(a.id) ?? 0));
}
