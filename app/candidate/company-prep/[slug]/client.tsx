"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    Clock,
    Briefcase,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Tag,
    Search,
    IndianRupee,
    TrendingUp,
    Code
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyKnowledgePanel } from "@/components/company-prep/company-knowledge-panel";
import { CompanyDetailSkeleton } from "@/components/company-prep/company-detail-skeleton";
import { CompanyProblemSolver } from "@/components/company-prep/company-problem-solver";
import { getUserSolvedQuestions } from "@/actions/company-prep";

interface InterviewRound {
    name: string;
    type: string;
    duration: number;
    tips: string;
}

interface Question {
    id: string;
    question: string;
    type: string;
    difficulty: string;
    frequency: number;
    answer: string | null;
    tips: string | null;
    tags: string[];
    starterCode?: string | null;
    solutionCode?: string | null;
    testCases?: any;
    language?: string | null;
    roles?: string[];
}

interface CompanyContent {
    overview: string;
    culture: string[];
    interviewTips: string[];
    preparationStrategy: string;
}

interface CodeEditorFeatureFlags {
    languageSelector: boolean;
    codePersistence: boolean;
    aiCodeAnalysis: boolean;
}

interface CompanyDetailClientProps {
    company: {
        id: string;
        company: string;
        slug: string;
        description: string;
        difficulty: string;
        rounds: any;
        salaryRange: any;
        content: any;
        questions: Question[];
        resources: any[];
    };
    userRole?: string;
    featureFlags?: CodeEditorFeatureFlags;
}

const COMPANY_COLORS: Record<string, string> = {
    tcs: "bg-blue-500",
    infosys: "bg-cyan-500",
    wipro: "bg-purple-500",
    amazon: "bg-orange-500",
    google: "bg-green-500",
    microsoft: "bg-blue-600",
    meta: "bg-blue-500",
    flipkart: "bg-yellow-500",
    razorpay: "bg-blue-600",
    "goldman-sachs": "bg-blue-700",
};

const TYPE_COLORS: Record<string, string> = {
    CODING: "text-green-500 bg-green-500/10",
    APTITUDE: "text-cyan-500 bg-cyan-500/10",
    HR: "text-pink-500 bg-pink-500/10",
    GD: "text-purple-500 bg-purple-500/10",
};

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: "text-green-500 bg-green-500/10",
    MEDIUM: "text-yellow-500 bg-yellow-500/10",
    HARD: "text-red-500 bg-red-500/10",
};

export function CompanyDetailClient({ company, userRole, featureFlags }: CompanyDetailClientProps) {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");


    // Code editor modal state
    const [codeModalOpen, setCodeModalOpen] = useState(false);
    const [solvedQuestions, setSolvedQuestions] = useState<Set<string>>(new Set());

    // Load solved questions on mount
    useEffect(() => {
        const loadSolvedQuestions = async () => {
            const result = await getUserSolvedQuestions();
            if (result.success && result.solutions) {
                const solvedIds = new Set(result.solutions.map((s: any) => s.questionId));
                setSolvedQuestions(solvedIds);
            }
        };
        loadSolvedQuestions();
    }, []);
    const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

    const rounds = (company.rounds as InterviewRound[]) || [];
    const salaryRange = company.salaryRange as { min: number; max: number } | null;
    const content = company.content as CompanyContent | null;
    const colorClass = COMPANY_COLORS[company.slug] || "bg-gray-500";

    const toggleQuestion = (id: string) => {
        const newSet = new Set(expandedQuestions);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedQuestions(newSet);
    };

    const openCodeEditor = (question: Question) => {
        setActiveQuestion(question);
        setCodeModalOpen(true);
    };

    const closeCodeEditor = () => {
        setActiveQuestion(null);
        setCodeModalOpen(false);
    };

    // Filter questions
    const filteredQuestions = company.questions.filter(q => {
        if (typeFilter === "MY_ROLE" && userRole && (!q.roles || !q.roles.includes(userRole))) return false;
        if (typeFilter !== "ALL" && typeFilter !== "MY_ROLE" && q.type !== typeFilter) return false;
        if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false;

        const matchesSearch = searchQuery && (
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (q.tags && q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
            (q.roles && q.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase())))
        );

        if (searchQuery && !matchesSearch) return false;
        return true;
    });

    // Get unique types
    const questionTypes = [...new Set(company.questions.map(q => q.type))];

    return (
        <>
            <div className="space-y-8">
                {/* Back Link */}
                <Link
                    href="/candidate/company-prep"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Companies
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0", colorClass)}>
                        <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold">{company.company}</h1>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-sm font-medium",
                                DIFFICULTY_COLORS[company.difficulty] || "bg-gray-500/10"
                            )}>
                                {company.difficulty}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base">{company.description}</p>

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{rounds.length} interview rounds</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>{company.questions.length} practice questions</span>
                            </div>
                            {salaryRange && (
                                <div className="flex items-center gap-2 text-sm text-green-500">
                                    <IndianRupee className="h-4 w-4" />
                                    <span>₹{(salaryRange.min / 100000).toFixed(1)}L - ₹{(salaryRange.max / 100000).toFixed(1)}L</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Grid - Two Column Layout */}
                <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-6 items-start">

                    {/* LEFT COLUMN: Knowledge Panel */}
                    <div className="order-2 lg:order-1 h-auto lg:h-[calc(100vh-200px)] lg:min-h-[500px] lg:sticky lg:top-24">
                        {content ? (
                            <div className="bg-card border rounded-xl p-4 sm:p-6 h-full overflow-hidden flex flex-col shadow-sm">
                                <CompanyKnowledgePanel
                                    companyName={company.company}
                                    content={content}
                                />
                            </div>
                        ) : (
                            <div className="bg-card border rounded-xl p-6 space-y-6">
                                {/* Interview Process */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Interview Process
                                    </h2>

                                    <div className="space-y-4">
                                        {rounds.map((round, index) => (
                                            <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h3 className="font-semibold">{round.name}</h3>
                                                        <span className="text-xs px-2 py-0.5 bg-muted rounded">{round.type}</span>
                                                        <span className="text-xs text-muted-foreground">~{round.duration} min</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                                                        {round.tips}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Questions & Actions */}
                    <div className="order-1 lg:order-2 space-y-6">
                        {/* Interview Process (when we have content) */}
                        {content && (
                            <div className="bg-card border rounded-xl p-4 sm:p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Interview Process ({rounds.length} rounds)
                                </h2>
                                <div className="space-y-3">
                                    {rounds.map((round, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-medium text-sm">{round.name}</h3>
                                                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{round.type}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{round.tips}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Questions Section */}
                        <div className="bg-card border rounded-xl p-4 sm:p-6">
                            <h2 className="text-lg font-semibold mb-4">Practice Questions</h2>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                </div>

                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="px-3 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                                >
                                    <option value="ALL">All Types</option>
                                    {userRole && <option value="MY_ROLE" className="text-primary font-bold">✨ Recommended for {userRole}</option>}
                                    {questionTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>

                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="px-3 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                >
                                    <option value="ALL">All Difficulty</option>
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>

                            {/* Question List */}
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {filteredQuestions.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">
                                        No questions match your filters.
                                    </p>
                                ) : (
                                    filteredQuestions.map((question) => (
                                        <div key={question.id} className="border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleQuestion(question.id)}
                                                className="w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/50 transition-colors text-left"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm mb-2 line-clamp-2">{question.question}</p>
                                                    {solvedQuestions.has(question.id) && (
                                                        <div className="mb-2">
                                                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                                                                ✓ Solved
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                        <span className={cn("text-xs px-2 py-0.5 rounded", TYPE_COLORS[question.type] || "bg-gray-500/10")}>
                                                            {question.type}
                                                        </span>
                                                        <span className={cn("text-xs px-2 py-0.5 rounded", DIFFICULTY_COLORS[question.difficulty])}>
                                                            {question.difficulty}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                            Asked {question.frequency}/10
                                                        </span>
                                                    </div>
                                                </div>
                                                {expandedQuestions.has(question.id) ? (
                                                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                )}
                                            </button>

                                            {expandedQuestions.has(question.id) && (
                                                <div className="px-3 sm:px-4 pb-4 border-t bg-muted/30">
                                                    {/* Solve Button for Coding Questions */}
                                                    {question.type === "CODING" && (
                                                        <button
                                                            onClick={() => openCodeEditor(question)}
                                                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25"
                                                        >
                                                            <Code className="h-4 w-4" />
                                                            Solve in Code Editor
                                                        </button>
                                                    )}

                                                    {question.answer && (
                                                        <div className="mt-4">
                                                            <h4 className="text-sm font-semibold mb-2 text-green-500">Answer</h4>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.answer}</p>
                                                        </div>
                                                    )}
                                                    {question.tips && (
                                                        <div className="mt-4">
                                                            <h4 className="text-sm font-semibold mb-2 text-yellow-500 flex items-center gap-1">
                                                                <Lightbulb className="h-4 w-4" />
                                                                Tips
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">{question.tips}</p>
                                                        </div>
                                                    )}
                                                    {question.tags && question.tags.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                                            {question.tags.map(tag => (
                                                                <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                                                                    <Tag className="h-3 w-3" />
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Page Problem Solver */}
            {codeModalOpen && activeQuestion && (
                <CompanyProblemSolver
                    question={activeQuestion}
                    companyName={company.company}
                    companySlug={company.slug}
                    onClose={closeCodeEditor}
                    featureFlags={featureFlags}
                />
            )}
        </>
    );
}
