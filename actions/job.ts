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

    // Soft-Delete Logic:
    // 1. Fetch current active questions
    const currentQuestions = await db.question.findMany({
        where: { jobId: jobId, archived: false },
    });

    const newQuestionTexts = data.questions || [];

    // 2. Identify questions to Archive (in DB but not in new list)
    // We match by TEXT because that's what we have.
    const questionsToArchive = currentQuestions.filter(
        (q) => !newQuestionTexts.includes(q.text)
    );

    // 3. Identify questions to Create (in new list but not in DB)
    const questionsToCreate = newQuestionTexts.filter(
        (text) => !currentQuestions.some((q) => q.text === text)
    );

    // Execute Archival
    if (questionsToArchive.length > 0) {
        await db.question.updateMany({
            where: {
                id: { in: questionsToArchive.map((q) => q.id) },
            },
            data: { archived: true },
        });
    }

    // Execute Creation (and Job Update)
    await db.job.update({
        where: { id: jobId },
        data: {
            title: data.title,
            description: data.description,
            requireResume: data.requireResume,
            requireAadhar: data.requireAadhar,
            requirePAN: data.requirePAN,
            questions: {
                create: questionsToCreate.map((text) => ({ text })),
            },
        },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/jobs/${jobId}`);
}
