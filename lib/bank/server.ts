// Filling the Question Bank (AIIN-209). No access checks: callers pass ids they've checked.
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { bankKey, bankType, modelAnswerPrompt, type NewQuestion } from "@/lib/bank/items";

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
 * A saved question that's now been practised becomes Practising; Confident stays Confident.
 */
export async function addAnswerToBank(
    userId: string,
    answer: { id: string; question: string; role: string; companyQuestionId: string | null; gradedType: unknown }
) {
    const linked = answer.companyQuestionId
        ? await db.companyQuestion.findUnique({ where: { id: answer.companyQuestionId }, select: { type: true, tags: true, kit: { select: { company: true } } } })
        : null;
    const sourceKey = bankKey({ companyQuestionId: answer.companyQuestionId, mockAnswerId: answer.id });

    await db.bankItem.upsert({
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
    });
    await db.bankItem.updateMany({ where: { userId, sourceKey, status: "NEW" }, data: { status: "PRACTISING" } });
}
