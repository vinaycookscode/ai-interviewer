"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export const logProctoringEvent = async (
    interviewId: string,
    type: string,
    details?: string
) => {
    const session = await auth();
    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    try {
        // Verify interview ownership
        const interview = await db.interview.findUnique({
            where: { id: interviewId },
        });

        if (!interview) {
            return { error: "Interview not found" };
        }

        if (interview.candidateId !== session.user.id) {
            return { error: "Unauthorized access to interview" };
        }

        await db.proctoringEvent.create({
            data: {
                interviewId,
                type,
                details,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log proctoring event:", error);
        return { error: "Failed to log event" };
    }
};
