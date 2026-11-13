// The grading queue (AIIN-170). Server only. Answers are graded here with bounded concurrency and retries, never in
// the candidate's request; an interview gets its score only once every answer is graded. Rows are claimed with
// SKIP LOCKED, so two workers never grade the same answer (AC5).
import { db } from "@/lib/db";
import { evaluateAnswer, type EvaluationResult } from "@/lib/gemini";
import { MAX_GRADING_ATTEMPTS, MIN_TRANSCRIPT, averageScore, gradingBackoffMs } from "@/lib/grading-rules";
import { autoShortlist } from "@/lib/drive-shortlist";

const STUCK_MS = 10 * 60_000;
const LEASE = "grading-worker";
const LEASE_MS = 90_000;
/** Gemini calls a minute, across every server: one worker at a time (the lease), paced (AC1). */
const RATE_PER_MINUTE = Number(process.env.GRADING_RATE_PER_MINUTE) || 60;

/** Take (or renew) the single-worker lease. Returns false when another worker holds it. */
async function takeLease(owner: string): Promise<boolean> {
    const until = new Date(Date.now() + LEASE_MS);
    await db.rateLimit.upsert({ where: { identifier: LEASE }, update: {}, create: { identifier: LEASE, count: 0, expiresAt: new Date(0) } });
    const n = await db.$executeRaw`
        UPDATE "RateLimit" SET "expiresAt" = ${until}, "createdAt" = "createdAt"
        WHERE identifier = ${LEASE} AND ("expiresAt" < (now() AT TIME ZONE 'UTC') OR "count" = ${hash(owner)})`;
    if (n === 1) await db.rateLimit.update({ where: { identifier: LEASE }, data: { count: hash(owner) } });
    return n === 1;
}
async function releaseLease(owner: string) {
    await db.rateLimit.updateMany({ where: { identifier: LEASE, count: hash(owner) }, data: { expiresAt: new Date(0) } });
}
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Evaluate = (question: string, answer: string, language: string) => Promise<EvaluationResult>;

interface Claimed {
    id: string;
    interviewId: string;
    gradingAttempts: number;
}

/** Claim up to `limit` due answers for this worker only, stamping the claim time (so a stuck claim can be spotted). */
async function claim(limit: number): Promise<Claimed[]> {
    return db.$queryRaw<Claimed[]>`
        UPDATE "Answer" SET "gradingStatus" = 'GRADING', "gradingAttempts" = "gradingAttempts" + 1, "gradeAfter" = (now() AT TIME ZONE 'UTC')
        WHERE id IN (
            SELECT id FROM "Answer"
            WHERE "gradingStatus" = 'PENDING' AND "gradeAfter" <= (now() AT TIME ZONE 'UTC')
            ORDER BY "gradeAfter", id
            LIMIT ${limit}
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, "interviewId", "gradingAttempts"`;
}

async function gradeOne(row: Claimed, evaluate: Evaluate, backoffScale = 1): Promise<"done" | "retry" | "failed"> {
    const a = await db.answer.findUnique({ where: { id: row.id }, select: { transcript: true, question: { select: { text: true } }, interview: { select: { language: true } } } });
    if (!a) return "done";
    // Too short to judge: done, with no score, as before
    if (!a.transcript || a.transcript.length < MIN_TRANSCRIPT) {
        await db.answer.update({ where: { id: row.id }, data: { gradingStatus: "DONE", gradingError: null } });
        return "done";
    }
    try {
        const e = await evaluate(a.question.text, a.transcript, a.interview.language || "en");
        await db.answer.update({ where: { id: row.id }, data: { score: e.score, feedback: e.feedback, gradingStatus: "DONE", gradingError: null } });
        return "done";
    } catch (error) {
        const final = row.gradingAttempts >= MAX_GRADING_ATTEMPTS;
        const message = error instanceof Error ? error.message : String(error);
        await db.answer.update({
            where: { id: row.id },
            data: final
                ? { gradingStatus: "FAILED", gradingError: message.slice(0, 300) }
                : { gradingStatus: "PENDING", gradingError: message.slice(0, 300), gradeAfter: new Date(Date.now() + gradingBackoffMs(row.gradingAttempts) * backoffScale) },
        });
        return final ? "failed" : "retry";
    }
}

/**
 * Set the score of finished interviews whose answers are all graded (AC2, AC7). Never from a partial average: one
 * pending, grading or failed answer keeps the score empty.
 */
export async function finalizeInterviews(interviewIds: string[]): Promise<number> {
    let scored = 0;
    for (const id of [...new Set(interviewIds)]) {
        const iv = await db.interview.findUnique({
            where: { id },
            select: { status: true, score: true, answers: { select: { score: true, gradingStatus: true } } },
        });
        if (!iv || iv.status !== "COMPLETED" || iv.score !== null) continue;
        if (iv.answers.some((a) => a.gradingStatus !== "DONE")) continue;
        const score = averageScore(iv.answers.map((a) => a.score));
        if (score === null) continue;
        // Only the first worker to get here sets it
        const n = await db.interview.updateMany({ where: { id, score: null }, data: { score } });
        if (n.count === 1) {
            scored++;
            // A drive's auto-shortlist runs once, when the score is first set (AIIN-171)
            await autoShortlist(id).catch((e) => console.error("Auto-shortlist failed:", e));
        }
    }
    return scored;
}

/**
 * Grade what's due until the deadline, `concurrency` at a time (AC1). Rate limits and errors are retried with backoff
 * up to 5 attempts (AC3, AC4). Never throws.
 */
export async function processGrading(
    opts: { deadlineMs?: number; concurrency?: number; evaluate?: Evaluate; ratePerMinute?: number; /** tests only: compress time */ backoffScale?: number } = {},
) {
    const stopAt = Date.now() + (opts.deadlineMs ?? 40_000);
    const concurrency = opts.concurrency ?? 4;
    const rate = opts.ratePerMinute ?? RATE_PER_MINUTE;
    const evaluate: Evaluate = opts.evaluate ?? ((q, a, l) => evaluateAnswer(q, a, l, 0, true));
    const tally = { graded: 0, retried: 0, failed: 0, scored: 0, busy: false };
    const owner = `${process.pid}-${Math.random()}`;
    try {
        // One worker at a time across servers, so the rate below is the whole app's rate
        if (!(await takeLease(owner))) return { ...tally, busy: true };
        await db.answer.updateMany({ where: { gradingStatus: "GRADING", gradeAfter: { lt: new Date(Date.now() - STUCK_MS) } }, data: { gradingStatus: "PENDING" } });
        while (Date.now() < stopAt) {
            const started = Date.now();
            const rows = await claim(concurrency);
            if (!rows.length) break;
            const results = await Promise.all(rows.map((r) => gradeOne(r, evaluate, opts.backoffScale)));
            for (const r of results) tally[r === "done" ? "graded" : r === "retry" ? "retried" : "failed"]++;
            tally.scored += await finalizeInterviews(rows.map((r) => r.interviewId));
            // Pace: this batch may use rows.length of the per-minute budget
            const wait = (rows.length * 60_000) / rate - (Date.now() - started);
            if (wait > 0) await sleep(Math.min(wait, Math.max(0, stopAt - Date.now())));
            await takeLease(owner);
        }
    } catch (error) {
        console.error("Grading worker failed:", error);
    } finally {
        await releaseLease(owner).catch(() => undefined);
    }
    return tally;
}

/** "Try again": queue an interview's failed answers once more (AC4). Callers have checked the employer owns it. */
export async function retryFailedAnswers(interviewId: string): Promise<number> {
    const { count } = await db.answer.updateMany({
        where: { interviewId, gradingStatus: "FAILED" },
        data: { gradingStatus: "PENDING", gradingAttempts: 0, gradingError: null, gradeAfter: new Date() },
    });
    return count;
}
