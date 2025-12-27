import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export default async function DashboardPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return <div>Please sign in</div>;
    }

    // Get user from database
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            jobs: {
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    interviews: {
                        include: {
                            answers: true,
                        },
                    },
                },
            },
        },
    });

    // Aggregate Analytics Data
    const allInterviews = user?.jobs.flatMap((job) => job.interviews) || [];

    // 1. Score Distribution
    const scoreRanges = [
        { range: "0-2", min: 0, max: 2, count: 0 },
        { range: "3-5", min: 3, max: 5, count: 0 },
        { range: "6-8", min: 6, max: 8, count: 0 },
        { range: "9-10", min: 9, max: 10, count: 0 },
    ];

    allInterviews.forEach((interview) => {
        if (interview.score !== null) {
            const score = interview.score;
            const range = scoreRanges.find((r) => score >= r.min && score <= r.max);
            if (range) {
                range.count++;
            }
        }
    });

    const scoreDistribution = scoreRanges.map(({ range, count }) => ({ range, count }));

    // 2. Status Distribution
    const statusCounts: Record<string, number> = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
    };

    allInterviews.forEach((interview) => {
        if (statusCounts[interview.status] !== undefined) {
            statusCounts[interview.status]++;
        }
    });

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace("_", " "),
        count,
    }));

    // 3. Activity Data (Last 7 Days)
    const activityMap = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        activityMap.set(dateString, 0);
    }

    allInterviews.forEach((interview) => {
        const dateString = new Date(interview.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        if (activityMap.has(dateString)) {
            activityMap.set(dateString, (activityMap.get(dateString) || 0) + 1);
        }
    });

    const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({
        date,
        count,
    }));

    return (
        <div className="p-4 md:p-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your job postings and interviews</p>
                </div>
                <Link href="/dashboard/jobs/new">
                    <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        <span className="hidden sm:inline">New Job</span>
                        <span className="sm:hidden">Create Job</span>
                    </Button>
                </Link>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Analytics Overview</h2>
                <AnalyticsCharts
                    scoreDistribution={scoreDistribution}
                    statusDistribution={statusDistribution}
                    activityData={activityData}
                />
            </div>

            <h2 className="text-2xl font-bold mb-4">Recent Jobs</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {user?.jobs && user.jobs.length > 0 ? (
                    user.jobs.map((job) => (
                        <Card
                            key={job.id}
                            className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {job.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Posted {new Date(job.createdAt).toLocaleString()}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {job.description}
                                </p>
                                <Link href={`/dashboard/jobs/${job.id}`}>
                                    <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        View Details →
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-full border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <PlusCircle className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-lg font-semibold mb-2">No jobs posted yet</p>
                            <p className="text-muted-foreground mb-6">Create your first job to start interviewing candidates</p>
                            <Link href="/dashboard/jobs/new">
                                <Button size="lg" className="shadow-lg">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Create Your First Job
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
