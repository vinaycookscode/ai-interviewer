
import 'dotenv/config';
import { db } from "../lib/db";

async function fixTwoSumContent() {
    console.log("Fixing Two Sum Content...");

    // Find the task
    // We know the ID from the check script, or we can find by title/module
    const tasks = await db.dailyTask.findMany({
        where: {
            title: "Solve: Two Sum"
        }
    });

    if (tasks.length === 0) {
        console.error("Task 'Solve: Two Sum' not found!");
        return;
    }

    console.log(`Found ${tasks.length} tasks to update.`);

    const richContent = {
        difficulty: "EASY",
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                input: "nums = [3,2,4], target = 6",
                output: "[1,2]",
                explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
        ],
        constraints: [
            "2 <= nums.length <= 10⁴",
            "-10⁹ <= nums[i] <= 10⁹",
            "-10⁹ <= target <= 10⁹",
            "Only one valid answer exists."
        ],
        hints: [
            "A brute force approach would be to check every pair - this gives O(n²) time complexity.",
            "Can you think of a way to reduce the time complexity using extra space?",
            "What data structure allows O(1) lookups?",
            "For each element, you need to find if (target - element) exists in the array."
        ],
        starterCode: `function twoSum(nums, target) {
    // Your solution here
    
    return [];
}`,
        solution: `function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}

// Time Complexity: O(n)
// Space Complexity: O(n)`,
        // EDUCATIONAL CONTENT (The "Reading Material")
        conceptTitle: "HashMap for Fast Lookups",
        conceptExplanation: `**The Two Sum problem** is one of the most popular coding interview questions. It teaches a fundamental concept: **trading space for time**.

### The Core Insight
Instead of checking every pair (O(n²)), we store each number we've seen in a HashMap. For each new number, we check if its "complement" (target - current) already exists in our map. This is O(1) lookup!

### Pattern Recognition
This problem belongs to the **"Complement Search"** pattern. Whenever you need to find pairs that satisfy a condition, think HashMap first.

### Why HashMap?
- **O(1) average lookup time** - finding if a value exists is instant
- **O(1) insertion** - adding new key-value pairs is fast
- **Perfect for frequency counting and pair finding**`,
        keyLearnings: [
            "HashMap provides O(1) lookup time, making it perfect for search optimizations",
            "The 'complement search' pattern: for each element, search for (target - element)",
            "Trade-off: We use O(n) extra space to achieve O(n) time instead of O(n²)",
            "Single-pass solution: We can check and insert in the same loop"
        ],
        realWorldUseCases: [
            {
                title: "E-commerce: Finding Product Bundles",
                description: "When a customer has a budget of ₹1000, quickly find two products that together equal exactly ₹1000 for bundle deals.",
                icon: "🛒"
            },
            {
                title: "Financial Apps: Transaction Matching",
                description: "In accounting software, find two transactions that sum to a specific amount for reconciliation.",
                icon: "💰"
            },
            {
                title: "Gaming: Resource Combination",
                description: "In a game, find two items whose power levels combine to unlock a specific ability or level.",
                icon: "🎮"
            },
            {
                title: "Social Networks: Mutual Connections",
                description: "Find pairs of users whose combined friend count reaches a threshold for group recommendations.",
                icon: "👥"
            }
        ],
        interviewTips: [
            "Always clarify: Can numbers be negative? Can the same element be used twice?",
            "Start with brute force O(n²), then optimize to O(n) using HashMap",
            "Discuss the space-time trade-off explicitly - interviewers love this!",
            "Handle edge cases: empty array, no solution found, duplicate numbers"
        ]
    };

    for (const task of tasks) {
        await db.dailyTask.update({
            where: { id: task.id },
            data: {
                content: richContent
            }
        });
        console.log(`Updated task: ${task.id}`);
    }

    console.log("✅ Successfully updated Two Sum content.");
}

fixTwoSumContent()
    .catch(console.error)
    .finally(() => process.exit());
