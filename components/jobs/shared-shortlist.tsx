"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Mascot } from "@/components/soft-glass/mascot";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** What a shared shortlist may show about a candidate (AIIN-161 AC3): no contact details, documents, notes or integrity. */
export interface SharedCandidate {
    key: string;
    rank: number;
    name: string;
    score: number | null;
    summary: string | null;
    confidence: number | null;
    cultureFit: number | null;
    strengths: string[];
    weaknesses: string[];
    answers: { question: string; score: number | null; feedback: string | null; transcript: string }[];
}

const tile = "rounded-[14px] bg-sg-row px-3 py-2.5";

/** The ranked list and one report at a time, from the approved hiring-manager artboards. Read-only. */
export function SharedShortlistView({ candidates }: { candidates: SharedCandidate[] }) {
    const t = useTranslations("SharedShortlist");
    const [pick, setPick] = useState(0);
    const report = useRef<HTMLElement>(null);
    // On a phone the report sits below the list: bring it up when it's out of sight
    const choose = (i: number) => {
        setPick(i);
        const top = report.current?.getBoundingClientRect().top ?? 0;
        if (top > window.innerHeight * 0.6)
            report.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    };
    const c = candidates[pick];
    const ten = (n: number | null) => (n == null ? t("none") : `${Math.round(n)} / 10`);

    return (
        <div className="flex flex-wrap items-start gap-6">
            <ol aria-label={t("listLabel")} className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-2 lg:max-w-[380px]">
                {candidates.map((s, i) => {
                    const on = i === pick;
                    return (
                        <li key={s.key}>
                            <button
                                type="button"
                                aria-pressed={on}
                                onClick={() => choose(i)}
                                className={cn(
                                    "flex min-h-16 w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left",
                                    on ? "border-2 border-sg-ink bg-(--sg-glass-strong) shadow-[var(--sg-shadow)]" : "sg-glass",
                                    focusRing,
                                )}
                            >
                                <span className="font-bold text-sg-muted">#{s.rank}</span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="font-bold break-words">{s.name}</span>
                                    {s.strengths[0] && <span className="text-[13px] text-sg-muted">{t("strongest", { skill: s.strengths[0] })}</span>}
                                </span>
                                <span className="font-display sg-soft text-[22px] font-semibold">{s.score?.toFixed(1) ?? t("none")}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>

            <section
                ref={report}
                aria-label={t("reportLabel")}
                aria-live="polite"
                className="sg-glass flex min-w-0 flex-[999_1_520px] scroll-mt-4 flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display sg-soft text-[26px] leading-[33px] font-semibold tracking-[-0.015em] break-words">{c.name}</h2>
                    <span className="flex items-baseline gap-1">
                        <span className="font-display sg-soft text-[36px] font-semibold">{c.score?.toFixed(1) ?? t("none")}</span>
                        <span className="font-semibold text-sg-muted">{t("outOf10")}</span>
                    </span>
                </div>
                {c.summary && (
                    <div className="flex items-start gap-3">
                        <Mascot className="size-10 shrink-0" />
                        <p className="sg-glass-strong flex-1 rounded-[6px_20px_20px_20px] px-4 py-3.5 text-sg-muted">{c.summary}</p>
                    </div>
                )}
                <ol className="flex flex-col gap-2">
                    {c.answers.map((a, i) => (
                        <li key={i}>
                            <details className="group rounded-[16px] bg-sg-row px-3.5 py-3">
                                <summary className={cn("flex cursor-pointer list-none flex-col gap-1 rounded-md", focusRing)}>
                                    <span className="flex justify-between gap-3">
                                        <span className="font-semibold">{a.question}</span>
                                        <strong>{a.score?.toFixed(1) ?? t("none")}</strong>
                                    </span>
                                    {a.feedback && <span className="text-sm text-sg-muted">{a.feedback}</span>}
                                    <span className="text-[13px] font-bold text-sg-muted group-open:hidden">{t("readAnswer")}</span>
                                </summary>
                                <p className="mt-2 text-sm whitespace-pre-line">{a.transcript}</p>
                            </details>
                        </li>
                    ))}
                </ol>
                <dl className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
                    <div className={tile}>
                        <dt className="text-[13px] font-bold text-sg-muted">{t("confidence")}</dt>
                        <dd className="font-bold">{ten(c.confidence)}</dd>
                    </div>
                    <div className={tile}>
                        <dt className="text-[13px] font-bold text-sg-muted">{t("cultureFit")}</dt>
                        <dd className="font-bold">{ten(c.cultureFit)}</dd>
                    </div>
                    <div className={tile}>
                        <dt className="text-[13px] font-bold text-sg-muted">{t("strengths")}</dt>
                        <dd className="font-bold">{c.strengths.join(", ") || t("none")}</dd>
                    </div>
                    <div className={tile}>
                        <dt className="text-[13px] font-bold text-sg-muted">{t("watchFor")}</dt>
                        <dd className="font-bold">{c.weaknesses.join(", ") || t("none")}</dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
