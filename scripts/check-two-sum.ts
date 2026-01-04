import 'dotenv/config';
import { db } from "../lib/db";

async function checkTwoSum() {
    console.log("🔍 Checking Two Sum question...\n");

    const question = await db.companyQuestion.findFirst({
        where: {
            question: {
                contains: "Two Sum"
            }
        }
    });

    if (!question) {
        console.log("❌ Two Sum question not found");
        return;
    }

    console.log("✅ Found question:", question.question);
    console.log("\n📊 Test Cases:");
    console.log(JSON.stringify(question.testCases, null, 2));
    console.log("\n💡 Solution Code:");
    console.log(question.solutionCode);

    await db.$disconnect();
}

checkTwoSum().catch(console.error);
