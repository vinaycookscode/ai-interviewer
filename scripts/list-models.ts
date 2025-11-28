
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in environment variables");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // @ts-ignore
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy model to get client

    try {
        // There isn't a direct listModels method on the client instance in this SDK version usually,
        // but let's try to see if we can just infer or use a known working one.
        // Actually, the error message suggested calling ListModels.
        // In the Node SDK, it might be different.
        // Let's try a different approach: just try a few common ones.

        console.log("Testing common models...");

        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro", "gemini-pro"];

        for (const modelName of modelsToTest) {
            console.log(`Testing ${modelName}...`);
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const result = await m.generateContent("Hello");
                console.log(`✅ ${modelName} is WORKING`);
                break; // Found one!
            } catch (e: any) {
                console.log(`❌ ${modelName} failed: ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
