// Prep sets for upcoming interviews (AIIN-213). No access checks: callers pass the signed-in candidate's id.
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { istDay, startOfIstDay } from "@/lib/ist";
import { embed, similarities } from "@/lib/bank/meaning";
import { bankKey, bankType } from "@/lib/bank/items";
import { RELATED, WEAK_SCORE, parsePrepSuggestion, pickPrepSet, prepPrompt, type Candidate } from "@/lib/bank/prep";

/** The candidate's interviews still to come: not finished, job open, link not expired, not scheduled before today. */
export function upcomingWhere(userId: string) {
    const now = new Date();
    return {
        candidateId: userId,
        status: { not: "COMPLETED" as const },
        job: { archivedAt: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [{ OR: [{ scheduledTime: null }, { scheduledTime: { gte: startOfIstDay(istDay(now)) } }] }],
    };
}

/**
 * Build the prep set for one of the candidate's upcoming interviews, once: the candidate's bank questions closest to
 * the job, the company's Company prep questions, their weak spots, and Gemini's suggestions for any gap. The
 * employer's own interview questions are never shown to Gemini and never let into the set (AC3).
 */
export async function buildPrepSet(userId: string, interviewId: string): Promise<string | null> {
    const existing = await db.prepSet.findUnique({ where: { userId_interviewId: { userId, interviewId } }, select: { id: true } });
    if (existing) return existing.id;

    const interview = await db.interview.findFirst({
        where: { id: interviewId, ...upcomingWhere(userId) },
        select: {
            job: {
                select: {
                    title: true,
                    description: true,
                    employer: { select: { name: true } },
                    questions: { where: { archived: false }, select: { text: true } },
                },
            },
        },
    });
    if (!interview) return null;
    const { job } = interview;
    const company = job.employer.name?.trim() || null;

    // The job's must-haves and spare practice questions, from its title and description only
    const model = await getGeminiModelInstance();
    const suggestion = parsePrepSuggestion((await model.generateContent(prepPrompt(job))).response.text());
    const jobQuery = `${job.title}. ${suggestion.skills.join(", ")}`;

    const [scores, bank, kit] = await Promise.all([
        similarities(userId, jobQuery),
        db.bankItem.findMany({
            where: { userId },
            select: {
                id: true,
                questionText: true,
                box: true,
                companyQuestionId: true,
                mockAnswer: { select: { score: true, createdAt: true } },
                attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true, createdAt: true } },
            },
        }),
        company
            ? db.companyPrepKit.findFirst({
                  where: { company: { equals: company, mode: "insensitive" } },
                  select: { questions: { where: { status: "PUBLISHED" }, orderBy: { frequency: "desc" }, take: 10, select: { id: true, question: true, type: true, tags: true } } },
              })
            : null,
    ]);
    const similarity = new Map(scores.map((s) => [s.id, s.similarity]));
    const lastScore = (item: (typeof bank)[number]) =>
        [item.mockAnswer, item.attempts[0]].filter((a) => a && a.score != null).sort((a, b) => b!.createdAt.getTime() - a!.createdAt.getTime())[0]?.score ?? null;
    const byCloseness = (a: { id: string }, b: { id: string }) => (similarity.get(b.id) ?? 0) - (similarity.get(a.id) ?? 0);

    const related = bank.filter((item) => (similarity.get(item.id) ?? 0) >= RELATED).sort(byCloseness);
    const weak = bank
        .filter((item) => {
            const score = lastScore(item);
            return (score != null && score < WEAK_SCORE) || (item.box >= 1 && item.box <= 2 && (score ?? 0) < 7);
        })
        .sort(byCloseness);
    const companyQuestions = kit?.questions ?? [];

    // One embedding call for every candidate text and the employer's questions, to drop near-duplicates (AC2, AC3)
    const pool: { key: string; text: string; group: Candidate["group"] }[] = [
        ...related.map((item) => ({ key: item.id, text: item.questionText, group: "JOB" as const })),
        ...companyQuestions.map((q) => ({ key: `cq:${q.id}`, text: q.question, group: "COMPANY" as const })),
        ...weak.map((item) => ({ key: item.id, text: item.questionText, group: "WEAK" as const })),
        ...suggestion.questions.map((q, i) => ({ key: `ai:${i}`, text: q.question, group: "JOB" as const })),
    ];
    const employerTexts = job.questions.map((q) => q.text);
    const vectors = await embed([...pool.map((p) => p.text), ...employerTexts], "RETRIEVAL_DOCUMENT");
    const picked = pickPrepSet(
        pool.map((p, i) => ({ ...p, vector: vectors[i] })),
        employerTexts.map((text, i) => ({ text, vector: vectors[pool.length + i] }))
    );

    // Company prep and AI questions join the bank as Recommended; a Company prep question already there is reused
    const bankIds: string[] = [];
    for (const p of picked) {
        if (p.key.startsWith("cq:")) {
            const q = companyQuestions.find((c) => `cq:${c.id}` === p.key)!;
            const item = await db.bankItem.upsert({
                where: { userId_sourceKey: { userId, sourceKey: bankKey({ companyQuestionId: q.id }) } },
                create: { userId, sourceKey: bankKey({ companyQuestionId: q.id }), source: "RECOMMENDED", questionText: q.question, type: bankType(q.type, q.question), companyName: company, tags: q.tags, companyQuestionId: q.id },
                update: {},
                select: { id: true },
            });
            bankIds.push(item.id);
        } else if (p.key.startsWith("ai:")) {
            const q = suggestion.questions[Number(p.key.slice(3))];
            const item = await db.bankItem.create({
                data: { userId, sourceKey: bankKey({ recId: randomUUID() }), source: "RECOMMENDED", questionText: q.question, type: q.type, topic: job.title, companyName: company },
                select: { id: true },
            });
            bankIds.push(item.id);
        } else bankIds.push(p.key);
    }

    const set = await db.prepSet.upsert({
        where: { userId_interviewId: { userId, interviewId } },
        create: {
            userId,
            interviewId,
            skills: suggestion.skills,
            items: {
                create: [...new Set(bankIds)].map((bankItemId, position) => {
                    const p = picked[bankIds.indexOf(bankItemId)];
                    return { bankItemId, reason: p.group, aiSuggested: p.key.startsWith("ai:"), position };
                }),
            },
        },
        update: {},
        select: { id: true },
    });
    return set.id;
}
