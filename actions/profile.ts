"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/lib/db";
import { deleteReplacedFile } from "@/lib/replaced-file";
import { userRepository } from "@/lib/repositories/user.repository";
import { handleError } from "@/lib/error-handler";
import { GOAL_LIMIT, SKILL_LENGTH, SKILL_LIMIT } from "@/lib/career-path";
import { ownFileUrl } from "@/lib/storage-key";

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

    // A document URL must be a file this user uploaded to their own folder in our bucket (AIIN-216)
    const own = (url: string | undefined) => (url === undefined ? undefined : ownFileUrl(url, process.env.R2_PUBLIC_URL, session.user!.id!));
    const urls = { resumeUrl: own(data.resumeUrl), panUrl: own(data.panUrl), aadhaarUrl: own(data.aadhaarUrl) };
    if ((["resumeUrl", "panUrl", "aadhaarUrl"] as const).some((k) => data[k] !== undefined && !urls[k])) {
        return { error: "That file isn't yours to attach." };
    }

    try {
        const userId = session.user.id;
        const before = await db.user.findUnique({ where: { id: userId }, select: { resumeUrl: true, panUrl: true, aadhaarUrl: true } });
        await userRepository.update(userId, {
            name: data.name,
            resumeUrl: urls.resumeUrl,
            resumeName: data.resumeName,
            panUrl: urls.panUrl,
            panName: data.panName,
            aadhaarUrl: urls.aadhaarUrl,
            aadhaarName: data.aadhaarName,
        });

        // The file each new upload replaced is deleted once the response is sent (AIIN-224)
        after(() =>
            Promise.all(
                (["resumeUrl", "panUrl", "aadhaarUrl"] as const).map((k) => (urls[k] ? deleteReplacedFile(before?.[k], urls[k], userId) : undefined))
            )
        );

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

    // Free text from the client: hold it to what the career path set-up allows (AIIN-52)
    const skills = data.skills?.map((s) => s.trim()).filter(Boolean);
    if (
        (skills && (skills.length > SKILL_LIMIT || skills.some((s) => s.length > SKILL_LENGTH))) ||
        (data.careerGoals && data.careerGoals.length > GOAL_LIMIT) ||
        (data.primaryRole && data.primaryRole.length > 100)
    ) {
        return { error: "Too long" };
    }

    try {
        await userRepository.upsertCandidateProfile(session.user.id, { ...data, skills });

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
