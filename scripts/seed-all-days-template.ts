/**
 * Seed Educational Content for All 90 Days - Template Version
 * 
 * This script generates content using pre-defined templates
 * without requiring external API calls.
 * 
 * Usage: npx tsx scripts/seed-all-days-template.ts
 */

import 'dotenv/config';
import { db } from "../lib/db";
import { CURRICULUM, type DayTopic, type ContentStructure } from "../lib/curriculum-config";

// Template-based content generation
function generateContentForDay(dayTopic: DayTopic): ContentStructure {
    const { topic, subtopic, conceptTitle, difficulty } = dayTopic;

    // Difficulty-based complexity descriptions
    const complexityMap = {
        beginner: { time: "O(n)", space: "O(1) to O(n)", level: "fundamental" },
        intermediate: { time: "O(n log n)", space: "O(n)", level: "commonly tested" },
        advanced: { time: "O(n²) optimized to O(n)", space: "O(n) with optimization", level: "challenging" }
    };

    const complexity = complexityMap[difficulty];

    // Topic-specific patterns
    const topicPatterns: Record<string, { pattern: string; tip: string; useCase: string }> = {
        "Arrays & Hashing": {
            pattern: "HashMap to reduce O(n²) to O(n)",
            tip: "\"I'll use a HashMap to store seen values for O(1) lookup\"",
            useCase: "Database indexing, caching systems, and frequency analysis"
        },
        "Two Pointers": {
            pattern: "Move pointers based on comparison",
            tip: "\"Since the array is sorted, I can use two pointers from opposite ends\"",
            useCase: "Text processing, merge operations, and range queries"
        },
        "Sliding Window": {
            pattern: "Expand/contract window to find optimal subarray",
            tip: "\"I'll maintain a window and expand/shrink based on conditions\"",
            useCase: "Stream processing, rate limiting, and substring problems"
        },
        "Binary Search": {
            pattern: "Eliminate half the search space each iteration",
            tip: "\"This sorted property allows binary search for O(log n) time\"",
            useCase: "Database queries, version control (git bisect), and search engines"
        },
        "Linked Lists": {
            pattern: "Use slow/fast pointers or dummy nodes",
            tip: "\"I'll use a dummy head to simplify edge cases\"",
            useCase: "Memory management, undo operations, and LRU caches"
        },
        "Stacks & Queues": {
            pattern: "LIFO for stacks, FIFO for queues",
            tip: "\"A monotonic stack helps track the next greater element efficiently\"",
            useCase: "Expression evaluation, browser history, and BFS traversals"
        },
        "Trees": {
            pattern: "Recursive DFS or iterative BFS",
            tip: "\"I'll use recursion with the base case being null nodes\"",
            useCase: "File systems, DOM trees, and database indexing (B-Trees)"
        },
        "Heaps": {
            pattern: "Priority queue for top-K or streaming median",
            tip: "\"A min-heap of size K gives us the K largest elements\"",
            useCase: "Task scheduling, Dijkstra's algorithm, and recommendation systems"
        },
        "Tries": {
            pattern: "Character-by-character traversal for prefix matching",
            tip: "\"A trie efficiently handles prefix-based operations\"",
            useCase: "Autocomplete, spell checkers, and IP routing tables"
        },
        "Graphs": {
            pattern: "BFS for shortest path, DFS for complete exploration",
            tip: "\"I'll represent this as an adjacency list and use BFS for level-order\"",
            useCase: "Social networks, GPS navigation, and dependency resolution"
        },
        "Dynamic Programming": {
            pattern: "Define state, recurrence relation, and base cases",
            tip: "\"I'll define dp[i] as the optimal solution up to index i\"",
            useCase: "Route optimization, text comparison, and resource allocation"
        }
    };

    const pattern = topicPatterns[topic] || topicPatterns["Arrays & Hashing"];

    // Generate content
    return {
        conceptTitle,
        conceptExplanation: `**${subtopic}** is a ${complexity.level} technique in ${topic}.\n\n` +
            `### Core Concept\n` +
            `Today we focus on ${subtopic.toLowerCase()}, which is essential for solving ${topic.toLowerCase()} problems efficiently. ` +
            `The key insight is: ${pattern.pattern}.\n\n` +
            `### Time & Space Complexity\n` +
            `- **Time Complexity**: Typically ${complexity.time}\n` +
            `- **Space Complexity**: ${complexity.space}\n\n` +
            `### When to Use This Pattern\n` +
            `Look for problems involving ${topic.toLowerCase()}. Common signals include keywords like ` +
            `"find", "count", "optimal", "minimum", or "maximum" in the problem statement.`,
        keyLearnings: [
            `${subtopic} is typically ${complexity.time} time complexity when implemented correctly.`,
            `Always consider edge cases: empty input, single element, and duplicate values.`,
            `The pattern "${pattern.pattern}" applies to many ${topic} problems.`,
            `Practice identifying when ${topic.toLowerCase()} techniques apply to unfamiliar problems.`
        ],
        realWorldUseCases: [
            {
                title: "Tech Industry",
                description: `${pattern.useCase} at major tech companies.`,
                icon: "💼"
            },
            {
                title: "System Design",
                description: `Understanding ${topic.toLowerCase()} helps in designing scalable systems.`,
                icon: "🏗️"
            },
            {
                title: "Interview Success",
                description: `${topic} problems appear in 90% of technical interviews.`,
                icon: "🎯"
            },
            {
                title: "Daily Development",
                description: `These patterns optimize everyday coding tasks and algorithms.`,
                icon: "💻"
            }
        ],
        interviewTips: [
            `Start by clarifying: "Is the input sorted? Can there be duplicates?"`,
            `Think out loud: ${pattern.tip}`,
            `After coding, trace through an example to verify correctness.`,
            `Discuss time/space trade-offs to show depth of understanding.`
        ]
    };
}

async function seedAllDays() {
    console.log("🚀 Starting 90-Day Content Generation (Template Mode)...\n");

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

    for (const dayTopic of CURRICULUM) {
        try {
            process.stdout.write(`  Day ${dayTopic.dayNumber}: ${dayTopic.conceptTitle}... `);

            // Generate content from template
            const content = generateContentForDay(dayTopic);

            // Upsert to database (create if not exists, update if exists)
            await db.programModule.upsert({
                where: {
                    programId_dayNumber: {
                        programId: program.id,
                        dayNumber: dayTopic.dayNumber
                    }
                },
                create: {
                    programId: program.id,
                    dayNumber: dayTopic.dayNumber,
                    title: dayTopic.conceptTitle,
                    description: `${dayTopic.topic} - ${dayTopic.subtopic}`,
                    content: content as any
                },
                update: {
                    title: dayTopic.conceptTitle,
                    description: `${dayTopic.topic} - ${dayTopic.subtopic}`,
                    content: content as any
                }
            });

            console.log("✅");
            successCount++;

        } catch (error: any) {
            console.log("❌");
            console.error(`    Error: ${error.message}`);
            errorCount++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully generated: ${successCount} days`);
    console.log(`❌ Failed: ${errorCount} days`);
    console.log("=".repeat(50));
}

// Run
seedAllDays()
    .catch(console.error)
    .finally(() => process.exit());
