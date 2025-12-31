import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { PracticeView } from "@/components/candidate/practice-view";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default async function PracticePage() {
    const isEnabled = await checkFeature(FEATURES.PRACTICE_INTERVIEWS);

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
                            The Practice Interview feature is currently disabled by the administrator.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return <PracticeView />;
}
