import "dotenv/config";
import { db } from "@/lib/db";
import { generatePersonalityProfile } from "@/lib/ai/personality";

async function main() {

    const totalAnswers = await db.answer.count();

    const targetId = "5154d0a4-6d7e-499b-ac2b-805ac3167e31";

    try {
        const profile = await generatePersonalityProfile(targetId);
    } catch (e) {
        console.error("Error generating profile:", e);
    }
    process.exit(0);

    const interviews = await db.interview.findMany({
        include: {
            answers: true,
            job: true,
            personalityProfile: true,
            candidate: true
        }
    });


    for (const interview of interviews) {

        if (interview.answers.length > 0 && !interview.personalityProfile) {
            try {
                const profile = await generatePersonalityProfile(interview.id);
            } catch (e) {
                console.error("Error generating profile:", e);
            }
        }
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
