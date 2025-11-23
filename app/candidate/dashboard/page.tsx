import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Clock, CheckCircle, Calendar, Upload } from "lucide-react";
import { redirect } from "next/navigation";
import { canStartInterview, getTimeUntilInterview } from "@/lib/interview-timing";

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

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        My Interviews
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View your interview invitations and results
                    </p>
                </div>

                <div className="grid gap-6">
                    {candidate.interviews.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-lg font-semibold mb-2">No interviews yet</p>
                                <p className="text-muted-foreground">
                                    You'll see your interview invitations here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        candidate.interviews.map((interview) => {
                            const canStart = canStartInterview(interview.scheduledTime);
                            const timeUntil = getTimeUntilInterview(interview.scheduledTime);
                            const needsDocuments =
                                (interview.job.requireResume && !interview.resumeUrl) ||
                                (interview.job.requireAadhar && !interview.aadharUrl) ||
                                (interview.job.requirePAN && !interview.panUrl);

                            return (
                                <Card
                                    key={interview.id}
                                    className="hover:shadow-lg transition-shadow"
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl">
                                                    {interview.job.title}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Invited on <span suppressHydrationWarning>{new Date(interview.createdAt).toLocaleString()}</span>
                                                </p>
                                                {interview.scheduledTime && (
                                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-muted-foreground">
                                                            Scheduled: <span suppressHydrationWarning>{new Date(interview.scheduledTime).toLocaleString()}</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <Badge
                                                variant={
                                                    interview.status === "COMPLETED"
                                                        ? "default"
                                                        : interview.status === "IN_PROGRESS"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                            >
                                                {interview.status === "PENDING" && (
                                                    <Clock className="h-3 w-3 mr-1" />
                                                )}
                                                {interview.status === "COMPLETED" && (
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                )}
                                                {interview.status.replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {interview.job.description}
                                        </p>

                                        {/* Document Status */}
                                        {(interview.job.requireResume || interview.job.requireAadhar || interview.job.requirePAN) && (
                                            <div className="mb-4 p-3 bg-muted rounded-lg">
                                                <p className="text-sm font-medium mb-2">Required Documents:</p>
                                                <div className="space-y-1 text-sm">
                                                    {interview.job.requireResume && (
                                                        <div className="flex items-center gap-2">
                                                            {interview.resumeUrl ? (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Upload className="h-4 w-4 text-orange-600" />
                                                            )}
                                                            <span>Resume {interview.resumeUrl ? "(Uploaded)" : "(Required)"}</span>
                                                        </div>
                                                    )}
                                                    {interview.job.requireAadhar && (
                                                        <div className="flex items-center gap-2">
                                                            {interview.aadharUrl ? (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Upload className="h-4 w-4 text-orange-600" />
                                                            )}
                                                            <span>Aadhar {interview.aadharUrl ? "(Uploaded)" : "(Required)"}</span>
                                                        </div>
                                                    )}
                                                    {interview.job.requirePAN && (
                                                        <div className="flex items-center gap-2">
                                                            {interview.panUrl ? (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Upload className="h-4 w-4 text-orange-600" />
                                                            )}
                                                            <span>PAN Card {interview.panUrl ? "(Uploaded)" : "(Required)"}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Score Display */}
                                        {interview.score && (
                                            <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                                                <p className="text-sm font-medium mb-1">Your Score</p>
                                                <p className="text-2xl font-bold text-primary">
                                                    {interview.score.toFixed(1)}/10
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {interview.status === "PENDING" && (
                                                <>
                                                    {needsDocuments ? (
                                                        <Button variant="default" className="w-full" asChild>
                                                            <Link href={`/candidate/interview/${interview.id}/documents`}>
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Upload Documents
                                                            </Link>
                                                        </Button>
                                                    ) : canStart && interview.token ? (
                                                        <Button className="w-full" asChild>
                                                            <Link href={`/interview/${interview.id}?token=${interview.token}`}>
                                                                Start Interview
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button disabled className="w-full">
                                                            <Clock className="h-4 w-4 mr-2" />
                                                            {timeUntil}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {interview.status === "COMPLETED" && (
                                                <Button variant="outline" className="w-full" asChild>
                                                    <Link href={`/interview/${interview.id}/feedback`}>
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        View Feedback
                                                    </Link>
                                                </Button>
                                            )}
                                            {interview.status === "IN_PROGRESS" && interview.token && (
                                                <Button variant="secondary" className="w-full" asChild>
                                                    <Link href={`/interview/${interview.id}?token=${interview.token}`}>
                                                        Continue Interview
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
