import { CreateJobForm } from "@/components/jobs/create-job-form";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default async function NewJobPage() {
    const isEnabled = await checkFeature(FEATURES.JOB_MANAGEMENT);

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
                            Job creation is currently disabled by the administrator.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Post a New Job</h1>
                <p className="text-gray-500 mt-2">
                    Create a job posting to start interviewing candidates with AI.
                </p>
            </div>
            <CreateJobForm />
        </div>
    );
}
