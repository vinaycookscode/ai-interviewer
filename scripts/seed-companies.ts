/**
 * Seed Companies and Questions into Database
 * 
 * Usage: npx tsx scripts/seed-companies.ts
 */

import 'dotenv/config';
import { db } from "../lib/db";
import { COMPANIES, type CompanyConfig } from "../lib/company-data";

// Sample questions for each company type
const CODING_QUESTIONS = [
    {
        question: "Reverse a linked list",
        difficulty: "EASY",
        frequency: 9,
        tags: ["Linked List", "Pointers"],
        answer: "Use three pointers (prev, current, next) to reverse links one by one.",
        tips: "Draw it out! Trace through with 3 nodes first.",
        starterCode: "function reverseList(head) {\n  // Your code here\n}",
        solutionCode: "function reverseList(head) {\n  let prev = null;\n  let current = head;\n  while (current) {\n    let next = current.next;\n    current.next = prev;\n    prev = current;\n    current = next;\n  }\n  return prev;\n}",
        testCases: JSON.stringify([
            { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" },
            { input: "[1,2]", expected: "[2,1]" },
            { input: "[]", expected: "[]" }
        ]),
        language: "javascript"
    },
    {
        question: "Two Sum - Find two numbers that add up to target",
        difficulty: "EASY",
        frequency: 10,
        tags: ["Array", "HashMap"],
        answer: "Use a HashMap to store complements as you iterate.",
        tips: "Think about what you're looking for: target - current",
        starterCode: "function twoSum(nums, target) {\n  // Your code here\n}",
        solutionCode: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}",
        testCases: JSON.stringify([
            { input: "[2,7,11,15], 9", expected: "[0,1]" },
            { input: "[3,2,4], 6", expected: "[1,2]" },
            { input: "[3,3], 6", expected: "[0,1]" }
        ]),
        language: "javascript"
    },
    {
        question: "Find the longest common prefix among an array of strings",
        difficulty: "EASY",
        frequency: 7,
        tags: ["String", "Array"],
        answer: "Compare characters at each position across all strings.",
        tips: "Start with the first string as the prefix and keep trimming.",
        starterCode: "function longestCommonPrefix(strs) {\n  // Your code here\n}",
        solutionCode: "function longestCommonPrefix(strs) {\n  if (!strs.length) return '';\n  let prefix = strs[0];\n  for (let i = 1; i < strs.length; i++) {\n    while (strs[i].indexOf(prefix) !== 0) {\n      prefix = prefix.slice(0, -1);\n      if (!prefix) return '';\n    }\n  }\n  return prefix;\n}",
        testCases: JSON.stringify([
            { input: '["flower","flow","flight"]', expected: '"fl"' },
            { input: '["dog","racecar","car"]', expected: '""' }
        ]),
        language: "javascript"
    },
    {
        question: "Valid Parentheses - Check if brackets are balanced",
        difficulty: "EASY",
        frequency: 9,
        tags: ["Stack", "String"],
        answer: "Use a stack to match opening and closing brackets.",
        tips: "Push opening brackets, pop and compare for closing brackets.",
        starterCode: "function isValid(s) {\n  // Your code here\n}",
        solutionCode: "function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (let char of s) {\n    if (char in map) {\n      if (stack.pop() !== map[char]) return false;\n    } else {\n      stack.push(char);\n    }\n  }\n  return stack.length === 0;\n}",
        testCases: JSON.stringify([
            { input: '"()"', expected: 'true' },
            { input: '"()[]{}"', expected: 'true' },
            { input: '"(]"', expected: 'false' }
        ]),
        language: "javascript"
    },
    {
        question: "Maximum Subarray Sum (Kadane's Algorithm)",
        difficulty: "MEDIUM",
        frequency: 9,
        tags: ["Array", "Dynamic Programming"],
        answer: "Track current sum and max sum. Reset current if it goes negative.",
        tips: "Kadane's algorithm is the key - O(n) time, O(1) space.",
        starterCode: "function maxSubArray(nums) {\n  // Your code here\n}",
        solutionCode: "function maxSubArray(nums) {\n  let maxSum = nums[0];\n  let currentSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  return maxSum;\n}",
        testCases: JSON.stringify([
            { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6" },
            { input: "[1]", expected: "1" },
            { input: "[5,4,-1,7,8]", expected: "23" }
        ]),
        language: "javascript"
    },
    {
        question: "Merge Two Sorted Lists",
        difficulty: "EASY",
        frequency: 8,
        tags: ["Linked List", "Two Pointers"],
        answer: "Use a dummy node and compare values from both lists.",
        tips: "Create a dummy head to simplify the code.",
        starterCode: "function mergeTwoLists(l1, l2) {\n  // Your code here\n}",
        solutionCode: "function mergeTwoLists(l1, l2) {\n  const dummy = { next: null };\n  let current = dummy;\n  while (l1 && l2) {\n    if (l1.val <= l2.val) {\n      current.next = l1;\n      l1 = l1.next;\n    } else {\n      current.next = l2;\n      l2 = l2.next;\n    }\n    current = current.next;\n  }\n  current.next = l1 || l2;\n  return dummy.next;\n}",
        testCases: JSON.stringify([
            { input: "[1,2,4], [1,3,4]", expected: "[1,1,2,3,4,4]" }
        ]),
        language: "javascript"
    },
    {
        question: "Binary Search",
        difficulty: "EASY",
        frequency: 8,
        tags: ["Binary Search", "Array"],
        answer: "Divide and conquer - check mid and narrow down.",
        tips: "Be careful with integer overflow when calculating mid.",
        starterCode: "function binarySearch(nums, target) {\n  // Return index or -1\n}",
        solutionCode: "function binarySearch(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}",
        testCases: JSON.stringify([
            { input: "[-1,0,3,5,9,12], 9", expected: "4" },
            { input: "[-1,0,3,5,9,12], 2", expected: "-1" }
        ]),
        language: "javascript"
    },
    {
        question: "Find the first non-repeating character in a string",
        difficulty: "EASY",
        frequency: 8,
        tags: ["String", "HashMap"],
        answer: "Count frequencies first, then find first with count 1.",
        tips: "Two-pass solution is clean and efficient.",
        starterCode: "function firstUniqChar(s) {\n  // Return index or -1\n}",
        solutionCode: "function firstUniqChar(s) {\n  const freq = {};\n  for (let char of s) {\n    freq[char] = (freq[char] || 0) + 1;\n  }\n  for (let i = 0; i < s.length; i++) {\n    if (freq[s[i]] === 1) return i;\n  }\n  return -1;\n}",
        testCases: JSON.stringify([
            { input: '"leetcode"', expected: "0" },
            { input: '"loveleetcode"', expected: "2" },
            { input: '"aabb"', expected: "-1" }
        ]),
        language: "javascript"
    },
    {
        question: "Detect cycle in a linked list",
        difficulty: "MEDIUM",
        frequency: 8,
        tags: ["Linked List", "Two Pointers"],
        answer: "Use Floyd's Cycle Detection - slow and fast pointers.",
        tips: "If fast catches up to slow, there's a cycle.",
        starterCode: "function hasCycle(head) {\n  // Return true/false\n}",
        solutionCode: "function hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}",
        testCases: JSON.stringify([
            { input: "[3,2,0,-4], pos=1", expected: "true" },
            { input: "[1,2], pos=0", expected: "true" },
            { input: "[1], pos=-1", expected: "false" }
        ]),
        language: "javascript"
    },
    {
        question: "Implement LRU Cache",
        difficulty: "HARD",
        frequency: 9,
        tags: ["Design", "HashMap", "Linked List"],
        answer: "Use HashMap + Doubly Linked List for O(1) operations.",
        tips: "Move to head on access, remove from tail when full.",
        starterCode: "class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}",
        solutionCode: "class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      this.cache.delete(this.cache.keys().next().value);\n    }\n  }\n}",
        testCases: JSON.stringify([
            { input: "LRUCache(2), put(1,1), put(2,2), get(1)", expected: "1" }
        ]),
        language: "javascript"
    }
];

const APTITUDE_QUESTIONS = [
    {
        question: "A train 360m long is running at 72km/hr. In what time will it pass a bridge 140m long?",
        difficulty: "MEDIUM",
        frequency: 7,
        tags: ["Time Distance Speed"],
        answer: "25 seconds. Total distance = 360 + 140 = 500m. Speed = 72 kmph = 20 m/s. Time = 500/20 = 25s",
        tips: "Convert speed to m/s by multiplying by 5/18. Add train length and bridge length."
    },
    {
        question: "If 8 men can do a work in 12 days, in how many days can 6 men do the same work?",
        difficulty: "EASY",
        frequency: 8,
        tags: ["Work Time"],
        answer: "16 days. Using M1*D1 = M2*D2: 8*12 = 6*D2, so D2 = 16 days",
        tips: "More men = less days (inverse proportion). Use M1D1 = M2D2."
    },
    {
        question: "A shopkeeper sells an article at 20% profit. If he had bought it at 10% less and sold it for Rs.18 less, he would have gained 25%. Find the cost price.",
        difficulty: "HARD",
        frequency: 6,
        tags: ["Profit Loss"],
        answer: "Rs. 200. Let CP = x. SP = 1.2x. New CP = 0.9x, New SP = 1.2x - 18 = 1.25 * 0.9x. Solve to get x = 200.",
        tips: "Set up equations carefully. New SP = New CP * 1.25"
    },
    {
        question: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        difficulty: "EASY",
        frequency: 8,
        tags: ["Number Series"],
        answer: "42. Pattern: differences are 4, 6, 8, 10, 12. So 30 + 12 = 42",
        tips: "Look at differences between consecutive terms first."
    },
    {
        question: "A can complete a job in 10 days and B in 15 days. They start together but after 3 days A leaves. How many more days will B take?",
        difficulty: "MEDIUM",
        frequency: 7,
        tags: ["Work Time"],
        answer: "7.5 days. In 3 days, together they do 3(1/10 + 1/15) = 1/2 work. Remaining 1/2 by B = (1/2) * 15 = 7.5 days",
        tips: "Calculate work done in 3 days first, then find remaining."
    }
];

const HR_QUESTIONS = [
    {
        question: "Tell me about yourself",
        difficulty: "EASY",
        frequency: 10,
        tags: ["Introduction"],
        answer: "Structure: Education -> Skills -> Projects/Internships -> Why this role. Keep it 2-3 minutes.",
        tips: "Prepare a crisp 60-90 second intro. Practice until it's natural."
    },
    {
        question: "Why do you want to join our company?",
        difficulty: "EASY",
        frequency: 10,
        tags: ["Company Research"],
        answer: "Research the company's values, recent news, products. Connect your skills and interests to their mission.",
        tips: "Never give generic answers. Show you've done your homework."
    },
    {
        question: "What are your strengths and weaknesses?",
        difficulty: "MEDIUM",
        frequency: 9,
        tags: ["Self-Awareness"],
        answer: "Strengths: Be specific with examples. Weakness: Pick a real one and show how you're improving.",
        tips: "Don't say 'I'm a perfectionist' or 'I work too hard'. Be genuine."
    },
    {
        question: "Where do you see yourself in 5 years?",
        difficulty: "MEDIUM",
        frequency: 8,
        tags: ["Career Goals"],
        answer: "Show ambition but be realistic. Align with company's growth opportunities.",
        tips: "Show you want to grow with the company, not just use them as stepping stone."
    },
    {
        question: "Describe a challenging situation and how you handled it",
        difficulty: "MEDIUM",
        frequency: 9,
        tags: ["Behavioral", "STAR"],
        answer: "Use STAR format: Situation, Task, Action, Result. Pick a real example.",
        tips: "Prepare 3-4 STAR stories covering different scenarios."
    }
];

const GD_TOPICS = [
    {
        question: "Impact of AI on Employment",
        difficulty: "MEDIUM",
        frequency: 8,
        tags: ["Technology", "Current Affairs"],
        answer: "Key points: Job displacement vs job creation, need for upskilling, new roles emerging, ethical considerations.",
        tips: "Take a balanced view. Acknowledge both pros and cons."
    },
    {
        question: "Work from Home vs Work from Office",
        difficulty: "EASY",
        frequency: 9,
        tags: ["Workplace"],
        answer: "Discuss productivity, collaboration, mental health, cost savings, hybrid model benefits.",
        tips: "There's no right answer. Present structured arguments."
    },
    {
        question: "Should social media be regulated?",
        difficulty: "MEDIUM",
        frequency: 7,
        tags: ["Technology", "Society"],
        answer: "Consider free speech, misinformation, privacy, mental health. Compare global models.",
        tips: "Use examples from different countries. Stay factual."
    }
];

async function seedCompanies() {
    console.log("🚀 Starting Company Prep Seeding...\n");
    console.log(`📊 Found ${COMPANIES.length} companies to seed\n`);

    let companiesCreated = 0;
    let questionsCreated = 0;

    for (const company of COMPANIES) {
        try {
            process.stdout.write(`  ${company.company}... `);

            // Upsert company
            const kit = await db.companyPrepKit.upsert({
                where: { slug: company.slug },
                create: {
                    company: company.company,
                    slug: company.slug,
                    description: company.description,
                    difficulty: company.difficulty,
                    rounds: company.rounds as any,
                    salaryRange: company.salaryRange as any,
                    content: company.content as any
                },
                update: {
                    description: company.description,
                    difficulty: company.difficulty,
                    rounds: company.rounds as any,
                    salaryRange: company.salaryRange as any,
                    content: company.content as any
                }
            });

            companiesCreated++;

            // Check if questions already exist
            const existingQuestions = await db.companyQuestion.count({
                where: { kitId: kit.id }
            });

            if (existingQuestions === 0) {
                // Add sample questions based on company difficulty
                const numCoding = company.difficulty === "HARD" ? 5 : company.difficulty === "MEDIUM" ? 3 : 2;
                const numAptitude = company.category.includes("Services") || company.category.includes("Consulting") ? 3 : 1;
                const numHR = 3;
                const numGD = company.category.includes("Consulting") ? 2 : 0;

                // Add coding questions
                for (let i = 0; i < numCoding && i < CODING_QUESTIONS.length; i++) {
                    const q = CODING_QUESTIONS[i];
                    await db.companyQuestion.create({
                        data: {
                            kitId: kit.id,
                            question: q.question,
                            type: "CODING",
                            difficulty: q.difficulty,
                            frequency: q.frequency,
                            tags: q.tags,
                            answer: q.answer,
                            tips: q.tips,
                            starterCode: q.starterCode,
                            solutionCode: q.solutionCode,
                            testCases: JSON.parse(q.testCases!) as any,
                            language: q.language
                        }
                    });
                    questionsCreated++;
                }

                // Add aptitude questions
                for (let i = 0; i < numAptitude && i < APTITUDE_QUESTIONS.length; i++) {
                    const q = APTITUDE_QUESTIONS[i];
                    await db.companyQuestion.create({
                        data: {
                            kitId: kit.id,
                            question: q.question,
                            type: "APTITUDE",
                            difficulty: q.difficulty,
                            frequency: q.frequency,
                            tags: q.tags,
                            answer: q.answer,
                            tips: q.tips
                        }
                    });
                    questionsCreated++;
                }

                // Add HR questions
                for (let i = 0; i < numHR && i < HR_QUESTIONS.length; i++) {
                    const q = HR_QUESTIONS[i];
                    await db.companyQuestion.create({
                        data: {
                            kitId: kit.id,
                            question: q.question,
                            type: "HR",
                            difficulty: q.difficulty,
                            frequency: q.frequency,
                            tags: q.tags,
                            answer: q.answer,
                            tips: q.tips
                        }
                    });
                    questionsCreated++;
                }

                // Add GD topics
                for (let i = 0; i < numGD && i < GD_TOPICS.length; i++) {
                    const q = GD_TOPICS[i];
                    await db.companyQuestion.create({
                        data: {
                            kitId: kit.id,
                            question: q.question,
                            type: "GD",
                            difficulty: q.difficulty,
                            frequency: q.frequency,
                            tags: q.tags,
                            answer: q.answer,
                            tips: q.tips
                        }
                    });
                    questionsCreated++;
                }
            }

            console.log("✅");
        } catch (error: any) {
            console.log("❌");
            console.error(`    Error: ${error.message}`);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Companies seeded: ${companiesCreated}`);
    console.log(`✅ Questions created: ${questionsCreated}`);
    console.log("=".repeat(50));
}

// Run
seedCompanies()
    .catch(console.error)
    .finally(() => process.exit());
