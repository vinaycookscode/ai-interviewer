"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleUserFeature(userId: string, featureKey: string, isEnabled: boolean) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { features: true }
        });

        if (!user) return { error: "User not found" };

        let features = user.features as Record<string, boolean> || {};

        // Handle if it's a string
        if (typeof features === 'string') {
            try {
                features = JSON.parse(features);
            } catch (e) {
                features = {};
            }
        }

        // Update the specific feature
        features[featureKey] = isEnabled;

        await db.user.update({
            where: { id: userId },
            data: { features }
        });

        revalidatePath("/admin/features");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle feature:", error);
        return { error: "Failed to update feature" };
    }
}

export async function getAllUsersWithFeatures() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return [];
    }

    return await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            features: true,
        }
    });
}
