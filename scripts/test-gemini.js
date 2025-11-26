const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // We can't list models directly with the high-level SDK easily without a specific client, 
        // but we can try to just run a generation on a few likely candidates to see which one works,
        // or use the model manager if exposed. 
        // Actually, the SDK *does* have a specific way to list models if we use the API directly, 
        // but let's just try to generate content with a few known valid names to see which one succeeds.

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-1.5-pro-001",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        console.log("Testing models...");

        for (const modelName of modelsToTest) {
            try {
                console.log(`Testing ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`SUCCESS: ${modelName} works! Response: ${response.text()}`);
                return; // Found one!
            } catch (error) {
                console.log(`FAILED: ${modelName} - ${error.message}`);
            }
        }
        console.log("All tested models failed.");

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
