"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function deleteCandidateInterview(interviewId: string) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify ownership
        const interview = await db.interview.findUnique({
            where: { id: interviewId },
            include: { job: true },
        });

        if (!interview) {
            return { success: false, error: "Interview not found" };
        }

        // Check if the current user is the employer who created the job
        const job = await db.job.findUnique({
            where: { id: interview.jobId },
        });

        if (!job) {
            return { success: false, error: "Job not found" };
        }

        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (!user || job.employerId !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        // Delete the interview
        // Note: This will cascade delete answers if configured in schema, 
        // but Prisma default relation might need explicit delete if not cascade.
        // Let's assume we need to delete answers first or rely on cascade.
        // Checking schema... we didn't see onDelete: Cascade.
        // Let's delete answers manually to be safe.
        await db.answer.deleteMany({
            where: { interviewId: interviewId },
        });

        await db.interview.delete({
            where: { id: interviewId },
        });

        revalidatePath("/dashboard/candidates");
        revalidatePath(`/dashboard/jobs/${interview.jobId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to delete interview:", error);
        return { success: false, error: "Failed to delete candidate" };
    }
}
