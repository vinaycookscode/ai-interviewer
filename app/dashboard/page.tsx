import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        return <div>Please sign in</div>;
    }

    // Get user from database
    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            jobs: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage your job postings and interviews</p>
                </div>
                <Link href="/dashboard/jobs/new">
                    <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        New Job
                    </Button>
                </Link>
            </div>

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
                                    Posted {new Date(job.createdAt).toLocaleDateString()}
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
