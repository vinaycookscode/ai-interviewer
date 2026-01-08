import { getDeckWithCards } from "@/actions/flashcards";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Layers, Clock, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddCardDialog } from "./add-card-dialog";
import { DeleteDeckButton } from "./delete-deck-button";
import { ProgressExplainer } from "./progress-explainer";

// Force dynamic rendering to get fresh progress data
export const dynamic = 'force-dynamic';

const categoryColors: Record<string, string> = {
    DSA: "from-blue-500 to-indigo-500",
    "System Design": "from-purple-500 to-pink-500",
    Behavioral: "from-green-500 to-emerald-500",
    SQL: "from-orange-500 to-amber-500",
    Custom: "from-cyan-500 to-teal-500",
};

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

    const gradientClass = categoryColors[deck.category] || categoryColors.Custom;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="px-4 md:px-8 py-8 md:py-12 border-b bg-card">
                <div>
                    {/* Back button */}
                    <Link
                        href="/candidate/flashcards"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Decks
                    </Link>

                    {/* Header Content */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass}`}>
                                    <Layers className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent`}>
                                        {deck.name}
                                    </h1>
                                    <Badge variant="outline" className="mt-1">
                                        {deck.category}
                                    </Badge>
                                </div>
                            </div>
                            {deck.description && (
                                <p className="text-muted-foreground text-lg max-w-2xl">
                                    {deck.description}
                                </p>
                            )}
                        </div>

                        {/* Stats & CTA */}
                        <div className="flex flex-col sm:flex-row md:flex-col gap-4">
                            <div className="flex items-center gap-2">
                                {isOwned && <DeleteDeckButton deckId={deck.id} />}
                                <Link href={`/candidate/flashcards/${deckId}/study`}>
                                    <Button
                                        size="lg"
                                        className={`gap-2 bg-gradient-to-r ${gradientClass} hover:opacity-90 shadow-lg`}
                                    >
                                        <Play className="h-5 w-5" />
                                        Study Now
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-xl">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <div className="text-2xl md:text-3xl font-bold">
                                {deck.cards.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Cards</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <div className="text-2xl md:text-3xl font-bold">
                                {dueCards.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Due Today</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <div className="text-2xl md:text-3xl font-bold">
                                {masteryPercent}%
                            </div>
                            <div className="text-sm text-muted-foreground">Mastered</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Cards Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">
                                Cards ({deck.cards.length})
                            </h2>
                            {isOwned && <AddCardDialog deckId={deckId} />}
                        </div>

                        {/* Cards Grid */}
                        {deck.cards.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-16 text-center">
                                    <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        No cards in this deck yet.
                                    </p>
                                    {isOwned && <AddCardDialog deckId={deckId} />}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {deck.cards.map((card) => {
                                    const progress = card.progress?.[0];
                                    const box = progress?.box || 0;

                                    // Simplified confidence levels
                                    const getConfidenceLevel = (box: number) => {
                                        if (box >= 4) return { label: "Mastered", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
                                        if (box >= 2) return { label: "Reviewing", style: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
                                        return { label: "Learning", style: "bg-red-500/10 text-red-400 border-red-500/30" };
                                    };

                                    const confidence = getConfidenceLevel(box);
                                    const isDue = !progress || new Date(progress.nextReview) <= new Date();

                                    return (
                                        <Card
                                            key={card.id}
                                            className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${confidence.style}`}
                                                    >
                                                        {confidence.label}
                                                    </Badge>
                                                    {isDue ? (
                                                        <div className="flex items-center gap-1 text-xs text-orange-400">
                                                            <Clock className="h-3 w-3" />
                                                            Due
                                                        </div>
                                                    ) : box >= 4 ? (
                                                        <div className="flex items-center gap-1 text-xs text-emerald-400">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Mastered
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                                                    {card.front}
                                                </h3>

                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {card.back}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sticky Sidebar */}
                    <div className="lg:w-80 xl:w-96 flex-shrink-0">
                        <div className="lg:sticky lg:top-8 space-y-6">
                            {/* Progress Summary Card */}
                            <Card className="border-2 border-primary/20">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        Your Progress
                                    </h3>

                                    {/* Mastery Progress */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Mastery</span>
                                            <span className="text-sm font-medium">{masteryPercent}%</span>
                                        </div>
                                        <Progress value={masteryPercent} className="h-3" />
                                    </div>

                                    {/* Stats Breakdown */}
                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <div className="p-3 rounded-lg bg-red-500/10 text-center">
                                            <div className="text-2xl font-bold text-red-400">
                                                {deck.cards.filter(c => {
                                                    const b = c.progress?.[0]?.box || 0;
                                                    return b < 2;
                                                }).length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Learning</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                                            <div className="text-2xl font-bold text-amber-400">
                                                {deck.cards.filter(c => {
                                                    const b = c.progress?.[0]?.box || 0;
                                                    return b >= 2 && b < 4;
                                                }).length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Reviewing</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                                            <div className="text-2xl font-bold text-emerald-400">
                                                {masteredCards.length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Mastered</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                                            <div className="text-2xl font-bold text-orange-400">
                                                {dueCards.length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Due Today</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* How Progress Works - Explainer */}
                            <ProgressExplainer />

                            {/* Quick Study CTA */}
                            {dueCards.length > 0 && (
                                <Card className={`bg-gradient-to-br ${gradientClass} border-0`}>
                                    <CardContent className="p-6 text-center text-white">
                                        <Clock className="h-8 w-8 mx-auto mb-3 opacity-90" />
                                        <p className="font-semibold mb-1">
                                            {dueCards.length} cards due
                                        </p>
                                        <p className="text-sm opacity-80 mb-4">
                                            Keep your streak going!
                                        </p>
                                        <Link href={`/candidate/flashcards/${deckId}/study`}>
                                            <Button
                                                variant="secondary"
                                                className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Study Now
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
