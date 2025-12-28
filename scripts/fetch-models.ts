
import "dotenv/config";

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key provided");
        return;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
        console.log("Available Models:");
        data.models.forEach((m: any) => {
            // Filter for generateContent supported models
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });
    } else {
        console.log("No models found or error:", data);
    }
}

listModels();
