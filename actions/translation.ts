"use server";

import { getGeminiModelInstance } from "@/lib/gemini";

export async function translateText(text: string, targetLanguage: string) {
    if (!text) return { error: "No text provided" };

    try {
        const model = await getGeminiModelInstance();

        const prompt = `
        Translate the following text into ${targetLanguage}.
        Maintain the original tone and formatting (markdown).
        Do not add any explanations or preamble. Just return the translated text.
        
        Text:
        ${text}
        `;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();

        return { success: true, translatedText };
    } catch (error: any) {
        console.error("Translation error:", error);
        // Check for rate limit
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
            const { markModelRateLimited } = await import("@/actions/gemini-config");
            const { getGeminiModel } = await import("@/actions/gemini-config"); // dynamically import to avoid circular dep if any
            const modelName = await getGeminiModel();
            await markModelRateLimited(modelName);
            return { error: `Rate limit reached for ${modelName}. Please switch models.` };
        }
        return { error: "Failed to translate text" };
    }
}
