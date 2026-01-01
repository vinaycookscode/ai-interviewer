import "dotenv/config";
import { db } from "@/lib/db";
import { generatePersonalityProfile } from "@/lib/ai/personality";

async function main() {
    const key = process.env.GEMINI_API_KEY || "MISSING";

    const targetId = "5154d0a4-6d7e-499b-ac2b-805ac3167e31";

    try {
        const profile = await generatePersonalityProfile(targetId);
        if (profile) {
        } else {
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
