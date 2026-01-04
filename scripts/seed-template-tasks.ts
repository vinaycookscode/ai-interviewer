import 'dotenv/config';
import { db } from "../lib/db";
import { CURRICULUM } from "../lib/curriculum-config";

async function seedTemplateTasks() {
    console.log("🌱 Creating template tasks for missing days...\n");

    const program = await db.placementProgram.findFirst({
        where: { name: "90-Day Placement Bootcamp" }
    });

    if (!program) {
        console.log("❌ Program not found");
        return;
    }

    // Get modules without tasks
    const modules = await db.programModule.findMany({
        where: {
            programId: program.id,
            tasks: { none: {} }
        },
        orderBy: { dayNumber: 'asc' }
    });

    console.log(`✅ Found ${modules.length} modules without tasks\n`);

    let createdCount = 0;

    for (const module of modules) {
        const curriculum = CURRICULUM.find(c => c.dayNumber === module.dayNumber);
        if (!curriculum) continue;

        console.log(`📝 Creating tasks for Day ${module.dayNumber}: ${module.title}`);

        // 1. READING Task (Educational Content)
        const learnTask = await db.dailyTask.create({
            data: {
                moduleId: module.id,
                title: `${curriculum.subtopic}: Core Concepts`,
                type: 'READING',
                duration: 20,
                order: 1,
                content: {
                    concept: `# Understanding ${curriculum.conceptTitle}\n\nThis lesson covers the fundamental concepts of ${curriculum.subtopic} in the context of ${curriculum.topic}.\n\n## Key Points\n\n- Understanding the core principles\n- Learning when to apply this pattern\n- Recognizing common use cases\n- Analyzing time and space complexity\n\n## Why This Matters\n\nThis concept is frequently tested in coding interviews and appears in real-world software development.`,
                    keyTakeaways: [
                        `Master the core algorithm for ${curriculum.subtopic}`,
                        `Understand the time complexity implications`,
                        `Practice identifying when to use this pattern`,
                        `Learn common edge cases and optimizations`
                    ]
                }
            }
        });

        // 2. PROBLEM Task 1 (Easy/Medium)
        const problem1 = await db.dailyTask.create({
            data: {
                moduleId: module.id,
                title: `${curriculum.subtopic} - Practice Problem`,
                type: 'PROBLEM',
                duration: 30,
                order: 2,
                content: {
                    problemStatement: `Solve a ${curriculum.difficulty} level problem involving ${curriculum.subtopic}.\n\nImplement a solution that demonstrates understanding of ${curriculum.conceptTitle}.`,
                    difficulty: curriculum.difficulty,
                    hints: [
                        `Consider using ${curriculum.topic} data structures`,
                        `Think about edge cases`,
                        `Optimize for time complexity`
                    ],
                    starterCode: {
                        python: `def solve(input):\n    # Write your solution here\n    pass`,
                        javascript: `function solve(input) {\n    // Write your solution here\n}`,
                        java: `public class Solution {\n    public void solve(Object input) {\n        // Write your solution here\n    }\n}`
                    },
                    testCases: [
                        { input: "sample input", expected: "sample output", explanation: "Basic test case" }
                    ]
                }
            }
        });

        // 3. PROBLEM Task 2 (Medium/Hard)
        const problem2 = await db.dailyTask.create({
            data: {
                moduleId: module.id,
                title: `Advanced ${curriculum.subtopic} Challenge`,
                type: 'PROBLEM',
                duration: 45,
                order: 3,
                content: {
                    problemStatement: `Apply ${curriculum.conceptTitle} to solve a more complex challenge.\n\nThis problem requires deeper understanding and optimization.`,
                    difficulty: curriculum.difficulty === 'beginner' ? 'intermediate' : 'advanced',
                    hints: [
                        `Break down the problem into smaller steps`,
                        `Consider multiple approaches`,
                        `Optimize your initial solution`
                    ],
                    starterCode: {
                        python: `def solve_advanced(input):\n    # Write your optimized solution here\n    pass`,
                        javascript: `function solveAdvanced(input) {\n    // Write your optimized solution here\n}`,
                        java: `public class Solution {\n    public void solveAdvanced(Object input) {\n        // Write your optimized solution here\n    }\n}`
                    },
                    testCases: [
                        { input: "complex input", expected: "complex output", explanation: "Advanced test case" }
                    ]
                }
            }
        });

        // 4. QUIZ Task
        const quiz = await db.dailyTask.create({
            data: {
                moduleId: module.id,
                title: `${curriculum.subtopic} Knowledge Check`,
                type: 'QUIZ',
                duration: 10,
                order: 4,
                content: {
                    questions: [
                        {
                            question: `What is the primary use case for ${curriculum.subtopic}?`,
                            options: [
                                "Optimizing time complexity",
                                "Managing memory efficiently",
                                "Handling edge cases",
                                "All of the above"
                            ],
                            correctAnswer: 3,
                            explanation: `${curriculum.subtopic} helps with multiple aspects of problem solving.`
                        },
                        {
                            question: `What is the time complexity of the typical ${curriculum.subtopic} approach?`,
                            options: [
                                "O(1)",
                                "O(log n)",
                                "O(n)",
                                "O(n²)"
                            ],
                            correctAnswer: 2,
                            explanation: "This depends on the specific implementation."
                        },
                        {
                            question: `When should you consider using ${curriculum.conceptTitle}?`,
                            options: [
                                "When working with sorted data",
                                "When optimizing search operations",
                                "When dealing with specific patterns",
                                "Depends on the problem context"
                            ],
                            correctAnswer: 3,
                            explanation: "The applicability depends on the specific problem requirements."
                        }
                    ]
                }
            }
        });

        createdCount += 4;
        console.log(`   ✅ Created 4 tasks (LEARN, PROBLEM x2, QUIZ)`);
    }

    console.log(`\n\n🎉 Successfully created ${createdCount} tasks for ${modules.length} days!`);
    await db.$disconnect();
}

seedTemplateTasks().catch(console.error);
