"use server";

import { db } from "@/lib/db";

// ============================================
// COMPANY QUERIES
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
