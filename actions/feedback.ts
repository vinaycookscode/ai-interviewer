"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * An interview's report, for the people allowed to read it: the candidate, the employer
 * who owns the job, or an admin. Anyone else (or no session) gets "not found", so this
 * public endpoint can't be used to read or probe other interviews.
 */
export async function getInterviewFeedback(interviewId: string) {
    const session = await auth();
    const user = session?.user;
    if (!user?.id) return { success: false as const, error: "Interview not found" };

    try {
        const isAdmin = user.role === "ADMIN";
        const interview = await db.interview.findFirst({
            where: isAdmin
                ? { id: interviewId }
                : { id: interviewId, OR: [{ candidateId: user.id }, { job: { employerId: user.id } }] },
            // Only what the report shows: never the whole User row (it holds the password hash).
            select: {
                id: true,
                candidateId: true,
                createdAt: true,
                score: true,
                job: { select: { id: true, title: true, employerId: true } },
                candidate: { select: { name: true, email: true } },
                answers: {
                    select: { id: true, transcript: true, score: true, feedback: true, question: { select: { text: true } } },
                    orderBy: { createdAt: "asc" },
                },
                personalityProfile: {
                    select: {
                        communicationStyle: true,
                        confidenceScore: true,
                        technicalDepth: true,
                        strengths: true,
                        weaknesses: true,
                        cultureFitScore: true,
                        summary: true,
                    },
                },
            },
        });

        if (!interview) return { success: false as const, error: "Interview not found" };

        const viewer: "candidate" | "employer" = interview.candidateId === user.id ? "candidate" : "employer";

        // Calculate average score if not present
        let averageScore = interview.score;
        if (!averageScore && interview.answers.length > 0) {
            const scoredAnswers = interview.answers.filter((a) => a.score !== null);
            if (scoredAnswers.length > 0) {
                const totalScore = scoredAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);
                averageScore = totalScore / scoredAnswers.length;

                // Update interview with calculated score
                await db.interview.update({
                    where: { id: interview.id },
                    data: { score: averageScore }
                });
            }
        }

        return {
            success: true as const,
            viewer,
            averageScore,
            // The personality profile is for the hiring team only.
            interview: { ...interview, personalityProfile: viewer === "employer" ? interview.personalityProfile : null },
        };
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return { success: false as const, error: "Failed to fetch feedback" };
    }
}
