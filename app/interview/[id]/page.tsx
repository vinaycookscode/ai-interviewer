import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InterviewClientPage } from "./client-page";
import { auth } from "@/auth";
import { StatusScreen } from "@/components/layout/status-screen";
import { CalendarClock, CheckCircle2, FileText, LinkIcon, LockKeyhole, TimerOff } from "lucide-react";

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
            <StatusScreen icon={LinkIcon} tone="error" title="Invalid link">
                <p>This interview link is missing its access token. Please use the link from your invitation email.</p>
            </StatusScreen>
        );
    }

    const interview = await db.interview.findUnique({
        where: { id },
        include: {
            job: {
                include: {
                    questions: {
                        where: { archived: false },
                        orderBy: { createdAt: 'asc' }
                    },
                },
            },
            // Only what this page needs: never the whole User row (it holds the password hash).
            candidate: { select: { id: true, email: true, resumeUrl: true, panUrl: true, aadhaarUrl: true } },
        },
    });

    if (!interview) {
        notFound();
    }

    // Verify token. An interview without a token is never accessible.
    if (!interview.token || interview.token !== token) {
        return (
            <StatusScreen icon={LockKeyhole} tone="error" title="No access">
                <p>You don&apos;t have permission to open this interview.</p>
            </StatusScreen>
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

        // Relative links, so they never depend on NEXT_PUBLIC_APP_URL being set.
        const callback = new URLSearchParams({ callbackUrl: `/interview/${id}?token=${token}` }).toString();

        if (existingUser && existingUser.password !== null) {
            // User exists with password - sign in
            return (
                <StatusScreen title="Welcome back" action={{ label: "Sign in to continue", href: `/auth/login?${callback}` }}>
                    <p>
                        Sign in to continue your interview for{" "}
                        <strong className="font-medium text-foreground">{interview.job.title}</strong>.
                    </p>
                </StatusScreen>
            );
        } else {
            // New user OR invited user (NULL password) - sign up
            return (
                <StatusScreen title="You're invited" action={{ label: "Create account and start", href: `/auth/register?${callback}` }}>
                    <p>
                        You&apos;ve been invited to interview for{" "}
                        <strong className="font-medium text-foreground">{interview.job.title}</strong>. Create an
                        account to get started.
                    </p>
                </StatusScreen>
            );
        }
    }

    // User is authenticated    // Check if user is logged in and matches candidate
    if (!user || user.id !== interview.candidate.id) {
        return (
            <StatusScreen icon={LockKeyhole} tone="error" title="Wrong account">
                <p>Sign in as the candidate this interview was sent to.</p>
            </StatusScreen>
        );
    }

    // Check if scheduled time has arrived
    const now = new Date();
    const scheduledTime = interview.scheduledTime ? new Date(interview.scheduledTime) : null;

    // Check if interview has expired
    if (interview.expiresAt && now > interview.expiresAt) {
        return (
            <StatusScreen icon={TimerOff} tone="error" title="Interview expired">
                <p>This interview link expired on {interview.expiresAt.toLocaleString()}.</p>
                <p>If you think this is a mistake, contact the hiring manager.</p>
            </StatusScreen>
        );
    }

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
            <StatusScreen icon={CalendarClock} title="Not open yet">
                <p>
                    Your interview for <strong className="font-medium text-foreground">{interview.job.title}</strong> is
                    scheduled for
                </p>
                <p className="text-card-title text-foreground">{formattedDate}</p>
                <p>
                    Opens in {hours}h {minutes}m. Come back then to start.
                </p>
            </StatusScreen>
        );
    }

    // Check if interview is already completed
    if (interview.status === "COMPLETED") {
        return (
            <StatusScreen
                icon={CheckCircle2}
                tone="success"
                title="Interview completed"
                action={{ label: "View feedback", href: `/interview/${id}/feedback` }}
            >
                <p>You&apos;ve already completed this interview.</p>
            </StatusScreen>
        );
    }

    // Check for required documents
    const requirements = {
        resume: interview.job.requireResume,
        aadhar: interview.job.requireAadhar,
        pan: interview.job.requirePAN,
    };

    const existingDocs = {
        resume: !!interview.resumeUrl,
        aadhar: !!interview.aadhaarUrl,
        pan: !!interview.panUrl,
    };

    const missingDocs =
        (requirements.resume && !existingDocs.resume) ||
        (requirements.aadhar && !existingDocs.aadhar) ||
        (requirements.pan && !existingDocs.pan);

    if (missingDocs) {
        // Redirect to document upload page
        return (
            <StatusScreen
                icon={FileText}
                title="Documents needed"
                action={{ label: "Upload documents", href: `/candidate/interview/${id}/documents` }}
            >
                <p>This interview asks for a few documents before you can start.</p>
            </StatusScreen>
        );
    }

    // All checks passed - show interview
    return (
        <InterviewClientPage
            interview={{ id: interview.id, language: interview.language, job: { title: interview.job.title } }}
            questions={interview.job.questions}
            userDocuments={{
                resumeUrl: interview.candidate.resumeUrl,
                panUrl: interview.candidate.panUrl,
                aadhaarUrl: interview.candidate.aadhaarUrl,
            }}
        />
    );
}
