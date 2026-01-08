import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Import all card data
import { ARRAYS_CARDS } from "@/lib/flashcard-data/arrays";
import { LINKED_LISTS_CARDS } from "@/lib/flashcard-data/linked-lists";
import { TREES_CARDS } from "@/lib/flashcard-data/trees";
import { GRAPHS_CARDS } from "@/lib/flashcard-data/graphs";
import { DP_CARDS } from "@/lib/flashcard-data/dp";
import { SORTING_CARDS } from "@/lib/flashcard-data/sorting";
import { STACKS_QUEUES_CARDS } from "@/lib/flashcard-data/stacks-queues";
import { HEAPS_HASH_CARDS } from "@/lib/flashcard-data/heaps-hash";
import { SYSTEM_DESIGN_CARDS } from "@/lib/flashcard-data/system-design";
import { SQL_CARDS } from "@/lib/flashcard-data/sql";
import { BEHAVIORAL_CARDS } from "@/lib/flashcard-data/behavioral";

// Deck definitions
const DECKS = [
    { id: "arrays-deck", name: "Arrays & Strings", description: "Array manipulation, two pointers, sliding window techniques", category: "DSA", cards: ARRAYS_CARDS },
    { id: "linked-lists-deck", name: "Linked Lists", description: "Singly, doubly linked lists, fast-slow pointers, list manipulation", category: "DSA", cards: LINKED_LISTS_CARDS },
    { id: "trees-deck", name: "Binary Trees & BST", description: "Tree traversals, BST operations, balanced trees, tries", category: "DSA", cards: TREES_CARDS },
    { id: "graphs-deck", name: "Graphs", description: "BFS, DFS, shortest paths, topological sort, MST, union-find", category: "DSA", cards: GRAPHS_CARDS },
    { id: "dp-deck", name: "Dynamic Programming", description: "Memoization, tabulation, classic DP patterns and problems", category: "DSA", cards: DP_CARDS },
    { id: "sorting-deck", name: "Sorting & Searching", description: "Comparison sorts, binary search, interval problems", category: "DSA", cards: SORTING_CARDS },
    { id: "stacks-queues-deck", name: "Stacks & Queues", description: "Monotonic stacks, expression parsing, design problems", category: "DSA", cards: STACKS_QUEUES_CARDS },
    { id: "heaps-hash-deck", name: "Heaps & Hash Tables", description: "Priority queues, top-K problems, hashing techniques", category: "DSA", cards: HEAPS_HASH_CARDS },
    { id: "system-design-deck", name: "System Design", description: "Scalability, distributed systems, design patterns, real systems", category: "System Design", cards: SYSTEM_DESIGN_CARDS },
    { id: "sql-deck", name: "SQL & Databases", description: "SQL queries, joins, optimization, ACID, sharding, indexing", category: "SQL", cards: SQL_CARDS },
    { id: "behavioral-deck", name: "Behavioral Interview", description: "STAR format answers, common questions, interview techniques", category: "Behavioral", cards: BEHAVIORAL_CARDS },
];

export async function GET() {
    try {
        console.time("Total seed time");
        let decksCreated = 0;
        let cardsCreated = 0;

        // Step 1: Delete all existing cards and decks (faster than upsert)
        console.time("Delete old data");
        const deckIds = DECKS.map(d => d.id);
        await db.flashcard.deleteMany({ where: { deckId: { in: deckIds } } });
        await db.flashcardDeck.deleteMany({ where: { id: { in: deckIds } } });
        console.timeEnd("Delete old data");

        // Step 2: Create all decks in batch
        console.time("Create decks");
        await db.flashcardDeck.createMany({
            data: DECKS.map(d => ({
                id: d.id,
                name: d.name,
                description: d.description,
                category: d.category,
                isPublic: true,
                userId: null,
            })),
        });
        decksCreated = DECKS.length;
        console.timeEnd("Create decks");

        // Step 3: Create all cards in batches
        console.time("Create cards");
        for (const deckData of DECKS) {
            const cardsToCreate = deckData.cards.map((card, i) => ({
                id: `${deckData.id}-${i}`,
                deckId: deckData.id,
                front: card.front,
                back: card.back,
            }));

            await db.flashcard.createMany({ data: cardsToCreate });
            cardsCreated += cardsToCreate.length;
        }
        console.timeEnd("Create cards");

        console.timeEnd("Total seed time");

        return NextResponse.json({
            success: true,
            message: `Seeded ${decksCreated} decks with ${cardsCreated} flashcards!`,
            decks: DECKS.map(d => ({ name: d.name, cards: d.cards.length })),
        });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
