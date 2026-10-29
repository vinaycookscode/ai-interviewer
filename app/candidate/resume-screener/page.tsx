import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { PlanTier } from "@prisma/client";
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
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} />;
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { resumeUrl: true, resumeName: true },
    });

    return <ResumeScreenerView resumeUrl={user?.resumeUrl ?? null} resumeName={user?.resumeName ?? null} />;
}
