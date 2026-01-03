
import 'dotenv/config';
import { db } from "../lib/db";

async function verifyContent() {
    console.log("🔍 Verifying Day 1 Content...");

    try {
        const program = await db.placementProgram.findUnique({
            where: { slug: "90-day-placement-bootcamp" },
            include: {
                modules: {
                    where: { dayNumber: 1 }
                }
            }
        });

        if (!program || program.modules.length === 0) {
            console.error("❌ Program or Day 1 module not found");
            return;
        }

        const module = program.modules[0];
        console.log("📄 Content found for Day 1:");
        console.log(JSON.stringify(module.content, null, 2));

    } catch (error) {
        console.error("❌ Error verifying content:", error);
    } finally {
        process.exit();
    }
}

verifyContent();
