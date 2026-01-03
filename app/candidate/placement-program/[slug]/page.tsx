import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getProgramBySlug, getUserEnrollment, getDayTasks } from "@/actions/placement-program";
import { ProgramDashboardClient } from "./client";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProgramDashboardPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { day } = await searchParams;

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

    // Determine day to view
    let viewDay = enrollment.currentDay;
    if (day && typeof day === "string") {
        const dayNum = parseInt(day);
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= enrollment.currentDay) {
            viewDay = dayNum;
        }
    }


    // Get tasks for the specific day
    const dayData = await getDayTasks(enrollment.id, viewDay);

    return (
        <ProgramDashboardClient
            program={program}
            enrollment={enrollment}
            dayData={dayData as any}
            viewDay={viewDay}
        />
    );
}
