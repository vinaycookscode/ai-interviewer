"use client";

import { useState } from "react";
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
    Filter,
    Search,
    ExternalLink,
    IndianRupee,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        questions: Question[];
        resources: any[];
    };
}

const COMPANY_COLORS: Record<string, string> = {
    tcs: "bg-blue-500",
    infosys: "bg-cyan-500",
    wipro: "bg-purple-500",
    amazon: "bg-orange-500",
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

export function CompanyDetailClient({ company }: CompanyDetailClientProps) {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const rounds = (company.rounds as InterviewRound[]) || [];
    const salaryRange = company.salaryRange as { min: number; max: number } | null;
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

    // Filter questions
    const filteredQuestions = company.questions.filter(q => {
        if (typeFilter !== "ALL" && q.type !== typeFilter) return false;
        if (difficultyFilter !== "ALL" && q.difficulty !== difficultyFilter) return false;
        if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Get unique types
    const questionTypes = [...new Set(company.questions.map(q => q.type))];

    return (
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
            <div className="flex items-start gap-6">
                <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center", colorClass)}>
                    <Building2 className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{company.company}</h1>
                        <span className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium",
                            DIFFICULTY_COLORS[company.difficulty] || "bg-gray-500/10"
                        )}>
                            {company.difficulty}
                        </span>
                    </div>
                    <p className="text-muted-foreground">{company.description}</p>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4 mt-4">
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

            {/* Interview Process */}
            <div className="bg-card border rounded-xl p-6">
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
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
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

            {/* Questions Section */}
            <div className="bg-card border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Practice Questions</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="ALL">All Types</option>
                        {questionTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="ALL">All Difficulty</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                </div>

                {/* Question List */}
                <div className="space-y-3">
                    {filteredQuestions.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No questions match your filters.
                        </p>
                    ) : (
                        filteredQuestions.map((question) => (
                            <div key={question.id} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleQuestion(question.id)}
                                    className="w-full flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium mb-2">{question.question}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={cn("text-xs px-2 py-0.5 rounded", TYPE_COLORS[question.type] || "bg-gray-500/10")}>
                                                {question.type}
                                            </span>
                                            <span className={cn("text-xs px-2 py-0.5 rounded", DIFFICULTY_COLORS[question.difficulty])}>
                                                {question.difficulty}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                Asked {question.frequency}/10
                                            </span>
                                            {question.tags?.map(tag => (
                                                <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                                                    <Tag className="h-3 w-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {expandedQuestions.has(question.id) ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                </button>

                                {expandedQuestions.has(question.id) && (
                                    <div className="px-4 pb-4 border-t bg-muted/30">
                                        {question.answer && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2 text-green-500">Answer</h4>
                                                <p className="text-sm text-muted-foreground">{question.answer}</p>
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
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
