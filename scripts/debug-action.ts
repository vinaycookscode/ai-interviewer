
import 'dotenv/config';
import { getDayTasks } from "../actions/placement-program";
import { db } from "../lib/db";

async function debugAction() {
    console.log("🐞 Debugging getDayTasks...");

    try {
        // Need a valid enrollment ID
        const enrollments = await db.programEnrollment.findMany({ take: 1 });
        if (enrollments.length === 0) {
            console.error("No enrollments found to test with.");
            return;
        }

        const enrollment = enrollments[0];
        console.log(`Using enrollment: ${enrollment.id}, Day: ${enrollment.currentDay}`);

        // Fetch Day 1 specifically since we seeded it
        const day1Data = await getDayTasks(enrollment.id, 1);

        if (!day1Data) {
            console.error("❌ getDayTasks returned null");
        } else {
            console.log("✅ getDayTasks returned data.");
            console.log("Module ID:", day1Data.module.id);
            console.log("Module Title:", day1Data.module.title);
            console.log("Module Content Type:", typeof (day1Data.module as any).content);
            console.log("Module Content Present:", !!(day1Data.module as any).content);

            if ((day1Data.module as any).content) {
                console.log("Content Preview:", JSON.stringify((day1Data.module as any).content).substring(0, 100) + "...");
            } else {
                console.log("❌ CONTENT IS MISSING IN RETURNED OBJECT");
            }
        }

    } catch (error) {
        console.error("❌ Error running debug:", error);
    } finally {
        process.exit();
    }
}

debugAction();
