import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { getDeckWithCards } from "@/actions/flashcards";
import { getCurrentSubscription } from "@/actions/subscription";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { glassButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";
import { AddCardDialog } from "./add-card-dialog";
import { CardList, type DeckCardRow } from "./card-list";
import { DeleteDeckButton } from "./delete-deck-button";

// Fresh progress on every visit
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export default async function DeckDetailPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("Flashcards");

    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const deck = await getDeckWithCards(deckId);
    if (!deck) notFound();

    const isOwned = deck.userId === session.user.id;
    const rows = cardRows(deck.cards, (key, values) => t(key, values));

    const dueCount = rows.filter((r) => r.dueIn <= 0).length;
    const counts = {
        learning: rows.filter((r) => r.stage === "learning").length,
        reviewing: rows.filter((r) => r.stage === "reviewing").length,
        mastered: rows.filter((r) => r.stage === "mastered").length,
    };
    const masteryPercent = rows.length > 0 ? Math.round((counts.mastered / rows.length) * 100) : 0;
    const studyHref = `/candidate/flashcards/${deckId}/study`;

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <Link href="/candidate/flashcards" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {t("deck.back")}
                    </Link>
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{deck.name}</h1>
                    {deck.description && <p className="text-lg text-sg-muted">{deck.description}</p>}
                </div>
                <span className="inline-flex h-7 items-center rounded-full bg-sg-chip px-2.5 text-sm font-semibold">{isOwned ? t("custom") : deck.category}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                {dueCount > 0 ? (
                    <Link href={studyHref} className={cn(coralButton, "h-12 px-6 text-base")}>
                        {t("deck.studyDue", { count: dueCount })}
                        <ArrowRight className="size-[18px]" aria-hidden="true" />
                    </Link>
                ) : (
                    rows.length > 0 && <span className="font-semibold text-sg-muted">{t("deck.allDone")}</span>
                )}
                {isOwned && <AddCardDialog deckId={deckId} triggerClassName={cn(glassButton, "h-12")} />}
            </div>

            {rows.length === 0 ? (
                <div className="sg-glass flex flex-col items-center gap-3 rounded-[28px] p-8 text-center">
                    <Layers className="size-7 text-sg-muted" aria-hidden="true" />
                    <h2 className={panelTitle}>{t("deck.emptyTitle")}</h2>
                    <p className="max-w-[380px] text-sg-muted">{isOwned ? t("deck.emptyBody") : t("deck.emptyShared")}</p>
                </div>
            ) : (
                <div className="flex flex-wrap items-start gap-6">
                    <CardList cards={rows} />

                    <aside aria-label={t("deck.progress")} className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]">
                        <div className={panel}>
                            <h2 className={panelTitle}>{t("deck.progress")}</h2>
                            <div className="flex flex-col gap-2">
                                <span className="flex justify-between gap-3 text-sm">
                                    <span className="text-sg-muted">{t("deck.masteredOf", { done: counts.mastered, total: rows.length })}</span>
                                    <span className="font-bold">{t("stats.percent", { value: masteryPercent })}</span>
                                </span>
                                <span
                                    role="progressbar"
                                    aria-label={t("masteryLabel", { value: masteryPercent })}
                                    aria-valuenow={masteryPercent}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    className="h-2 overflow-hidden rounded-full bg-sg-track"
                                >
                                    <span className="block h-full rounded-full bg-sg-lavender-ink" style={{ width: `${masteryPercent}%` }} />
                                </span>
                            </div>
                            <ol className="flex flex-col gap-2">
                                {(["learning", "reviewing", "mastered"] as const).map((stage) => (
                                    <li key={stage} className="flex items-start gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                        <span className="font-display sg-soft min-w-7 text-[22px] leading-7 font-semibold">{counts[stage]}</span>
                                        <span className="flex flex-col">
                                            <span className="font-bold">{t(`deck.${stage}`)}</span>
                                            <span className="text-sm text-sg-muted">{t(`deck.${stage}Body`)}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                            <p className="text-[15px] text-sg-muted">{t("deck.rule")}</p>
                        </div>
                        {isOwned && <DeleteDeckButton deckId={deck.id} />}
                    </aside>
                </div>
            )}
        </div>
    );
}

type Translate = (key: "deck.dueToday" | "deck.inDays" | "deck.inWeeks", values?: { count: number }) => string;

/** Each card's stage and when it's next due, due first. */
function cardRows(cards: { id: string; front: string; progress: { box: number; nextReview: Date }[] }[], t: Translate): DeckCardRow[] {
    const now = Date.now();
    return cards
        .map((card) => {
            const progress = card.progress[0];
            const box = progress?.box ?? 0;
            const dueIn = progress ? progress.nextReview.getTime() - now : 0;
            const days = Math.ceil(dueIn / DAY);
            return {
                id: card.id,
                front: card.front,
                stage: box >= 4 ? ("mastered" as const) : box >= 2 ? ("reviewing" as const) : ("learning" as const),
                dueIn,
                due: dueIn <= 0 ? t("deck.dueToday") : days >= 14 ? t("deck.inWeeks", { count: Math.round(days / 7) }) : t("deck.inDays", { count: days }),
            };
        })
        .sort((a, b) => a.dueIn - b.dueIn);
}
