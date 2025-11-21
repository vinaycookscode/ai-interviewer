"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";

interface AnalyticsChartsProps {
    scoreDistribution: { range: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
    activityData: { date: string; count: number }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function AnalyticsCharts({
    scoreDistribution,
    statusDistribution,
    activityData,
}: AnalyticsChartsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Interview Activity (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Interview Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {statusDistribution.map((entry, index) => (
                                <div key={entry.status} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm text-muted-foreground capitalize">
                                        {entry.status.toLowerCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-7">
                <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="range"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill="#adfa1d"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
