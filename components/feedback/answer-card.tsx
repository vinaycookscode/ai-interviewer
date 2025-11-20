"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnswerCardProps {
    question: string;
    answer: string;
    score: number | null;
    feedback: string | null;
    index: number;
}

export function AnswerCard({ question, answer, score, feedback, index }: AnswerCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    let scoreColor = "bg-yellow-100 text-yellow-800";
    if (score && score >= 8) scoreColor = "bg-green-100 text-green-800";
    else if (score && score < 5) scoreColor = "bg-red-100 text-red-800";

    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Question {index + 1}</p>
                        <CardTitle className="text-lg">{question}</CardTitle>
                    </div>
                    {score !== null && (
                        <Badge variant="secondary" className={cn("text-sm font-bold px-3 py-1", scoreColor)}>
                            Score: {score}/10
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-slate-500 mb-1">Candidate's Answer:</p>
                        <p className="text-slate-800">{answer}</p>
                    </div>

                    {feedback && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-sm font-semibold text-blue-600 mb-1">AI Feedback:</p>
                            <p className="text-blue-800">{feedback}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
