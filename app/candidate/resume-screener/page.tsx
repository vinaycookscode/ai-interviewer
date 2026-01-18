import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { ResumeScreenerView } from "@/components/candidate/resume-screener-view";
import { getUserProfile } from "@/actions/profile";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { getCurrentSubscription } from "@/actions/subscription";
import { PlanTier } from "@prisma/client";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { getTranslations } from "next-intl/server";

export default async function ResumeScreenerPage() {
    const t = await getTranslations("ResumeScreener");
    const isEnabled = await checkFeature(FEATURES.RESUME_SCREENER);

    if (!isEnabled) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted p-3 rounded-full mb-4 w-fit">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>{t("unavailable.title")}</CardTitle>
                        <CardDescription>
                            {t("unavailable.description")}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Check subscription - block free users
    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;

    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} />;
    }

    const user = await getUserProfile();

    // resumeUrl is on the user object, not candidateProfile
    return <ResumeScreenerView profileResumeUrl={user?.resumeUrl} profileResumeName={user?.resumeName} />;
}


