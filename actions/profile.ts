"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { userRepository } from "@/lib/repositories/user.repository";
import { handleError } from "@/lib/error-handler";

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

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await userRepository.update(session.user.id, {
            name: data.name,
            resumeUrl: data.resumeUrl,
            resumeName: data.resumeName,
            panUrl: data.panUrl,
            panName: data.panName,
            aadhaarUrl: data.aadhaarUrl,
            aadhaarName: data.aadhaarName,
        });

        revalidatePath("/candidate/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        handleError(error, "updateProfile");
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

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await userRepository.upsertCandidateProfile(session.user.id, data);

        revalidatePath("/candidate/profile");
        revalidatePath("/candidate/dashboard");
        return { success: "Career profile updated" };
    } catch (error) {
        handleError(error, "updateCandidateProfile");
        return { error: "Failed to update career profile" };
    }
}

export async function getUserProfile() {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    try {
        return await userRepository.findById(session.user.id);
    } catch (error) {
        handleError(error, "getUserProfile");
        return null;
    }
}
