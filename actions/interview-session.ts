"use server";

import { db } from "@/lib/db";
import { InterviewStatus } from "@prisma/client";
import { generateFollowUp } from "@/lib/ai-context";
import { generatePersonalityProfile } from "@/lib/ai/personality";

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

        // Generate Follow-up Logic
        let followUpQuestion = null;
        if (data.transcript && data.transcript.length > 20) {
            // Get context for AI
            const interview = await db.interview.findUnique({
                where: { id: data.interviewId },
                include: { job: true, answers: true },
            });

            const question = await db.question.findUnique({
                where: { id: data.questionId },
            });

            // Only generate follow-up if we haven't asked too many questions already
            // and if it's not already a follow-up (simple check: prevent infinite loop)
            // For now, limit total questions or just check probability
            if (interview && question && interview.answers.length < 15) {
                const generatedText = await generateFollowUp(
                    question.text,
                    data.transcript,
                    interview.job.title
                );

                if (generatedText) {
                    // Save new question to DB
                    const newQuestion = await db.question.create({
                        data: {
                            text: generatedText,
                            jobId: interview.jobId,
                            // Mark as follow-up? We don't have a field yet, but we can just add it
                        },
                    });
                    followUpQuestion = newQuestion;
                }
            }
        }

        return { success: true, answerId: answer.id, followUp: followUpQuestion };
    } catch (error) {
        console.error("Failed to submit answer:", error);
        return { success: false, error: "Failed to submit answer" };
    }
}

export async function completeInterview(interviewId: string) {
    try {
        // Compute average score from answers
        const answers = await db.answer.findMany({
            where: { interviewId },
            select: { score: true },
        });

        const validScores = answers.filter((a) => a.score !== null && a.score !== undefined);
        const avgScore = validScores.length > 0
            ? validScores.reduce((sum, a) => sum + (a.score as number), 0) / validScores.length
            : null;

        const interview = await db.interview.update({
            where: { id: interviewId },
            data: {
                status: "COMPLETED",
                ...(avgScore !== null ? { score: avgScore } : {})
            },
            include: {
                job: {
                    include: {
                        employer: true
                    }
                },
                candidate: true
            }
        });

        // Generate Personality Profile
        try {
            await generatePersonalityProfile(interviewId);
        } catch (aiError) {
            console.error("Failed to generate personality profile:", aiError);
        }

        // Send email notification to employer
        if (process.env.RESEND_API_KEY && interview.job.employer.email) {
            try {
                const { Resend } = await import("resend");
                const resend = new Resend(process.env.RESEND_API_KEY);

                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                    to: interview.job.employer.email,
                    subject: `Interview Completed: ${interview.candidate.email} - ${interview.job.title}`,
                    html: `
                        <h1>Interview Completed</h1>
                        <p>Candidate <strong>${interview.candidate.email}</strong> has completed the interview for <strong>${interview.job.title}</strong>.</p>
                        <p><strong>Score:</strong> ${avgScore !== null ? avgScore.toFixed(1) + "/10" : "Pending Evaluation"}</p>
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidates">View Results</a></p>
                    `,
                });
            } catch (emailError) {
                console.error("Failed to send completion email:", emailError);
                // Don't fail the request if email fails
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to complete interview:", error);
        return { success: false, error: "Failed to complete interview" };
    }
}
