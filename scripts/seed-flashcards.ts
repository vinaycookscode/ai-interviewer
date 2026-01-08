/**
 * Seed Flashcard Decks into Database
 * 
 * Usage: npx tsx scripts/seed-flashcards.ts
 */

import 'dotenv/config';
import { db } from "../lib/db";

// DSA Flashcards
const DSA_CARDS = [
    { front: "What is the time complexity of binary search?", back: "O(log n) - Binary search divides the search space in half each iteration." },
    { front: "What is the difference between a stack and a queue?", back: "Stack: LIFO (Last In, First Out)\nQueue: FIFO (First In, First Out)" },
    { front: "What is the time complexity of inserting at the beginning of an array vs linked list?", back: "Array: O(n) - need to shift all elements\nLinked List: O(1) - just update pointers" },
    { front: "What is a hash collision and how do you handle it?", back: "When two keys hash to the same index. Solutions:\n1. Chaining (linked lists)\n2. Open Addressing (linear/quadratic probing)" },
    { front: "What is the difference between BFS and DFS?", back: "BFS: Level-by-level, uses Queue, finds shortest path\nDFS: Goes deep first, uses Stack/recursion, uses less memory" },
    { front: "What is the time complexity of quicksort?", back: "Average: O(n log n)\nWorst: O(n²) when pivot is always min/max" },
    { front: "What is dynamic programming?", back: "Breaking complex problems into overlapping subproblems, solving each once and storing results (memoization/tabulation)." },
    { front: "What is the difference between a tree and a graph?", back: "Tree: Connected, no cycles, N-1 edges for N nodes\nGraph: Can have cycles, may be disconnected" },
    { front: "What is a heap and its main operations?", back: "Complete binary tree with heap property.\nInsert: O(log n)\nExtract min/max: O(log n)\nPeek: O(1)" },
    { front: "What is the two-pointer technique?", back: "Using two pointers moving toward each other or in same direction to solve problems in O(n) instead of O(n²). Common for sorted arrays." },
];

// System Design Flashcards
const SYSTEM_DESIGN_CARDS = [
    { front: "What is horizontal vs vertical scaling?", back: "Horizontal: Add more machines (scale out)\nVertical: Add more power to one machine (scale up)\nHorizontal is preferred for large systems." },
    { front: "What is a load balancer?", back: "Distributes incoming traffic across multiple servers. Algorithms: Round Robin, Least Connections, IP Hash." },
    { front: "What is database sharding?", back: "Splitting data across multiple databases.\n- Horizontal: Split rows\n- Vertical: Split columns" },
    { front: "What is CAP theorem?", back: "Distributed system can only guarantee 2 of 3:\n- Consistency\n- Availability\n- Partition tolerance" },
    { front: "What is a CDN?", back: "Content Delivery Network - Geographically distributed servers caching content closer to users." },
    { front: "What is caching and when to use it?", back: "Storing frequently accessed data in fast storage. Use for read-heavy workloads, expensive computations." },
    { front: "What is a message queue?", back: "Async communication between services. Benefits: Decoupling, Load leveling, Reliability. Examples: Kafka, RabbitMQ" },
    { front: "What is database replication?", back: "Copying data across multiple databases.\n- Master-Slave: One write, many reads\n- Master-Master: Multiple writes" },
    { front: "What is eventual consistency?", back: "System will become consistent over time, not immediately. Trade-off for availability." },
    { front: "What is a rate limiter?", back: "Controls request rate to prevent abuse. Algorithms: Token bucket, Sliding window, Leaky bucket." },
];

// Behavioral Flashcards
const BEHAVIORAL_CARDS = [
    { front: "Tell me about a time you failed.", back: "STAR: Specific situation, task, actions taken, result and learnings. Focus on: ownership, growth mindset." },
    { front: "Why do you want to work here?", back: "Research company: mission, products, culture. Connect your skills and goals to their needs." },
    { front: "Describe a conflict with a coworker.", back: "Show: active listening, empathy, finding common ground, focusing on goals not personalities." },
    { front: "Tell me about a challenging project.", back: "Highlight: problem complexity, your specific contributions, obstacles overcome, quantifiable impact." },
    { front: "Where do you see yourself in 5 years?", back: "Show ambition aligned with role. Mention: skill growth, leadership, domain expertise." },
    { front: "What is your greatest strength?", back: "Pick relevant strength. Back with specific example. Connect to how it helps in this role." },
    { front: "What is your greatest weakness?", back: "Choose real weakness. Show self-awareness. Explain steps you're taking to improve." },
    { front: "How do you handle tight deadlines?", back: "Mention: prioritization, breaking tasks down, communication, asking for help when needed." },
    { front: "Tell me about a time you showed leadership.", back: "Leadership without title counts. Show: initiative, influence, helping others, taking responsibility." },
    { front: "How do you handle feedback?", back: "Show: openness, listening without defensiveness, asking clarifying questions, implementing changes." },
];

async function seed() {
    console.log("🃏 Seeding flashcard decks...\n");

    // Create DSA Deck
    const dsaDeck = await db.flashcardDeck.upsert({
        where: { id: "dsa-deck" },
        update: {},
        create: {
            id: "dsa-deck",
            name: "Data Structures & Algorithms",
            description: "Core DSA concepts frequently asked in technical interviews",
            category: "DSA",
            isPublic: true,
            userId: null,
        },
    });
    console.log("✅ Created DSA deck");

    // Create System Design Deck
    const sdDeck = await db.flashcardDeck.upsert({
        where: { id: "system-design-deck" },
        update: {},
        create: {
            id: "system-design-deck",
            name: "System Design",
            description: "Essential system design concepts for architect-level interviews",
            category: "System Design",
            isPublic: true,
            userId: null,
        },
    });
    console.log("✅ Created System Design deck");

    // Create Behavioral Deck
    const behavDeck = await db.flashcardDeck.upsert({
        where: { id: "behavioral-deck" },
        update: {},
        create: {
            id: "behavioral-deck",
            name: "Behavioral Questions",
            description: "Common behavioral interview questions with STAR answers",
            category: "Behavioral",
            isPublic: true,
            userId: null,
        },
    });
    console.log("✅ Created Behavioral deck");

    // Seed cards
    for (let i = 0; i < DSA_CARDS.length; i++) {
        await db.flashcard.upsert({
            where: { id: `dsa-${i}` },
            update: { front: DSA_CARDS[i].front, back: DSA_CARDS[i].back },
            create: { id: `dsa-${i}`, deckId: dsaDeck.id, front: DSA_CARDS[i].front, back: DSA_CARDS[i].back },
        });
    }
    console.log(`✅ Added ${DSA_CARDS.length} DSA cards`);

    for (let i = 0; i < SYSTEM_DESIGN_CARDS.length; i++) {
        await db.flashcard.upsert({
            where: { id: `sd-${i}` },
            update: { front: SYSTEM_DESIGN_CARDS[i].front, back: SYSTEM_DESIGN_CARDS[i].back },
            create: { id: `sd-${i}`, deckId: sdDeck.id, front: SYSTEM_DESIGN_CARDS[i].front, back: SYSTEM_DESIGN_CARDS[i].back },
        });
    }
    console.log(`✅ Added ${SYSTEM_DESIGN_CARDS.length} System Design cards`);

    for (let i = 0; i < BEHAVIORAL_CARDS.length; i++) {
        await db.flashcard.upsert({
            where: { id: `behav-${i}` },
            update: { front: BEHAVIORAL_CARDS[i].front, back: BEHAVIORAL_CARDS[i].back },
            create: { id: `behav-${i}`, deckId: behavDeck.id, front: BEHAVIORAL_CARDS[i].front, back: BEHAVIORAL_CARDS[i].back },
        });
    }
    console.log(`✅ Added ${BEHAVIORAL_CARDS.length} Behavioral cards`);

    console.log("\n🎉 Seeded 3 decks with 30 flashcards total!");
}

// Run
seed()
    .catch(console.error)
    .finally(() => process.exit());
