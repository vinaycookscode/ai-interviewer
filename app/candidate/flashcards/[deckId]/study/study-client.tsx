"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProgress } from "@/actions/flashcards";
import { FocusRoot } from "@/components/interview/session-shell";
import { Mascot } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { glassButton, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface StudyCard {
    id: string;
    front: string;
    back: string;
}

interface StudyClientProps {
    deckId: string;
    deckName: string;
    cards: StudyCard[];
}

const cardText = "[&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-sg-chip [&_code]:px-1";

export function StudyClient({ deckId, deckName, cards: dueCards }: StudyClientProps) {
    const t = useTranslations("Flashcards.study");
    // The session's cards as they were when it started: each answer revalidates the page, and the
    // re-rendered list no longer includes cards just answered.
    const [cards] = useState(dueCards);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [saving, setSaving] = useState(false);
    const [known, setKnown] = useState(0);
    const [done, setDone] = useState(cards.length === 0);
    const answerRef = useRef<HTMLButtonElement>(null);
    const showRef = useRef<HTMLButtonElement>(null);
    const deckHref = `/candidate/flashcards/${deckId}`;

    const card = cards[index];

    // Keep keyboard focus on the next thing to press as the card turns.
    useEffect(() => {
        if (done) return;
        (flipped ? answerRef : showRef).current?.focus();
    }, [flipped, index, done]);

    const answer = async (knewIt: boolean) => {
        if (!card || saving) return;
        setSaving(true);
        try {
            await updateProgress(card.id, knewIt);
            if (knewIt) setKnown((n) => n + 1);
            if (index < cards.length - 1) {
                setIndex((i) => i + 1);
                setFlipped(false);
            } else {
                setDone(true);
            }
        } catch {
            toast.error(t("saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const answered = done ? cards.length : index;
    const missed = answered - known;

    return (
        <FocusRoot>
            <header className="sg-glass flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-[22px] py-2.5 pr-3 pl-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    <Link
                        href={deckHref}
                        aria-label={t("back", { deck: deckName })}
                        className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-sg-chip", focusRing)}
                    >
                        <ArrowLeft className="size-[18px]" aria-hidden="true" />
                    </Link>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate font-bold">{t("title", { deck: deckName })}</span>
                        <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("dueCount", { count: cards.length })}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!done && (
                        <button type="button" onClick={() => setDone(true)} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("end")}
                        </button>
                    )}
                    <ThemeSwitch className="hidden sm:inline-flex" />
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5">
                {!done && card ? (
                    <>
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{t("position", { n: index + 1, total: cards.length })}</span>
                            {cards.length <= 30 && (
                                <ol aria-hidden="true" className="flex flex-wrap justify-end gap-1">
                                    {cards.map((c, i) => (
                                        <li
                                            key={c.id}
                                            className={cn("h-1.5 rounded-full", i === index ? "w-[22px] bg-sg-ink" : "w-2.5", i < index ? "bg-sg-coral" : i > index && "bg-sg-track")}
                                        />
                                    ))}
                                </ol>
                            )}
                        </div>

                        <section aria-live="polite" className="sg-glass sg-shadow-lg flex min-h-[380px] flex-col gap-5 rounded-[24px] p-6 sm:rounded-[32px] sm:p-11">
                            <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("question")}</span>
                            {/* The question is the page's heading; Markdown paragraphs render inline inside it. */}
                            <h1 className={cn("font-display sg-soft text-[26px] leading-[1.22] font-semibold tracking-[-0.02em] text-pretty sm:text-[34px]", cardText)}>
                                <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{card.front}</ReactMarkdown>
                            </h1>
                            {flipped ? (
                                <>
                                    <div aria-hidden="true" className="h-px bg-sg-rule" />
                                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("answer")}</span>
                                    <div className={cn("flex flex-col gap-2 text-lg leading-[29px]", cardText)}>
                                        <ReactMarkdown>{card.back}</ReactMarkdown>
                                    </div>
                                </>
                            ) : (
                                <p className="mt-auto text-sg-muted">{t("sayIt")}</p>
                            )}
                        </section>

                        {flipped ? (
                            <div role="group" aria-label={t("knewIt")} className="grid grid-cols-2 gap-2.5">
                                <button type="button" onClick={() => answer(false)} disabled={saving} className={cn(glassButton, "h-14 text-base")}>
                                    {t("learning")}
                                </button>
                                <button ref={answerRef} type="button" onClick={() => answer(true)} disabled={saving} className={cn(coralButton, "h-14 text-base")}>
                                    {saving ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Check className="size-[18px]" aria-hidden="true" />}
                                    {t("gotIt")}
                                </button>
                            </div>
                        ) : (
                            <button ref={showRef} type="button" onClick={() => setFlipped(true)} className={cn(inkButton, "h-14 self-center px-8 text-base")}>
                                {t("show")}
                            </button>
                        )}
                    </>
                ) : (
                    <section role="status" className="sg-glass sg-shadow-lg flex flex-col items-center gap-4 rounded-[24px] p-6 text-center sm:rounded-[32px] sm:p-11">
                        <Mascot className="size-[72px]" />
                        <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">
                            {cards.length === 0 ? t("noneTitle") : t("doneTitle")}
                        </h1>
                        <p className="max-w-[520px] text-lg text-sg-muted">
                            {cards.length === 0
                                ? t("noneBody")
                                : `${t("doneBody", { known, total: answered })}${missed > 0 ? ` ${t("doneMissed", { missed })}` : ""}`}
                        </p>
                        {answered > 0 && (
                            <div className="grid w-full max-w-[380px] grid-cols-2 gap-2.5">
                                <div className="flex flex-col rounded-[18px] bg-sg-row px-4 py-3.5 text-left">
                                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("gotIt")}</span>
                                    <span className="font-display sg-soft text-[28px] leading-[34px] font-semibold">{known}</span>
                                </div>
                                <div className="flex flex-col rounded-[18px] bg-sg-row px-4 py-3.5 text-left">
                                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("learning")}</span>
                                    <span className="font-display sg-soft text-[28px] leading-[34px] font-semibold">{missed}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap justify-center gap-2.5">
                            <Link href={deckHref} className={cn(coralButton, "h-12 px-6 text-base")}>
                                {t("backToDeck")}
                            </Link>
                            <Link href="/candidate/flashcards" className={cn(glassButton, "h-12")}>
                                {t("allDecks")}
                            </Link>
                        </div>
                    </section>
                )}
            </main>
        </FocusRoot>
    );
}
