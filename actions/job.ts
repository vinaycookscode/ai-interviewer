"use server";

import { auth } from "@/auth";
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
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Verify user exists in database
    const user = await db.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new Error("User not found");
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
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const job = await db.job.findUnique({
        where: { id: jobId },
        include: { employer: true },
    });

    if (!job || job.employer.id !== userId) {
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
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Verify ownership
    const job = await db.job.findUnique({
        where: { id: jobId },
        include: { employer: true },
    });

    if (!job || job.employer.id !== userId) {
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
