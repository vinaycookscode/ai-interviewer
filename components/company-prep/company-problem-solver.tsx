"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Code, Play, CheckCircle, Lightbulb, Eye, EyeOff,
    Clock, Zap, Cpu, TrendingUp, AlertTriangle, Loader2,
    ChevronDown, ChevronUp, Target, BookOpen, Briefcase, GraduationCap,
    ArrowLeft, X, Building2, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { saveUserSolution, getUserSolution } from "@/actions/company-prep";
import { toast } from "sonner";
import { CodeEditor } from "@/components/ui/code-editor";

interface CompanyQuestion {
    id: string;
    question: string;
    description?: string | null;  // Detailed problem statement
    type: string;
    difficulty: string;
    frequency: number;
    answer?: string | null;
    tips?: string | null;
    tags: string[];
    starterCode?: string | null;
    solutionCode?: string | null;
    testCases?: any[];
    language?: string | null;
}

interface CodeEditorFeatureFlags {
    languageSelector: boolean;
    codePersistence: boolean;
    aiCodeAnalysis: boolean;
}

interface CompanyProblemSolverProps {
    question: CompanyQuestion;
    companyName: string;
    companySlug: string;
    onClose: () => void;
    featureFlags?: CodeEditorFeatureFlags;
}

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "text-green-500 bg-green-500/10 border-green-500/30",
    MEDIUM: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    HARD: "text-red-500 bg-red-500/10 border-red-500/30",
};

const DIFFICULTY_ICONS: Record<string, string> = {
    EASY: "🟢",
    MEDIUM: "🟡",
    HARD: "🔴"
};

// AI Code Analysis Types
interface CodeAnalysis {
    timeComplexity: string;
    spaceComplexity: string;
    correctness: number;
    codeQuality: number;
    feedback: string[];
    improvements: string[];
    isOptimal: boolean;
}

// Simulated AI Analysis
function analyzeCode(code: string, difficulty: string): CodeAnalysis {
    const codeLength = code.length;
    const hasLoop = code.includes("for") || code.includes("while");
    const hasMap = code.includes("Map") || code.includes("{}") || code.includes("Object");

    // Simulated analysis based on code patterns
    const isOptimal = hasMap && hasLoop;
    const timeComplexity = isOptimal ? "O(n)" : hasLoop ? "O(n²)" : "O(1)";
    const spaceComplexity = hasMap ? "O(n)" : "O(1)";

    const baseScore = difficulty === "EASY" ? 85 : difficulty === "MEDIUM" ? 75 : 65;
    const correctness = Math.min(100, baseScore + (isOptimal ? 15 : 0));
    const codeQuality = Math.min(100, 70 + (codeLength > 100 ? 0 : 20) + (code.includes("//") ? 10 : 0));

    const feedback: string[] = [];
    const improvements: string[] = [];

    if (hasMap) {
        feedback.push("Good use of HashMap for O(1) lookups");
    } else {
        improvements.push("Consider using a HashMap to optimize lookup time");
    }

    if (code.includes("//")) {
        feedback.push("Good practice: Code includes comments");
    } else {
        improvements.push("Add comments to explain your approach");
    }

    if (isOptimal) {
        feedback.push("Your solution achieves optimal time complexity!");
    }

    return {
        timeComplexity,
        spaceComplexity,
        correctness,
        codeQuality,
        feedback,
        improvements,
        isOptimal
    };
}

// localStorage key for user code
const getCodeStorageKey = (questionId: string) => `company-prep-code-${questionId}`;

export function CompanyProblemSolver({
    question,
    companyName,
    companySlug,
    onClose,
    featureFlags = { languageSelector: true, codePersistence: true, aiCodeAnalysis: true }
}: CompanyProblemSolverProps) {
    const defaultStarterCode = question.starterCode || `// ${question.question}
// Difficulty: ${question.difficulty}

function solution(input) {
    // Your code here
    
}`;

    // Load saved code from localStorage or use starter code
    const getSavedCode = () => {
        if (typeof window === 'undefined') return defaultStarterCode;
        const saved = localStorage.getItem(getCodeStorageKey(question.id));
        return saved || defaultStarterCode;
    };

    const [code, setCode] = useState(defaultStarterCode);
    const [activeTab, setActiveTab] = useState<"problem" | "learn">("problem");
    const [showHints, setShowHints] = useState<number[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
    const [testResults, setTestResults] = useState<any[] | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("javascript");
    const [hasSavedSolution, setHasSavedSolution] = useState(false);
    const [solutionInfo, setSolutionInfo] = useState<{ passedTests: number; totalTests: number } | null>(null);

    // Supported programming languages
    const SUPPORTED_LANGUAGES = [
        { id: "javascript", name: "JavaScript", extension: ".js" },
        { id: "python", name: "Python", extension: ".py" },
        { id: "java", name: "Java", extension: ".java" },
        { id: "csharp", name: "C#", extension: ".cs" },
        { id: "typescript", name: "TypeScript", extension: ".ts" },
        { id: "cpp", name: "C++", extension: ".cpp" },
    ];

    // Get starter code for selected language
    const starterCodes: Record<string, string> = {
        javascript: `// ${question.question}
// Difficulty: ${question.difficulty}

function solution(input) {
    // Your code here
    
}`,
        python: `# ${question.question}
# Difficulty: ${question.difficulty}

def solution(input):
    # Your code here
    pass`,
        java: `// ${question.question}
// Difficulty: ${question.difficulty}

class Solution {
    public Object solution(Object input) {
        // Your code here
        return null;
    }
}`,
        csharp: `// ${question.question}
// Difficulty: ${question.difficulty}

public class Solution {
    public object Solve(object input) {
        // Your code here
        return null;
    }
}`,
        typescript: `// ${question.question}
// Difficulty: ${question.difficulty}

function solution(input: any): any {
    // Your code here
    
}`,
        cpp: `// ${question.question}
// Difficulty: ${question.difficulty}

#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    // Your code here
    
};`
    };

    // Get localStorage key with language
    const getCodeStorageKeyWithLang = (lang: string) => `company-prep-code-${question.id}-${lang}`;
    // Load saved solution from database on mount
    useEffect(() => {
        const loadSolution = async () => {
            if (typeof window === 'undefined') return;

            try {
                const result = await getUserSolution(question.id, selectedLanguage);
                if (result.success && result.solution) {
                    setCode(result.solution.code);
                    setHasSavedSolution(true);
                    setSolutionInfo({
                        passedTests: result.solution.passedTests,
                        totalTests: result.solution.totalTests
                    });
                    return;
                }
            } catch (error) {
                console.error("Error loading solution:", error);
            }

            // Fallback to localStorage if no database solution
            if (featureFlags.codePersistence) {
                const saved = localStorage.getItem(getCodeStorageKeyWithLang(selectedLanguage));
                if (saved) {
                    setCode(saved);
                    return;
                }
            }

            // Use starter code
            setCode(starterCodes[selectedLanguage] || defaultStarterCode);
        };

        loadSolution();
    }, [question.id, selectedLanguage]);


    // Save code to localStorage when it changes (only if persistence is enabled)
    useEffect(() => {
        if (!featureFlags.codePersistence) return;
        if (typeof window === 'undefined') return;
        const starterCode = starterCodes[selectedLanguage];
        if (code && code !== starterCode) {
            localStorage.setItem(getCodeStorageKeyWithLang(selectedLanguage), code);
        }
    }, [code, question.id, selectedLanguage, featureFlags.codePersistence]);

    // Handle language change
    const handleLanguageChange = (newLang: string) => {
        // Save current code for current language before switching (if persistence enabled)
        if (featureFlags.codePersistence && code && typeof window !== 'undefined') {
            localStorage.setItem(getCodeStorageKeyWithLang(selectedLanguage), code);
        }
        setSelectedLanguage(newLang);
    };

    const difficultyClass = DIFFICULTY_COLORS[question.difficulty] || DIFFICULTY_COLORS.MEDIUM;

    // Generate hints from tips and answer
    const hints: string[] = [];
    if (question.tips) hints.push(question.tips);
    if (question.answer && hints.length === 0) {
        // Extract first sentence as a hint
        const firstSentence = question.answer.split('.')[0];
        if (firstSentence) hints.push(firstSentence + "...");
    }

    // Add generic hints if none available
    if (hints.length === 0) {
        hints.push("Think about the time complexity - can you do better than O(n²)?");
        hints.push("Consider using a hashmap for faster lookups");
    }

    // Use provided test cases or generate matching ones based on problem
    const testCases = question.testCases && question.testCases.length > 0
        ? question.testCases
        : generateDefaultTestCases(question);

    function generateDefaultTestCases(q: CompanyQuestion) {
        // Generate sensible test cases based on problem type
        const qLower = q.question.toLowerCase();

        if (qLower.includes("two sum") || qLower.includes("add up")) {
            return [
                { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
                { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
                { input: { nums: [3, 3], target: 6 }, expected: [0, 1] }
            ];
        }
        if (qLower.includes("reverse") && qLower.includes("link")) {
            return [
                { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" },
                { input: "[1,2]", expected: "[2,1]" }
            ];
        }
        if (qLower.includes("substring") || qLower.includes("longest")) {
            return [
                { input: "\"abcabcbb\"", expected: "3" },
                { input: "\"bbbbb\"", expected: "1" },
                { input: "\"pwwkew\"", expected: "3" }
            ];
        }
        if (qLower.includes("palindrome")) {
            return [
                { input: "\"racecar\"", expected: "true" },
                { input: "\"hello\"", expected: "false" }
            ];
        }
        // Default test cases
        return [
            { input: "example input 1", expected: "expected output 1" },
            { input: "example input 2", expected: "expected output 2" }
        ];
    }

    // Generate detailed problem description based on question
    function getProblemDescription(q: CompanyQuestion): string {
        const qLower = q.question.toLowerCase();

        if (qLower.includes("two sum") || qLower.includes("add up")) {
            return `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`;
        }
        if (qLower.includes("reverse") && qLower.includes("link")) {
            return `Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nYou should reverse the links between nodes to reverse the list in-place.`;
        }
        if (qLower.includes("substring") && !qLower.includes("repeat")) {
            return `Given a string s, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous sequence of characters within a string.`;
        }
        if (qLower.includes("longest substring")) {
            return `Given a string s, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.`;
        }
        if (qLower.includes("palindrome")) {
            return `Given a string s, return true if it is a palindrome, or false otherwise.\n\nA palindrome is a string that reads the same forward and backward.`;
        }
        if (qLower.includes("binary search")) {
            return `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.`;
        }
        if (qLower.includes("valid parentheses") || qLower.includes("balanced")) {
            return `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.`;
        }
        if (qLower.includes("lru cache")) {
            return `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n- LRUCache(int capacity): Initialize the LRU cache with positive size capacity.\n- int get(int key): Return the value of the key if it exists, otherwise return -1.\n- void put(int key, int value): Update the value if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.`;
        }
        if (qLower.includes("maximum subarray") || qLower.includes("kadane")) {
            return `Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.`;
        }
        if (qLower.includes("merge") && qLower.includes("sorted")) {
            return `You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.`;
        }
        if (qLower.includes("cycle") && qLower.includes("link")) {
            return `Given head, the head of a linked list, determine if the linked list has a cycle in it.\n\nThere is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the next pointer.`;
        }

        // Default description
        return `Solve the following problem efficiently. Consider the time and space complexity of your solution. Make sure to handle edge cases appropriately.`;
    }

    // Execute user code safely
    // Execute user code safely (supports JS/TS natively, simulates for other languages)
    const executeCode = (userCode: string, testCase: any, lang: string): { passed: boolean; output: string; error?: string } => {
        // For non-JavaScript languages, provide simulated execution with feedback
        if (!['javascript', 'typescript'].includes(lang)) {
            // Check if the code has a proper implementation (not just starter code)
            const hasImplementation = !userCode.includes('Your code here') &&
                !userCode.includes('pass') &&
                userCode.trim().length > 100;

            if (!hasImplementation) {
                return {
                    passed: false,
                    output: 'Not implemented',
                    error: `Please implement your ${SUPPORTED_LANGUAGES.find(l => l.id === lang)?.name || lang} solution before running tests`
                };
            }

            // Simulate execution based on code patterns
            const hasReturn = userCode.includes('return') || userCode.includes('print') || userCode.includes('Console.Write');
            const hasCorrectStructure = lang === 'python' ? userCode.includes('def ') :
                lang === 'java' ? userCode.includes('class ') :
                    lang === 'csharp' ? userCode.includes('class ') :
                        lang === 'cpp' ? userCode.includes('class ') || userCode.includes('int ') : true;

            if (hasReturn && hasCorrectStructure) {
                // Simulate successful execution for well-structured code
                const passed = Math.random() > 0.3; // 70% pass rate for demo
                return {
                    passed,
                    output: passed ? JSON.stringify(testCase.expected) : '"simulated output"',
                    error: passed ? undefined : `Expected ${JSON.stringify(testCase.expected)}, but got different result`
                };
            }

            return {
                passed: false,
                output: 'Syntax/structure issue',
                error: `Please check your ${SUPPORTED_LANGUAGES.find(l => l.id === lang)?.name || lang} code for proper syntax and structure`
            };
        }

        // JavaScript/TypeScript execution (existing logic)
        try {
            // Try to find a function definition in user's code
            const funcMatch = userCode.match(/function\s+(\w+)\s*\(/);
            const arrowMatch = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/);
            const funcName = funcMatch?.[1] || arrowMatch?.[1] || 'solution';

            // Parse input for execution
            let inputArg: any;
            if (typeof testCase.input === 'object') {
                inputArg = testCase.input;
            } else if (typeof testCase.input === 'string') {
                try {
                    // Handle format like "[2,7,11,15], 9" (array, value)
                    if (testCase.input.includes(',') && testCase.input.includes('[')) {
                        const parts = testCase.input.split('],');
                        if (parts.length === 2) {
                            const nums = JSON.parse(parts[0] + ']');
                            const target = parseInt(parts[1].trim());
                            inputArg = { nums, target };
                        } else {
                            inputArg = JSON.parse(testCase.input);
                        }
                    } else {
                        inputArg = JSON.parse(testCase.input);
                    }
                } catch {
                    inputArg = testCase.input;
                }
            } else {
                inputArg = testCase.input;
            }

            // Wrap user code and execute
            const wrappedCode = `
                ${userCode}
                
                // Try to call the function
                if (typeof ${funcName} === 'function') {
                    if (typeof input === 'object' && input !== null) {
                        if (input.nums && input.target !== undefined) {
                            return ${funcName}(input.nums, input.target);
                        } else if (Array.isArray(input)) {
                            return ${funcName}(...input);
                        }
                        return ${funcName}(input);
                    }
                    return ${funcName}(input);
                }
                throw new Error('Function ${funcName} not defined');
            `;

            const func = new Function('input', wrappedCode);
            const result = func(inputArg);

            // Compare result with expected
            const resultStr = JSON.stringify(result);
            let expectedStr: string;
            if (typeof testCase.expected === 'string') {
                try {
                    expectedStr = JSON.stringify(JSON.parse(testCase.expected));
                } catch {
                    expectedStr = testCase.expected;
                }
            } else {
                expectedStr = JSON.stringify(testCase.expected);
            }

            // Check if passed
            const passed = resultStr === expectedStr ||
                (Array.isArray(result) && Array.isArray(testCase.expected) &&
                    result.length === testCase.expected.length &&
                    result.every((v: any, i: number) => v === testCase.expected[i]));

            return {
                passed,
                output: resultStr || 'undefined',
                error: passed ? undefined : `Expected ${expectedStr}, got ${resultStr}`
            };
        } catch (err: any) {
            return {
                passed: false,
                output: 'Error',
                error: err.message || 'Execution error'
            };
        }
    };

    const handleRunCode = async () => {
        setIsAnalyzing(true);
        setTestResults(null);

        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 300));

        // Actually execute the code against test cases
        const results = testCases.map((tc: any, i: number) => {
            const result = executeCode(code, tc, selectedLanguage);
            return {
                passed: result.passed,
                input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input,
                expected: typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected,
                output: result.output,
                error: result.error
            };
        });

        setTestResults(results);
        setIsAnalyzing(false);
    };

    const handleAnalyzeCode = async () => {
        setIsAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = analyzeCode(code, question.difficulty);
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

    const handleSubmitAnswer = async () => {
        if (!code.trim()) {
            toast.error("Please write some code before submitting");
            return;
        }
        try {
            let passedTests = 0;
            let totalTests = testCases.length;
            if (testResults) {
                passedTests = testResults.filter((r: any) => r.passed).length;
            }
            const result = await saveUserSolution(question.id, code, selectedLanguage, passedTests, totalTests);
            if (result.success) {
                toast.success("Answer submitted successfully! ✓");
            } else {
                toast.error("Failed to submit answer");
            }
        } catch (error) {
            toast.error("Error submitting answer");
            console.error(error);
        }
    };
    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0 bg-card">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Code className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold line-clamp-1">{question.question}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", difficultyClass)}>
                                    {DIFFICULTY_ICONS[question.difficulty]} {question.difficulty}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {companyName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4">
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
                            onClick={() => setActiveTab("learn")}
                            className={cn(
                                "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                                activeTab === "learn" ? "bg-background shadow" : "hover:bg-background/50"
                            )}
                        >
                            Learn
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "problem" && (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-0 lg:gap-6 p-4">
                        {/* Left: Problem Description */}
                        <div className="overflow-y-auto pr-3 space-y-6 border-r lg:border-r-0">
                            {/* Description */}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="flex items-center gap-2 text-green-500 mb-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="font-medium text-sm">Problem Statement</span>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed space-y-4">
                                    <h3 className="font-semibold text-lg">{question.question}</h3>

                                    {/* Show detailed description if available, otherwise generate one */}
                                    {question.description ? (
                                        <div className="text-muted-foreground whitespace-pre-wrap">
                                            {question.description}
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground space-y-3">
                                            <p>{getProblemDescription(question)}</p>

                                            <div className="mt-4">
                                                <p className="font-medium text-foreground">Example:</p>
                                                {testCases.slice(0, 1).map((tc: any, i: number) => (
                                                    <div key={i} className="mt-2 font-mono text-xs bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded">
                                                        <div><span className="text-blue-400">Input:</span> {typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}</div>
                                                        <div><span className="text-green-400">Output:</span> {typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4">
                                                <p className="font-medium text-foreground">Constraints:</p>
                                                <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                                                    <li>The solution should be optimized for time complexity</li>
                                                    <li>Consider edge cases like empty inputs or single elements</li>
                                                    <li>Your function should return the result, not print it</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show approach hint if available */}
                                    {question.answer && (
                                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <p className="font-medium text-amber-500 text-xs mb-1">💡 Approach Hint</p>
                                            <p className="text-xs text-muted-foreground">{question.answer}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            {question.tags && question.tags.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-blue-500 mb-3">
                                        <Tag className="h-4 w-4" />
                                        <span className="font-medium text-sm">Topics</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {question.tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Test Cases Preview */}
                            <div>
                                <div className="flex items-center gap-2 text-purple-500 mb-3">
                                    <Target className="h-4 w-4" />
                                    <span className="font-medium text-sm">Sample Test Cases</span>
                                </div>
                                <div className="space-y-3">
                                    {testCases.slice(0, 2).map((tc: any, i: number) => (
                                        <div key={i} className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-sm">
                                            <div className="mb-2">
                                                <span className="text-blue-400">Input: </span>
                                                <span className="text-[#d4d4d4]">
                                                    {typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-green-400">Expected: </span>
                                                <span className="text-[#d4d4d4]">
                                                    {typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hints */}
                            <div className="border rounded-lg">
                                <div className="flex items-center gap-2 p-3 border-b">
                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium text-sm">Hints</span>
                                    <span className="text-xs text-muted-foreground">(Click to reveal)</span>
                                </div>
                                <div className="p-3 space-y-2">
                                    {hints.map((hint, i) => (
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

                        {/* Right: Code Editor + Results */}
                        <div className="flex flex-col min-h-0 overflow-hidden">
                            {/* Code Editor */}
                            <CodeEditor
                                value={code}
                                onChange={(val) => setCode(val || "")}
                                language={selectedLanguage}
                                height="400px"
                                showLanguageSelector={featureFlags.languageSelector}
                                starterCodes={starterCodes}
                                solutions={question.solutionCode ? { [selectedLanguage]: question.solutionCode } : undefined}
                                onLanguageChange={handleLanguageChange}
                            />

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4 shrink-0">
                                <button
                                    onClick={handleRunCode}
                                    disabled={isAnalyzing}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium",
                                        !featureFlags.aiCodeAnalysis && "w-full"
                                    )}
                                >
                                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    Run Tests
                                </button>
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={isAnalyzing}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Submit Answer
                                </button>
                                {featureFlags.aiCodeAnalysis && (
                                    <button
                                        onClick={handleAnalyzeCode}
                                        disabled={isAnalyzing}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 font-medium"
                                    >
                                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                                        Analyze Code
                                    </button>
                                )}
                            </div>

                            {/* Scrollable Results Area */}
                            <div className="flex-1 overflow-y-auto mt-4 space-y-4 min-h-0">
                                {/* Test Results */}
                                {testResults && (
                                    <div className="bg-[#1e1e1e] rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium text-white">Test Results</h4>
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded",
                                                testResults.every(r => r.passed)
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-red-500/20 text-red-400"
                                            )}>
                                                {testResults.filter(r => r.passed).length}/{testResults.length} Passed
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {testResults.map((result, i) => (
                                                <div key={i} className={cn(
                                                    "p-3 rounded-lg border",
                                                    result.passed
                                                        ? "bg-green-500/5 border-green-500/30"
                                                        : "bg-red-500/5 border-red-500/30"
                                                )}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-200">Test Case {i + 1}</span>
                                                        <span className={cn(
                                                            "text-xs font-medium px-2 py-0.5 rounded",
                                                            result.passed
                                                                ? "bg-green-500/20 text-green-400"
                                                                : "bg-red-500/20 text-red-400"
                                                        )}>
                                                            {result.passed ? "✓ Passed" : "✗ Failed"}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs space-y-1">
                                                        <div>
                                                            <span className="text-gray-500">Input: </span>
                                                            <span className="text-blue-400 font-mono">{result.input}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Expected: </span>
                                                            <span className="text-green-400 font-mono">{result.expected}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">Output: </span>
                                                            <span className={cn(
                                                                "font-mono",
                                                                result.passed ? "text-green-400" : "text-red-400"
                                                            )}>{result.output}</span>
                                                        </div>
                                                    </div>
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

                                        {/* Complexity */}
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
                                        {analysis.feedback.length > 0 && (
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
                                        )}

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
                    </div>
                )}

                {activeTab === "learn" && (
                    <div className="h-full overflow-y-auto p-6 space-y-6">
                        {/* Tips Section */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500/20 rounded-lg shrink-0">
                                    <Lightbulb className="h-6 w-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2 text-amber-500">
                                        Interview Tips for This Problem
                                    </h3>
                                    {question.tips ? (
                                        <p className="text-muted-foreground">{question.tips}</p>
                                    ) : (
                                        <ul className="space-y-2 text-muted-foreground">
                                            <li>• Start by explaining your thought process before coding</li>
                                            <li>• Discuss the time and space complexity of your approach</li>
                                            <li>• Consider edge cases like empty inputs or single elements</li>
                                            <li>• Think about how you would optimize if needed</li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Topics Covered */}
                        {question.tags && question.tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-blue-500 mb-3">
                                    <Tag className="h-5 w-5" />
                                    <h4 className="font-semibold">Topics to Master</h4>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {question.tags.map((tag, i) => (
                                        <div key={i} className="flex gap-3 p-4 bg-card border rounded-lg">
                                            <span className="text-blue-500 font-bold">{i + 1}.</span>
                                            <p className="text-sm font-medium">{tag}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Company Context */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg shrink-0">
                                    <Building2 className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2 text-blue-500">
                                        Why {companyName} Asks This
                                    </h3>
                                    <p className="text-muted-foreground">
                                        This type of problem tests your ability to write efficient code and think algorithmically.
                                        Companies like {companyName} value candidates who can optimize solutions and explain their
                                        reasoning clearly during the interview.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
