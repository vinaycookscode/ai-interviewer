import { getDecks } from "@/actions/flashcards";
import { DeckCard } from "@/components/flashcards/deck-card";
import { Layers, Brain, Target, BookOpen } from "lucide-react";
import { auth } from "@/auth";
import { CreateDeckDialog } from "./create-deck-dialog";
import { getCurrentSubscription } from "@/actions/subscription";
import { PlanTier } from "@prisma/client";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { PageHeader, Section } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";

export const metadata = {
    title: "Flashcards | Get Back To U",
    description: "Master interview concepts with spaced repetition flashcards",
};

// Force dynamic rendering to get fresh progress data
export const dynamic = 'force-dynamic';

export default async function FlashcardsPage() {
    const session = await auth();

    // Check subscription - block free users
    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;

    if (isFreeUser) {
        return <UpgradePrompt feature="Flashcards" description="Master interview concepts with AI-powered spaced repetition flashcards." />;
    }

    const decks = await getDecks();


    const systemDecks = decks.filter((d) => !d.userId);
    const userDecks = decks.filter((d) => d.userId === session?.user?.id);

    // Calculate overall stats
    const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);
    const totalMastered = decks.reduce((sum, d) => sum + (d.masteredCount || 0), 0);

    const deckGrid = "grid gap-stack sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

    return (
        <div className="space-y-section">
            <PageHeader
                title="Flashcards"
                subtitle="Master concepts with spaced repetition"
                actions={<CreateDeckDialog />}
            />

            <div className="grid max-w-2xl grid-cols-3 gap-3">
                <StatCard icon={BookOpen} label="Decks" value={decks.length} />
                <StatCard icon={Brain} label="Total cards" value={totalCards} />
                <StatCard icon={Target} label="Mastered" value={totalMastered} />
            </div>

            {systemDecks.length > 0 && (
                <Section title="Interview prep decks">
                    <div className={deckGrid}>
                        {systemDecks.map((deck) => (
                            <DeckCard
                                key={deck.id}
                                id={deck.id}
                                name={deck.name}
                                description={deck.description}
                                category={deck.category}
                                cardCount={deck.cardCount}
                                masteryPercent={deck.masteryPercent}
                            />
                        ))}
                    </div>
                </Section>
            )}

            <Section title="Your decks">
                {userDecks.length > 0 ? (
                    <div className={deckGrid}>
                        {userDecks.map((deck) => (
                            <DeckCard
                                key={deck.id}
                                id={deck.id}
                                name={deck.name}
                                description={deck.description}
                                category={deck.category}
                                cardCount={deck.cardCount}
                                masteryPercent={deck.masteryPercent}
                                isOwned
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-stack rounded-card border border-dashed p-card text-center">
                        <Layers className="size-8 text-muted-foreground" />
                        <div className="space-y-1">
                            <h3 className="text-card-title">No custom decks yet</h3>
                            <p className="mx-auto max-w-sm text-body text-muted-foreground">
                                Create your own flashcard decks to study any topic you want.
                            </p>
                        </div>
                        <CreateDeckDialog />
                    </div>
                )}
            </Section>
        </div>
    );
}
