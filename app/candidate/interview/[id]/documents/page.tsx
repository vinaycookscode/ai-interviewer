import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { DocumentUploadForm } from "@/components/interview/document-upload-form";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { focusRing } from "@/components/soft-glass/classes";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-validation";
import { cn } from "@/lib/utils";

export default async function DocumentUploadPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();

    if (!session || !session.user) {
        redirect(`/auth/login?callbackUrl=/candidate/interview/${id}/documents`);
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
            <div className="flex flex-1 items-center justify-center py-10">
                <div className="sg-glass flex w-full max-w-md flex-col items-center gap-4 rounded-[24px] p-6 text-center sm:rounded-[28px] sm:p-8">
                    <span className="flex size-12 items-center justify-center rounded-full bg-sg-danger/10 text-sg-danger">
                        <LockKeyhole className="size-6" aria-hidden="true" />
                    </span>
                    <h1 className="font-display sg-soft text-[28px] font-semibold leading-[34px]">No access</h1>
                    <p className="text-sg-muted">You don&apos;t have permission to open this page.</p>
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

    const scheduled = interview.scheduledTime?.toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <Link
                    href="/candidate/dashboard"
                    className={cn(
                        "inline-flex items-center gap-1.5 self-start rounded-full font-semibold text-sg-muted hover:text-sg-text",
                        focusRing
                    )}
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Dashboard
                </Link>
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                    Add your documents
                </h1>
                <p className="text-lg text-sg-muted">
                    The hiring team asks for these before your {interview.job.title} interview. Only they can see them.
                </p>
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <DocumentUploadForm
                    interviewId={id}
                    token={interview.token || ""}
                    requirements={requirements}
                    existingDocs={existingDocs}
                    maxBytes={MAX_UPLOAD_BYTES}
                />
                <aside
                    aria-label="Your interview"
                    className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]"
                >
                    <CoachBubble>
                        <span className="text-sg-muted">
                            A clear phone photo works. Make sure all four corners show and the text isn&apos;t blurry.
                        </span>
                    </CoachBubble>
                    <div className="sg-glass flex flex-col gap-2 rounded-[22px] p-[18px]">
                        <span className="text-[13px] font-bold leading-[18px] text-sg-muted">Your interview</span>
                        <span className="font-bold">{interview.job.title}</span>
                        {scheduled && <span className="text-sg-muted">{scheduled}</span>}
                    </div>
                </aside>
            </div>
        </div>
    );
}
