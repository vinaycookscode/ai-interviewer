"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    name: string;
    resumeUrl?: string;
    resumeName?: string;
}) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                resumeUrl: data.resumeUrl,
                resumeName: data.resumeName,
            },
        });

        revalidatePath("/candidate/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { error: "Failed to update profile" };
    }
}

export async function getUserProfile() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            resumeUrl: true,
            resumeName: true,
        },
    });

    return user;
}
