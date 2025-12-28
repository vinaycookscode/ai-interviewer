"use server";

import { getGeminiModel } from "@/actions/gemini-config";
import { getGeminiModelInstance } from "@/lib/gemini";
import { auth } from "@/auth"; // Assuming auth is from next-auth or similar
import { db } from "@/lib/db"; // Assuming db is your Prisma client or ORM instance
// import { GoogleGenerativeAI } from "@google/generative-ai"; // No longer needed directly

export async function generateQuestions(jobDescription: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    // Get user's API key
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { geminiApiKey: true }
    });

    const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: "Gemini API key not found. Please add your API key in Settings."
        };
    }

    try {
        const model = await getGeminiModelInstance(apiKey);


        const prompt = `
            Generate 5 interview questions for a job with the following description:
            ${jobDescription}
            
            Format the output as a JSON array of strings.
            Example: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Attempt to parse the JSON output
        let questions: string[] = [];
        // Clean the text to remove markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            questions = JSON.parse(cleanText);
            if (!Array.isArray(questions) || !questions.every(q => typeof q === 'string')) {
                throw new Error("Invalid JSON format from Gemini API.");
            }
        } catch (parseError) {
            console.error("Failed to parse Gemini API response as JSON:", parseError);
            console.error("Raw Gemini API response:", text);
            return {
                success: false,
                error: "Failed to parse questions from Gemini API. Please try again."
            };
        }

        return { success: true, questions };
    } catch (error: any) {
        console.error("Failed to generate questions:", error);

        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            const modelName = await getGeminiModel(); // Re-fetch to be sure which model failed
            await markModelRateLimited(modelName);

            return {
                success: false,
                error: `Rate limit reached for ${modelName}. Please select a different model in the dashboard header.`
            };
        }

        return {
            success: false,
            error: error.message || "Failed to generate questions. Please try again."
        };
    }
}
