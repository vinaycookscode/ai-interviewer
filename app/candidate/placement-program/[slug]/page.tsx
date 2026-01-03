import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getProgramBySlug, getUserEnrollment, getDayTasks, generateDayToken, validateDayToken } from "@/actions/placement-program";
import { ProgramDashboardClient } from "./client";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProgramDashboardPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const urlParams = await searchParams;

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

    // Determine day to view using secure token validation
    let viewDay = enrollment.currentDay;
    const dayToken = urlParams.d;

    if (dayToken && typeof dayToken === "string") {
        const requestedDay = await validateDayToken(enrollment.id, dayToken, program.durationDays);

        if (requestedDay !== null && requestedDay >= 1 && requestedDay <= enrollment.currentDay) {
            viewDay = requestedDay;
        } else {
            // Invalid token or unauthorized day - redirect to current day
            const currentDayToken = await generateDayToken(enrollment.id, enrollment.currentDay);
            redirect(`/candidate/placement-program/${slug}?d=${currentDayToken}`);
        }
    } else {
        // No token provided, generate one for current day
        const currentDayToken = await generateDayToken(enrollment.id, enrollment.currentDay);
        redirect(`/candidate/placement-program/${slug}?d=${currentDayToken}`);
    }


    // Get tasks for the specific day
    const dayData = await getDayTasks(enrollment.id, viewDay);

    // Generate navigation tokens
    const currentDayToken = await generateDayToken(enrollment.id, enrollment.currentDay);
    const prevDayToken = viewDay > 1
        ? await generateDayToken(enrollment.id, viewDay - 1)
        : undefined;
    const nextDayToken = viewDay < enrollment.currentDay
        ? await generateDayToken(enrollment.id, viewDay + 1)
        : undefined;

    return (
        <ProgramDashboardClient
            program={program}
            enrollment={enrollment}
            dayData={dayData as any}
            viewDay={viewDay}
            currentDayToken={currentDayToken}
            prevDayToken={prevDayToken}
            nextDayToken={nextDayToken}
        />
    );
}

