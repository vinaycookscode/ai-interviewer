"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getPlatformStats() {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalJobs, totalInterviews, dailyStats] = await Promise.all([
        db.user.count(),
        db.job.count(),
        db.interview.count(),
        db.dailyStat.findUnique({
            where: { date: today },
        }),
    ]);

    // Get recent user growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await db.user.count({
        where: {
            createdAt: {
                gte: thirtyDaysAgo,
            },
        },
    });

    return {
        totalUsers,
        totalJobs,
        totalInterviews,
        recentUsers,
        visitorsToday: dailyStats?.visitors || 0,
        viewsToday: dailyStats?.views || 0,
    };
}

export async function getUsers(page = 1, limit = 10, search = "") {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    const where = search
        ? {
            OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        jobs: true,
                        interviews: true
                    }
                }
            },
        }),
        db.user.count({ where }),
    ]);

    return {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
}

export async function deleteUser(userId: string) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    try {
        await db.user.delete({
            where: { id: userId }
        });
        revalidatePath("/admin/users");
        return { success: "User deleted" };
    } catch (error) {
        return { error: "Failed to delete user" };
    }
}
