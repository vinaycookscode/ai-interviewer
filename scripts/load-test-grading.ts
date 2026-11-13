// Load test for the grading queue (AIIN-170), against a throwaway local database only. Gemini is stubbed with a rate
// limit, and time is compressed: one "minute" is one second, so 60 calls a minute becomes 60 a second.
//
//   DATABASE_URL="postgresql://postgres@localhost:5433/build_check" GEMINI_API_KEY=stub npx tsx scripts/load-test-grading.ts
import { db } from "@/lib/db";
import { finalizeInterviews, processGrading, retryFailedAnswers } from "@/lib/grading-queue";
import { averageScore } from "@/lib/grading-rules";

const host = (() => {
    try {
        return new URL(process.env.DATABASE_URL ?? "").hostname;
    } catch {
        return "";
    }
})();
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error("Refusing: DATABASE_URL must point at a local database.");
    process.exit(1);
}

const INTERVIEWS = 300, ANSWERS = 5, LIMIT_PER_WINDOW = 60, WINDOW_MS = 1000;
const calls: number[] = [];
const graded = new Map<string, number>();
let flakyLeft = 3;
let peak = 0;

async function main() {
    // Fresh data
    await db.answer.deleteMany({ where: { interview: { jobId: "job-load" } } });
    await db.interview.deleteMany({ where: { jobId: "job-load" } });
    await db.question.deleteMany({ where: { jobId: "job-load" } });
    await db.job.upsert({ where: { id: "job-load" }, update: {}, create: { id: "job-load", title: "Load test", description: "Load test", employerId: "emp1" } });
    await db.question.createMany({ data: Array.from({ length: ANSWERS }, (_, i) => ({ id: `job-load-q${i}`, text: `Question ${i + 1}`, jobId: "job-load" })) });
    for (let i = 0; i < INTERVIEWS; i++)
        await db.user.upsert({ where: { email: `load${i}@test.local` }, update: {}, create: { id: `load-u${i}`, email: `load${i}@test.local`, role: "CANDIDATE" } });
    await db.interview.createMany({ data: Array.from({ length: INTERVIEWS }, (_, i) => ({ id: `load-iv${i}`, candidateId: `load-u${i}`, jobId: "job-load", status: "COMPLETED" as const, completedAt: new Date() })) });
    await db.answer.createMany({
        data: Array.from({ length: INTERVIEWS * ANSWERS }, (_, k) => ({
            id: `load-a${Math.floor(k / ANSWERS)}-${k % ANSWERS}`,
            interviewId: `load-iv${Math.floor(k / ANSWERS)}`,
            questionId: `job-load-q${k % ANSWERS}`,
            transcript: `A long enough answer number ${k}`,
        })),
    });

    // The stub: 429 beyond the limit; one answer fails 3 times then works (AC3); one always fails (AC4)
    const evaluate = async (_q: string, transcript: string) => {
        const now = Date.now();
        while (calls.length && calls[0] <= now - WINDOW_MS) calls.shift();
        if (calls.length >= LIMIT_PER_WINDOW) throw Object.assign(new Error("429 Too Many Requests"), { status: 429 });
        calls.push(now);
        peak = Math.max(peak, calls.length);
        const id = transcript.match(/number (\d+)$/)![1];
        if (id === "7" && flakyLeft-- > 0) throw Object.assign(new Error("429 Too Many Requests"), { status: 429 });
        if (id === "12") throw new Error("Model error");
        graded.set(id, (graded.get(id) ?? 0) + 1);
        await new Promise((r) => setTimeout(r, 15));
        return { score: (Number(id) % 10) + 0.5 > 10 ? 9 : (Number(id) % 9) + 1, feedback: "ok", criteria: { accuracy: 0, communication: 0, relevance: 0 } };
    };

    const started = Date.now();
    // Two workers at the same moment (AC5); the lease lets one grade, the other returns at once
    const opts = { deadlineMs: 5 * 60_000, concurrency: 4, evaluate, ratePerMinute: LIMIT_PER_WINDOW * 60, backoffScale: 0.01 };
    const [a, b] = await Promise.all([processGrading(opts), processGrading(opts)]);
    // Retries come due after their (compressed) backoff
    for (let i = 0; i < 16; i++) {
        await new Promise((r) => setTimeout(r, 600));
        await processGrading(opts);
    }
    const secs = (Date.now() - started) / 1000;

    const statuses = await db.answer.groupBy({ by: ["gradingStatus"], where: { interview: { jobId: "job-load" } }, _count: { _all: true } });
    const twice = [...graded.values()].filter((n) => n > 1).length;
    const scored = await db.interview.count({ where: { jobId: "job-load", score: { not: null } } });
    const failedIv = await db.interview.findUnique({ where: { id: "load-iv2" }, select: { score: true } });
    // AC7: every score is the plain average of its answers
    const sample = await db.interview.findMany({ where: { jobId: "job-load", score: { not: null } }, take: 50, select: { score: true, answers: { select: { score: true } } } });
    const averagesMatch = sample.every((s) => Math.abs((s.score ?? 0) - (averageScore(s.answers.map((x) => x.score)) ?? -1)) < 1e-9);
    console.log(JSON.stringify({ workers: [a, b].map((x) => ({ graded: x.graded, busy: x.busy })), seconds: secs, statuses, gradedTwice: twice, peakPerWindow: peak, limit: LIMIT_PER_WINDOW, scored, failedInterviewScore: failedIv?.score ?? null, flakyGradedOnce: graded.get("7") === 1, averagesMatch }, null, 1));

    // AC4: "Try again" re-queues only the failed answer
    const requeued = await retryFailedAnswers("load-iv2");
    const pending = await db.answer.count({ where: { interview: { jobId: "job-load" }, gradingStatus: "PENDING" } });
    console.log(JSON.stringify({ requeued, pendingAfterRetry: pending }));
    await finalizeInterviews([]);
}

main().finally(() => db.$disconnect());
