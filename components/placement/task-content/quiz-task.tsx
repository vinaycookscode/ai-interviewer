"use client";

import { useState } from "react";
import { HelpCircle, CheckCircle, X, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTaskProps {
    content: {
        questions?: number;
        topic?: string;
        items?: {
            question: string;
            options: string[];
            correct: number;
        }[];
    };
    onComplete: (score?: number) => void;
    isPending?: boolean;
}

// Sample quiz questions
const SAMPLE_QUIZ = [
    {
        question: "What is the time complexity of accessing an element in an array by index?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
        correct: 0
    },
    {
        question: "Which data structure uses LIFO principle?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        correct: 1
    },
    {
        question: "What is the space complexity of a recursive function with n calls?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        correct: 2
    },
    {
        question: "Which sorting algorithm has best average case complexity?",
        options: ["Bubble Sort", "Selection Sort", "Quick Sort", "Insertion Sort"],
        correct: 2
    },
    {
        question: "In a hash table, what is the average time complexity for search?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correct: 0
    }
];

export function QuizTask({ content, onComplete, isPending }: QuizTaskProps) {
    const questions = content.items || SAMPLE_QUIZ.slice(0, content.questions || 5);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const currentQuestion = questions[currentIndex];

    const handleAnswer = (optionIndex: number) => {
        if (showFeedback) return;
        setSelectedAnswer(optionIndex);
    };

    const handleCheck = () => {
        if (selectedAnswer === null) return;
        setShowFeedback(true);
        if (selectedAnswer === currentQuestion.correct) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex === questions.length - 1) {
            setCompleted(true);
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        }
    };

    if (completed) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="space-y-6 text-center">
                <div className="p-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
                    <Trophy className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">{percentage}%</h2>
                    <p className="text-muted-foreground">
                        You got {score} out of {questions.length} correct!
                    </p>
                    {percentage >= 80 && (
                        <p className="text-green-500 mt-2">Great job! 🎉</p>
                    )}
                </div>

                <button
                    onClick={() => onComplete(percentage)}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium"
                >
                    <CheckCircle className="h-5 w-5" />
                    {isPending ? "Completing..." : "Complete Quiz"}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                </div>
                <span className="text-sm text-muted-foreground">
                    Score: {score}/{currentIndex + (showFeedback ? 1 : 0)}
                </span>
            </div>

            {/* Progress */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <div className="p-6 bg-card border rounded-xl">
                <p className="text-lg font-medium mb-6">{currentQuestion.question}</p>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, i) => {
                        const isSelected = selectedAnswer === i;
                        const isCorrect = i === currentQuestion.correct;

                        let bgClass = "hover:border-muted-foreground/50";
                        if (showFeedback) {
                            if (isCorrect) {
                                bgClass = "border-green-500 bg-green-500/10";
                            } else if (isSelected && !isCorrect) {
                                bgClass = "border-red-500 bg-red-500/10";
                            }
                        } else if (isSelected) {
                            bgClass = "border-purple-500 bg-purple-500/10";
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(i)}
                                disabled={showFeedback}
                                className={cn(
                                    "w-full p-4 text-left rounded-lg border transition-all flex items-center justify-between",
                                    bgClass
                                )}
                            >
                                <span>
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-sm font-medium mr-3">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    {option}
                                </span>
                                {showFeedback && isCorrect && (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                                {showFeedback && isSelected && !isCorrect && (
                                    <X className="h-5 w-5 text-red-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Action Button */}
            {!showFeedback ? (
                <button
                    onClick={handleCheck}
                    disabled={selectedAnswer === null}
                    className="w-full px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 font-medium"
                >
                    Check Answer
                </button>
            ) : (
                <button
                    onClick={handleNext}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium"
                >
                    {currentIndex === questions.length - 1 ? "See Results" : "Next Question"}
                </button>
            )}
        </div>
    );
}
