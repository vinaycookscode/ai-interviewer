
"use client";

import { BookOpen, Target, Briefcase, GraduationCap, Lightbulb, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyContent {
    conceptTitle: string;
    conceptExplanation: string;
    keyLearnings: string[];
    realWorldUseCases: Array<{
        title: string;
        description: string;
        icon: string;
    }>;
    interviewTips: string[];
}

interface DailyKnowledgePanelProps {
    dayNumber: number;
    title: string;
    content: DailyContent | null;
}

export function DailyKnowledgePanel({ dayNumber, title, content }: DailyKnowledgePanelProps) {
    if (!content) return null;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="shrink-0">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm font-medium">Daily Knowledge</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold leading-tight">{content.conceptTitle}</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    mastering {title.toLowerCase()}
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">

                {/* Concept Deep Dive */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="p-3 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm md:text-base">
                        <div dangerouslySetInnerHTML={{
                            __html: content.conceptExplanation
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400">$1</strong>')
                                .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs md:text-sm">$1</code>')
                                .replace(/\n/g, '<br/>')
                        }} />
                    </div>
                </div>

                {/* Key Takeaways */}
                <div>
                    <div className="flex items-center gap-2 text-green-500 mb-3">
                        <Target className="h-5 w-5 shrink-0" />
                        <h3 className="font-semibold text-sm md:text-base">Key Takeaways</h3>
                    </div>
                    <ul className="space-y-2">
                        {content.keyLearnings.map((learning, i) => (
                            <li key={i} className="flex gap-2 md:gap-3 p-2 md:p-3 bg-card border rounded-lg text-xs md:text-sm">
                                <span className="text-green-500 font-bold shrink-0">{i + 1}.</span>
                                <span className="text-muted-foreground">{learning}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Real World Use Cases */}
                <div>
                    <div className="flex items-center gap-2 text-purple-500 mb-3">
                        <Briefcase className="h-5 w-5 shrink-0" />
                        <h3 className="font-semibold text-sm md:text-base">Real-World Application</h3>
                    </div>
                    <div className="grid gap-2 md:gap-3">
                        {content.realWorldUseCases.map((useCase, i) => (
                            <div key={i} className="flex gap-3 md:gap-4 p-2 md:p-3 bg-muted/30 border rounded-lg hover:border-purple-500/30 transition-colors">
                                <div className="text-xl md:text-2xl shrink-0 bg-background p-1.5 md:p-2 rounded-lg h-10 w-10 md:h-12 md:w-12 flex items-center justify-center">
                                    {useCase.icon}
                                </div>
                                <div className="min-w-0">
                                    <h5 className="font-medium text-xs md:text-sm mb-0.5 truncate">{useCase.title}</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                        {useCase.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interview Tips */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 md:p-5">
                    <div className="flex items-center gap-2 text-amber-500 mb-3">
                        <GraduationCap className="h-5 w-5 shrink-0" />
                        <h3 className="font-semibold text-sm md:text-base">Interview Tips</h3>
                    </div>
                    <ul className="space-y-2 md:space-y-3">
                        {content.interviewTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm">
                                <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
