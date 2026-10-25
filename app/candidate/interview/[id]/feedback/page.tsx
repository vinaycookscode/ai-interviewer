import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getInterviewFeedback } from "@/actions/feedback";
import { FeedbackReport } from "@/components/feedback/feedback-report";

// Renders inside the candidate shell (app/candidate/layout.tsx), which provides the Soft Glass root.
export default async function CandidateFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user;
    if (!user?.id) notFound();

    // Only the candidate, the job's employer or an admin may read this report.
    const isAdmin = user.role === "ADMIN";
    const allowed = await db.interview.findFirst({
        where: isAdmin ? { id } : { id, OR: [{ candidateId: user.id }, { job: { employerId: user.id } }] },
        select: { id: true },
    });
    if (!allowed) notFound();

    const { success, interview, averageScore } = await getInterviewFeedback(id);
    if (!success || !interview) notFound();

    const t = await getTranslations("FeedbackReport");
    const isCandidate = user.email === interview.candidate.email;

    return (
        <div className="mx-auto w-full max-w-[1160px]">
            <FeedbackReport
                interview={interview}
                averageScore={averageScore ?? null}
                viewer={isCandidate ? "candidate" : "employer"}
                back={isCandidate ? { href: "/candidate/dashboard", label: t("backCandidate") } : { href: "/dashboard", label: t("backEmployer") }}
            />
        </div>
    );
}
