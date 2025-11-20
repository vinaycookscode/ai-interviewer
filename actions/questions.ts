"use server";

import { generateInterviewQuestions } from "@/lib/gemini";

export async function generateQuestions(jobDescription: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                success: false,
                error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file."
            };
        }

        const questions = await generateInterviewQuestions(jobDescription);
        return { success: true, questions };
    } catch (error: any) {
        console.error("Failed to generate questions:", error);
        return {
            success: false,
            error: error.message || "Failed to generate questions. Please try again."
        };
    }
}
