import { auth } from "@/auth";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { DeleteCandidateButton } from "@/components/dashboard/delete-candidate-button";

export default async function CandidatesPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return <div>Unauthorized</div>;
    }

    // Get employer's jobs and all interviews
    const employer = await db.user.findUnique({
        where: { id: userId },
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
                                    <TableHead>Documents</TableHead>
                                    <TableHead className="w-[180px]">Date</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
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
                                                variant="outline"
                                                className={
                                                    interview.status === "COMPLETED"
                                                        ? interview.score && interview.score >= 8
                                                            ? "text-green-600 border-green-200 bg-green-50"
                                                            : interview.score && interview.score >= 5
                                                                ? "text-yellow-600 border-yellow-200 bg-yellow-50"
                                                                : "text-red-600 border-red-200 bg-red-50"
                                                        : interview.status === "IN_PROGRESS"
                                                            ? "text-blue-600 border-blue-200 bg-blue-50"
                                                            : "text-muted-foreground border-border bg-muted/50"
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
                                            <div className="flex gap-1 flex-wrap">
                                                {interview.resumeUrl && (
                                                    <a
                                                        href={interview.resumeUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Resume
                                                    </a>
                                                )}
                                                {interview.aadharUrl && (
                                                    <a
                                                        href={interview.aadharUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                    >
                                                        Aadhar
                                                    </a>
                                                )}
                                                {interview.panUrl && (
                                                    <a
                                                        href={interview.panUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                                                    >
                                                        PAN
                                                    </a>
                                                )}
                                                {!interview.resumeUrl && !interview.aadharUrl && !interview.panUrl && (
                                                    <span className="text-muted-foreground text-sm">No docs</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(interview.createdAt).toLocaleString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "numeric",
                                                minute: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            {interview.status === "COMPLETED" && (
                                                <Link href={`/interview/${interview.id}/feedback`}>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <FileText className="h-4 w-4 text-primary" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>View Feedback</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </Link>
                                            )}
                                            <DeleteCandidateButton interviewId={interview.id} />
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
