"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

// ============================================
// COMPANY QUERIES (Original functions)
// ============================================

export async function getAllCompanyKits() {
    return db.companyPrepKit.findMany({
        include: {
            _count: {
                select: { questions: true, resources: true }
            }
        },
        orderBy: { company: "asc" }
    });
}

export async function getCompanyKitBySlug(slug: string) {
    return db.companyPrepKit.findUnique({
        where: { slug },
        include: {
            questions: {
                orderBy: [
                    { frequency: "desc" },
                    { createdAt: "desc" }
                ]
            },
            resources: {
                orderBy: { createdAt: "desc" }
            }
        }
    });
}

export async function getCompanyQuestions(
    kitId: string,
    filters?: {
        type?: string;
        difficulty?: string;
        search?: string;
    }
) {
    const where: any = { kitId };

    if (filters?.type) {
        where.type = filters.type;
    }
    if (filters?.difficulty) {
        where.difficulty = filters.difficulty;
    }
    if (filters?.search) {
        where.question = {
            contains: filters.search,
            mode: "insensitive"
        };
    }

    return db.companyQuestion.findMany({
        where,
        orderBy: [
            { frequency: "desc" },
            { createdAt: "desc" }
        ]
    });
}

// ============================================
// USER SOLUTION PERSISTENCE (New functions)
// ============================================

/**
 * Save user's solution after running tests
 */
export async function saveUserSolution(
    questionId: string,
    code: string,
    language: string,
    passedTests: number,
    totalTests: number
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" };
        }

        // Upsert the solution (update if exists, create if not)
        const solution = await db.userCompanySolution.upsert({
            where: {
                userId_questionId_language: {
                    userId: session.user.id,
                    questionId,
                    language
                }
            },
            update: {
                code,
                passedTests,
                totalTests,
                updatedAt: new Date()
            },
            create: {
                userId: session.user.id,
                questionId,
                code,
                language,
                passedTests,
                totalTests
            }
        });

        return { success: true, solution };
    } catch (error) {
        console.error("Error saving solution:", error);
        return { success: false, error: "Failed to save solution" };
    }
}

/**
 * Get user's previous solution for a question
 */
export async function getUserSolution(questionId: string, language: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, solution: null };
        }

        const solution = await db.userCompanySolution.findUnique({
            where: {
                userId_questionId_language: {
                    userId: session.user.id,
                    questionId,
                    language
                }
            }
        });

        return { success: true, solution };
    } catch (error) {
        console.error("Error fetching solution:", error);
        return { success: false, solution: null };
    }
}

/**
 * Get all solved questions for a user (for showing badges)
 */
export async function getUserSolvedQuestions(userId?: string) {
    try {
        const session = await auth();
        const targetUserId = userId || session?.user?.id;

        if (!targetUserId) {
            return { success: false, solutions: [] };
        }

        const solutions = await db.userCompanySolution.findMany({
            where: { userId: targetUserId },
            select: {
                questionId: true,
                language: true,
                passedTests: true,
                totalTests: true,
                updatedAt: true
            }
        });

        return { success: true, solutions };
    } catch (error) {
        console.error("Error fetching solved questions:", error);
        return { success: false, solutions: [] };
    }
}
