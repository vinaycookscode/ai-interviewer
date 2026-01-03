'use server';

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitUserFeedback(content: string, page?: string, category: string = 'GENERAL') {
    const session = await auth();

    if (!content || content.trim().length === 0) {
        return { error: "Feedback content is required" };
    }

    try {
        await db.feedback.create({
            data: {
                userId: session?.user?.id || null,
                userEmail: session?.user?.email || null,
                userName: session?.user?.name || null,
                content: content.trim(),
                page: page || null,
                category,
            }
        });

        return { success: "Thank you for your feedback!" };
    } catch {
        return { error: "Failed to submit feedback. Please try again." };
    }
}

export async function getUserFeedbackList(page = 1, limit = 20, status?: string) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const skip = (page - 1) * limit;

    const where = status && status !== 'ALL' ? { status } : {};

    const [feedback, total] = await Promise.all([
        db.feedback.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        db.feedback.count({ where }),
    ]);

    return {
        feedback,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
    };
}

export async function updateUserFeedbackStatus(id: string, status: string, adminNotes?: string) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    try {
        await db.feedback.update({
            where: { id },
            data: {
                status,
                adminNotes: adminNotes || undefined
            }
        });

        revalidatePath('/admin/feedback');
        return { success: "Feedback updated" };
    } catch {
        return { error: "Failed to update feedback" };
    }
}

export async function deleteUserFeedback(id: string) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        return { error: "Unauthorized" };
    }

    try {
        await db.feedback.delete({
            where: { id }
        });

        revalidatePath('/admin/feedback');
        return { success: "Feedback deleted" };
    } catch {
        return { error: "Failed to delete feedback" };
    }
}
