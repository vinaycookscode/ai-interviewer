import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getInterviewFeedback } from "@/actions/feedback";
import { FeedbackReport } from "@/components/feedback/feedback-report";

// Renders inside the candidate shell (app/candidate/layout.tsx), which provides the Soft Glass root.
export default async function CandidateFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) notFound();

    // The action only returns the report to its candidate, the job's employer or an admin.
    const result = await getInterviewFeedback(id);
    if (!result.success) notFound();
    const { interview, averageScore, viewer } = result;

    const t = await getTranslations("FeedbackReport");

    return (
        <div className="mx-auto w-full max-w-[1160px]">
            <FeedbackReport
                interview={interview}
                averageScore={averageScore ?? null}
                viewer={viewer}
                back={viewer === "candidate" ? { href: "/candidate/dashboard", label: t("backCandidate") } : { href: "/dashboard", label: t("backEmployer") }}
            />
        </div>
    );
}
