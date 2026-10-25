import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PageHeading, displayName, formatShortDate, inkButton } from "@/components/jobs/employer-ui";
import { PdfDownloadButton } from "@/components/interview/pdf-download-button";
import { PersonalityCard } from "@/components/interview/personality-card";
import { ScoreCard, type HighlightAnswer } from "@/components/feedback/score-card";
import { AnswerList, type ReportAnswer } from "@/components/feedback/answer-card";

export interface FeedbackInterview {
    createdAt: Date;
    job: { id: string; title: string };
    candidate: { name: string | null; email: string };
    answers: { id: string; transcript: string; score: number | null; feedback: string | null; question: { text: string } }[];
    personalityProfile: {
        communicationStyle: string;
        confidenceScore: number;
        technicalDepth: string;
        strengths: string[];
        weaknesses: string[];
        cultureFitScore: number;
        summary: string;
    } | null;
}

interface FeedbackReportProps {
    interview: FeedbackInterview;
    averageScore: number | null;
    viewer: "candidate" | "employer";
    back: { href: string; label: string };
}

/** The interview report. Employers also see how the candidate came across. */
export function FeedbackReport({ interview, averageScore, viewer, back }: FeedbackReportProps) {
    const t = useTranslations("FeedbackReport");

    const answers: ReportAnswer[] = interview.answers.map((a) => ({
        id: a.id,
        question: a.question.text,
        transcript: a.transcript,
        score: a.score,
        feedback: a.feedback,
    }));
    const { strongest, weakest } = highlights(answers);
    const name = displayName(interview.candidate);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={back}
                title={viewer === "candidate" ? t("headingCandidate") : t("headingEmployer", { name })}
                subtitle={
                    <span className="text-base font-medium">
                        {t("meta", { job: interview.job.title, date: formatShortDate(interview.createdAt), count: answers.length })}
                    </span>
                }
                actions={
                    <>
                        <PdfDownloadButton targetId="feedback-content" fileName={`feedback-${interview.candidate.email}`} />
                        {viewer === "candidate" && (
                            <Link href="/candidate/practice" className={cn(inkButton, "h-11 px-[18px] text-[15px]")}>
                                {t("practise")}
                            </Link>
                        )}
                    </>
                }
            />

            <div id="feedback-content" className="flex flex-col gap-6 bg-sg-bg sm:gap-9">
                <ScoreCard
                    score={averageScore}
                    answerCount={answers.length}
                    viewer={viewer}
                    strongest={strongest}
                    weakest={weakest}
                />
                {viewer === "employer" && interview.personalityProfile && <PersonalityCard profile={interview.personalityProfile} />}
                <AnswerList answers={answers} viewer={viewer} />
            </div>
        </div>
    );
}

/** Best and worst scored answers; none when fewer than two answers are scored. */
function highlights(answers: ReportAnswer[]): { strongest: HighlightAnswer | null; weakest: HighlightAnswer | null } {
    const scored = answers.filter((a): a is ReportAnswer & { score: number } => a.score !== null);
    if (scored.length < 2) return { strongest: null, weakest: null };
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.score === worst.score) return { strongest: null, weakest: null };
    return {
        strongest: { question: best.question, score: best.score },
        weakest: { question: worst.question, score: worst.score },
    };
}
