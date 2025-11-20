import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Briefcase } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function CandidatesPage() {
    const { userId } = await auth();

    if (!userId) {
        return <div>Unauthorized</div>;
    }

    // Get employer's jobs and all interviews
    const employer = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            jobs: {
                include: {
                    interviews: {
                        include: {
                            candidate: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            },
        },
    });

    if (!employer) {
        return <div>Error loading data</div>;
    }

    // Flatten all interviews from all jobs
    const allInterviews = employer.jobs.flatMap((job) =>
        job.interviews.map((interview) => ({
            ...interview,
            jobTitle: job.title,
        }))
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        All Candidates
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View all candidates across all job postings
                    </p>
                </div>
            </div>

            {allInterviews.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Briefcase className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-lg font-semibold mb-2">No candidates yet</p>
                        <p className="text-muted-foreground mb-6">
                            Start by creating a job and inviting candidates
                        </p>
                        <Link href="/dashboard/jobs/new">
                            <Button>Create Job</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Candidate Interviews ({allInterviews.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Job Position</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allInterviews.map((interview) => (
                                    <TableRow key={interview.id}>
                                        <TableCell className="font-medium">
                                            {interview.candidate.email}
                                        </TableCell>
                                        <TableCell>{interview.jobTitle}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    interview.status === "COMPLETED"
                                                        ? "default"
                                                        : interview.status === "IN_PROGRESS"
                                                            ? "secondary"
                                                            : "outline"
                                                }
                                            >
                                                {interview.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {interview.score ? (
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        interview.score >= 8
                                                            ? "text-green-600 border-green-200 bg-green-50"
                                                            : interview.score >= 5
                                                                ? "text-yellow-600 border-yellow-200 bg-yellow-50"
                                                                : "text-red-600 border-red-200 bg-red-50"
                                                    }
                                                >
                                                    {interview.score.toFixed(1)}/10
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(interview.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {interview.status === "COMPLETED" && (
                                                <Link href={`/interview/${interview.id}/feedback`}>
                                                    <Button variant="ghost" size="sm">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        View Feedback
                                                    </Button>
                                                </Link>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
