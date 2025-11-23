import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { DocumentUploadClient } from "./client";

export default async function DocumentUploadPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/auth/login");
    }

    const { id } = await params;

    const interview = await db.interview.findUnique({
        where: { id },
        include: {
            job: true,
            candidate: true,
        },
    });

    if (!interview) {
        notFound();
    }

    // Verify user is the candidate
    if (!session.user || session.user.email !== interview.candidate.email) {
        redirect("/candidate/dashboard");
    }

    return (
        <DocumentUploadClient
            interviewId={interview.id}
            jobTitle={interview.job.title}
            requireResume={interview.job.requireResume}
            requireAadhar={interview.job.requireAadhar}
            requirePAN={interview.job.requirePAN}
            existingDocs={{
                resumeUrl: interview.resumeUrl,
                aadharUrl: interview.aadharUrl,
                panUrl: interview.panUrl,
            }}
        />
    );
}
