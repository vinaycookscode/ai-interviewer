"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { glassButton, label, sectionTitle } from "@/components/jobs/employer-ui";

export interface ReportAnswer {
    id: string;
    question: string;
    transcript: string;
    score: number | null;
    feedback: string | null;
}

interface AnswerCardProps {
    answer: ReportAnswer;
    index: number;
    open: boolean;
    onToggle: () => void;
    viewer: "candidate" | "employer";
    /** Hidden until "Show all"; the PDF still includes it. */
    collapsed?: boolean;
}

/** One answer: the question and score, opening to the feedback and the transcript. */
export function AnswerCard({ answer, index, open, onToggle, viewer, collapsed = false }: AnswerCardProps) {
    const t = useTranslations("FeedbackReport");
    const panelId = useId();
    const low = answer.score !== null && answer.score < 6;

    return (
        <article hidden={collapsed} data-pdf-reveal="" className="sg-glass overflow-hidden rounded-[22px]">
            <h3>
                <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={onToggle}
                    className={cn(
                        "flex min-h-16 w-full items-center gap-3.5 px-4 py-4 text-left font-semibold sm:px-5",
                        focusRing,
                        "focus-visible:ring-inset"
                    )}
                >
                    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[10px] bg-sg-chip text-[13px] font-bold">
                        <span className="sr-only">{t("questionNumber", { n: index + 1 })}</span>
                        <span aria-hidden="true">{index + 1}</span>
                    </span>
                    <span className="min-w-0 flex-1 break-words">{answer.question}</span>
                    {answer.score !== null ? (
                        <span
                            className={cn(
                                "inline-flex h-[30px] min-w-12 shrink-0 items-center justify-center rounded-full px-2.5 text-sm font-bold",
                                low ? "bg-sg-chip text-sg-text" : "bg-sg-lavender-soft text-sg-lavender-ink"
                            )}
                        >
                            {answer.score.toFixed(1)}
                            <span className="sr-only"> {t("outOfTen")}</span>
                        </span>
                    ) : (
                        <span className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-sg-chip px-2.5 text-[13px] font-semibold">
                            {t("notScored")}
                        </span>
                    )}
                    <ChevronDown
                        className={cn("size-5 shrink-0 transition-transform duration-150 motion-reduce:transition-none", open && "rotate-180")}
                        aria-hidden="true"
                    />
                </button>
            </h3>
            <div
                id={panelId}
                hidden={!open}
                data-pdf-reveal=""
                className="grid grid-cols-1 gap-4 px-4 pb-5 sm:px-5 md:grid-cols-2 md:pl-16"
            >
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className={label}>{t("feedback")}</span>
                    <p className="break-words">{answer.feedback || t("noFeedback")}</p>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl bg-sg-row px-4 py-3.5">
                    <span className={label}>{t(viewer === "candidate" ? "whatYouSaid" : "whatTheySaid")}</span>
                    <p className="break-words whitespace-pre-wrap text-sg-muted">{answer.transcript}</p>
                </div>
            </div>
        </article>
    );
}

const INITIAL_COUNT = 4;

/** Answer by answer. The first answer starts open; long reports show four until asked for all. */
export function AnswerList({ answers, viewer }: { answers: ReportAnswer[]; viewer: "candidate" | "employer" }) {
    const t = useTranslations("FeedbackReport");
    const [openId, setOpenId] = useState<string | null>(answers[0]?.id ?? null);
    const [showAll, setShowAll] = useState(false);
    const shown = showAll ? answers.length : Math.min(answers.length, INITIAL_COUNT);

    return (
        <section aria-labelledby="answers-title" className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="answers-title" className={sectionTitle}>
                    {t("answersTitle")}
                </h2>
                {answers.length > INITIAL_COUNT && (
                    <span data-pdf-hide="" className="font-medium text-sg-muted">{t("showing", { shown, total: answers.length })}</span>
                )}
            </div>
            {answers.length === 0 ? (
                <p className="rounded-[22px] border-2 border-dashed border-sg-field-border p-5 text-center text-sg-muted">{t("noAnswers")}</p>
            ) : (
                // Every answer is rendered so the PDF has them all; extras stay hidden on screen.
                answers.map((answer, index) => (
                    <AnswerCard
                        key={answer.id}
                        answer={answer}
                        index={index}
                        viewer={viewer}
                        collapsed={index >= shown}
                        open={openId === answer.id}
                        onToggle={() => setOpenId(openId === answer.id ? null : answer.id)}
                    />
                ))
            )}
            {!showAll && answers.length > INITIAL_COUNT && (
                <button
                    type="button"
                    data-pdf-hide=""
                    onClick={() => setShowAll(true)}
                    className={cn(glassButton, "h-11 self-center text-sm font-semibold")}
                >
                    {t("showAll", { total: answers.length })}
                </button>
            )}
        </section>
    );
}
