// The drive dashboard's numbers (AIIN-172), from grouped queries: never one query per candidate (AC5). Server only;
// callers have checked the employer owns the drive.
import { db } from "@/lib/db";
import { emptyCounts, totals, type FunnelCounts } from "@/lib/drive-funnel";

interface Row {
    college: string | null;
    invited: bigint;
    opened: bigint;
    aptitude_passed: bigint;
    started: bigint;
    finished: bigint;
    scored: bigint;
    above: bigint;
    shortlisted: bigint;
}

/** Each college's funnel and the drive's total, in one grouped query. Candidates without a college come last. */
export async function driveFunnel(driveId: string, cutoff: number | null) {
    const rows = await db.$queryRaw<Row[]>`
        SELECT dc."driveCollegeId" AS college,
               count(*) AS invited,
               count(*) FILTER (WHERE dc.stage <> 'INVITED') AS opened,
               count(*) FILTER (WHERE dc.stage IN ('APTITUDE_PASSED', 'INTERVIEW_STARTED', 'INTERVIEW_FINISHED')) AS aptitude_passed,
               count(*) FILTER (WHERE dc.stage IN ('INTERVIEW_STARTED', 'INTERVIEW_FINISHED')) AS started,
               count(*) FILTER (WHERE dc.stage = 'INTERVIEW_FINISHED') AS finished,
               count(i.score) AS scored,
               count(*) FILTER (WHERE ${cutoff}::float8 IS NOT NULL AND i.score >= ${cutoff}::float8) AS above,
               count(*) FILTER (WHERE i.decision = 'SHORTLISTED') AS shortlisted
        FROM "DriveCandidate" dc
        LEFT JOIN "Interview" i ON i.id = dc."interviewId"
        WHERE dc."driveId" = ${driveId}
        GROUP BY dc."driveCollegeId"`;
    const byCollege = new Map<string | null, FunnelCounts>(
        rows.map((r) => [
            r.college,
            {
                invited: Number(r.invited),
                opened: Number(r.opened),
                aptitudePassed: Number(r.aptitude_passed),
                started: Number(r.started),
                finished: Number(r.finished),
                scored: Number(r.scored),
                aboveCutoff: Number(r.above),
                shortlisted: Number(r.shortlisted),
            },
        ]),
    );
    return { byCollege, total: rows.length ? totals([...byCollege.values()]) : emptyCounts() };
}

/** What needs chasing: emails that didn't arrive, answers that couldn't be scored, and integrity flags. */
export async function driveProblems(driveId: string) {
    const [bounced, failed, unscored, flagged] = await Promise.all([
        db.outboundEmail.count({ where: { driveId, status: "BOUNCED" } }),
        db.outboundEmail.count({ where: { driveId, status: "FAILED" } }),
        db.interview.count({ where: { driveId, answers: { some: { gradingStatus: "FAILED" } } } }),
        db.interview.count({ where: { driveId, integrityVerdict: { in: ["STRONG_CONCERNS", "WORTH_A_LOOK"] } } }),
    ]);
    return { bounced, failed, unscored, flagged };
}
