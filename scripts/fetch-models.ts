
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
        data.models.forEach((m: any) => {
            // Filter for generateContent supported models
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
            }
        });
    } else {
    }
}

listModels();
