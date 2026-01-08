"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface FlashcardViewerProps {
    front: string;
    back: string;
    onKnow: () => void;
    onDontKnow: () => void;
    currentIndex: number;
    totalCards: number;
}

export function FlashcardViewer({
    front,
    back,
    onKnow,
    onDontKnow,
    currentIndex,
    totalCards,
}: FlashcardViewerProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleKnow = () => {
        setIsFlipped(false);
        onKnow();
    };

    const handleDontKnow = () => {
        setIsFlipped(false);
        onDontKnow();
    };

    return (
        <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto px-2 sm:px-0">
            {/* Progress indicator */}
            <div className="text-sm text-muted-foreground">
                Card {currentIndex + 1} of {totalCards}
            </div>

            {/* Flashcard container with fixed aspect ratio for flip animation */}
            <div
                className="w-full cursor-pointer"
                onClick={handleFlip}
                style={{ perspective: "1000px" }}
            >
                <div
                    className="relative w-full transition-transform duration-500"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >
                    {/* Front */}
                    <Card
                        className={cn(
                            "w-full min-h-[280px] sm:min-h-[350px] p-4 sm:p-8 flex flex-col items-center justify-center",
                            "bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-2 border-cyan-500/20",
                            isFlipped && "invisible"
                        )}
                        style={{ backfaceVisibility: "hidden" }}
                    >
                        <div className="text-center w-full max-h-[220px] sm:max-h-[280px] overflow-y-auto">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 mb-4 sm:mb-5">
                                <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                                    Question
                                </span>
                            </div>
                            <div className="text-base sm:text-xl font-medium leading-relaxed px-2 prose prose-invert prose-sm sm:prose-base max-w-none text-left [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>ul]:ml-4 [&>ol]:ml-4 [&>li]:my-1 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4">
                                <ReactMarkdown>{front}</ReactMarkdown>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
                                Click to reveal answer
                            </p>
                        </div>
                    </Card>

                    {/* Back - positioned absolutely when visible */}
                    <Card
                        className={cn(
                            "w-full min-h-[280px] sm:min-h-[350px] p-4 sm:p-8 flex flex-col items-center justify-center",
                            "bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/20",
                            "absolute inset-0",
                            !isFlipped && "invisible"
                        )}
                        style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    >
                        <div className="text-center w-full max-h-[220px] sm:max-h-[280px] overflow-y-auto">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 mb-4 sm:mb-5">
                                <Lightbulb className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                    Answer
                                </span>
                            </div>
                            <div className="text-sm sm:text-lg font-medium leading-relaxed px-2 prose prose-invert prose-sm sm:prose-base max-w-none text-left [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&>ul]:ml-4 [&>ol]:ml-4 [&>li]:my-1 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_strong]:text-emerald-300">
                                <ReactMarkdown>{back}</ReactMarkdown>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Action buttons - responsive layout */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => { e.stopPropagation(); handleDontKnow(); }}
                    className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500 w-full sm:w-auto order-2 sm:order-1"
                >
                    <X className="h-5 w-5" />
                    Still Learning
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                    className="h-12 w-12 order-1 sm:order-2"
                >
                    <RotateCcw className="h-5 w-5" />
                </Button>

                <Button
                    size="lg"
                    onClick={(e) => { e.stopPropagation(); handleKnow(); }}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto order-3"
                >
                    <Check className="h-5 w-5" />
                    Got It!
                </Button>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground text-center max-w-md px-4">
                <span className="text-emerald-400 font-medium">Got It</span> moves the card to a later review.
                <span className="text-red-400 font-medium">Still Learning</span> keeps it for daily review.
            </p>
        </div>
    );
}
