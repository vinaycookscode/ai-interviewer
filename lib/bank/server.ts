// Filling the Question Bank (AIIN-209). No access checks: callers pass ids they've checked.
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { bankKey, bankType, modelAnswerPrompt, type NewQuestion } from "@/lib/bank/items";
import { review } from "@/lib/bank/review";
import { gradingPrompt, type Reference } from "@/lib/mock/questions";

/** Gemini's model answer for a question the candidate added (AIIN-211), stored as AI-written. Failure leaves none. */
export async function writeModelAnswer(userId: string, itemId: string, q: Pick<NewQuestion, "question" | "type" | "company">) {
    try {
        const model = await getGeminiModelInstance();
        const result = await model.generateContent(modelAnswerPrompt(q));
        const answer = result.response.text().trim().slice(0, 4000);
        if (answer) await db.bankItem.updateMany({ where: { id: itemId, userId }, data: { aiAnswer: answer } });
    } catch (error) {
        console.error("Error writing a model answer for the bank:", error);
    }
}

/**
 * A scored mock answer adds its question to the candidate's bank, or moves an existing item on to this answer.
 * A graded answer also sets when the question comes back (AIIN-212). One Gemini couldn't grade leaves the schedule.
 */
export async function addAnswerToBank(
    userId: string,
    answer: { id: string; question: string; role: string; companyQuestionId: string | null; gradedType: unknown; score: number | null }
) {
    const linked = answer.companyQuestionId
        ? await db.companyQuestion.findUnique({ where: { id: answer.companyQuestionId }, select: { type: true, tags: true, kit: { select: { company: true } } } })
        : null;
    const sourceKey = bankKey({ companyQuestionId: answer.companyQuestionId, mockAnswerId: answer.id });

    const item = await db.bankItem.upsert({
        where: { userId_sourceKey: { userId, sourceKey } },
        create: {
            userId,
            sourceKey,
            source: "MOCK",
            questionText: answer.question,
            topic: answer.role,
            type: bankType(linked?.type ?? answer.gradedType, answer.question),
            companyName: linked?.kit.company ?? null,
            tags: linked?.tags ?? [],
            status: "PRACTISING",
            companyQuestionId: answer.companyQuestionId,
            mockAnswerId: answer.id,
        },
        update: { mockAnswerId: answer.id },
        select: { id: true, box: true, status: true },
    });
    if (answer.score != null && answer.score > 0) await scheduleReview(item, answer.score);
    else if (item.status === "NEW") await db.bankItem.update({ where: { id: item.id }, data: { status: "PRACTISING" } });
}

/** Move a bank item to its next box after a graded answer, and set when it comes back (lib/bank/review.ts). */
export async function scheduleReview(item: { id: string; box: number }, score: number) {
    const next = review(item.box, score, new Date());
    await db.bankItem.update({ where: { id: item.id }, data: { box: next.box, status: next.status, nextReview: next.nextReview } });
    return next;
}

/** Gemini's grade for an answer given from the bank, against the strong answer when there is one. Null if it fails. */
export async function gradeBankAnswer(question: string, transcript: string, role: string, reference: Reference | null): Promise<{ score: number; feedback: string } | null> {
    try {
        const model = await getGeminiModelInstance();
        const result = await model.generateContent(gradingPrompt(question, transcript, role, reference));
        const parsed = JSON.parse(result.response.text().replace(/```json/g, "").replace(/```/g, "").trim()) as { score?: unknown; feedback?: unknown };
        const score = Number(parsed.score);
        if (!Number.isFinite(score) || typeof parsed.feedback !== "string") return null;
        return { score: Math.min(10, Math.max(0, score)), feedback: parsed.feedback.slice(0, 1000) };
    } catch (error) {
        console.error("Error grading a bank answer:", error);
        return null;
    }
}
