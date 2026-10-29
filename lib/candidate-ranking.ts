// A job's candidates ranked by score, with filters and paging from the URL (AIIN-158).
import type { HiringDecision, Prisma } from "@prisma/client";
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

const ORDER: Record<Sort, Prisma.InterviewOrderByWithRelationInput[]> = {
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
    completedAt: Date | null;
}

/**
 * One page of the job's finished interviews, ranked by score among all of them (so a candidate keeps
 * their rank under any filter or sort). The caller has already checked the employer owns the job.
 */
export async function loadRanking(jobId: string, f: RankingFilters) {
    const where: Prisma.InterviewWhereInput = {
        jobId,
        status: "COMPLETED",
        ...(f.decisions.length ? { decision: { in: f.decisions } } : {}),
        ...(f.min ? { score: { gte: f.min } } : {}),
        ...(f.within ? { completedAt: { gte: withinDate(f.within) } } : {}),
        ...searchWhere(f.q),
    };

    const [total, rows, ranks, decisions] = await Promise.all([
        db.interview.count({ where }),
        db.interview.findMany({
            where,
            orderBy: ORDER[f.sort],
            skip: (f.page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                score: true,
                decision: true,
                completedAt: true,
                candidate: { select: { name: true, email: true } },
                personalityProfile: { select: { strengths: true, weaknesses: true } },
            },
        }),
        db.$queryRaw<{ id: string; rank: bigint }[]>`
            SELECT "id", ROW_NUMBER() OVER (ORDER BY "score" DESC NULLS LAST, "completedAt" ASC NULLS LAST, "id" ASC) AS "rank"
            FROM "Interview"
            WHERE "jobId" = ${jobId} AND "status" = 'COMPLETED'`,
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
    const rankOf = new Map(ranks.map((r) => [r.id, Number(r.rank)]));

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
        completedAt: r.completedAt,
    }));

    const counts = Object.fromEntries(decisions.map((d) => [d.decision, d._count._all])) as Partial<Record<HiringDecision, number>>;
    return { total, rows: ranked, finished: ranks.length, counts };
}

/** Unfinished interviews for the job: listed below the ranking, unranked. */
export function unfinishedWhere(jobId: string, f: RankingFilters): Prisma.InterviewWhereInput {
    const status = f.status === "in_progress" ? "IN_PROGRESS" : f.status === "pending" ? "PENDING" : undefined;
    return { jobId, ...(status ? { status } : { status: { in: ["PENDING", "IN_PROGRESS"] } }), ...searchWhere(f.q) };
}
