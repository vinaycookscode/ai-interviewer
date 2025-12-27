"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createJob(data: {
    title: string;
    description: string;
    questions?: { text: string, type: "TEXT" | "CODE" }[];
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
                create: data.questions.map((q) => ({ text: q.text, type: q.type })),
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
    questions?: { id?: string, text: string, type: "TEXT" | "CODE" }[];
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

    // Categorize questions
    const questionsToCreate = data.questions?.filter(q => !q.id) || [];
    const questionsToUpdate = data.questions?.filter(q => q.id) || [];
    const submittedIds = questionsToUpdate.map(q => q.id as string);

    // 1. Delete removed questions (only if no answers)
    // We do this in a separate transaction or call because nested deleteMany 
    // does not allow filtering by relation existence (answers: none).
    // 1. Identify questions to delete
    const questionsToDeleteDetails = await db.question.findMany({
        where: {
            jobId: jobId,
            id: { notIn: submittedIds }
        },
        select: { id: true }
    });

    const idsToDelete = questionsToDeleteDetails.map(q => q.id);

    if (idsToDelete.length > 0) {
        // Delete associated answers first (manual cascade)
        await db.answer.deleteMany({
            where: {
                questionId: { in: idsToDelete }
            }
        });

        // Now safe to delete the questions
        await db.question.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });
    }

    // 2. Update existing questions and create new ones
    // Note: We don't include deleteMany here anymore.
    await db.job.update({
        where: { id: jobId },
        data: {
            title: data.title,
            description: data.description,
            requireResume: data.requireResume,
            requireAadhar: data.requireAadhar,
            requirePAN: data.requirePAN,
            questions: {
                // Update existing questions
                update: questionsToUpdate.map(q => ({
                    where: { id: q.id },
                    data: { text: q.text, type: q.type }
                })),
                // Create new questions
                create: questionsToCreate.map(q => ({
                    text: q.text,
                    type: q.type
                }))
            },
        },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/jobs/${jobId}`);
}
