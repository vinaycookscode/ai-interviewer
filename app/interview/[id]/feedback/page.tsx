import { getInterviewFeedback } from "@/actions/feedback";
import { ScoreCard } from "@/components/feedback/score-card";
import { AnswerCard } from "@/components/feedback/answer-card";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";

import { PdfDownloadButton } from "@/components/interview/pdf-download-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { CandidateSidebar } from "@/components/candidate/sidebar";
import { db } from "@/lib/db";
import { PersonalityCard } from "@/components/interview/personality-card";

export default async function FeedbackPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { success, interview, averageScore } = await getInterviewFeedback(id);
    const session = await auth();
    const user = session?.user;
    const isCandidate = user?.email === interview?.candidate.email;
    const dashboardLink = isCandidate ? "/candidate/dashboard" : "/dashboard";

    if (!success || !interview) {
        notFound();
    }

    // Fetch dbUser to determine role for sidebar
    let dbUser = null;
    if (user?.id) {
        dbUser = await db.user.findUnique({
            where: { id: user.id },
        });
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={user} userRole={dbUser?.role} />

            <div className="flex flex-1">
                {dbUser?.role === "CANDIDATE" ? <CandidateSidebar /> : <DashboardSidebar userRole={dbUser?.role} />}

                <main className="flex-1 p-8">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="mb-8 flex items-start justify-between">
                            <div>
                                <Link
                                    href={dashboardLink}
                                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Dashboard
                                </Link>
                                <h1 className="text-3xl font-bold text-foreground">Interview Feedback</h1>
                                <p className="text-muted-foreground mt-2">
                                    {interview.job.title} • {interview.candidate.email}
                                </p>
                            </div>
                            <PdfDownloadButton targetId="feedback-content" fileName={`feedback-${interview.candidate.email}`} />
                        </div>

                        <div id="feedback-content" className="bg-background p-4 rounded-lg">
                            {/* Report Header for PDF */}
                            <div className="mb-8 border-b pb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-bold text-foreground mb-2">Interview Report</h1>
                                        <p className="text-muted-foreground text-sm">Generated on {new Date().toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate</span>
                                            <p className="font-medium text-foreground">{interview.candidate.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</span>
                                            <p className="font-medium text-foreground">{interview.job.title}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-8 mb-8">
                                <div className="md:col-span-1 space-y-6">
                                    <ScoreCard score={averageScore ?? null} />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="bg-card p-6 rounded-lg border shadow-sm h-full">
                                        <h3 className="text-lg font-semibold mb-2">Summary</h3>
                                        <p className="text-muted-foreground mb-6">
                                            {averageScore && averageScore >= 7
                                                ? "Great job! The candidate demonstrated strong knowledge and communication skills."
                                                : averageScore && averageScore >= 4
                                                    ? "Good effort. There are some areas for improvement, particularly in technical depth."
                                                    : "Needs improvement. The answers lacked sufficient detail or relevance."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!isCandidate && interview.personalityProfile && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-foreground mb-4">Personality Profile</h2>
                                    <PersonalityCard profile={interview.personalityProfile} />
                                </div>
                            )}

                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-foreground">Detailed Breakdown</h2>
                                {interview.answers.map((answer: any, index: number) => (
                                    <AnswerCard
                                        key={answer.id}
                                        index={index}
                                        question={answer.question.text}
                                        answer={answer.transcript}
                                        score={answer.score}
                                        feedback={answer.feedback}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
