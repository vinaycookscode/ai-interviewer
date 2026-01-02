"use server";

import { db } from "@/lib/db";
import { TaskType } from "@prisma/client";

/**
 * Seeds the 90-Day Placement Program with sample data
 * Run this once to populate the database with a complete program
 */
export async function seedPlacementProgram() {
    // Check if program already exists
    const existing = await db.placementProgram.findUnique({
        where: { slug: "90-day-placement-bootcamp" }
    });

    if (existing) {
        return { error: "Program already exists", programId: existing.id };
    }

    // Create the program
    const program = await db.placementProgram.create({
        data: {
            name: "90-Day Placement Bootcamp",
            slug: "90-day-placement-bootcamp",
            description: `A comprehensive 90-day program designed to make you placement-ready. 
            
This structured curriculum covers:
- Data Structures & Algorithms (Days 1-45)
- System Design Basics (Days 46-60)
- Aptitude & Logical Reasoning (Days 61-75)
- Behavioral & HR Preparation (Days 76-85)
- Mock Interviews & Final Prep (Days 86-90)

Features streak tracking, progress analytics, and daily accountability.`,
            durationDays: 90,
            isActive: true
        }
    });

    // Create modules for first 7 days (sample)
    const dayModules = [
        {
            dayNumber: 1,
            title: "Foundation: Arrays Basics",
            description: "Introduction to arrays and basic operations",
            tasks: [
                { title: "Watch: Arrays Introduction", type: TaskType.VIDEO, duration: 15, order: 1, content: { url: "https://example.com/arrays-intro", description: "Learn the fundamentals of arrays" } },
                { title: "Read: Array Time Complexity", type: TaskType.READING, duration: 10, order: 2, content: { text: "Understanding O(1) access and O(n) search in arrays" } },
                { title: "Solve: Two Sum", type: TaskType.PROBLEM, duration: 20, order: 3, content: { difficulty: "EASY", problem: "Find two numbers that add up to target" } },
                { title: "Quiz: Arrays Fundamentals", type: TaskType.QUIZ, duration: 10, order: 4, content: { questions: 5, topic: "arrays" } },
            ]
        },
        {
            dayNumber: 2,
            title: "Arrays: Sliding Window",
            description: "Master the sliding window pattern",
            tasks: [
                { title: "Watch: Sliding Window Pattern", type: TaskType.VIDEO, duration: 20, order: 1, content: { url: "https://example.com/sliding-window" } },
                { title: "Solve: Maximum Sum Subarray", type: TaskType.PROBLEM, duration: 25, order: 2, content: { difficulty: "EASY" } },
                { title: "Solve: Longest Substring Without Repeating", type: TaskType.PROBLEM, duration: 30, order: 3, content: { difficulty: "MEDIUM" } },
                { title: "Aptitude: Number Series", type: TaskType.APTITUDE, duration: 15, order: 4, content: { questions: 10 } },
            ]
        },
        {
            dayNumber: 3,
            title: "Arrays: Two Pointers",
            description: "Learn the two pointers technique",
            tasks: [
                { title: "Watch: Two Pointers Pattern", type: TaskType.VIDEO, duration: 15, order: 1, content: {} },
                { title: "Solve: Container With Most Water", type: TaskType.PROBLEM, duration: 25, order: 2, content: { difficulty: "MEDIUM" } },
                { title: "Solve: 3Sum", type: TaskType.PROBLEM, duration: 35, order: 3, content: { difficulty: "MEDIUM" } },
                { title: "HR Prep: Tell Me About Yourself", type: TaskType.HR_PREP, duration: 20, order: 4, content: { topic: "introduction" } },
            ]
        },
        {
            dayNumber: 4,
            title: "Strings Fundamentals",
            description: "String manipulation and common patterns",
            tasks: [
                { title: "Read: String Methods", type: TaskType.READING, duration: 15, order: 1, content: {} },
                { title: "Solve: Valid Anagram", type: TaskType.PROBLEM, duration: 20, order: 2, content: { difficulty: "EASY" } },
                { title: "Solve: Longest Palindromic Substring", type: TaskType.PROBLEM, duration: 30, order: 3, content: { difficulty: "MEDIUM" } },
                { title: "Quiz: Strings", type: TaskType.QUIZ, duration: 10, order: 4, content: { questions: 5 } },
            ]
        },
        {
            dayNumber: 5,
            title: "Hash Tables",
            description: "Master hash tables for O(1) lookups",
            tasks: [
                { title: "Watch: Hash Table Internals", type: TaskType.VIDEO, duration: 20, order: 1, content: {} },
                { title: "Solve: Group Anagrams", type: TaskType.PROBLEM, duration: 25, order: 2, content: { difficulty: "MEDIUM" } },
                { title: "Solve: Top K Frequent Elements", type: TaskType.PROBLEM, duration: 30, order: 3, content: { difficulty: "MEDIUM" } },
                { title: "Aptitude: Percentages", type: TaskType.APTITUDE, duration: 15, order: 4, content: { questions: 10 } },
            ]
        },
        {
            dayNumber: 6,
            title: "Linked Lists Basics",
            description: "Introduction to linked lists",
            tasks: [
                { title: "Watch: Linked List Fundamentals", type: TaskType.VIDEO, duration: 20, order: 1, content: {} },
                { title: "Solve: Reverse Linked List", type: TaskType.PROBLEM, duration: 20, order: 2, content: { difficulty: "EASY" } },
                { title: "Solve: Merge Two Sorted Lists", type: TaskType.PROBLEM, duration: 25, order: 3, content: { difficulty: "EASY" } },
                { title: "HR Prep: Why This Company", type: TaskType.HR_PREP, duration: 20, order: 4, content: {} },
            ]
        },
        {
            dayNumber: 7,
            title: "Week 1 Review & Mock",
            description: "Consolidate Week 1 learning",
            tasks: [
                { title: "Review: Week 1 Summary", type: TaskType.READING, duration: 20, order: 1, content: {} },
                { title: "Mock Interview: Coding Round", type: TaskType.MOCK_INTERVIEW, duration: 45, order: 2, content: { type: "coding" } },
                { title: "Quiz: Week 1 Assessment", type: TaskType.QUIZ, duration: 20, order: 3, content: { questions: 15 } },
            ]
        },
    ];

    // Create modules and tasks
    for (const moduleData of dayModules) {
        const module = await db.programModule.create({
            data: {
                programId: program.id,
                dayNumber: moduleData.dayNumber,
                title: moduleData.title,
                description: moduleData.description
            }
        });

        for (const taskData of moduleData.tasks) {
            await db.dailyTask.create({
                data: {
                    moduleId: module.id,
                    title: taskData.title,
                    type: taskData.type,
                    duration: taskData.duration,
                    order: taskData.order,
                    content: taskData.content
                }
            });
        }
    }

    return { success: true, programId: program.id, modulesCreated: dayModules.length };
}
