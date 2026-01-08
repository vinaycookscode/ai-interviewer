"use client";

import { useState, useEffect } from "react";
import { FlashcardViewer } from "@/components/flashcards/flashcard-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { getStudyCards, updateProgress } from "@/actions/flashcards";
import { useRouter } from "next/navigation";

interface StudyCard {
    id: string;
    front: string;
    back: string;
}

export function StudyClient({
    deckId,
    deckName,
    initialCards
}: {
    deckId: string;
    deckName: string;
    initialCards: StudyCard[];
}) {
    const [cards, setCards] = useState<StudyCard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
    const router = useRouter();

    const currentCard = cards[currentIndex];

    const handleKnow = async () => {
        if (!currentCard) return;

        try {
            await updateProgress(currentCard.id, true);
            setStats((prev) => ({ ...prev, correct: prev.correct + 1 }));

            if (currentIndex < cards.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                setCompleted(true);
                router.refresh(); // Refresh to update mastery stats
            }
        } catch (error) {
            console.error("Failed to update progress:", error);
        }
    };

    const handleDontKnow = async () => {
        if (!currentCard) return;

        try {
            await updateProgress(currentCard.id, false);
            setStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));

            if (currentIndex < cards.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                setCompleted(true);
                router.refresh(); // Refresh to update mastery stats
            }
        } catch (error) {
            console.error("Failed to update progress:", error);
        }
    };

    const handleBackToDeck = () => {
        router.refresh();
        router.push(`/candidate/flashcards/${deckId}`);
    };

    if (cards.length === 0) {
        return (
            <div className="container max-w-2xl py-8 px-4">
                <Link href={`/candidate/flashcards/${deckId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Deck
                </Link>

                <Card>
                    <CardContent className="py-16 text-center">
                        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
                        <p className="text-muted-foreground mb-6">
                            No cards are due for review right now. Check back later!
                        </p>
                        <Button variant="outline" onClick={handleBackToDeck}>Back to Deck</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="container max-w-2xl py-8 px-4">
                <Card className="border-2 border-emerald-500/30">
                    <CardContent className="py-16 text-center">
                        <PartyPopper className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
                        <p className="text-muted-foreground mb-6">
                            You reviewed {cards.length} cards
                        </p>

                        <div className="flex justify-center gap-8 mb-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-emerald-500">{stats.correct}</p>
                                <p className="text-sm text-muted-foreground">Got It</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-orange-500">{stats.incorrect}</p>
                                <p className="text-sm text-muted-foreground">Still Learning</p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <Button variant="outline" onClick={handleBackToDeck}>Back to Deck</Button>
                            <Button onClick={() => { router.refresh(); router.push("/candidate/flashcards"); }}>All Decks</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-8 px-4">
            <Link href={`/candidate/flashcards/${deckId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Deck
            </Link>

            <h1 className="text-2xl font-bold text-center mb-8">{deckName}</h1>

            <FlashcardViewer
                front={currentCard.front}
                back={currentCard.back}
                onKnow={handleKnow}
                onDontKnow={handleDontKnow}
                currentIndex={currentIndex}
                totalCards={cards.length}
            />
        </div>
    );
}
