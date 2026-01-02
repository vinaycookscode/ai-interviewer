"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle, Lightbulb, Mic, Star } from "lucide-react";

interface HRPrepTaskProps {
    content: {
        topic?: string;
        question?: string;
        tips?: string[];
        sampleAnswer?: string;
    };
    onComplete: () => void;
    isPending?: boolean;
}

const HR_QUESTIONS: Record<string, { question: string; tips: string[]; sampleAnswer: string }> = {
    introduction: {
        question: "Tell me about yourself.",
        tips: [
            "Keep it professional and relevant to the role",
            "Structure: Present → Past → Future",
            "Keep it under 2 minutes",
            "Highlight key achievements",
            "Show enthusiasm for the opportunity"
        ],
        sampleAnswer: `I'm a final year Computer Science student at [University] with a strong foundation in data structures and algorithms. I've completed internships at [Company] where I worked on backend development using Node.js.

My key achievements include leading a team project that won [Award] and contributing to open source projects. I'm particularly passionate about building scalable systems.

I'm excited about this opportunity because [Company] is known for its engineering culture, and I believe my skills in problem-solving and my eagerness to learn would make me a valuable addition to your team.`
    },
    default: {
        question: "Why should we hire you?",
        tips: [
            "Highlight your unique value proposition",
            "Connect your skills to the job requirements",
            "Show enthusiasm and cultural fit",
            "Provide concrete examples"
        ],
        sampleAnswer: "I bring a unique combination of technical skills and soft skills that align well with what you're looking for..."
    }
};

export function HRPrepTask({ content, onComplete, isPending }: HRPrepTaskProps) {
    const [userAnswer, setUserAnswer] = useState("");
    const [showSample, setShowSample] = useState(false);
    const [selfRating, setSelfRating] = useState<number | null>(null);
    const [hasPracticed, setHasPracticed] = useState(false);

    const questionData = content.topic && HR_QUESTIONS[content.topic]
        ? HR_QUESTIONS[content.topic]
        : {
            question: content.question || HR_QUESTIONS.default.question,
            tips: content.tips || HR_QUESTIONS.default.tips,
            sampleAnswer: content.sampleAnswer || HR_QUESTIONS.default.sampleAnswer
        };

    const handlePractice = () => {
        setHasPracticed(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-pink-500" />
                </div>
                <span className="font-medium">HR Interview Preparation</span>
            </div>

            {/* Question */}
            <div className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20">
                <h2 className="text-xl font-bold mb-2">"{questionData.question}"</h2>
                <p className="text-sm text-muted-foreground">Common interview question</p>
            </div>

            {/* Tips */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-500">
                    <Lightbulb className="h-5 w-5" />
                    <span className="font-medium">Tips for Answering</span>
                </div>
                <ul className="space-y-2 pl-7">
                    {questionData.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground list-disc">
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Practice Area */}
            <div className="space-y-3">
                <label className="block font-medium">Your Answer</label>
                <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Practice your answer here..."
                    className="w-full h-40 px-4 py-3 bg-muted border-0 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <div className="flex gap-3">
                    <button
                        onClick={handlePractice}
                        disabled={!userAnswer.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                    >
                        <Mic className="h-4 w-4" />
                        Practice Speaking
                    </button>
                    <button
                        onClick={() => setShowSample(!showSample)}
                        className="px-4 py-2 border rounded-lg hover:bg-muted"
                    >
                        {showSample ? "Hide Sample" : "View Sample Answer"}
                    </button>
                </div>
            </div>

            {/* Sample Answer */}
            {showSample && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-medium mb-2">Sample Answer</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {questionData.sampleAnswer}
                    </p>
                </div>
            )}

            {/* Self Rating */}
            {hasPracticed && (
                <div className="space-y-3">
                    <label className="block font-medium">Rate Your Practice (Optional)</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => setSelfRating(rating)}
                                className={`p-2 rounded-lg transition-colors ${selfRating && selfRating >= rating
                                        ? "text-yellow-500"
                                        : "text-muted-foreground hover:text-yellow-400"
                                    }`}
                            >
                                <Star className={`h-6 w-6 ${selfRating && selfRating >= rating ? "fill-current" : ""}`} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Complete Button */}
            <button
                onClick={() => onComplete()}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium"
            >
                <CheckCircle className="h-5 w-5" />
                {isPending ? "Completing..." : "Complete HR Prep"}
            </button>
        </div>
    );
}
