import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Clock, CheckCircle, Calendar, Upload } from "lucide-react";
import { redirect } from "next/navigation";
import { canStartInterview, getTimeUntilInterview } from "@/lib/interview-timing";
import { DashboardRefresher } from "@/components/candidate/dashboard-refresher";

export default async function CandidateDashboardPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/auth/login");
    }

    // Find candidate user in database
    const candidate = await db.user.findUnique({
        where: { id: userId },
        include: {
            interviews: {
                include: {
                    job: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!candidate) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>No Interviews Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            You haven't been invited to any interviews yet.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const upcomingInterviews = candidate.interviews.filter(
        (i) => i.status === "PENDING" || i.status === "IN_PROGRESS"
    );
    const pastInterviews = candidate.interviews.filter((i) => i.status === "COMPLETED");

    return (
        <div className="min-h-screen bg-background p-8">
            <DashboardRefresher />
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        My Interviews
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View your interview invitations and results
                    </p>
                </div>

                {/* Upcoming Interviews */}
                <section>
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        Upcoming Interviews
                    </h2>
                    {upcomingInterviews.length === 0 ? (
                        <p className="text-muted-foreground italic">No upcoming interviews.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingInterviews.map((interview) => (
                                <InterviewCard key={interview.id} interview={interview} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Interviews */}
                <section>
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Past Interviews
                    </h2>
                    {pastInterviews.length === 0 ? (
                        <p className="text-muted-foreground italic">No past interviews.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastInterviews.map((interview) => (
                                <InterviewCard key={interview.id} interview={interview} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function InterviewCard({ interview }: { interview: any }) {
    const canStart = canStartInterview(interview.scheduledTime);
    const timeUntil = getTimeUntilInterview(interview.scheduledTime);
    const needsDocuments = false; // Documents are optional

    return (
        <Card className="hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2 leading-tight">
                        {interview.job.title}
                    </CardTitle>
                    <Badge
                        variant={
                            interview.status === "COMPLETED"
                                ? "default"
                                : interview.status === "IN_PROGRESS"
                                    ? "secondary"
                                    : "outline"
                        }
                        className="shrink-0"
                    >
                        {interview.status.replace("_", " ")}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Invited {new Date(interview.createdAt).toLocaleDateString()}
                </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1">
                    {interview.scheduledTime && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                                <span suppressHydrationWarning className="font-medium text-foreground">
                                    {new Date(interview.scheduledTime).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </span>
                        </div>
                    )}
                    {interview.expiresAt && interview.status === "PENDING" && (
                        <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                                Expires: <span suppressHydrationWarning>
                                    {new Date(interview.expiresAt).toLocaleDateString()}
                                </span>
                            </span>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {interview.job.description}
                    </p>
                </div>

                {/* Score for Past Interviews */}
                {interview.score && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                        <p className="text-xs font-medium mb-1 text-muted-foreground">Score</p>
                        <p className="text-xl font-bold text-primary">
                            {interview.score.toFixed(1)}/10
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-2">
                    {interview.status === "PENDING" && (
                        <>
                            {interview.expiresAt && new Date() > new Date(interview.expiresAt) ? (
                                <Button disabled className="w-full variant-destructive opacity-80">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Expired
                                </Button>
                            ) : needsDocuments ? (
                                <Button variant="default" className="w-full" asChild>
                                    <Link href={`/candidate/interview/${interview.id}/documents`}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Docs
                                    </Link>
                                </Button>
                            ) : canStart && interview.token ? (
                                <Button className="w-full" asChild>
                                    <Link href={`/interview/${interview.id}?token=${interview.token}`}>
                                        Start
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled className="w-full variant-secondary opacity-80">
                                    <Clock className="h-4 w-4 mr-2" />
                                    {timeUntil}
                                </Button>
                            )}
                        </>
                    )}
                    {interview.status === "COMPLETED" && (
                        <Button variant="outline" className="w-full" asChild>
                            <Link href={`/candidate/interview/${interview.id}/feedback`}>
                                <FileText className="h-4 w-4 mr-2" />
                                Feedback
                            </Link>
                        </Button>
                    )}
                    {interview.status === "IN_PROGRESS" && interview.token && (
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href={`/interview/${interview.id}?token=${interview.token}`}>
                                Continue
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
