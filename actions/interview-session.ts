"use server";

import { db } from "@/lib/db";
import { InterviewStatus } from "@prisma/client";

export async function startInterview(interviewId: string) {
    try {
        await db.interview.update({
            where: { id: interviewId },
            data: { status: "IN_PROGRESS" },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to start interview:", error);
        return { success: false, error: "Failed to start interview" };
    }
}

export async function submitAnswer(data: {
    interviewId: string;
    questionId: string;
    transcript: string;
    audioUrl?: string;
    videoUrl?: string;
}) {
    try {
        const answer = await db.answer.create({
            data: {
                interviewId: data.interviewId,
                questionId: data.questionId,
                transcript: data.transcript,
                audioUrl: data.audioUrl,
                videoUrl: data.videoUrl,
            },
        });
        return { success: true, answerId: answer.id };
    } catch (error) {
        console.error("Failed to submit answer:", error);
        return { success: false, error: "Failed to submit answer" };
    }
}

export async function completeInterview(interviewId: string) {
    try {
        await db.interview.update({
            where: { id: interviewId },
            data: { status: "COMPLETED" },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to complete interview:", error);
        return { success: false, error: "Failed to complete interview" };
    }
}
