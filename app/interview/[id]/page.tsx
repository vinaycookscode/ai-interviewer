import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InterviewClientPage } from "./client-page";
import { currentUser } from "@clerk/nextjs/server";

export default async function InterviewPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token: string }>;
}) {
    const { id } = await params;
    const { token } = await searchParams;

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
                    <p className="text-gray-600">This interview link is missing a valid token.</p>
                </div>
            </div>
        );
    }

    const interview = await db.interview.findUnique({
        where: { id },
        include: {
            job: {
                include: {
                    questions: true,
                },
            },
            candidate: true,
        },
    });

    if (!interview) {
        notFound();
    }

    // Verify token
    if (interview.token && interview.token !== token) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                    <p className="text-gray-600">You do not have permission to access this interview.</p>
                </div>
            </div>
        );
    }

    // Verify authenticated user matches the invited candidate
    const user = await currentUser();
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Authentication Required</h1>
                    <p className="text-gray-600">Please sign in to access this interview.</p>
                </div>
            </div>
        );
    }

    // Check if user's email matches the candidate email
    const userEmails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    const candidateEmail = interview.candidate.email.toLowerCase();

    if (!userEmails.includes(candidateEmail)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                    <p className="text-gray-600">
                        Please log in with the email address: <strong>{interview.candidate.email}</strong>
                    </p>
                </div>
            </div>
        );
    }

    // Link Clerk ID to candidate if not already linked
    if (!interview.candidate.clerkId) {
        await db.user.update({
            where: { id: interview.candidate.id },
            data: { clerkId: user.id },
        });
    }

    if (interview.status === "COMPLETED") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-green-600">Interview Completed</h1>
                    <p className="text-gray-600">You have already completed this interview.</p>
                </div>
            </div>
        );
    }

    return (
        <InterviewClientPage
            interview={interview}
            questions={interview.job.questions}
        />
    );
}
