import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getProgramBySlug, getUserEnrollment, getDayTasks } from "@/actions/placement-program";
import { ProgramDashboardClient } from "./client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProgramDashboardPage({ params }: PageProps) {
    const { slug } = await params;

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

    // Fetch program
    const program = await getProgramBySlug(slug);
    if (!program) {
        notFound();
    }

    // Check enrollment
    const enrollment = await getUserEnrollment(program.id, session.user.id);
    if (!enrollment) {
        // User is not enrolled, redirect to enrollment page
        redirect("/candidate/placement-program");
    }

    // Get today's tasks
    const dayData = await getDayTasks(enrollment.id, enrollment.currentDay);

    return (
        <ProgramDashboardClient
            program={program}
            enrollment={enrollment}
            dayData={dayData}
        />
    );
}
