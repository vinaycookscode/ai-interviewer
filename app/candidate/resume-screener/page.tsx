import { redirect } from "next/navigation";
import { REVIEWS_SHOWN, readStoredAnalysis } from "@/lib/resume-reviews";
import { isFreeUser as isFree } from "@/lib/free-user";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { getCurrentSubscription } from "@/actions/subscription";
import { FEATURES } from "@/lib/features";
import { ResumeScreenerView } from "@/components/candidate/resume-screener-view";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";

export default async function ResumeScreenerPage() {
    const t = await getTranslations("ResumeScreener");
    const isEnabled = await checkFeature(FEATURES.RESUME_SCREENER);

    if (!isEnabled) {
        return (
            <div className="flex flex-1 items-center justify-center py-10">
                <div className="sg-glass flex w-full max-w-md flex-col items-center gap-4 rounded-[24px] p-6 text-center sm:rounded-[28px] sm:p-8">
                    <span className="flex size-12 items-center justify-center rounded-full bg-sg-chip text-sg-muted">
                        <Lock className="size-6" aria-hidden="true" />
                    </span>
                    <h1 className="font-display sg-soft text-[28px] font-semibold leading-[34px]">{t("unavailable.title")}</h1>
                    <p className="text-sg-muted">{t("unavailable.description")}</p>
                </div>
            </div>
        );
    }

    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const subscription = await getCurrentSubscription();
    const isFreeUser = isFree(subscription);
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} />;
    }

    const [user, reviews] = await Promise.all([
        db.user.findUnique({
            where: { id: session.user.id },
            select: { resumeUrl: true, resumeName: true },
        }),
        // Past reviews, newest first (AIIN-64); the newest opens with its full review
        db.resumeReview.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: REVIEWS_SHOWN,
            select: { id: true, createdAt: true, score: true, label: true },
        }),
    ]);
    const latest = reviews[0]
        ? await db.resumeReview.findUnique({ where: { id: reviews[0].id }, select: { score: true, analysis: true, resumeText: true, jobDescription: true } })
        : null;

    return (
        <ResumeScreenerView
            resumeUrl={user?.resumeUrl ?? null}
            resumeName={user?.resumeName ?? null}
            history={reviews.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), score: r.score, label: r.label }))}
            initial={
                latest && reviews[0]
                    ? {
                          id: reviews[0].id,
                          analysis: { ...readStoredAnalysis(latest.analysis, latest.score), resumeText: latest.resumeText, jobDescription: latest.jobDescription ?? undefined },
                      }
                    : null
            }
        />
    );
}
