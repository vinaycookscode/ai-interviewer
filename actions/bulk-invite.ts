"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface CandidateData {
    name: string;
    email: string;
}

export interface BulkInviteResult {
    success: boolean;
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
    results: {
        email: string;
        name: string;
        status: "success" | "failed" | "duplicate";
        error?: string;
        interviewLink?: string;
    }[];
}

export async function bulkInviteCandidates(data: {
    jobId: string;
    candidates: CandidateData[];
    scheduledTime: string;
    expiresAt?: string;
}): Promise<BulkInviteResult> {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return {
            success: false,
            total: 0,
            successful: 0,
            failed: 0,
            duplicates: 0,
            results: [],
        };
    }

    // Verify job ownership
    const job = await db.job.findUnique({
        where: { id: data.jobId },
        include: { employer: true, questions: true },
    });

    if (!job || job.employer.id !== userId) {
        return {
            success: false,
            total: 0,
            successful: 0,
            failed: 0,
            duplicates: 0,
            results: [],
        };
    }

    if (job.questions.length === 0) {
        return {
            success: false,
            total: data.candidates.length,
            successful: 0,
            failed: data.candidates.length,
            duplicates: 0,
            results: data.candidates.map((c) => ({
                email: c.email,
                name: c.name,
                status: "failed" as const,
                error: "Job has no questions",
            })),
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scheduledDate = new Date(data.scheduledTime);
    const expiresAt = data.expiresAt
        ? new Date(data.expiresAt)
        : new Date(scheduledDate.getTime() + 48 * 60 * 60 * 1000);

    const results: BulkInviteResult["results"] = [];
    let successful = 0;
    let failed = 0;
    let duplicates = 0;

    // Track emails to detect duplicates within the batch
    const processedEmails = new Set<string>();

    for (const candidate of data.candidates) {
        const email = candidate.email.toLowerCase().trim();
        const name = candidate.name.trim();

        // Check for duplicate in current batch
        if (processedEmails.has(email)) {
            duplicates++;
            results.push({
                email,
                name,
                status: "duplicate",
                error: "Duplicate email in batch",
            });
            continue;
        }
        processedEmails.add(email);

        try {
            // Find or create candidate user
            let user = await db.user.findUnique({
                where: { email },
            });

            if (!user) {
                user = await db.user.create({
                    data: {
                        email,
                        name,
                        role: "CANDIDATE",
                    },
                });
            }

            // Check if interview already exists for this job + candidate
            const existingInterview = await db.interview.findFirst({
                where: {
                    candidateId: user.id,
                    jobId: data.jobId,
                    status: { in: ["PENDING", "IN_PROGRESS"] },
                },
            });

            if (existingInterview) {
                duplicates++;
                results.push({
                    email,
                    name,
                    status: "duplicate",
                    error: "Already invited for this job",
                });
                continue;
            }

            // Generate unique interview token
            const interviewToken = randomBytes(32).toString("hex");

            // Create interview record
            const interview = await db.interview.create({
                data: {
                    candidateId: user.id,
                    jobId: data.jobId,
                    status: "PENDING",
                    token: interviewToken,
                    scheduledTime: scheduledDate,
                    expiresAt,
                },
            });

            const interviewLink = `${baseUrl}/interview/${interview.id}?token=${interviewToken}`;

            // Send email
            if (process.env.RESEND_API_KEY) {
                try {
                    const formattedDate = scheduledDate.toLocaleString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                    });

                    await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
                        to: email,
                        subject: `Interview Invitation: ${job.title}`,
                        html: `
                            <h2>Hello ${name},</h2>
                            <p>You have been invited to complete an AI-powered interview for the position of <strong>${job.title}</strong>.</p>
                            <p><strong>Scheduled Time:</strong> ${formattedDate}</p>
                            <p>The interview consists of ${job.questions.length} questions and should take approximately ${Math.ceil(job.questions.length * 2)} minutes to complete.</p>
                            <p>The interview will be available starting from the scheduled time. Click the link below when ready:</p>
                            <p><a href="${interviewLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Start Interview</a></p>
                            <p>Or copy this link: ${interviewLink}</p>
                            <p>Good luck!</p>
                        `,
                    });
                } catch (emailError) {
                    console.error(`Failed to send email to ${email}:`, emailError);
                }
            }

            successful++;
            results.push({
                email,
                name,
                status: "success",
                interviewLink,
            });
        } catch (error: any) {
            console.error(`Failed to process candidate ${email}:`, error);
            failed++;
            results.push({
                email,
                name,
                status: "failed",
                error: error.message || "Unknown error",
            });
        }
    }

    return {
        success: successful > 0,
        total: data.candidates.length,
        successful,
        failed,
        duplicates,
        results,
    };
}
