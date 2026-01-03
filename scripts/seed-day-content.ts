
import 'dotenv/config';
import { db } from "../lib/db";

async function seedDayContent() {
    console.log("🌱 Seeding Day 1 Content...");

    const day1Content = {
        conceptTitle: "Arrays & Hashing: The Foundation",
        conceptExplanation: `** Arrays ** are the simplest data structure: a contiguous block of memory.But coupled with ** Hashing **, they become the most powerful tool in your arsenal.

### Why Master This ?
    90 % of interview problems involve arrays or strings.Hashing(HashMaps / HashSets) is the "cheat code" to optimize them.

### Core Concepts
1. ** Contiguous Memory **: accessing \`arr[i]\` is O(1).
2. **Space-Time Trade-off**: We use HashMaps (O(n) space) to reduce time complexity from O(n²) to O(n).
3. **Prefix Sums**: Pre-calculating sums to answer range queries in O(1).

### The "HashMap" Pattern
Whenever you see a problem asking for "pairs", "frequency", or "duplicates", your first thought should be **HashMap**.`,
        keyLearnings: [
            "Accessing an element by index is O(1), but searching is O(n).",
            "HashMaps reduce search time to O(1) average case.",
            "Always check for edge cases: empty array, single element, duplicates.",
            "String problems are often just Array problems in disguise."
        ],
        realWorldUseCases: [
            {
                title: "Database Indexing",
                description: "Databases use B-Trees and Hash Indexes to find your data instantly, just like a HashMap.",
                icon: "🗄️"
            },
            {
                title: "Caching Systems (Redis)",
                description: "Distributed caches store key-value pairs in memory for lightning-fast retrieval.",
                icon: "⚡"
            },
            {
                title: "Spell Checkers",
                description: "Checking if a word exists in a dictionary using a HashSet is instantaneous.",
                icon: "abc"
            },
            {
                title: "Social Feeds",
                description: "Aggregating posts from friends involves complex array merging and filtering.",
                icon: "📱"
            }
        ],
        interviewTips: [
            "If the array is sorted, think **Two Pointers** or **Binary Search**.",
            "If the array is unsorted and you need to find something, think **HashMap**.",
            "Don't confuse a 'Map' (ordered) with an 'Object' (can be unordered) in JS/TS, though they act similarly for simple keys.",
            "Ask about constraints: Are numbers negative? How large can the array be?"
        ]
    };

    try {
        const program = await db.placementProgram.findUnique({
            where: { slug: "90-day-placement-bootcamp" }
        });

        if (!program) {
            console.error("Program not found!");
            return;
        }

        const updatedModule = await db.programModule.update({
            where: {
                programId_dayNumber: {
                    programId: program.id,
                    dayNumber: 1
                }
            },
            data: {
                content: day1Content
            }
        });

        console.log("✅ Successfully updated Day 1 content:", updatedModule.id);
    } catch (error) {
        console.error("❌ Error seeding content:", error);
    } finally {
        process.exit();
    }
}

seedDayContent();
