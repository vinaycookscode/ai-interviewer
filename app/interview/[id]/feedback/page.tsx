import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { softGlassFonts } from "@/lib/fonts";
import { getInterviewFeedback } from "@/actions/feedback";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { AppShell } from "@/components/soft-glass/app-shell";
import { getFeatureFlags } from "@/actions/feature-flags";
import { FeedbackReport } from "@/components/feedback/feedback-report";

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user;
    if (!user?.id) notFound();

    // The action only returns the report to its candidate, the job's employer or an admin.
    const result = await getInterviewFeedback(id);
    if (!result.success) notFound();
    const { interview, averageScore, viewer } = result;

    const t = await getTranslations("FeedbackReport");
    const isAdmin = user.role === "ADMIN";
    const back = viewer === "candidate"
        ? { href: "/candidate/dashboard", label: t("backCandidate") }
        : { href: `/dashboard/jobs/${interview.job.id}`, label: interview.job.title };

    const flags = await getFeatureFlags();
    const flagMap = flags.reduce<Record<string, boolean>>((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});

    // This route sits outside /dashboard, so it brings the same Soft Glass shell itself.
    return (
        <div className={cn(softGlassFonts, "soft-glass relative flex min-h-screen flex-col overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <AppShell
                role={user.role === "CANDIDATE" ? "candidate" : "employer"}
                user={{ name: user.name, email: user.email }}
                isAdmin={isAdmin}
                featureFlags={flagMap}
            >
                <FeedbackReport
                    interview={interview}
                    averageScore={averageScore ?? null}
                    viewer={viewer}
                    back={back}
                />
            </AppShell>
        </div>
    );
}
