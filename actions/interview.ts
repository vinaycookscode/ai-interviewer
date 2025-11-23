"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteCandidate(data: {
    jobId: string;
    candidateName: string;
    candidateEmail: string;
    scheduledTime: string;
}) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify job ownership
        const job = await db.job.findUnique({
            where: { id: data.jobId },
            include: { employer: true, questions: true },
        });

        if (!job || job.employer.id !== userId) {
            return { success: false, error: "Unauthorized" };
        }

        if (job.questions.length === 0) {
            return {
                success: false,
                error: "Please add questions to this job before inviting candidates",
            };
        }

        // Find or create candidate user
        let candidate = await db.user.findUnique({
            where: { email: data.candidateEmail },
        });

        if (!candidate) {
            candidate = await db.user.create({
                data: {
                    email: data.candidateEmail,
                    name: data.candidateName,
                    role: "CANDIDATE",
                },
            });
        }

        // Generate unique interview token
        const interviewToken = randomBytes(32).toString("hex");

        // Create interview record with scheduled time
        const interview = await db.interview.create({
            data: {
                candidateId: candidate.id,
                jobId: data.jobId,
                status: "PENDING",
                token: interviewToken,
                scheduledTime: new Date(data.scheduledTime),
            },
        });

        // Generate interview link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const interviewLink = `${baseUrl}/interview/${interview.id}?token=${interviewToken}`;

        // Send invitation email
        if (process.env.RESEND_API_KEY) {
            try {
                const scheduledDate = new Date(data.scheduledTime);
                const formattedDate = scheduledDate.toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                });

                const emailResult = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                    to: data.candidateEmail,
                    subject: `Interview Invitation: ${job.title}`,
                    html: `
          <h2>Hello ${data.candidateName},</h2>
          <p>You have been invited to complete an AI-powered interview for the position of <strong>${job.title}</strong>.</p>
          <p><strong>Scheduled Time:</strong> ${formattedDate}</p>
          <p>The interview consists of ${job.questions.length} questions and should take approximately ${Math.ceil(job.questions.length * 2)} minutes to complete.</p>
          <p>The interview will be available starting from the scheduled time. Click the link below when ready:</p>
          <p><a href="${interviewLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Start Interview</a></p>
          <p>Or copy this link: ${interviewLink}</p>
          <p>Good luck!</p>
        `,
                });
                console.log("Email sent successfully:", emailResult);
            } catch (emailError) {
                console.error("Failed to send email:", emailError);
                // Continue anyway - the link is still displayed in the UI
            }
        } else {
            console.log("RESEND_API_KEY not configured - skipping email send");
        }

        return {
            success: true,
            interviewId: interview.id,
            interviewLink: interviewLink
        };
    } catch (error: any) {
        console.error("Failed to invite candidate:", error);
        return { success: false, error: error.message || "Failed to send invitation" };
    }
}
