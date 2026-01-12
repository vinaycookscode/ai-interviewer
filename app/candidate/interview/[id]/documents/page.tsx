import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DocumentUploadForm } from "@/components/interview/document-upload-form";

export default async function DocumentUploadPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
        redirect(`/auth/login?callbackUrl=/interview/${id}/documents`);
    }

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
    if (interview.candidateId !== session.user.id) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                    <p className="text-muted-foreground">You do not have permission to access this page.</p>
                </div>
            </div>
        );
    }

    const requirements = {
        resume: interview.job.requireResume,
        aadhar: interview.job.requireAadhar,
        pan: interview.job.requirePAN,
    };

    const existingDocs = {
        resume: !!interview.resumeUrl,
        aadhar: !!interview.aadhaarUrl,
        pan: !!interview.panUrl,
    };

    // If no documents are required, or all are already uploaded, redirect to interview
    const allRequiredUploaded =
        (!requirements.resume || existingDocs.resume) &&
        (!requirements.aadhar || existingDocs.aadhar) &&
        (!requirements.pan || existingDocs.pan);

    if (allRequiredUploaded) {
        redirect(`/interview/${id}?token=${interview.token}`);
    }

    return (
        <div className="container max-w-2xl py-10">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Document Verification</h1>
                <p className="text-muted-foreground">
                    Before starting your interview for <strong>{interview.job.title}</strong>, please upload the required documents.
                </p>
            </div>

            <DocumentUploadForm
                interviewId={id}
                token={interview.token || ""}
                jobTitle={interview.job.title}
                requirements={requirements}
                existingDocs={existingDocs}
            />
        </div>
    );
}
