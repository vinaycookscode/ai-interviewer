"use server";

import { db } from "@/lib/db";
import { evaluateAnswer } from "@/lib/gemini";

export async function gradeAnswer(answerId: string) {
    try {
        // 1. Fetch Answer and Question
        const answer = await db.answer.findUnique({
            where: { id: answerId },
            include: { question: true },
        });

        if (!answer) {
            throw new Error("Answer not found");
        }

        if (!answer.transcript || answer.transcript.length < 10) {
            // Skip scoring for very short/empty answers
            return { success: false, error: "Answer too short to evaluate" };
        }

        // 2. Evaluate with Gemini
        const evaluation = await evaluateAnswer(answer.question.text, answer.transcript);

        // 3. Update Database
        await db.answer.update({
            where: { id: answerId },
            data: {
                score: evaluation.score,
                feedback: evaluation.feedback,
                // We could store the detailed criteria in a JSON field if we added one,
                // for now we'll just store the main score and feedback.
            },
        });

        return { success: true, evaluation };
    } catch (error: any) {
        console.error("Error grading answer:", error);

        if (error.name === "RateLimitError" || error.message?.includes("RateLimitError")) {
            return { success: false, error: "Rate limit reached", isRateLimit: true };
        }

        return { success: false, error: "Failed to grade answer" };
    }
}
