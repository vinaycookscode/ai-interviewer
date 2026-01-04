import 'dotenv/config';
import { db } from "../lib/db";

async function checkDay9() {
    console.log("🔍 Checking Day 9 content...\n");

    // Get the program
    const program = await db.placementProgram.findFirst({
        where: { name: "90-Day Placement Bootcamp" }
    });

    if (!program) {
        console.log("❌ Program not found");
        return;
    }

    console.log(`✅ Program found: ${program.name}`);

    // Get Day 9 module
    const day9Module = await db.programModule.findFirst({
        where: {
            programId: program.id,
            dayNumber: 9
        },
        include: {
            tasks: true
        }
    });

    if (!day9Module) {
        console.log("\n❌ No ProgramModule found for Day 9");
        console.log("This means Day 9 has NOT been seeded yet.");
        return;
    }

    console.log(`\n✅ Day 9 Module found: ${day9Module.title}`);
    console.log(`   Tasks: ${day9Module.tasks.length}`);

    if (day9Module.tasks.length === 0) {
        console.log("\n⚠️  Day 9 module exists but has NO TASKS");
        console.log("   This is why you see 0/0 completed");
    } else {
        console.log("\n📝 Day 9 Tasks:");
        day9Module.tasks.forEach((task: any, i: number) => {
            console.log(`   ${i + 1}. ${task.type}: ${task.title}`);
        });
    }

    await db.$disconnect();
}

checkDay9().catch(console.error);
