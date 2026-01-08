import { getDecks } from "@/actions/flashcards";
import { DeckCard } from "@/components/flashcards/deck-card";
import { Layers, Brain, Target, BookOpen } from "lucide-react";
import { auth } from "@/auth";
import { CreateDeckDialog } from "./create-deck-dialog";

export const metadata = {
    title: "Flashcards | Get Back To U",
    description: "Master interview concepts with spaced repetition flashcards",
};

// Force dynamic rendering to get fresh progress data
export const dynamic = 'force-dynamic';

export default async function FlashcardsPage() {
    const session = await auth();
    const decks = await getDecks();

    const systemDecks = decks.filter((d) => !d.userId);
    const userDecks = decks.filter((d) => d.userId === session?.user?.id);

    // Calculate overall stats
    const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);
    const totalMastered = decks.reduce((sum, d) => sum + (d.masteredCount || 0), 0);

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="px-4 md:px-8 py-8 md:py-12 border-b bg-card">
                <div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500">
                                <Layers className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                                    Flashcards
                                </h1>
                                <p className="text-muted-foreground text-lg">
                                    Master concepts with spaced repetition
                                </p>
                            </div>
                        </div>
                        <CreateDeckDialog />
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {decks.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Decks</div>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Brain className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {totalCards}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Cards</div>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold">
                                {totalMastered}
                            </div>
                            <div className="text-sm text-muted-foreground">Mastered</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 md:px-8 py-8">
                {/* System Decks */}
                {systemDecks.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" />
                            <h2 className="text-xl font-semibold">Interview Prep Decks</h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
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
                    </section>
                )}

                {/* User's Custom Decks */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-1 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        <h2 className="text-xl font-semibold">Your Decks</h2>
                    </div>
                    {userDecks.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
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
                        <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-card/50">
                            <Layers className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No custom decks yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Create your own flashcard decks to study any topic you want.
                            </p>
                            <CreateDeckDialog />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
