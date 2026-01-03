
import 'dotenv/config';
import { db } from "../lib/db";

async function checkDay2Tasks() {
    console.log("Checking Day 2 Tasks...");

    const program = await db.placementProgram.findUnique({
        where: { slug: "90-day-placement-bootcamp" }
    });

    if (!program) {
        console.log("Program not found");
        return;
    }

    const module = await db.programModule.findFirst({
        where: {
            programId: program.id,
            dayNumber: 1
        },
        include: {
            tasks: true
        }
    });

    if (!module) {
        console.log("Module not found for day 1");
        return;
    }

    console.log("Module:", module.title);
    console.log("Tasks:", JSON.stringify(module.tasks, null, 2));
}

checkDay2Tasks()
    .catch(console.error)
    .finally(() => process.exit());
