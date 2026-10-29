import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { getCurrentSubscription } from "@/actions/subscription";
import { FEATURES } from "@/lib/features";
import { generateDayToken, validateDayToken } from "@/lib/day-token";
import { liveStreak, streakAtRisk, weekRow } from "@/lib/streak";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { ProgramDayClient, type DayIdea, type DayTask } from "./client";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** The day's idea from the module's content, if it has one. */
function asIdea(value: unknown): DayIdea | null {
    if (!value || typeof value !== "object") return null;
    const c = value as Record<string, unknown>;
    if (typeof c.conceptTitle !== "string" || typeof c.conceptExplanation !== "string") return null;
    return {
        title: c.conceptTitle,
        explanation: c.conceptExplanation,
        takeaways: Array.isArray(c.keyLearnings) ? c.keyLearnings.filter((x): x is string => typeof x === "string") : [],
    };
}

export default async function ProgramDayPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { d: dayToken } = await searchParams;

    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");
    const userId = session.user.id;

    const t = await getTranslations("Placement");

    if (!(await checkFeature(FEATURES.PLACEMENT_PROGRAM))) {
        return <p className="py-16 text-center text-sg-muted">{t("unavailable")}</p>;
    }

    // Same plan check as the list, so a day can't be opened directly by URL on the free plan.
    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const program = await db.placementProgram.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true, durationDays: true },
    });
    if (!program) notFound();

    const enrollment = await db.programEnrollment.findUnique({
        where: { userId_programId: { userId, programId: program.id } },
        select: { id: true, status: true, currentDay: true, streak: true, longestStreak: true, lastActiveAt: true, startDate: true },
    });
    if (!enrollment) redirect("/candidate/placement-program");

    // The day comes from a signed token, and only days already reached can be opened.
    const todayHref = `/candidate/placement-program/${slug}?d=${generateDayToken(enrollment.id, enrollment.currentDay)}`;
    const requested = typeof dayToken === "string" ? validateDayToken(enrollment.id, dayToken, program.durationDays) : null;
    if (requested === null || requested < 1 || requested > enrollment.currentDay) redirect(todayHref);
    const viewDay = requested;

    const [module, profile, completions] = await Promise.all([
        db.programModule.findUnique({
            where: { programId_dayNumber: { programId: program.id, dayNumber: viewDay } },
            select: {
                title: true,
                content: true,
                tasks: {
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, type: true, duration: true, content: true, role: true },
                },
            },
        }),
        db.candidateProfile.findUnique({ where: { userId }, select: { primaryRole: true } }),
        db.taskCompletion.findMany({
            where: { enrollmentId: enrollment.id },
            select: { taskId: true, completedAt: true, metadata: true },
        }),
    ]);

    const byTask = new Map(completions.map((c) => [c.taskId, c]));
    // Tasks for everyone, plus those for the candidate's role (all of them before a role is set)
    const role = profile?.primaryRole;
    const tasks: DayTask[] = (module?.tasks ?? [])
        .filter((task) => !task.role || !role || task.role === role)
        .map((task) => {
            const completion = byTask.get(task.id);
            return {
                id: task.id,
                title: task.title,
                type: task.type,
                duration: task.duration,
                content: task.content,
                isStarted: !!completion,
                isCompleted: !!completion?.completedAt,
                savedCode:
                    completion?.metadata && typeof completion.metadata === "object" && "code" in completion.metadata && typeof completion.metadata.code === "string"
                        ? completion.metadata.code
                        : null,
            };
        });

    const paused = enrollment.status === "PAUSED";
    const dayHref = (day: number) => `/candidate/placement-program/${slug}?d=${generateDayToken(enrollment.id, day)}`;

    return (
        <ProgramDayClient
            program={{ name: program.name, durationDays: program.durationDays }}
            enrollment={{
                id: enrollment.id,
                paused,
                finished: enrollment.status === "COMPLETED",
                currentDay: enrollment.currentDay,
                streak: liveStreak(enrollment.streak, enrollment.lastActiveAt, paused),
                longestStreak: enrollment.longestStreak,
                atRisk: streakAtRisk(enrollment.streak, enrollment.lastActiveAt, paused),
            }}
            day={{ number: viewDay, title: module?.title ?? null, idea: asIdea(module?.content) }}
            tasks={tasks}
            week={weekRow(completions.flatMap((c) => (c.completedAt ? [c.completedAt] : [])), enrollment.startDate)}
            nav={{
                prev: viewDay > 1 ? dayHref(viewDay - 1) : null,
                next: viewDay < enrollment.currentDay ? dayHref(viewDay + 1) : null,
                today: viewDay !== enrollment.currentDay ? todayHref : null,
            }}
        />
    );
}
