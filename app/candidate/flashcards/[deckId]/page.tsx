import { getDeckWithCards } from "@/actions/flashcards";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Layers, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader, Section } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddCardDialog } from "./add-card-dialog";
import { DeleteDeckButton } from "./delete-deck-button";
import { ProgressExplainer } from "./progress-explainer";

// Force dynamic rendering to get fresh progress data
export const dynamic = 'force-dynamic';

// Text colours pair a darker light-mode shade with the lighter dark-mode one,
// so status labels stay readable on both backgrounds.
const CONFIDENCE = {
    learning: { label: "Learning", badge: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400", text: "text-red-700 dark:text-red-400" },
    reviewing: { label: "Reviewing", badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400", text: "text-amber-700 dark:text-amber-400" },
    mastered: { label: "Mastered", badge: "border-brand/30 bg-brand-subtle text-brand", text: "text-brand" },
} as const;

const confidenceFor = (box: number) => (box >= 4 ? CONFIDENCE.mastered : box >= 2 ? CONFIDENCE.reviewing : CONFIDENCE.learning);

export default async function DeckDetailPage({
    params,
}: {
    params: Promise<{ deckId: string }>;
}) {
    const { deckId } = await params;
    const session = await auth();
    const deck = await getDeckWithCards(deckId);

    if (!deck) {
        notFound();
    }

    const isOwned = deck.userId === session?.user?.id;
    const dueCards = deck.cards.filter((card) => {
        if (!card.progress || card.progress.length === 0) return true;
        return new Date(card.progress[0].nextReview) <= new Date();
    });

    const masteredCards = deck.cards.filter((card) => {
        const progress = card.progress?.[0];
        return progress && progress.box >= 4;
    });

    const masteryPercent = deck.cards.length > 0
        ? Math.round((masteredCards.length / deck.cards.length) * 100)
        : 0;

    const learningCount = deck.cards.filter((c) => (c.progress?.[0]?.box || 0) < 2).length;
    const reviewingCount = deck.cards.filter((c) => {
        const b = c.progress?.[0]?.box || 0;
        return b >= 2 && b < 4;
    }).length;
    const studyHref = `/candidate/flashcards/${deckId}/study`;

    return (
        <div className="space-y-section">
            <PageHeader
                breadcrumb={
                    <Link
                        href="/candidate/flashcards"
                        className="inline-flex items-center gap-1.5 text-body text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to decks
                    </Link>
                }
                title={deck.name}
                subtitle={deck.description || undefined}
                badge={{ text: deck.category, variant: "outline" }}
                actions={
                    <>
                        {isOwned && <DeleteDeckButton deckId={deck.id} />}
                        <Button asChild>
                            <Link href={studyHref}>
                                <Play />
                                Study now
                            </Link>
                        </Button>
                    </>
                }
            />

            <div className="grid max-w-xl grid-cols-3 gap-3">
                <StatCard label="Total cards" value={deck.cards.length} />
                <StatCard label="Due today" value={dueCards.length} />
                <StatCard label="Mastered" value={`${masteryPercent}%`} />
            </div>

            <div className="flex flex-col gap-section lg:flex-row">
                <Section
                    title={`Cards (${deck.cards.length})`}
                    actions={isOwned ? <AddCardDialog deckId={deckId} /> : undefined}
                    className="min-w-0 flex-1"
                >
                    {deck.cards.length === 0 ? (
                        <div className="flex flex-col items-center gap-stack rounded-card border border-dashed p-card text-center">
                            <Layers className="size-8 text-muted-foreground" />
                            <p className="text-body text-muted-foreground">No cards in this deck yet.</p>
                            {isOwned && <AddCardDialog deckId={deckId} />}
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {deck.cards.map((card) => {
                                const progress = card.progress?.[0];
                                const box = progress?.box || 0;
                                const confidence = confidenceFor(box);
                                const isDue = !progress || new Date(progress.nextReview) <= new Date();

                                return (
                                    <Card key={card.id} className="gap-0 py-0 transition-colors hover:border-foreground/20">
                                        <CardContent className="space-y-2 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <Badge variant="outline" className={confidence.badge}>
                                                    {confidence.label}
                                                </Badge>
                                                {isDue ? (
                                                    <span className="flex items-center gap-1 text-caption text-amber-700 dark:text-amber-400">
                                                        <Clock className="size-3" />
                                                        Due
                                                    </span>
                                                ) : box >= 4 ? (
                                                    <span className="flex items-center gap-1 text-caption text-brand">
                                                        <CheckCircle2 className="size-3" />
                                                        Mastered
                                                    </span>
                                                ) : null}
                                            </div>
                                            <h3 className="line-clamp-2 text-body font-medium">{card.front}</h3>
                                            <p className="line-clamp-3 text-body text-muted-foreground">{card.back}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Section>

                <aside className="shrink-0 lg:w-80">
                    <div className="space-y-stack lg:sticky lg:top-8">
                        <Card className="gap-0 py-0">
                            <CardContent className="space-y-stack p-card">
                                <h3 className="text-card-title">Your progress</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-body">
                                        <span className="text-muted-foreground">Mastery</span>
                                        <span className="font-medium tabular-nums">{masteryPercent}%</span>
                                    </div>
                                    <Progress value={masteryPercent} className="h-2" />
                                </div>
                                <dl className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Learning", value: learningCount, text: CONFIDENCE.learning.text },
                                        { label: "Reviewing", value: reviewingCount, text: CONFIDENCE.reviewing.text },
                                        { label: "Mastered", value: masteredCards.length, text: CONFIDENCE.mastered.text },
                                        { label: "Due today", value: dueCards.length, text: "text-foreground" },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-control bg-muted/50 p-3">
                                            <dt className="text-caption text-muted-foreground">{item.label}</dt>
                                            <dd className={cn("text-section-title tabular-nums", item.text)}>{item.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>

                        <ProgressExplainer />

                        {dueCards.length > 0 && (
                            <Card className="gap-0 border-brand/30 bg-brand-subtle py-0">
                                <CardContent className="space-y-stack p-card text-center">
                                    <div className="space-y-1">
                                        <p className="text-card-title">{dueCards.length} cards due</p>
                                        <p className="text-body text-muted-foreground">Keep your streak going.</p>
                                    </div>
                                    <Button asChild className="w-full">
                                        <Link href={studyHref}>
                                            <Play />
                                            Study now
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
