import { getInterviewFeedback } from "@/actions/feedback";
import { ScoreCard } from "@/components/feedback/score-card";
import { AnswerCard } from "@/components/feedback/answer-card";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function FeedbackPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { success, interview, averageScore } = await getInterviewFeedback(id);

    if (!success || !interview) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Interview Feedback</h1>
                    <p className="text-slate-500 mt-2">
                        {interview.job.title} • {interview.candidate.email}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div className="md:col-span-1">
                        <ScoreCard score={averageScore ?? null} />
                    </div>
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-lg border shadow-sm h-full">
                            <h3 className="text-lg font-semibold mb-2">Summary</h3>
                            <p className="text-slate-600">
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
                    <h2 className="text-2xl font-bold text-slate-900">Detailed Breakdown</h2>
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
