import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Layers } from "lucide-react";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { getDecks } from "@/actions/flashcards";
import { getCurrentSubscription } from "@/actions/subscription";
import { DeckCard } from "@/components/flashcards/deck-card";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { coralButton } from "@/components/soft-glass/classes";
import { sectionTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";
import { CreateDeckDialog } from "./create-deck-dialog";

export const metadata = {
    title: "Flashcards | Get Back To U",
    description: "Short decks for the things interviews test from memory.",
};

// Fresh progress on every visit
export const dynamic = "force-dynamic";

// A card takes about 20 seconds to answer out loud and check.
const SECONDS_PER_CARD = 20;

export default async function FlashcardsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("Flashcards");

    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const decks = await getDecks();
    const sharedDecks = decks.filter((d) => !d.userId);
    const ownDecks = decks.filter((d) => d.userId === session.user.id);

    const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);
    const totalMastered = decks.reduce((sum, d) => sum + d.masteredCount, 0);
    const dueDecks = decks.filter((d) => d.dueCount > 0).sort((a, b) => b.dueCount - a.dueCount);
    const dueCards = dueDecks.reduce((sum, d) => sum + d.dueCount, 0);
    const minutes = Math.max(1, Math.ceil((dueCards * SECONDS_PER_CARD) / 60));

    const stats = [
        { label: t("stats.decks"), value: decks.length },
        { label: t("stats.cards"), value: totalCards },
        {
            label: t("stats.mastered"),
            value: totalMastered,
            note: totalCards > 0 ? t("stats.percent", { value: Math.round((totalMastered / totalCards) * 100) }) : null,
        },
    ];

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                    {t("title")}
                </h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            <section
                aria-label={t("due.label")}
                className="sg-shadow-lg flex flex-wrap items-center justify-between gap-5 rounded-[24px] bg-sg-ink p-5 text-sg-ink-foreground sm:rounded-[28px] sm:p-7"
            >
                <span className="flex min-w-0 max-w-[560px] flex-col gap-1.5">
                    <span className="text-[13px] leading-[18px] font-bold opacity-75">{t("due.label")}</span>
                    {dueCards > 0 ? (
                        <>
                            <span className="font-display sg-soft text-[26px] leading-[1.2] font-semibold sm:text-[34px]">
                                {t("due.title", { cards: dueCards, decks: dueDecks.length })}
                            </span>
                            <span className="opacity-80">{t("due.minutes", { minutes })}</span>
                        </>
                    ) : (
                        <>
                            <span className="font-display sg-soft text-[26px] leading-[1.2] font-semibold sm:text-[34px]">{t("due.noneTitle")}</span>
                            <span className="opacity-80">{t("due.noneBody")}</span>
                        </>
                    )}
                </span>
                {dueDecks[0] && (
                    <Link href={`/candidate/flashcards/${dueDecks[0].id}/study`} className={cn(coralButton, "h-12 px-6 text-base")}>
                        {t("due.study")}
                        <ArrowRight className="size-[18px]" aria-hidden="true" />
                    </Link>
                )}
            </section>

            <dl className="grid max-w-[640px] grid-cols-3 gap-2.5 sm:gap-3">
                {stats.map((s) => (
                    <div key={s.label} className="sg-glass flex min-w-0 flex-col rounded-[22px] px-4 py-3.5">
                        <dt className="text-[13px] leading-[18px] font-bold text-sg-muted">{s.label}</dt>
                        <dd className="font-display sg-soft text-[28px] leading-[34px] font-semibold">{s.value}</dd>
                        {s.note && <dd className="text-[13px] leading-[18px] font-medium text-sg-muted">{s.note}</dd>}
                    </div>
                ))}
            </dl>

            {sharedDecks.length > 0 && (
                <section aria-label={t("prep")} className="flex flex-col gap-4">
                    <h2 className={sectionTitle}>{t("prep")}</h2>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4">
                        {sharedDecks.map((deck) => (
                            <li key={deck.id} className="flex">
                                <DeckCard {...deckProps(deck)} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section aria-label={t("own")} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className={sectionTitle}>{t("own")}</h2>
                    <CreateDeckDialog />
                </div>
                {ownDecks.length > 0 ? (
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4">
                        {ownDecks.map((deck) => (
                            <li key={deck.id} className="flex">
                                <DeckCard {...deckProps(deck)} category={t("custom")} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="sg-glass flex items-start gap-3.5 rounded-[24px] p-5 sm:p-6">
                        <Layers className="mt-0.5 size-5 shrink-0 text-sg-muted" aria-hidden="true" />
                        <span className="flex flex-col gap-1">
                            <span className="font-bold">{t("noOwnTitle")}</span>
                            <span className="text-sg-muted">{t("noOwnBody")}</span>
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}

function deckProps(deck: Awaited<ReturnType<typeof getDecks>>[number]) {
    return {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        category: deck.category,
        cardCount: deck.cardCount,
        dueCount: deck.dueCount,
        masteryPercent: deck.masteryPercent,
    };
}
