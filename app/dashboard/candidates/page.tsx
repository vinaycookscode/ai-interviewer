import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, Lock } from "lucide-react";
import { CandidatesTable } from "@/components/dashboard/candidates-table";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";

export default async function CandidatesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const isEnabled = await checkFeature(FEATURES.CANDIDATE_SEARCH);

    if (!isEnabled) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted p-3 rounded-full mb-4 w-fit">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Feature Unavailable</CardTitle>
                        <CardDescription>
                            Candidate search is currently disabled by the administrator.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return <div>Unauthorized</div>;
    }

    const { page: pageParam } = await searchParams;
    const page = Number(pageParam) || 1;
    const itemsPerPage = 10;

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

    // Pagination
    const totalItems = allInterviews.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInterviews = allInterviews.slice(startIndex, endIndex);

    return (
        <div className="p-4 md:p-8 pb-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        All Candidates
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">
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
                        <CardTitle className="text-lg sm:text-xl">Candidate Interviews ({allInterviews.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto">
                            <CandidatesTable interviews={paginatedInterviews} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {allInterviews.length > itemsPerPage && (
                <div className="flex items-center justify-end space-x-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        asChild
                    >
                        <Link href={`/dashboard/candidates?page=${page - 1}`}>
                            Previous
                        </Link>
                    </Button>
                    <div className="text-sm font-medium">
                        Page {page} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        asChild
                    >
                        <Link href={`/dashboard/candidates?page=${page + 1}`}>
                            Next
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
