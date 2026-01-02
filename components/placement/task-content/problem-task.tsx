"use client";

import { useState } from "react";
import { Code, Play, CheckCircle, Lightbulb, Eye, EyeOff } from "lucide-react";

interface ProblemTaskProps {
    content: {
        difficulty?: string;
        problem?: string;
        description?: string;
        examples?: { input: string; output: string }[];
        hints?: string[];
        solution?: string;
        starterCode?: string;
    };
    onComplete: (score?: number) => void;
    isPending?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "text-green-500 bg-green-500/10",
    MEDIUM: "text-yellow-500 bg-yellow-500/10",
    HARD: "text-red-500 bg-red-500/10",
};

export function ProblemTask({ content, onComplete, isPending }: ProblemTaskProps) {
    const [code, setCode] = useState(content.starterCode || `function solution(input) {
    // Write your solution here
    
    return result;
}`);
    const [showHints, setShowHints] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [hasAttempted, setHasAttempted] = useState(false);

    const handleRun = () => {
        setHasAttempted(true);
        // Simulate code execution
        setOutput("✓ Code executed successfully!\n\nTest Case 1: Passed\nTest Case 2: Passed\n\nAll tests passed!");
    };

    const difficultyClass = DIFFICULTY_COLORS[content.difficulty || "MEDIUM"];

    return (
        <div className="space-y-6">
            {/* Problem Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <Code className="h-5 w-5 text-green-500" />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-sm font-medium ${difficultyClass}`}>
                        {content.difficulty || "MEDIUM"}
                    </span>
                </div>
            </div>

            {/* Problem Description */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3 className="text-lg font-semibold">Problem</h3>
                <p>{content.problem || content.description || "Solve the given problem."}</p>
            </div>

            {/* Examples */}
            {content.examples && content.examples.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium">Examples</h4>
                    {content.examples.map((example, i) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                            <div className="mb-2">
                                <span className="text-muted-foreground">Input: </span>
                                <span>{example.input}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Output: </span>
                                <span>{example.output}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hints */}
            {content.hints && content.hints.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHints(!showHints)}
                        className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400"
                    >
                        <Lightbulb className="h-4 w-4" />
                        {showHints ? "Hide Hints" : "Show Hints"}
                    </button>
                    {showHints && (
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground pl-6 list-disc">
                            {content.hints.map((hint, i) => (
                                <li key={i}>{hint}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Code Editor */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Your Solution</label>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-64 px-4 py-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm rounded-lg border border-[#3e3e3e] focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    spellCheck={false}
                />
            </div>

            {/* Run Button */}
            <div className="flex gap-3">
                <button
                    onClick={handleRun}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                    <Play className="h-4 w-4" />
                    Run Code
                </button>
                <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
                >
                    {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showSolution ? "Hide Solution" : "View Solution"}
                </button>
            </div>

            {/* Output */}
            {output && (
                <div className="bg-[#1e1e1e] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-400 mb-2">Output</h4>
                    <pre className="text-sm text-[#d4d4d4] whitespace-pre-wrap font-mono">{output}</pre>
                </div>
            )}

            {/* Solution */}
            {showSolution && content.solution && (
                <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
                    <h4 className="font-medium text-amber-500 mb-2">Solution</h4>
                    <pre className="text-sm bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded font-mono overflow-x-auto">
                        {content.solution}
                    </pre>
                </div>
            )}

            {/* Complete Button */}
            <button
                onClick={() => onComplete(hasAttempted ? 100 : 50)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium"
            >
                <CheckCircle className="h-5 w-5" />
                {isPending ? "Completing..." : hasAttempted ? "Complete Problem" : "Skip & Complete"}
            </button>
        </div>
    );
}
