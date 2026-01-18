import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getActivePrograms, getUserEnrollments } from "@/actions/placement-program";
import { PlacementProgramClient } from "./client";
import { getCurrentSubscription } from "@/actions/subscription";
import { PlanTier } from "@prisma/client";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";

export default async function PlacementProgramPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.PLACEMENT_PROGRAM);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    // Check subscription - block free users
    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;

    if (isFreeUser) {
        return <UpgradePrompt feature="90-Day Program" description="Get structured interview preparation with our comprehensive 90-day placement program." />;
    }


    // Fetch data
    const [programs, enrollments] = await Promise.all([
        getActivePrograms(),
        getUserEnrollments(session.user.id)
    ]);

    // Map enrollments by program ID for easy lookup
    const enrollmentsByProgram = new Map(
        enrollments.map(e => [e.programId, e])
    );

    return (
        <PlacementProgramClient
            programs={programs}
            enrollments={enrollments}
            enrollmentsByProgram={Object.fromEntries(enrollmentsByProgram)}
        />
    );
}
