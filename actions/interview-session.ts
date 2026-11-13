"use server";

import { after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { finalizeInterviews, processGrading } from "@/lib/grading-queue";
import { InterviewStatus } from "@prisma/client";
import { generatePersonalityProfile } from "@/lib/ai/personality";
import { escapeHtml } from "@/lib/utils";
import { storeIntegrity } from "@/lib/integrity/compute";

/** The caller's own interview, or null. Every action here acts only on it. */
async function findOwnInterview(interviewId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;
    return db.interview.findFirst({
        where: { id: interviewId, candidateId: session.user.id },
        select: { id: true, jobId: true, status: true },
    });
}

export async function startInterview(interviewId: string) {
    const interview = await findOwnInterview(interviewId);
    if (!interview || interview.status === "COMPLETED") {
        return { success: false, error: "Interview not found" };
    }
    // Nothing starts before the candidate agreed to the integrity checks (AIIN-176)
    if (!(await db.interviewConsent.findFirst({ where: { interviewId }, select: { id: true } }))) {
        return { success: false, error: "Consent needed" };
    }

    try {
        await db.interview.update({
            where: { id: interviewId },
            data: { status: "IN_PROGRESS" },
        });
        // The first start only: the integrity timeline counts mm:ss from here (AIIN-177)
        await db.interview.updateMany({ where: { id: interviewId, startedAt: null }, data: { startedAt: new Date() } });
        // A drive's funnel counts it as started (AIIN-172)
        await db.driveCandidate.updateMany({ where: { interviewId, stage: { in: ["INVITED", "OPENED", "APTITUDE_PASSED"] } }, data: { stage: "INTERVIEW_STARTED" } });
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
    /** The last question: completeInterview grades it, so it isn't graded twice. */
    last?: boolean;
}) {
    const interview = await findOwnInterview(data.interviewId);
    if (!interview || interview.status === "COMPLETED") {
        return { success: false, error: "Interview not found" };
    }

    const question = await db.question.findFirst({
        where: { id: data.questionId, jobId: interview.jobId },
        select: { id: true },
    });
    if (!question) {
        return { success: false, error: "Question not found" };
    }

    try {
        const answer = await db.answer.create({
            data: {
                interviewId: data.interviewId,
                questionId: data.questionId,
                transcript: data.transcript,
                audioUrl: data.audioUrl,
                videoUrl: data.videoUrl,
            },
            select: { id: true },
        });

        // Queued for grading and graded after the response, so the next question shows at once (AIIN-38, AIIN-170)
        after(() => processGrading({ deadlineMs: 20_000 }));

        return { success: true, answerId: answer.id };
    } catch (error) {
        console.error("Failed to submit answer:", error);
        return { success: false, error: "Failed to submit answer" };
    }
}

export async function completeInterview(interviewId: string) {
    const own = await findOwnInterview(interviewId);
    if (!own) {
        return { success: false, error: "Interview not found" };
    }
    // Already completed: don't re-score or re-notify the employer.
    if (own.status === "COMPLETED") {
        return { success: true };
    }

    try {
        // No grading here (AIIN-170): answers are graded by the queue, and the score is set once all are graded
        const interview = await db.interview.update({
            where: { id: interviewId },
            data: { status: "COMPLETED", completedAt: new Date() },
            include: {
                job: {
                    include: {
                        employer: true
                    }
                },
                candidate: true
            }
        });

        await db.driveCandidate.updateMany({ where: { interviewId }, data: { stage: "INTERVIEW_FINISHED" } });

        // The integrity verdict, stored so lists can filter by it (AIIN-177); auto-shortlist reads it (AIIN-171)
        try {
            await storeIntegrity(interviewId);
        } catch (integrityError) {
            console.error("Failed to compute the integrity verdict:", integrityError);
        }

        // After the response: finish grading, score, the personality profile and the employer's email, so the
        // candidate isn't kept waiting (AC6)
        after(async () => {
            await finalizeInterviews([interviewId]);
            await processGrading({ deadlineMs: 50_000 });
            try {
                await generatePersonalityProfile(interviewId);
            } catch (aiError) {
                console.error("Failed to generate personality profile:", aiError);
            }
            await notifyEmployer(interview);
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to complete interview:", error);
        return { success: false, error: "Failed to complete interview" };
    }
}

/** Tell the employer an interview finished, with its score if grading is done by now. Never throws. */
async function notifyEmployer(interview: { id: string; job: { title: string; employer: { email: string | null } }; candidate: { email: string } }) {
        const score = (await db.interview.findUnique({ where: { id: interview.id }, select: { score: true } }))?.score ?? null;
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
                        <p>Candidate <strong>${escapeHtml(interview.candidate.email)}</strong> has completed the interview for <strong>${escapeHtml(interview.job.title)}</strong>.</p>
                        <p><strong>Score:</strong> ${score !== null ? score.toFixed(1) + "/10" : "Being scored"}</p>
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidates">View Results</a></p>
                    `,
                });
            } catch (emailError) {
                console.error("Failed to send completion email:", emailError);
                // Don't fail the request if email fails
            }
        }
}
