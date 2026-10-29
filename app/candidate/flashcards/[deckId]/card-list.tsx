"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { glassButton, sectionTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export interface DeckCardRow {
    id: string;
    front: string;
    stage: "learning" | "reviewing" | "mastered";
    /** Milliseconds until the card is due; zero or less means due now. */
    dueIn: number;
    /** Already worded: "Due today", "In 3 days". */
    due: string;
}

const FIRST = 6;

const stageChip: Record<DeckCardRow["stage"], string> = {
    learning: "bg-sg-chip text-sg-text",
    reviewing: "bg-sg-lavender-soft text-sg-lavender-ink",
    mastered: "bg-sg-ink text-sg-ink-foreground",
};

/** The deck's cards, due first, with the first few shown until asked for all. */
export function CardList({ cards }: { cards: DeckCardRow[] }) {
    const t = useTranslations("Flashcards.deck");
    const [all, setAll] = useState(false);
    const shown = all ? cards : cards.slice(0, FIRST);

    return (
        <section aria-label={t("cards", { count: cards.length })} className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className={sectionTitle}>{t("cards", { count: cards.length })}</h2>
                <span className="font-semibold text-sg-muted">{t("dueFirst")}</span>
            </div>
            <ul className="flex flex-col gap-2.5">
                {shown.map((card) => (
                    <li key={card.id} className="sg-glass flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[20px] px-4 py-3.5 sm:px-5">
                        <span className="min-w-0 flex-[1_1_240px] font-semibold">{card.front}</span>
                        <span className="flex items-center gap-2.5">
                            <span className={cn("inline-flex h-6 items-center rounded-full px-2 text-[13px] font-bold", stageChip[card.stage])}>{t(card.stage)}</span>
                            <span className="text-[13px] leading-[18px] font-medium whitespace-nowrap text-sg-muted">{card.due}</span>
                        </span>
                    </li>
                ))}
            </ul>
            {!all && cards.length > FIRST && (
                <button type="button" onClick={() => setAll(true)} className={cn(glassButton, "h-10 self-start text-sm")}>
                    {t("showAll", { count: cards.length })}
                </button>
            )}
        </section>
    );
}
