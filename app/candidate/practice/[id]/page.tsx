import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PracticeSession } from "@/components/practice/practice-session";
import { checkApiStatus } from "@/actions/mock-interview";
import { FocusCard, FocusRoot, outlineButton } from "@/components/interview/session-shell";
import { cn } from "@/lib/utils";

export default async function PracticeSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    const mockInterview = await db.mockInterview.findUnique({
        where: {
            id,
            userId: session.user.id,
        },
    });

    if (!mockInterview) {
        redirect("/candidate/practice");
    }

    if (mockInterview.score) {
        // Already completed
        redirect(`/candidate/practice/${id}/result`);
    }

    // Check API availability
    const apiStatus = await checkApiStatus();

    if (!apiStatus.available) {
        return (
            <FocusRoot>
                <FocusCard>
                    <div className="flex flex-col gap-2">
                        <span className="text-[13px] font-bold leading-[18px] text-sg-muted">
                            {mockInterview.role} · {mockInterview.difficulty}
                        </span>
                        <h1 className="font-display sg-soft text-[30px] font-semibold leading-9 sm:text-[34px] sm:leading-10">
                            U can&apos;t run this practice right now
                        </h1>
                    </div>
                    <div role="alert" className="flex items-start gap-3 rounded-[18px] bg-sg-danger/10 p-4 text-sg-danger">
                        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <div className="flex flex-col gap-1 font-semibold">
                            <p>{apiStatus.reason || "The AI service is unavailable."}</p>
                            <p>This practice can&apos;t continue without it. Please try again later.</p>
                        </div>
                    </div>
                    <Link href="/candidate/practice" className={cn(outlineButton, "h-12 px-6 text-base")}>
                        Back to practice
                    </Link>
                </FocusCard>
            </FocusRoot>
        );
    }

    return (
        <PracticeSession
            mockInterviewId={mockInterview.id}
            role={mockInterview.role}
            difficulty={mockInterview.difficulty}
        />
    );
}
