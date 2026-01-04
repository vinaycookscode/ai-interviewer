import 'dotenv/config';
import { db } from "../lib/db";

async function auditAllDays() {
    console.log("🔍 Auditing all 90 days for tasks...\n");

    const program = await db.placementProgram.findFirst({
        where: { name: "90-Day Placement Bootcamp" }
    });

    if (!program) {
        console.log("❌ Program not found");
        return;
    }

    // Get all modules
    const modules = await db.programModule.findMany({
        where: { programId: program.id },
        include: {
            tasks: true
        },
        orderBy: { dayNumber: 'asc' }
    });

    console.log(`✅ Found ${modules.length} day modules\n`);

    const daysWithoutTasks: number[] = [];
    const daySummary: { day: number; title: string; tasks: number }[] = [];

    for (const module of modules) {
        daySummary.push({
            day: module.dayNumber,
            title: module.title,
            tasks: module.tasks.length
        });

        if (module.tasks.length === 0) {
            daysWithoutTasks.push(module.dayNumber);
        }
    }

    // Display summary
    console.log("📊 Day Summary:");
    console.log("Day | Tasks | Title");
    console.log("--- | ----- | -----");
    daySummary.forEach(d => {
        const status = d.tasks === 0 ? "❌" : "✅";
        console.log(`${status} ${d.day.toString().padStart(2)} | ${d.tasks} | ${d.title}`);
    });

    console.log(`\n\n📈 Statistics:`);
    console.log(`   Total Days: ${modules.length}`);
    console.log(`   Days with Tasks: ${modules.length - daysWithoutTasks.length}`);
    console.log(`   Days without Tasks: ${daysWithoutTasks.length}`);

    if (daysWithoutTasks.length > 0) {
        console.log(`\n⚠️  Days missing tasks: ${daysWithoutTasks.join(', ')}`);
    }

    await db.$disconnect();
}

auditAllDays().catch(console.error);
