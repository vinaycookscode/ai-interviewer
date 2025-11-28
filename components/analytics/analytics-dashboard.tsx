"use client";

import { useEffect, useState } from "react";
import { GrowthDataPoint, getGrowthInsights } from "@/actions/analytics";
import { TrendChart } from "@/components/analytics/trend-chart";
import { InsightsCard } from "@/components/analytics/insights-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Activity, TrendingUp } from "lucide-react";

interface AnalyticsDashboardProps {
    initialData: GrowthDataPoint[];
}

export function AnalyticsDashboard({ initialData }: AnalyticsDashboardProps) {
    const [insights, setInsights] = useState<string | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            if (initialData.length === 0) {
                setIsLoadingInsights(false);
                return;
            }

            const result = await getGrowthInsights();
            if (result.success && result.insights) {
                setInsights(result.insights);
            }
            setIsLoadingInsights(false);
        };

        fetchInsights();
    }, [initialData]);

    // Calculate stats
    const totalInterviews = initialData.length;
    const averageScore = totalInterviews > 0
        ? (initialData.reduce((acc, curr) => acc + curr.score, 0) / totalInterviews).toFixed(1)
        : "N/A";

    const latestScore = totalInterviews > 0 ? initialData[initialData.length - 1].score : 0;
    const previousScore = totalInterviews > 1 ? initialData[initialData.length - 2].score : 0;
    const trend = latestScore - previousScore;

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalInterviews}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{averageScore}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Trend</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground">from last interview</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3 h-[400px]">
                <TrendChart data={initialData} />
                <div className="md:col-span-1">
                    <InsightsCard insights={insights} isLoading={isLoadingInsights} />
                </div>
            </div>
        </div>
    );
}
