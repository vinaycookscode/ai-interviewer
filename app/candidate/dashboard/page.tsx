import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function CandidateDashboardPage() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    // Get candidate's email
    const candidateEmail = user.emailAddresses[0]?.emailAddress;

    if (!candidateEmail) {
        return <div>Error: No email found</div>;
    }

    // Find candidate user in database
    const candidate = await db.user.findUnique({
        where: { email: candidateEmail },
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
            <div className="flex items-center justify-center min-h-screen">
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
                        candidate.interviews.map((interview) => (
                            <Card
                                key={interview.id}
                                className="hover:shadow-lg transition-shadow"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl">
                                                {interview.job.title}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Invited on{" "}
                                                {new Date(interview.createdAt).toLocaleString()}
                                            </p>
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

                                    {interview.score && (
                                        <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                                            <p className="text-sm font-medium mb-1">Your Score</p>
                                            <p className="text-2xl font-bold text-primary">
                                                {interview.score.toFixed(1)}/10
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {interview.status === "PENDING" && interview.token && (
                                            <Link
                                                href={`/interview/${interview.id}?token=${interview.token}`}
                                            >
                                                <Button className="w-full">Start Interview</Button>
                                            </Link>
                                        )}
                                        {interview.status === "COMPLETED" && (
                                            <Link href={`/interview/${interview.id}/feedback`}>
                                                <Button variant="outline" className="w-full">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View Feedback
                                                </Button>
                                            </Link>
                                        )}
                                        {interview.status === "IN_PROGRESS" && interview.token && (
                                            <Link
                                                href={`/interview/${interview.id}?token=${interview.token}`}
                                            >
                                                <Button variant="secondary" className="w-full">
                                                    Continue Interview
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
