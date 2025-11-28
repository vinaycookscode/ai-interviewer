"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface InsightsCardProps {
    insights: string | null;
    isLoading: boolean;
}

export function InsightsCard({ insights, isLoading }: InsightsCardProps) {
    return (
        <Card className="h-full border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Growth Insights</CardTitle>
                <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-primary/10 rounded w-3/4"></div>
                        <div className="h-4 bg-primary/10 rounded w-full"></div>
                        <div className="h-4 bg-primary/10 rounded w-5/6"></div>
                    </div>
                ) : insights ? (
                    <div className="text-sm text-muted-foreground prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{insights}</ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Complete more interviews to unlock personalized AI insights.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
