/**
 * Seed Educational Content for All 90 Days
 * 
 * This script generates AI-powered educational content for each day
 * of the 90-Day Placement Bootcamp and stores it in the database.
 * 
 * Usage: npx tsx scripts/seed-all-days.ts
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../lib/db";
import { CURRICULUM, type DayTopic, type ContentStructure } from "../lib/curriculum-config";

// Configuration
const BATCH_SIZE = 5; // Process 5 days at a time to avoid rate limits
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds between batches
const MODEL_NAME = "gemini-2.0-flash";

async function generateContentForDay(
    model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
    dayTopic: DayTopic
): Promise<ContentStructure> {
    const prompt = `You are creating educational content for Day ${dayTopic.dayNumber} of a 90-Day Coding Interview Preparation Bootcamp.

Topic: ${dayTopic.topic}
Subtopic: ${dayTopic.subtopic}
Concept Title: ${dayTopic.conceptTitle}
Difficulty: ${dayTopic.difficulty}

Generate comprehensive educational content in JSON format with these exact fields:

{
    "conceptTitle": "${dayTopic.conceptTitle}",
    "conceptExplanation": "A detailed 3-4 paragraph explanation of the concept. Use **bold** for emphasis. Include code complexity notations like O(n). Include 2-3 subsections with ### headers. Write in an engaging, educational tone.",
    "keyLearnings": [
        "4 key takeaways that are specific and actionable",
        "Each point should be 1-2 sentences",
        "Focus on what interviewers look for",
        "Include complexity analysis where relevant"
    ],
    "realWorldUseCases": [
        {
            "title": "Use case title",
            "description": "1-2 sentence description of how this concept applies in real software",
            "icon": "emoji representing this use case"
        }
    ],
    "interviewTips": [
        "4 specific interview tips for this topic",
        "Include common mistakes to avoid",
        "Mention what to say to interviewers",
        "Pattern recognition tips"
    ]
}

Requirements:
- conceptExplanation should be educational and include code-like examples using backticks
- realWorldUseCases should have exactly 4 items with relevant emojis
- keyLearnings should have exactly 4 items
- interviewTips should have exactly 4 items
- All content should be specific to ${dayTopic.subtopic}
- Tone should be encouraging but technical

Return ONLY the JSON object. No markdown formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error(`Failed to parse JSON for Day ${dayTopic.dayNumber}`);
    }

    return JSON.parse(jsonMatch[0]) as ContentStructure;
}

async function seedAllDays() {
    console.log("🚀 Starting 90-Day Content Generation...\n");

    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in environment");
        process.exit(1);
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Get program
    const program = await db.placementProgram.findUnique({
        where: { slug: "90-day-placement-bootcamp" }
    });

    if (!program) {
        console.error("❌ Program '90-day-placement-bootcamp' not found!");
        process.exit(1);
    }

    console.log(`📚 Found program: ${program.name}`);
    console.log(`📅 Generating content for ${CURRICULUM.length} days...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < CURRICULUM.length; i += BATCH_SIZE) {
        const batch = CURRICULUM.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(CURRICULUM.length / BATCH_SIZE);

        console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (Days ${batch[0].dayNumber}-${batch[batch.length - 1].dayNumber})`);

        for (const dayTopic of batch) {
            try {
                process.stdout.write(`  Day ${dayTopic.dayNumber}: ${dayTopic.conceptTitle}... `);

                // Generate content
                const content = await generateContentForDay(model, dayTopic);

                // Upsert to database
                await db.programModule.update({
                    where: {
                        programId_dayNumber: {
                            programId: program.id,
                            dayNumber: dayTopic.dayNumber
                        }
                    },
                    data: {
                        content: content as any
                    }
                });

                console.log("✅");
                successCount++;

            } catch (error: any) {
                console.log("❌");
                console.error(`    Error: ${error.message}`);
                errorCount++;

                // Handle rate limiting
                if (error.message?.includes('429') || error.message?.includes('Resource has been exhausted')) {
                    console.log("    ⏳ Rate limited! Waiting 30 seconds...");
                    await sleep(30000);
                }
            }
        }

        // Delay between batches
        if (i + BATCH_SIZE < CURRICULUM.length) {
            console.log(`  ⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
            await sleep(DELAY_BETWEEN_BATCHES);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully generated: ${successCount} days`);
    console.log(`❌ Failed: ${errorCount} days`);
    console.log("=".repeat(50));
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
seedAllDays()
    .catch(console.error)
    .finally(() => process.exit());
