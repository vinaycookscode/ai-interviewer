import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { ResumeScreenerView } from "@/components/candidate/resume-screener-view";
import { redirect, notFound } from "next/navigation";
import { getUserProfile } from "@/actions/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default async function ResumeScreenerPage() {
    const isEnabled = await checkFeature(FEATURES.RESUME_SCREENER);

    if (!isEnabled) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted p-3 rounded-full mb-4 w-fit">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Feature Unavailable</CardTitle>
                        <CardDescription>
                            The Resume Screener feature is currently disabled by the administrator.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const user = await getUserProfile();
    const userProfile = user as any;
    const candidateProfile = userProfile?.candidateProfile;

    return <ResumeScreenerView profileResumeUrl={candidateProfile?.resumeUrl} profileResumeName={candidateProfile?.resumeName} />;
}
