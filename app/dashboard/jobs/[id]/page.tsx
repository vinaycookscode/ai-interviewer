import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users } from "lucide-react";
import Link from "next/link";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { InviteCandidateDialog } from "@/components/interviews/invite-candidate-dialog";
import { CandidateList } from "@/components/jobs/candidate-list";

export default async function JobDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
        return <div>Unauthorized</div>;
    }

    const job = await db.job.findUnique({
        where: { id },
        include: {
            questions: true,
            employer: true,
            _count: {
                select: { interviews: true },
            },
            interviews: {
                include: {
                    candidate: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!job) {
        notFound();
    }

    // Verify the user owns this job
    if (job.employer.clerkId !== userId) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                    <p className="text-gray-500">
                        Created on {new Date(job.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                        })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/jobs/${job.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                    <DeleteJobButton jobId={job.id} />
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Job Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{job.description}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Interview Questions ({job.questions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {job.questions.length > 0 ? (
                            <ol className="space-y-3">
                                {job.questions.map((question, index) => (
                                    <li key={question.id} className="flex gap-3">
                                        <span className="font-semibold text-gray-500">
                                            {index + 1}.
                                        </span>
                                        <span>{question.text}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-gray-500">No questions added yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Candidates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-500">
                                {job._count.interviews} candidate(s) have been invited for this
                                position.
                            </p>
                            <InviteCandidateDialog jobId={job.id} />
                        </div>

                        <CandidateList interviews={job.interviews as any} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
