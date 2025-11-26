import "dotenv/config";
import { db } from "@/lib/db";
import { generatePersonalityProfile } from "@/lib/ai/personality";

async function main() {
    console.log("Listing all users and interviews...");

    const totalAnswers = await db.answer.count();
    console.log(`Total Answers in DB: ${totalAnswers}`);

    const targetId = "5154d0a4-6d7e-499b-ac2b-805ac3167e31";
    console.log(`Generating profile for target ID: ${targetId}`);

    try {
        const profile = await generatePersonalityProfile(targetId);
        console.log("Profile generated:", profile);
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

    console.log(`Found ${interviews.length} interviews in total.`);

    for (const interview of interviews) {
        console.log(`--------------------------------------------------`);
        console.log(`ID: ${interview.id}`);
        console.log(`Candidate: ${interview.candidate.email}`);
        console.log(`Job: ${interview.job.title}`);
        console.log(`Status: ${interview.status}`);
        console.log(`Score: ${interview.score}`);
        console.log(`Answers: ${interview.answers.length}`);
        console.log(`Has Profile: ${!!interview.personalityProfile}`);

        if (interview.answers.length > 0 && !interview.personalityProfile) {
            console.log(">>> Generating personality profile...");
            try {
                const profile = await generatePersonalityProfile(interview.id);
                console.log("Profile generated:", profile ? "Success" : "Failed");
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
