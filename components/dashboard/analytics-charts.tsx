"use client";

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

// Lazy load Recharts for better initial page load
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), {
    loading: () => <ChartSkeleton />,
    ssr: false
});
const LineChart = dynamic(() => import("recharts").then(mod => mod.LineChart), {
    loading: () => <ChartSkeleton />,
    ssr: false
});
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });

function ChartSkeleton() {
    return (
        <div className="flex items-center justify-center h-[300px] bg-muted/30 rounded-lg">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                <p className="text-xs text-muted-foreground">Loading chart...</p>
            </div>
        </div>
    );
}

interface AnalyticsChartsProps {
    scoreDistribution: { range: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    activityData: { date: string; count: number }[];
}

export function AnalyticsCharts({
    scoreDistribution,
    statusDistribution,
    activityData,
}: AnalyticsChartsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Score Distribution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Status Distribution Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Interview Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="hsl(var(--accent))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Activity Chart (Last 7 Days) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
