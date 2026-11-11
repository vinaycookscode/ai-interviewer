"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, Mic, Sparkles, Square } from "lucide-react";
import { practiseBankItem, type PractiseResult } from "@/actions/bank";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { FocusRoot, SessionHeader, eyebrow, outlineButton } from "@/components/interview/session-shell";
import { StatusChip, bankChip } from "@/components/question-bank/chips";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { inkButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface BankPracticeProps {
    item: { id: string; question: string; status: string; type: string; company: string | null };
    /** Company prep's answer or the AI-written one; shown once the answer is scored. */
    strongAnswer: string | null;
    /** Where this question sits in today's due list, or null when practising one question. */
    progress: { step: number; total: number } | null;
    /** The next due question, or null when there isn't one. */
    nextHref: string | null;
}

type Scored = Extract<PractiseResult, { ok: true }>;

/** Answer one bank question by voice or text, then see the score, what changed and when it comes back (AIIN-212). */
export function BankPractice({ item, strongAnswer, progress, nextHref }: BankPracticeProps) {
    const t = useTranslations("QuestionBank");
    const [answer, setAnswer] = useState("");
    const [scored, setScored] = useState<Scored | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechToText();

    // Speech fills the box; typing after it keeps working
    useEffect(() => {
        if (transcript) setAnswer(transcript);
    }, [transcript]);

    const submit = () => {
        if (isListening) stopListening();
        setError(null);
        startTransition(async () => {
            const result = await practiseBankItem(item.id, answer).catch(() => ({ error: "unavailable" as const }));
            if ("ok" in result) setScored(result);
            else setError(t(`practise.errors.${result.error}`));
        });
    };

    const again = () => {
        setScored(null);
        setAnswer("");
        resetTranscript();
    };

    const change = (s: Scored) => {
        if (s.previous == null) return t("practise.first");
        const diff = Math.round((s.score - s.previous) * 10) / 10;
        if (diff > 0) return t("practise.up", { previous: s.previous.toFixed(1) });
        if (diff < 0) return t("practise.down", { previous: s.previous.toFixed(1) });
        return t("practise.same");
    };

    return (
        <FocusRoot>
            <SessionHeader
                title={t("practise.title")}
                subtitle={progress ? t("practise.dueProgress", progress) : t("practise.single")}
                current={progress ? progress.step - 1 : 0}
                total={progress?.total ?? 0}
            >
                <Link href="/candidate/question-bank" className={outlineButton}>
                    {t("practise.done")}
                </Link>
            </SessionHeader>

            <div className="flex flex-1 flex-wrap items-start gap-5">
                <main className="sg-glass sg-shadow-lg flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8">
                    <span className="flex flex-wrap gap-1.5">
                        <StatusChip status={scored?.status ?? item.status} label={t(`statuses.${(scored?.status ?? item.status) as "NEW"}`)} />
                        <span className={bankChip}>{t(`types.${item.type as "HR"}`)}</span>
                        {item.company && <span className={bankChip}>{item.company}</span>}
                    </span>
                    <h1 className="font-display sg-soft text-[26px] font-semibold leading-[1.22] tracking-[-0.02em] text-pretty break-words sm:text-[34px]">{item.question}</h1>

                    {!scored ? (
                        <>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <label htmlFor="bank-answer" className={eyebrow}>
                                        {t("practise.answer")}
                                    </label>
                                    {isListening && (
                                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
                                            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-sg-coral" />
                                            {t("practise.listening")}
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    id="bank-answer"
                                    rows={6}
                                    maxLength={5000}
                                    placeholder={t("practise.placeholder")}
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={isPending}
                                    aria-invalid={!!error}
                                    aria-describedby={error ? "bank-error" : undefined}
                                    className={cn(
                                        "min-h-[168px] w-full resize-y rounded-[18px] border border-sg-field-border bg-sg-row px-4 py-3.5 text-base leading-[26px] text-sg-text placeholder:text-sg-muted/70 disabled:opacity-60",
                                        focusRing
                                    )}
                                />
                            </div>
                            {error && (
                                <p id="bank-error" role="alert" className="text-sm font-bold text-sg-danger">
                                    {error}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={isPending}
                                    aria-pressed={isListening}
                                    className={cn(
                                        "inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full px-[22px] font-bold transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto",
                                        isListening ? "bg-sg-ink text-sg-ink-foreground" : "border border-sg-field-border bg-sg-row text-sg-text",
                                        focusRing
                                    )}
                                >
                                    {isListening ? <Square className="size-5" aria-hidden="true" /> : <Mic className="size-5" aria-hidden="true" />}
                                    {isListening ? t("practise.stopVoice") : t("practise.voice")}
                                </button>
                                <button type="button" onClick={submit} disabled={!answer.trim() || isPending} className={cn(coralButton, "h-14 w-full px-[26px] sm:w-auto")}>
                                    {isPending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                                    {isPending ? t("practise.scoring") : t("practise.score")}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div role="status" className="flex flex-wrap items-center gap-4 rounded-[20px] bg-sg-row px-[18px] py-4">
                                <span className="font-display sg-soft text-[44px] leading-none font-semibold">
                                    <span aria-hidden="true">{scored.score.toFixed(1)}</span>
                                    <span className="sr-only">{t("practise.outOf", { score: scored.score.toFixed(1) })}</span>
                                </span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="font-bold">{change(scored)}</span>
                                    <span className="text-sg-muted">
                                        {t("practise.next", {
                                            days: scored.inDays,
                                            status: scored.status === "CONFIDENT" ? t("practise.nowConfident") : t("practise.stillPractising"),
                                        })}
                                    </span>
                                </span>
                            </div>
                            <div className="flex gap-3 rounded-[18px] bg-sg-lavender-soft px-4 py-3.5">
                                <Sparkles className="mt-1 size-3.5 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                                <span className="flex flex-col gap-1">
                                    <span className="font-bold">{scored.againstReference ? t("practise.againstReference") : t("practise.whatToFix")}</span>
                                    <span>{scored.feedback}</span>
                                </span>
                            </div>
                            {strongAnswer && (
                                <details className="rounded-[18px] bg-sg-row px-4 py-3.5">
                                    <summary className={cn("cursor-pointer rounded-md font-bold", focusRing)}>{t("practise.strongAnswer")}</summary>
                                    <p className="mt-2.5 leading-[26px] whitespace-pre-line">{strongAnswer}</p>
                                </details>
                            )}
                            <div className="flex flex-wrap gap-2.5">
                                <Link href={nextHref ?? "/candidate/question-bank"} className={cn(inkButton, "h-12 px-[22px]")}>
                                    {nextHref ? t("practise.nextDue") : t("practise.backToBank")}
                                </Link>
                                <button type="button" onClick={again} className={cn("sg-glass inline-flex h-12 items-center rounded-full px-[22px] font-bold", focusRing)}>
                                    {t("practise.tryAgain")}
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </FocusRoot>
    );
}
