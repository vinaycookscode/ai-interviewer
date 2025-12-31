'use server';

import { db } from "@/lib/db";
import { FEATURES } from "@/lib/features";
import { revalidatePath } from "next/cache";

export async function getFeatureFlags() {
    return await db.featureFlag.findMany({
        orderBy: { key: 'asc' }
    });
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
    // In a real app, add auth check here to ensure user is ADMIN
    // const session = await auth();
    // if (session?.user?.role !== 'ADMIN') throw new Error("Unauthorized");

    await db.featureFlag.upsert({
        where: { key },
        update: { enabled },
        create: {
            key,
            enabled,
            category: 'SYSTEM', // Default, should be seeded properly
        }
    });

    revalidatePath('/', 'layout'); // Revalidate all layouts from root
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/candidate', 'layout');
    revalidatePath('/admin', 'layout');
}

export async function checkFeature(key: string): Promise<boolean> {
    const flag = await db.featureFlag.findUnique({
        where: { key }
    });
    // Default to true if not found (fail open) vs fail closed?
    // Plan said Assume ENABLED.
    return flag ? flag.enabled : true;
}

export async function getLatestFlagUpdate(): Promise<number> {
    const lastUpdated = await db.featureFlag.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
    });
    return lastUpdated?.updatedAt.getTime() || 0;
}

export async function seedFeatureFlags() {
    const defaults = [
        { key: FEATURES.RESUME_SCREENER, category: 'CANDIDATE', description: "Upload and analyze resumes" },
        { key: FEATURES.PRACTICE_INTERVIEWS, category: 'CANDIDATE', description: "Mock interview practice area" },
        { key: FEATURES.JOB_MANAGEMENT, category: 'EMPLOYER', description: "Create and manage job postings" },
        { key: FEATURES.CANDIDATE_SEARCH, category: 'EMPLOYER', description: "Search and view candidate profiles" },
        { key: FEATURES.ANALYTICS, category: 'EMPLOYER', description: "View dashboard analytics" },
        { key: FEATURES.MODEL_SELECTION, category: 'SYSTEM', description: "Allow users to switch AI models" },
        // Keep existing legacy ones valid too if needed, but we focus on these
        { key: FEATURES.MULTILINGUAL_SUPPORT, category: 'SYSTEM', description: "Support multiple languages" },
        { key: FEATURES.MOBILE_ACCESS, category: 'SYSTEM', description: "Enable mobile-optimized views" },
    ];

    for (const feat of defaults) {
        await db.featureFlag.upsert({
            where: { key: feat.key },
            update: {
                category: feat.category,
                description: feat.description
            },
            create: {
                key: feat.key,
                enabled: true,
                category: feat.category,
                description: feat.description
            }
        });
    }
}
