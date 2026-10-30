import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Flame, LineChart } from "lucide-react";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { getCurrentSubscription } from "@/actions/subscription";
import { FEATURES } from "@/lib/features";
import { istDay, planWeek } from "@/lib/daily-challenge/logic";
import { loadStreak } from "@/lib/daily-challenge/server";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { WeekStreak } from "@/components/placement/week-streak";
import { EnrollButton } from "@/components/placement/enroll-button";
import { coralButton } from "@/components/soft-glass/classes";
import { glassButton, sectionTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export default async function PlacementProgramPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");
    const userId = session.user.id;

    const t = await getTranslations("Placement");

    if (!(await checkFeature(FEATURES.PLACEMENT_PROGRAM))) {
        return <p className="py-16 text-center text-sg-muted">{t("unavailable")}</p>;
    }

    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const [programs, enrollments] = await Promise.all([
        db.placementProgram.findMany({
            where: { isActive: true },
            orderBy: [{ durationDays: "desc" }, { createdAt: "asc" }],
            select: { id: true, slug: true, name: true, description: true, durationDays: true },
        }),
        db.programEnrollment.findMany({
            where: { userId },
            orderBy: { lastActiveAt: "desc" },
            select: {
                id: true,
                programId: true,
                status: true,
                currentDay: true,
                streak: true,
                longestStreak: true,
                lastActiveAt: true,
                startDate: true,
                program: { select: { slug: true, name: true, durationDays: true } },
            },
        }),
    ]);

    const enrolledIn = new Map(enrollments.map((e) => [e.programId, e]));
    const current = enrollments.find((e) => e.status === "ACTIVE" || e.status === "PAUSED") ?? null;
    const featured = current ? null : programs[0] ?? null;
    const others = programs.filter((p) => p.id !== (current?.programId ?? featured?.id));

    let today: { title: string; tasks: number; minutes: number } | null = null;
    let week: ReturnType<typeof planWeek> = [];
    const shared = await loadStreak(userId);
    if (current) {
        const dayModule = await db.programModule.findUnique({
            where: { programId_dayNumber: { programId: current.programId, dayNumber: current.currentDay } },
            select: { title: true, tasks: { select: { duration: true } } },
        });
        if (dayModule) today = { title: dayModule.title, tasks: dayModule.tasks.length, minutes: dayModule.tasks.reduce((sum, task) => sum + task.duration, 0) };
        // The one streak, shared with the daily challenge (AIIN-99)
        week = planWeek(shared.week, istDay(new Date()), istDay(current.startDate));
    }

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            {current && (
                <section
                    aria-label={current.program.name}
                    className="sg-glass sg-shadow-lg grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-6 rounded-[24px] p-5 sm:rounded-[32px] sm:p-8"
                >
                    <div className="flex flex-col gap-4">
                        <span className="inline-flex h-7 items-center self-start rounded-full bg-sg-lavender-soft px-2.5 text-sm font-bold text-sg-lavender-ink">
                            {t("dayOf", { day: current.currentDay, total: current.program.durationDays })}
                        </span>
                        <div className="flex flex-col gap-1.5">
                            <h2 className={sectionTitle}>{current.program.name}</h2>
                            {today && (
                                <p className="text-sg-muted">
                                    {today.title
                                        ? t("today", { topic: today.title, tasks: today.tasks, minutes: today.minutes })
                                        : t("todayNoTopic", { tasks: today.tasks, minutes: today.minutes })}
                                </p>
                            )}
                        </div>
                        <PlanProgress day={current.currentDay} total={current.program.durationDays} t={t} />
                        <Link href={`/candidate/placement-program/${current.program.slug}`} className={cn(coralButton, "h-12 self-start px-6 text-base")}>
                            {t("continue", { day: current.currentDay })}
                        </Link>
                    </div>
                    <div className="flex flex-col gap-4 rounded-[22px] bg-sg-row p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-2.5">
                                <Flame aria-hidden="true" className="size-6 text-sg-coral" />
                                <span className="flex items-baseline gap-1.5">
                                    <span className="font-display sg-soft text-[28px] leading-[34px] font-semibold">
                                        {shared.streak}
                                    </span>
                                    <span className="font-semibold">{t("streak", { count: shared.streak })}</span>
                                </span>
                            </span>
                            <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("best", { count: current.longestStreak })}</span>
                        </div>
                        <WeekStreak days={week} />
                        <p className="text-sm text-sg-muted">{t("streakNote")}</p>
                    </div>
                </section>
            )}

            {featured && (
                <section aria-label={featured.name} className="sg-glass sg-shadow-lg flex flex-col gap-6 rounded-[24px] p-5 sm:rounded-[32px] sm:p-8">
                    <div className="flex flex-col gap-2">
                        <h2 className={sectionTitle}>{featured.name}</h2>
                        <p className="max-w-[620px] whitespace-pre-line text-sg-muted">{featured.description.split("\n\n")[0]}</p>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
                        {[
                            { icon: CalendarDays, title: t("intro.planTile"), body: t("intro.planBody") },
                            { icon: Flame, title: t("intro.streakTile"), body: t("intro.streakBody") },
                            { icon: LineChart, title: t("intro.progressTile"), body: t("intro.progressBody") },
                        ].map(({ icon: Icon, title, body }) => (
                            <div key={title} className="flex flex-col gap-2 rounded-[18px] bg-sg-row p-4">
                                <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[14px] bg-sg-chip">
                                    <Icon className="size-5" />
                                </span>
                                <span className="font-bold">{title}</span>
                                <span className="text-[15px] text-sg-muted">{body}</span>
                            </div>
                        ))}
                    </div>
                    <EnrollButton
                        programId={featured.id}
                        slug={featured.slug}
                        label={t("intro.start")}
                        busyLabel={t("intro.starting")}
                        failedLabel={t("enrollFailed")}
                        className={cn(coralButton, "h-12 self-start px-6 text-base")}
                    />
                </section>
            )}

            {programs.length === 0 && <p className="sg-glass rounded-[24px] p-8 text-center text-sg-muted">{t("empty")}</p>}

            {others.length > 0 && (
                <section aria-label={t("more")} className="flex flex-col gap-4">
                    <h2 className={sectionTitle}>{t("shorter")}</h2>
                    <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
                        {others.map((program) => {
                            const enrollment = enrolledIn.get(program.id);
                            return (
                                <li key={program.id} className="sg-glass flex flex-col gap-3.5 rounded-[24px] p-5 sm:p-6">
                                    <span className="inline-flex h-7 items-center self-start rounded-full bg-sg-chip px-2.5 text-sm font-semibold">
                                        {t("days", { count: program.durationDays })}
                                    </span>
                                    <span className="flex flex-col gap-1">
                                        <span className="text-xl leading-7 font-bold">{program.name}</span>
                                        <span className="line-clamp-3 text-sg-muted">{program.description.split("\n\n")[0]}</span>
                                    </span>
                                    {enrollment ? (
                                        <Link href={`/candidate/placement-program/${program.slug}`} className={cn(glassButton, "mt-auto h-11 self-start text-[15px]")}>
                                            {t("open")}
                                        </Link>
                                    ) : (
                                        <EnrollButton
                                            programId={program.id}
                                            slug={program.slug}
                                            label={t("start")}
                                            busyLabel={t("intro.starting")}
                                            failedLabel={t("enrollFailed")}
                                            className={cn(glassButton, "mt-auto h-11 self-start text-[15px]")}
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}
        </div>
    );
}

function PlanProgress({ day, total, t }: { day: number; total: number; t: Awaited<ReturnType<typeof getTranslations<"Placement">>> }) {
    const percent = Math.round((Math.min(day, total) / total) * 100);
    return (
        <div className="flex flex-col gap-2">
            <span className="flex justify-between gap-3 text-sm">
                <span className="text-sg-muted">{t("daysProgress", { day, total })}</span>
                <span className="font-bold">{t("percent", { value: percent })}</span>
            </span>
            <span
                role="progressbar"
                aria-label={t("progressLabel", { value: percent })}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-sg-track"
            >
                <span className="block h-full rounded-full bg-sg-lavender-ink" style={{ width: `${percent}%` }} />
            </span>
        </div>
    );
}
