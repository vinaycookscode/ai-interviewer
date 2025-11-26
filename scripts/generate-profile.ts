import "dotenv/config";
import { db } from "@/lib/db";
import { generatePersonalityProfile } from "@/lib/ai/personality";

async function main() {
    const key = process.env.GEMINI_API_KEY || "MISSING";
    console.log(`Loaded API Key starts with: ${key.substring(0, 5)}...`);

    const targetId = "5154d0a4-6d7e-499b-ac2b-805ac3167e31";
    console.log(`Generating profile for target ID: ${targetId} with NEW KEY...`);

    try {
        const profile = await generatePersonalityProfile(targetId);
        if (profile) {
            console.log("SUCCESS! Profile generated:", profile);
        } else {
            console.log("FAILED to generate profile (returned null)");
        }
    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
