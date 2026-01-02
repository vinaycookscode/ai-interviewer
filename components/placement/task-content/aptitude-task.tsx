"use client";

import { useState, useEffect } from "react";
import { Brain, Clock, CheckCircle, ChevronRight, ChevronLeft, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface AptitudeTaskProps {
    content: {
        questions?: number;
        topic?: string;
        items?: {
            question: string;
            options: string[];
            correct: number;
            explanation?: string;
        }[];
        timeLimit?: number; // in minutes
    };
    onComplete: (score?: number) => void;
    isPending?: boolean;
}

// Sample aptitude questions if none provided
const SAMPLE_QUESTIONS = [
    {
        question: "If 15% of a number is 45, what is the number?",
        options: ["200", "300", "350", "400"],
        correct: 1,
        explanation: "Let the number be x. 15% of x = 45 → 0.15x = 45 → x = 300"
    },
    {
        question: "A train 150m long passes a pole in 10 seconds. What is the speed of the train?",
        options: ["45 km/hr", "54 km/hr", "60 km/hr", "72 km/hr"],
        correct: 1,
        explanation: "Speed = Distance/Time = 150/10 = 15 m/s = 15 × 18/5 = 54 km/hr"
    },
    {
        question: "What comes next in the series: 2, 6, 12, 20, 30, ?",
        options: ["36", "40", "42", "48"],
        correct: 2,
        explanation: "Differences: 4, 6, 8, 10, 12. Next number = 30 + 12 = 42"
    },
    {
        question: "If A can do a work in 12 days and B can do it in 18 days, in how many days can they complete it together?",
        options: ["6.2 days", "7.2 days", "8.2 days", "9.2 days"],
        correct: 1,
        explanation: "Combined rate = 1/12 + 1/18 = 5/36. Time = 36/5 = 7.2 days"
    },
    {
        question: "The average of 5 numbers is 27. If one number is excluded, the average becomes 25. What is the excluded number?",
        options: ["30", "32", "35", "37"],
        correct: 2,
        explanation: "Sum of 5 numbers = 5 × 27 = 135. Sum of 4 numbers = 4 × 25 = 100. Excluded = 135 - 100 = 35"
    }
];

export function AptitudeTask({ content, onComplete, isPending }: AptitudeTaskProps) {
    const questions = content.items || SAMPLE_QUESTIONS.slice(0, content.questions || 5);
    const timeLimit = (content.timeLimit || 10) * 60; // Convert to seconds

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [showResults, setShowResults] = useState(false);

    // Timer
    useEffect(() => {
        if (showResults || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setShowResults(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [showResults, timeLeft]);

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const calculateScore = () => {
        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.correct) correct++;
        });
        return Math.round((correct / questions.length) * 100);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (showResults) {
        const score = calculateScore();
        const correctCount = questions.filter((q, i) => answers[i] === q.correct).length;

        return (
            <div className="space-y-6">
                {/* Score Card */}
                <div className="text-center p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20">
                    <Trophy className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">{score}%</h2>
                    <p className="text-muted-foreground">
                        You got {correctCount} out of {questions.length} correct
                    </p>
                </div>

                {/* Review Answers */}
                <div className="space-y-4">
                    <h3 className="font-semibold">Review Your Answers</h3>
                    {questions.map((q, i) => (
                        <div key={i} className={cn(
                            "p-4 rounded-lg border",
                            answers[i] === q.correct
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-red-500/10 border-red-500/30"
                        )}>
                            <p className="font-medium mb-2">Q{i + 1}: {q.question}</p>
                            <p className="text-sm">
                                Your answer: <span className={answers[i] === q.correct ? "text-green-500" : "text-red-500"}>
                                    {answers[i] !== null ? q.options[answers[i]] : "Not answered"}
                                </span>
                            </p>
                            {answers[i] !== q.correct && (
                                <p className="text-sm text-green-500">
                                    Correct: {q.options[q.correct]}
                                </p>
                            )}
                            {q.explanation && (
                                <p className="text-sm text-muted-foreground mt-2">{q.explanation}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Complete Button */}
                <button
                    onClick={() => onComplete(score)}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium"
                >
                    <CheckCircle className="h-5 w-5" />
                    {isPending ? "Completing..." : "Complete Aptitude Test"}
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-cyan-500" />
                    <span className="font-medium">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full",
                    timeLeft < 60 ? "bg-red-500/20 text-red-500" : "bg-muted"
                )}>
                    <Clock className="h-4 w-4" />
                    <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1">
                {questions.map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex-1 h-2 rounded-full transition-colors",
                            i === currentIndex ? "bg-cyan-500" :
                                answers[i] !== null ? "bg-green-500" : "bg-muted"
                        )}
                    />
                ))}
            </div>

            {/* Question */}
            <div className="p-6 bg-card border rounded-xl">
                <p className="text-lg font-medium mb-6">{currentQuestion.question}</p>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            className={cn(
                                "w-full p-4 text-left rounded-lg border transition-all",
                                answers[currentIndex] === i
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-sm font-medium mr-3">
                                {String.fromCharCode(65 + i)}
                            </span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </button>

                {currentIndex === questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                    >
                        Submit
                        <CheckCircle className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
