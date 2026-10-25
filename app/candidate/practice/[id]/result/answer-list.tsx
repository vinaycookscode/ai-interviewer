"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

interface Answer {
    id: string;
    question: string;
    transcript: string;
    score: number | null;
    feedback: string | null;
}

/** Practice answers as an accordion; the first one starts open. */
export function AnswerList({ answers }: { answers: Answer[] }) {
    const [openId, setOpenId] = useState<string | null>(answers[0]?.id ?? null);

    return (
        <ol className="flex flex-col gap-3.5">
            {answers.map((answer, index) => {
                const open = openId === answer.id;
                const score = answer.score ?? 0;
                const panelId = `answer-panel-${answer.id}`;
                return (
                    <li key={answer.id} className="sg-glass overflow-hidden rounded-[22px]">
                        <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => setOpenId(open ? null : answer.id)}
                            className={cn(
                                "flex min-h-16 w-full items-center gap-3.5 rounded-[22px] px-4 py-4 text-left font-semibold sm:px-5",
                                focusRing
                            )}
                        >
                            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[10px] bg-sg-chip text-[13px] font-bold">
                                {index + 1}
                            </span>
                            <span className="min-w-0 flex-1">{answer.question}</span>
                            {score > 0 ? (
                                <span
                                    className={cn(
                                        "inline-flex h-[30px] min-w-12 shrink-0 items-center justify-center rounded-full px-2.5 text-sm font-bold",
                                        score < 6 ? "bg-sg-chip text-sg-text" : "bg-sg-lavender-soft text-sg-lavender-ink"
                                    )}
                                >
                                    {score.toFixed(1)}
                                    <span className="sr-only"> out of 10</span>
                                </span>
                            ) : (
                                <span className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-sg-chip px-2.5 text-[13px] font-bold">
                                    Not scored
                                </span>
                            )}
                            <ChevronDown
                                className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")}
                                aria-hidden="true"
                            />
                        </button>
                        {open && (
                            <div id={panelId} className="grid gap-4 px-5 pb-5 sm:pl-16 md:grid-cols-2">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <span className="text-[13px] font-bold leading-[18px] text-sg-muted">Feedback</span>
                                    <p>{answer.feedback || "No feedback for this answer."}</p>
                                </div>
                                <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl bg-sg-row px-4 py-3.5">
                                    <span className="text-[13px] font-bold leading-[18px] text-sg-muted">What you said</span>
                                    <p className="break-words text-sg-muted">{answer.transcript}</p>
                                </div>
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
