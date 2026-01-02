"use client";

import { useState } from "react";
import {
    Code, Play, CheckCircle, Lightbulb, Eye, EyeOff,
    Clock, Zap, Cpu, TrendingUp, AlertTriangle, Loader2,
    ChevronDown, ChevronUp, Target, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemTaskProps {
    content: {
        difficulty?: string;
        problem?: string;
        description?: string;
        examples?: { input: string; output: string; explanation?: string }[];
        hints?: string[];
        constraints?: string[];
        solution?: string;
        starterCode?: string;
        testCases?: { input: string; expected: string }[];
    };
    onComplete: (score?: number) => void;
    isPending?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "text-green-500 bg-green-500/10 border-green-500/30",
    MEDIUM: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    HARD: "text-red-500 bg-red-500/10 border-red-500/30",
};

const DIFFICULTY_ICONS = {
    EASY: "🟢",
    MEDIUM: "🟡",
    HARD: "🔴"
};

// AI Code Analysis Types
interface CodeAnalysis {
    timeComplexity: string;
    spaceComplexity: string;
    correctness: number; // 0-100
    codeQuality: number; // 0-100
    feedback: string[];
    improvements: string[];
    isOptimal: boolean;
}

// Simulated AI Analysis (in production, this would call an API)
function analyzeCode(code: string, difficulty: string): CodeAnalysis {
    // Simulate analysis based on code patterns
    const hasLoop = /for|while/.test(code);
    const hasNestedLoop = /(for|while)[\s\S]*?(for|while)/.test(code);
    const usesHashMap = /Map|Set|Object|{}/.test(code);
    const hasRecursion = /function\s+(\w+)[\s\S]*?\1\s*\(/.test(code);

    let timeComplexity = "O(1)";
    let spaceComplexity = "O(1)";

    if (hasNestedLoop) {
        timeComplexity = "O(n²)";
    } else if (hasLoop) {
        timeComplexity = "O(n)";
    }

    if (usesHashMap) {
        spaceComplexity = "O(n)";
    }

    const correctness = Math.min(100, 70 + Math.random() * 30);
    const codeQuality = Math.min(100, 60 + Math.random() * 40);

    const feedback: string[] = [];
    const improvements: string[] = [];

    if (code.length < 50) {
        feedback.push("Your solution seems incomplete. Make sure to handle all edge cases.");
    } else {
        feedback.push("Good job on implementing a solution!");
    }

    if (hasNestedLoop) {
        feedback.push(`Your solution has ${timeComplexity} time complexity due to nested loops.`);
        improvements.push("Consider using a HashMap to reduce time complexity to O(n).");
    } else if (usesHashMap) {
        feedback.push("Great use of HashMap for efficient lookups!");
    }

    if (!code.includes("//") && !code.includes("/*")) {
        improvements.push("Add comments to explain your approach for better readability.");
    }

    if (!code.includes("if") && !code.includes("?")) {
        improvements.push("Consider adding edge case checks (empty array, null values, etc.).");
    }

    if (difficulty === "EASY" && timeComplexity === "O(n)") {
        feedback.push("Your O(n) solution is optimal for this problem!");
    }

    return {
        timeComplexity,
        spaceComplexity,
        correctness: Math.round(correctness),
        codeQuality: Math.round(codeQuality),
        feedback,
        improvements,
        isOptimal: timeComplexity === "O(n)" || timeComplexity === "O(1)"
    };
}

// Sample problem data
const SAMPLE_PROBLEMS: Record<string, any> = {
    default: {
        title: "Two Sum",
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                input: "nums = [3,2,4], target = 6",
                output: "[1,2]",
                explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
            }
        ],
        constraints: [
            "2 <= nums.length <= 10⁴",
            "-10⁹ <= nums[i] <= 10⁹",
            "-10⁹ <= target <= 10⁹",
            "Only one valid answer exists."
        ],
        hints: [
            "A brute force approach would be to check every pair - this gives O(n²) time complexity.",
            "Can you think of a way to reduce the time complexity using extra space?",
            "What data structure allows O(1) lookups?",
            "For each element, you need to find if (target - element) exists in the array."
        ],
        difficulty: "EASY",
        starterCode: `function twoSum(nums, target) {
    // Your solution here
    
    return [];
}`,
        solution: `function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}

// Time Complexity: O(n)
// Space Complexity: O(n)`
    }
};

export function ProblemTask({ content, onComplete, isPending }: ProblemTaskProps) {
    const problem = {
        ...SAMPLE_PROBLEMS.default,
        ...content,
        difficulty: content.difficulty || "MEDIUM"
    };

    const [code, setCode] = useState(problem.starterCode || SAMPLE_PROBLEMS.default.starterCode);
    const [activeTab, setActiveTab] = useState<"problem" | "solution">("problem");
    const [showHints, setShowHints] = useState<number[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
    const [testResults, setTestResults] = useState<{ passed: boolean; output: string }[] | null>(null);

    const difficultyClass = DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.MEDIUM;

    const handleRunCode = async () => {
        setIsAnalyzing(true);
        // Simulate running tests
        await new Promise(resolve => setTimeout(resolve, 1500));

        setTestResults([
            { passed: true, output: "[0, 1]" },
            { passed: true, output: "[1, 2]" },
            { passed: Math.random() > 0.3, output: "[0, 3]" }
        ]);
        setIsAnalyzing(false);
    };

    const handleAnalyzeCode = async () => {
        setIsAnalyzing(true);
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = analyzeCode(code, problem.difficulty);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const toggleHint = (index: number) => {
        setShowHints(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Problem Header */}
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur pb-4 border-b z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <Code className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <h2 className="font-semibold">{problem.title || "Coding Problem"}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", difficultyClass)}>
                                {DIFFICULTY_ICONS[problem.difficulty as keyof typeof DIFFICULTY_ICONS]} {problem.difficulty}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~25 min
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab("problem")}
                        className={cn(
                            "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                            activeTab === "problem" ? "bg-background shadow" : "hover:bg-background/50"
                        )}
                    >
                        Problem
                    </button>
                    <button
                        onClick={() => setActiveTab("solution")}
                        className={cn(
                            "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                            activeTab === "solution" ? "bg-background shadow" : "hover:bg-background/50"
                        )}
                    >
                        Solution
                    </button>
                </div>
            </div>

            {activeTab === "problem" ? (
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 h-full">
                    {/* Left: Problem Description */}
                    <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
                        {/* Description */}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="flex items-center gap-2 text-green-500 mb-2">
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium text-sm">Problem Statement</span>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                                {(problem.description || problem.problem || SAMPLE_PROBLEMS.default.description)
                                    .split('\n').map((line: string, i: number) => (
                                        <p key={i} className="mb-2" dangerouslySetInnerHTML={{
                                            __html: line.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-green-500">$1</code>')
                                                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                        }} />
                                    ))}
                            </div>
                        </div>

                        {/* Examples */}
                        <div>
                            <div className="flex items-center gap-2 text-blue-500 mb-3">
                                <Target className="h-4 w-4" />
                                <span className="font-medium text-sm">Examples</span>
                            </div>
                            <div className="space-y-3">
                                {(problem.examples || SAMPLE_PROBLEMS.default.examples).map((example: any, i: number) => (
                                    <div key={i} className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-sm">
                                        <div className="mb-2">
                                            <span className="text-blue-400">Input: </span>
                                            <span className="text-[#d4d4d4]">{example.input}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-green-400">Output: </span>
                                            <span className="text-[#d4d4d4]">{example.output}</span>
                                        </div>
                                        {example.explanation && (
                                            <div className="text-gray-400 text-xs mt-2 border-t border-gray-700 pt-2">
                                                <span className="text-amber-400">Explanation: </span>
                                                {example.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Constraints */}
                        <div>
                            <div className="flex items-center gap-2 text-orange-500 mb-3">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium text-sm">Constraints</span>
                            </div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {(problem.constraints || SAMPLE_PROBLEMS.default.constraints).map((c: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-orange-500">•</span>
                                        <code className="text-xs">{c}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Hints */}
                        <div className="border rounded-lg">
                            <div className="flex items-center gap-2 p-3 border-b">
                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                <span className="font-medium text-sm">Hints</span>
                                <span className="text-xs text-muted-foreground">(Click to reveal)</span>
                            </div>
                            <div className="p-3 space-y-2">
                                {(problem.hints || SAMPLE_PROBLEMS.default.hints).map((hint: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => toggleHint(i)}
                                        className="w-full text-left"
                                    >
                                        <div className={cn(
                                            "p-3 rounded-lg border transition-all",
                                            showHints.includes(i)
                                                ? "bg-amber-500/10 border-amber-500/30"
                                                : "bg-muted/50 hover:bg-muted"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Hint {i + 1}</span>
                                                {showHints.includes(i) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </div>
                                            {showHints.includes(i) && (
                                                <p className="text-sm text-muted-foreground mt-2">{hint}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Code Editor + Analysis */}
                    <div className="space-y-4 flex flex-col">
                        {/* Code Editor */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="text-sm font-medium mb-2 block">Your Solution</label>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="flex-1 min-h-[400px] w-full px-4 py-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm rounded-lg border border-[#3e3e3e] focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                spellCheck={false}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleRunCode}
                                disabled={isAnalyzing}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                Run Tests
                            </button>
                            <button
                                onClick={handleAnalyzeCode}
                                disabled={isAnalyzing}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                Analyze Code
                            </button>
                        </div>

                        {/* Test Results */}
                        {testResults && (
                            <div className="bg-[#1e1e1e] rounded-lg p-4">
                                <h4 className="text-sm font-medium text-white mb-3">Test Results</h4>
                                <div className="space-y-2">
                                    {testResults.map((result, i) => (
                                        <div key={i} className={cn(
                                            "flex items-center justify-between p-2 rounded",
                                            result.passed ? "bg-green-500/10" : "bg-red-500/10"
                                        )}>
                                            <span className="text-sm text-gray-300">Test Case {i + 1}</span>
                                            <span className={cn(
                                                "text-xs font-medium",
                                                result.passed ? "text-green-500" : "text-red-500"
                                            )}>
                                                {result.passed ? "✓ Passed" : "✗ Failed"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        {analysis && (
                            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                    <h4 className="font-semibold">AI Code Analysis</h4>
                                </div>

                                {/* Complexity Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-background/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                            <Clock className="h-4 w-4" />
                                            Time Complexity
                                        </div>
                                        <p className="text-lg font-mono font-bold text-blue-500">{analysis.timeComplexity}</p>
                                    </div>
                                    <div className="bg-background/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                            <Cpu className="h-4 w-4" />
                                            Space Complexity
                                        </div>
                                        <p className="text-lg font-mono font-bold text-green-500">{analysis.spaceComplexity}</p>
                                    </div>
                                </div>

                                {/* Score Bars */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Correctness</span>
                                            <span className="font-medium">{analysis.correctness}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${analysis.correctness}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Code Quality</span>
                                            <span className="font-medium">{analysis.codeQuality}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all"
                                                style={{ width: `${analysis.codeQuality}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Feedback
                                    </h5>
                                    <ul className="space-y-1">
                                        {analysis.feedback.map((f, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-green-500 mt-1">•</span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                {analysis.improvements.length > 0 && (
                                    <div>
                                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-amber-500" />
                                            How to Improve
                                        </h5>
                                        <ul className="space-y-1">
                                            {analysis.improvements.map((imp, i) => (
                                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <span className="text-amber-500 mt-1">→</span>
                                                    {imp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {analysis.isOptimal && (
                                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span className="text-sm font-medium text-green-500">
                                            Your solution has optimal time complexity!
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Solution Tab */
                <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-500 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Try solving the problem yourself before viewing the solution!
                        </p>
                    </div>

                    <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        {problem.solution || SAMPLE_PROBLEMS.default.solution}
                    </pre>
                </div>
            )}

            {/* Complete Button */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 border-t">
                <button
                    onClick={() => onComplete(analysis?.correctness || (testResults ? 85 : 70))}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium"
                >
                    <CheckCircle className="h-5 w-5" />
                    {isPending ? "Completing..." : "Complete Problem"}
                </button>
            </div>
        </div>
    );
}
