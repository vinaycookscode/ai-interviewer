import { getInterviewFeedback } from "@/actions/feedback";
import { ScoreCard } from "@/components/feedback/score-card";
import { AnswerCard } from "@/components/feedback/answer-card";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";

import { PdfDownloadButton } from "@/components/interview/pdf-download-button";
import { db } from "@/lib/db";

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
    const dbUser = await db.user.findUnique({
        where: { id: user?.id },
    });

    return (
        <div className="container mx-auto px-4 max-w-4xl py-8">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <Link
                        href={dashboardLink}
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Interview Feedback</h1>
                    <p className="text-muted-foreground mt-2">
                        {interview.job.title} • {interview.candidate.email}
                    </p>
                </div>
                <PdfDownloadButton targetId="feedback-content" fileName={`feedback-${interview.candidate.email}`} />
            </div>

            <div id="feedback-content" className="bg-background p-4 rounded-lg">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div className="md:col-span-1">
                        <ScoreCard score={averageScore ?? null} />
                    </div>
                    <div className="md:col-span-2">
                        <div className="h-full flex flex-col justify-center">
                            <h3 className="text-lg font-semibold mb-2">Summary</h3>
                            <p className="text-muted-foreground">
                                {averageScore && averageScore >= 7
                                    ? "Great job! The candidate demonstrated strong knowledge and communication skills."
                                    : averageScore && averageScore >= 4
                                        ? "Good effort. There are some areas for improvement, particularly in technical depth."
                                        : "Needs improvement. The answers lacked sufficient detail or relevance."}
                            </p>
                        </div>
                    </div>
                </div>

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
    );
}
