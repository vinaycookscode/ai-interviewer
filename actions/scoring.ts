"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { gradeAnswerById } from "@/lib/grading";

export async function gradeAnswer(answerId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const answer = await db.answer.findUnique({
        where: { id: answerId },
        select: { interview: { select: { candidateId: true } } },
    });
    if (answer?.interview.candidateId !== session.user.id) {
        return { success: false, error: "Answer not found" };
    }

    return gradeAnswerById(answerId);
}
