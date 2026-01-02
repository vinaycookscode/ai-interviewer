import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getActivePrograms, getUserEnrollments } from "@/actions/placement-program";
import { PlacementProgramClient } from "./client";

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
