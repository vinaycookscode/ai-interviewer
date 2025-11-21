"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createJob(data: {
    title: string;
    description: string;
    questions?: string[];
    requireResume?: boolean;
    requireAadhar?: boolean;
    requirePAN?: boolean;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Find or create user in database
    let user = await db.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        // Get user email from Clerk
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerkUser = await (await clerkClient()).users.getUser(userId);

        user = await db.user.create({
            data: {
                clerkId: userId,
                email: clerkUser.emailAddresses[0].emailAddress,
                role: "EMPLOYER",
            },
        });
    }

    // Create the job with questions and document requirements
    const job = await db.job.create({
        data: {
            title: data.title,
            description: data.description,
            employerId: user.id,
            requireResume: data.requireResume || false,
            requireAadhar: data.requireAadhar || false,
            requirePAN: data.requirePAN || false,
            questions: data.questions ? {
                create: data.questions.map((text) => ({ text })),
            } : undefined,
        },
    });

    revalidatePath("/dashboard");
    return job;
}

export async function deleteJob(jobId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const job = await db.job.findUnique({
        where: { id: jobId },
        include: { employer: true },
    });

    if (!job || job.employer.clerkId !== userId) {
        throw new Error("Unauthorized");
    }

    await db.job.delete({
        where: { id: jobId },
    });

    revalidatePath("/dashboard");
}

export async function updateJob(jobId: string, data: {
    title: string;
    description: string;
    questions?: string[];
    requireResume?: boolean;
    requireAadhar?: boolean;
    requirePAN?: boolean;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const job = await db.job.findUnique({
        where: { id: jobId },
        include: { employer: true },
    });

    if (!job || job.employer.clerkId !== userId) {
        throw new Error("Unauthorized");
    }

    // Update job
    // First, delete only questions that have no answers
    await db.question.deleteMany({
        where: {
            jobId: jobId,
            answers: {
                none: {}
            }
        }
    });

    // Then update the job details and add new questions
    await db.job.update({
        where: { id: jobId },
        data: {
            title: data.title,
            description: data.description,
            requireResume: data.requireResume,
            requireAadhar: data.requireAadhar,
            requirePAN: data.requirePAN,
            questions: {
                create: data.questions?.map((text) => ({ text })), // Create new ones (will append to existing used ones)
            },
        },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/jobs/${jobId}`);
}
