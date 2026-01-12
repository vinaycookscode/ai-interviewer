"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    name?: string;
    resumeUrl?: string;
    resumeName?: string;
    panUrl?: string;
    panName?: string;
    aadhaarUrl?: string;
    aadhaarName?: string;
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
                panUrl: data.panUrl,
                panName: data.panName,
                aadhaarUrl: data.aadhaarUrl,
                aadhaarName: data.aadhaarName,
            },
        });

        revalidatePath("/candidate/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { error: "Failed to update profile" };
    }
}

export async function updateCandidateProfile(data: {
    primaryRole?: string;
    experienceLevel?: string;
    skills?: string[];
    targetCompanies?: string[];
    careerGoals?: string;
    onboardingComplete?: boolean;
}) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.candidateProfile.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...data,
            },
            update: {
                ...data,
            },
        });

        revalidatePath("/candidate/profile");
        revalidatePath("/candidate/dashboard");
        return { success: "Career profile updated" };
    } catch (error) {
        console.error("Error updating career profile:", error);
        return { error: "Failed to update career profile" };
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
            panUrl: true,
            panName: true,
            aadhaarUrl: true,
            aadhaarName: true,
            candidateProfile: true,
        },
    });

    return user;
}
