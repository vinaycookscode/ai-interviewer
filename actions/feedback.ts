"use server";

import { db } from "@/lib/db";

export async function getInterviewFeedback(interviewId: string) {
    try {
        const interview = await db.interview.findUnique({
            where: { id: interviewId },
            include: {
                job: true,
                candidate: true,
                answers: {
                    include: {
                        question: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!interview) {
            throw new Error("Interview not found");
        }

        // Calculate average score if not present
        let averageScore = interview.score;
        if (!averageScore && interview.answers.length > 0) {
            const scoredAnswers = interview.answers.filter((a) => a.score !== null);
            if (scoredAnswers.length > 0) {
                const totalScore = scoredAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);
                averageScore = totalScore / scoredAnswers.length;

                // Update interview with calculated score
                await db.interview.update({
                    where: { id: interviewId },
                    data: { score: averageScore }
                });
            }
        }

        return { success: true, interview, averageScore };
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return { success: false, error: "Failed to fetch feedback" };
    }
}
