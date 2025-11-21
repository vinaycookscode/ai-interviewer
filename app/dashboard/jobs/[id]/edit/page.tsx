import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditJobForm } from "@/components/jobs/edit-job-form";

export default async function EditJobPage({
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
        },
    });

    if (!job) {
        notFound();
    }

    // Verify ownership
    if (job.employer.clerkId !== userId) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Edit Job</h1>
                <p className="text-gray-500 mt-2">
                    Update job details and interview questions.
                </p>
            </div>
            <EditJobForm jobId={job.id} initialData={job} />
        </div>
    );
}
