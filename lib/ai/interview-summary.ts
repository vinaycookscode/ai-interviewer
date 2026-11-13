// Writes an interview's two summaries once every answer is scored (AIIN-41). Server only. Callers have set the score.
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { parseSummaries, summaryPrompt } from "@/lib/interview-summary";

export async function writeSummaries(interviewId: string): Promise<boolean> {
    const iv = await db.interview.findUnique({
        where: { id: interviewId },
        select: {
            language: true,
            candidateSummary: true,
            job: { select: { title: true } },
            answers: { orderBy: { createdAt: "asc" }, select: { transcript: true, score: true, feedback: true, question: { select: { text: true } } } },
        },
    });
    if (!iv || iv.candidateSummary || iv.answers.length === 0) return false;
    const prompt = summaryPrompt({
        job: iv.job.title,
        language: iv.language || "en",
        answers: iv.answers.map((a) => ({ question: a.question.text, transcript: a.transcript, score: a.score, feedback: a.feedback })),
    });
    const model = await getGeminiModelInstance();
    let s = null;
    // Busy or rate-limited models usually recover in seconds: try 3 times
    for (const wait of [0, 2_000, 6_000]) {
        if (wait) await new Promise((r) => setTimeout(r, wait));
        try {
            s = parseSummaries((await model.generateContent(prompt)).response.text());
            if (s) break;
        } catch (error) {
            const status = (error as { status?: number }).status;
            if (status !== 429 && status !== 503) throw error;
        }
    }
    if (!s) return false;
    // Only the first writer wins
    const { count } = await db.interview.updateMany({ where: { id: interviewId, candidateSummary: null }, data: { candidateSummary: s.candidate, feedback: s.employer } });
    return count === 1;
}

/** Summaries that a busy model missed: interviews scored in the last day with none yet, a few per run. */
export async function retryMissingSummaries(limit = 3): Promise<number> {
    const missing = await db.interview.findMany({
        where: { candidateSummary: null, score: { not: null }, completedAt: { gt: new Date(Date.now() - 24 * 3600_000) } },
        orderBy: { completedAt: "desc" },
        take: limit,
        select: { id: true },
    });
    let written = 0;
    for (const m of missing) if (await writeSummaries(m.id).catch(() => false)) written++;
    return written;
}
