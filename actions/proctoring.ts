"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PROCTORING_EVENT_TYPES } from "@/lib/integrity/verdict";

export const logProctoringEvent = async (
    interviewId: string,
    type: string,
    details?: string
) => {
    const session = await auth();
    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    // A public endpoint: only the event types the interview page sends, with short details
    if (!(PROCTORING_EVENT_TYPES as readonly string[]).includes(type)) {
        return { error: "Unknown event" };
    }

    try {
        // Verify interview ownership
        const interview = await db.interview.findUnique({
            where: { id: interviewId },
            select: { candidateId: true, status: true },
        });

        if (!interview) {
            return { error: "Interview not found" };
        }

        if (interview.candidateId !== session.user.id) {
            return { error: "Unauthorized access to interview" };
        }

        // Nothing is recorded once the interview is over
        if (interview.status === "COMPLETED") {
            return { error: "Interview finished" };
        }

        await db.proctoringEvent.create({
            data: {
                interviewId,
                type,
                details: details?.slice(0, 200),
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to log proctoring event:", error);
        return { error: "Failed to log event" };
    }
};
