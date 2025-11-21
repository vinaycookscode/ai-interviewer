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
                    <p className="text-muted-foreground">This interview link is missing a valid token.</p>
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
                    <p className="text-muted-foreground">You do not have permission to access this interview.</p>
                </div>
            </div>
        );
    }

    // Verify authenticated user matches the invited candidate
    const user = await currentUser();

    // 1. Unauthenticated State: Show Landing Page
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-lg text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Welcome, {interview.candidate.email}</h1>
                        <p className="text-muted-foreground mt-2">
                            You have been invited to an interview for the position of <span className="font-semibold text-foreground">{interview.job.title}</span>.
                        </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700 text-left">
                        <p className="font-medium mb-1">Interview Details:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>{interview.job.questions.length} Questions</li>
                            <li>Estimated time: {Math.ceil(interview.job.questions.length * 2)} minutes</li>
                            <li>AI-powered evaluation</li>
                        </ul>
                    </div>

                    <a
                        href={`/sign-in?redirect_url=${encodeURIComponent(`/interview/${id}?token=${token}`)}`}
                        className="block w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Log in to Start Interview
                    </a>
                </div>
            </div>
        );
    }

    // Check if user's email matches the candidate email
    const userEmails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
    const candidateEmail = interview.candidate.email.toLowerCase();

    // 2. Wrong Account State: Show Switch Account UI
    if (!userEmails.includes(candidateEmail)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-lg text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Wrong Account</h1>
                        <p className="text-muted-foreground mt-2">
                            You are currently logged in as <span className="font-semibold text-foreground">{userEmails[0]}</span>.
                        </p>
                        <p className="text-muted-foreground mt-1">
                            This invitation is specifically for <span className="font-semibold text-foreground">{candidateEmail}</span>.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <a
                            href="/sign-out" // Clerk handles sign out via this or we need a client component
                        // Actually, for server component, we can just link to sign-out? No, usually needs client.
                        // Let's use a simple link to sign-in which will prompt switch or we can use a client component button.
                        // For simplicity in this server component, let's direct to sign-in which usually handles session switching if configured,
                        // or we can use a special sign-out route if we had one.
                        // Better: Use a client component for the button.
                        >
                        </a>
                        {/* We need a client component for SignOutButton. Let's import one or create inline if possible? No. 
                             Let's just direct to /sign-in, Clerk often allows adding another account. 
                             Or better, use the Clerk <SignOutButton> wrapped in a client component.
                             For now, let's use a direct link to the Clerk User Button or just tell them to switch.
                          */}
                        <a
                            href={`/sign-in?redirect_url=${encodeURIComponent(`/interview/${id}?token=${token}`)}`}
                            className="block w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Switch Account
                        </a>
                    </div>
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
                    <p className="text-muted-foreground">You have already completed this interview.</p>
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
