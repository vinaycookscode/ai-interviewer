"use client";

import { BookOpen, Target, Users, Lightbulb, GraduationCap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyContent {
    overview: string;
    culture: string[];
    interviewTips: string[];
    preparationStrategy: string;
}

interface CompanyKnowledgePanelProps {
    companyName: string;
    content: CompanyContent | null;
}

export function CompanyKnowledgePanel({ companyName, content }: CompanyKnowledgePanelProps) {
    if (!content) return null;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="shrink-0">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">Interview Prep Guide</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold leading-tight">Crack {companyName}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Everything you need to prepare for this company
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">

                {/* Overview */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="p-3 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm md:text-base">
                        {content.overview}
                    </div>
                </div>

                {/* Company Culture */}
                <div>
                    <div className="flex items-center gap-2 text-purple-500 mb-3">
                        <Users className="h-5 w-5 shrink-0" />
                        <h3 className="font-semibold text-sm md:text-base">Company Culture</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {content.culture.map((point, i) => (
                            <span
                                key={i}
                                className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-xs md:text-sm"
                            >
                                {point}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Interview Tips */}
                <div>
                    <div className="flex items-center gap-2 text-amber-500 mb-3">
                        <Lightbulb className="h-5 w-5 shrink-0" />
                        <h3 className="font-semibold text-sm md:text-base">Interview Tips</h3>
                    </div>
                    <ul className="space-y-2">
                        {content.interviewTips.map((tip, i) => (
                            <li key={i} className="flex gap-2 md:gap-3 p-2 md:p-3 bg-card border rounded-lg text-xs md:text-sm">
                                <CheckCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Preparation Strategy */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 md:p-5">
                    <div className="flex items-center gap-2 text-green-500 mb-3">
                        <Target className="h-5 w-5 shrink-0" />
                        <h3 className="font-semibold text-sm md:text-base">Preparation Strategy</h3>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {content.preparationStrategy}
                    </p>
                </div>
            </div>
        </div>
    );
}
