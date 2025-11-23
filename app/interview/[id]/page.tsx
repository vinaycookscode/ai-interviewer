import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InterviewClientPage } from "./client-page";
import { auth } from "@/auth";

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

    // Smart authentication flow
    const session = await auth();
    const user = session?.user;

    if (!user) {
        // User not authenticated - check if they exist in our database
        const candidateEmail = interview.candidate.email;
        const existingUser = await db.user.findUnique({
            where: { email: candidateEmail },
        });

        const redirectPath = `/interview/${id}?token=${token}`;

        if (existingUser && existingUser.password !== null) {
            // User exists with password - redirect to sign-in
            const signInUrl = new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
            signInUrl.searchParams.set("callbackUrl", redirectPath); // NextAuth uses callbackUrl

            return (
                <div className="flex items-center justify-center min-h-screen bg-background">
                    <div className="text-center space-y-6 max-w-md p-8">
                        <h1 className="text-3xl font-bold">Welcome Back!</h1>
                        <p className="text-muted-foreground">
                            Please sign in to continue with your interview for <strong>{interview.job.title}</strong>
                        </p>
                        <a
                            href={signInUrl.toString()}
                            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Sign In to Continue
                        </a>
                    </div>
                </div>
            );
        } else {
            // New user OR invited user (NULL password) - redirect to sign-up
            const signUpUrl = new URL("/auth/register", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
            signUpUrl.searchParams.set("callbackUrl", redirectPath);

            return (
                <div className="flex items-center justify-center min-h-screen bg-background">
                    <div className="text-center space-y-6 max-w-md p-8">
                        <h1 className="text-3xl font-bold">Welcome!</h1>
                        <p className="text-muted-foreground">
                            You've been invited to interview for <strong>{interview.job.title}</strong>.
                            Please create an account to get started.
                        </p>
                        <a
                            href={signUpUrl.toString()}
                            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Create Account & Start Interview
                        </a>
                    </div>
                </div>
            );
        }
    }

    // User is authenticated    // Check if user is logged in and matches candidate
    if (!user || user.id !== interview.candidate.id) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                    <p className="text-muted-foreground">
                        You must be logged in as the invited candidate to access this interview.
                    </p>
                </div>
            </div>
        );
    }

    // Check if scheduled time has arrived
    const now = new Date();
    const scheduledTime = interview.scheduledTime ? new Date(interview.scheduledTime) : null;

    if (scheduledTime && now < scheduledTime) {
        const timeUntil = scheduledTime.getTime() - now.getTime();
        const hours = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

        const formattedDate = scheduledTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-6 max-w-md p-8">
                    <h1 className="text-3xl font-bold">Interview Not Yet Available</h1>
                    <p className="text-muted-foreground">
                        Your interview for <strong>{interview.job.title}</strong> is scheduled for:
                    </p>
                    <p className="text-lg font-semibold">{formattedDate}</p>
                    <p className="text-muted-foreground">
                        Time remaining: <strong>{hours}h {minutes}m</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please return after the scheduled time to start your interview.
                    </p>
                </div>
            </div>
        );
    }

    // Check if interview is already completed
    if (interview.status === "COMPLETED") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4 max-w-md p-8">
                    <h1 className="text-2xl font-bold text-green-600">Interview Completed</h1>
                    <p className="text-muted-foreground">You have already completed this interview.</p>
                    <a
                        href={`/interview/${id}/feedback`}
                        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        View Feedback
                    </a>
                </div>
            </div>
        );
    }

    // All checks passed - show interview
    return (
        <InterviewClientPage
            interview={interview}
            questions={interview.job.questions}
        />
    );
}
