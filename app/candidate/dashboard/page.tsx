import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
    ArrowRight,
    CalendarDays,
    Check,
    Circle,
    CircleCheck,
    Clock,
    FileText,
    FileUp,
    Hourglass,
    ListChecks,
    Mic,
    TriangleAlert,
    type LucideIcon,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import { getFeatureFlags } from "@/actions/feature-flags";
import { canStartInterview, getTimeUntilInterview } from "@/lib/interview-timing";
import { DashboardRefresher } from "@/components/candidate/dashboard-refresher";
import { Mascot } from "@/components/soft-glass/mascot";
import { ScoreGauge } from "@/components/soft-glass/score-gauge";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { liveStreak } from "@/lib/streak";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { glassButton } from "@/components/jobs/employer-ui";

export async function generateMetadata() {
    const t = await getTranslations("Today");
    return { title: t("metaTitle") };
}

// Candidates and interviews are in India: dates and times are shown in IST, the same on the server and in the browser.
const TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const fmt = (options: Intl.DateTimeFormatOptions, locale = "en-IN") => new Intl.DateTimeFormat(locale, { timeZone: TZ, ...options });
const weekdayShort = fmt({ weekday: "short" }, "en-GB");
const weekdayLong = fmt({ weekday: "long" }, "en-GB");
const dayMonth = fmt({ day: "numeric", month: "short" }, "en-GB");
const timeOfDay = fmt({ hour: "numeric", minute: "2-digit", hour12: true });
const hour24 = fmt({ hour: "numeric", hourCycle: "h23" }, "en-GB");

/** Days since the epoch for the IST calendar date of `date`. */
const istDay = (date: Date) => Math.floor((date.getTime() + IST_OFFSET_MS) / DAY_MS);
const shortDate = (date: Date) => `${weekdayShort.format(date)}, ${dayMonth.format(date)}`;
const clockTime = (date: Date) => timeOfDay.format(date).replace(/\s?([ap])\.?m\.?/i, " $1m");

const card = "sg-glass flex flex-col rounded-3xl p-5 sm:rounded-[28px] sm:p-7";
const cardTitle = "font-display sg-soft text-display-2xs";
const inkButton = cn(
    "inline-flex items-center justify-center gap-2 rounded-full bg-sg-ink font-bold text-sg-ink-foreground transition-opacity hover:opacity-90",
    focusRing
);
const chip = "inline-flex h-8 items-center gap-1.5 rounded-full bg-sg-chip px-3 text-sm font-semibold";

const interviewInclude = {
    job: { include: { _count: { select: { questions: { where: { archived: false } } } } } },
} satisfies Prisma.InterviewInclude;
type InterviewWithJob = Prisma.InterviewGetPayload<{ include: typeof interviewInclude }>;
type T = Awaited<ReturnType<typeof getTranslations<"Today">>>;

// Finished interviews are shown 10 at a time; "Show more" adds 10 through `?past=`.
const PAST_PAGE = 10;
const PAST_MAX = 200;

export default async function CandidateDashboardPage({ searchParams }: { searchParams: Promise<{ past?: string }> }) {
    const t = await getTranslations("Today");
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/auth/login");
    }

    const requested = Number((await searchParams).past);
    const pastLimit = Number.isFinite(requested) ? Math.min(PAST_MAX, Math.max(PAST_PAGE, Math.ceil(requested / PAST_PAGE) * PAST_PAGE)) : PAST_PAGE;

    // Everything here is scoped to the signed-in candidate.
    const completed = { candidateId: userId, status: "COMPLETED" } satisfies Prisma.InterviewWhereInput;
    const scoredWhere = { ...completed, score: { not: null } } satisfies Prisma.InterviewWhereInput;
    const [candidate, upcoming, past, pastCount, scoreStats, firstScored, lastScored, enrollment, flags] = await Promise.all([
        db.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, candidateProfile: { select: { primaryRole: true } } },
        }),
        // Every interview still to do: there are few, and the next one is chosen from them.
        db.interview.findMany({
            where: { candidateId: userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
            include: interviewInclude,
            orderBy: { createdAt: "desc" },
        }),
        db.interview.findMany({ where: completed, include: interviewInclude, orderBy: { createdAt: "desc" }, take: pastLimit }),
        db.interview.count({ where: completed }),
        db.interview.aggregate({ where: scoredWhere, _avg: { score: true }, _count: { score: true } }),
        db.interview.findFirst({ where: scoredWhere, orderBy: { createdAt: "asc" }, select: { score: true } }),
        db.interview.findFirst({ where: scoredWhere, orderBy: { createdAt: "desc" }, select: { score: true } }),
        db.programEnrollment.findFirst({
            where: { userId, status: "ACTIVE" },
            select: { id: true, programId: true, currentDay: true, streak: true, lastActiveAt: true, program: { select: { slug: true, durationDays: true } } },
        }),
        getFeatureFlags(),
    ]);

    if (!candidate) {
        return (
            <div className={cn(card, "mx-auto max-w-md items-center gap-3 text-center")}>
                <Mascot className="size-16" />
                <h1 className="font-display sg-soft text-display-2xs">{t("missingTitle")}</h1>
                <p className="text-sg-muted">{t("missingBody")}</p>
            </div>
        );
    }

    const flagOn = (key: string) => !flags.some((f) => f.key === key && !f.enabled);
    const now = new Date();
    const today = istDay(now);

    // ---- The program: this week's practice and today's tasks ----
    const weekStart = today - ((istDay(now) + 3) % 7); // Monday (1970-01-01 was a Thursday)
    const [weekCompletions, todayModule] = enrollment
        ? await Promise.all([
              db.taskCompletion.findMany({
                  where: { enrollmentId: enrollment.id, completedAt: { gte: new Date(weekStart * DAY_MS - IST_OFFSET_MS) } },
                  select: { completedAt: true },
              }),
              db.programModule.findUnique({
                  where: { programId_dayNumber: { programId: enrollment.programId, dayNumber: enrollment.currentDay } },
                  select: {
                      title: true,
                      tasks: { select: { role: true, completions: { where: { enrollmentId: enrollment.id }, select: { completedAt: true } } } },
                  },
              }),
          ])
        : [[], null];

    const practisedDays = new Set(weekCompletions.flatMap((c) => (c.completedAt ? [istDay(c.completedAt)] : [])));
    const primaryRole = candidate.candidateProfile?.primaryRole;
    // Same rule as the program page: common tasks, plus the ones for the candidate's role.
    const todayTasks = (todayModule?.tasks ?? []).filter((task) => !task.role || !primaryRole || task.role === primaryRole);
    const todayDone = todayTasks.filter((task) => task.completions.some((c) => c.completedAt)).length;

    // ---- Interviews ----
    const isExpired = (i: InterviewWithJob) => i.status === "PENDING" && !!i.expiresAt && now > i.expiresAt;
    const next =
        upcoming.find((i) => i.status === "IN_PROGRESS") ??
        upcoming
            .filter((i) => !isExpired(i))
            .sort((a, b) => (a.scheduledTime?.getTime() ?? 0) - (b.scheduledTime?.getTime() ?? 0))[0] ??
        upcoming[0];

    // Across every scored interview, not just the ones listed.
    const average = scoreStats._avg.score;
    const delta =
        scoreStats._count.score > 1 && firstScored?.score != null && lastScored?.score != null
            ? Number((lastScored.score - firstScored.score).toFixed(1))
            : null;

    // ---- Greeting and the tip from U ----
    const hour = Number(hour24.format(now));
    const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const firstName = candidate.name?.trim().split(/\s+/)[0];

    const when = (date: Date | null) => {
        if (!date) return t("when.today");
        const days = istDay(date) - today;
        if (days <= 0) return t("when.today");
        if (days === 1) return t("when.tomorrow");
        return t("when.on", { date: days < 7 ? weekdayLong.format(date) : dayMonth.format(date) });
    };

    const docs = next
        ? [
              { key: "Resume", required: next.job.requireResume, done: !!next.resumeUrl },
              { key: "Aadhaar", required: next.job.requireAadhar, done: !!next.aadhaarUrl },
              { key: "Pan", required: next.job.requirePAN, done: !!next.panUrl },
          ].filter((d) => d.required)
        : [];
    const missingDocs = docs.filter((d) => !d.done).length;

    type NextState = "inProgress" | "open" | "expired" | "waiting";
    const nextState: NextState | null = !next
        ? null
        : next.status === "IN_PROGRESS"
          ? "inProgress"
          : isExpired(next)
            ? "expired"
            : canStartInterview(next.scheduledTime)
              ? "open"
              : "waiting";

    const tip =
        next && nextState === "inProgress"
            ? t("coach.inProgress", { role: next.job.title })
            : next && nextState === "open"
              ? t("coach.open", { role: next.job.title })
              : next && nextState === "waiting"
                ? missingDocs > 0
                    ? t("coach.todo", { role: next.job.title, when: when(next.scheduledTime), count: missingDocs })
                    : t("coach.ready", { role: next.job.title, when: when(next.scheduledTime) })
                : enrollment
                  ? t("coach.plan", { day: enrollment.currentDay })
                  : t("coach.idle");

    const showPlan = !!enrollment || flagOn(FEATURES.PLACEMENT_PROGRAM);
    const showPractice = flagOn(FEATURES.PRACTICE_INTERVIEWS);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <DashboardRefresher active={upcoming.some((i) => i.status === "IN_PROGRESS") || pastCount > scoreStats._count.score} />

            <section aria-label={t("metaTitle")} className="flex flex-wrap items-end gap-x-6 gap-y-4">
                <Mascot className="size-20 sm:size-[104px]" />
                <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
                    <p className="sg-glass-strong max-w-[560px] self-start rounded-[20px_20px_20px_6px] px-[18px] py-3.5 font-medium">{tip}</p>
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                        {firstName ? t("greetingNamed", { part, name: firstName }) : t("greeting", { part })}
                    </h1>
                </div>
            </section>

            {next && nextState ? (
                <NextInterview
                    interview={next}
                    state={nextState}
                    docs={docs}
                    now={now}
                    t={t}
                />
            ) : (
                <section aria-labelledby="next-none" className={cn(card, "sg-shadow-lg flex-row flex-wrap items-center gap-4")}>
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sg-lavender-soft text-sg-lavender-ink" aria-hidden="true">
                        <CalendarDays className="size-6" />
                    </span>
                    <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                        <h2 id="next-none" className={cardTitle}>
                            {t("next.noneTitle")}
                        </h2>
                        <p className="text-sg-muted">{t("next.noneBody")}</p>
                    </div>
                </section>
            )}

            {(showPlan || average !== null || showPractice) && (
                <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
                    {enrollment ? (
                        <section aria-labelledby="week-title" className={cn(card, "gap-[18px]")}>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                                <h2 id="week-title" className={cardTitle}>
                                    {t("week.streak", { count: liveStreak(enrollment.streak, enrollment.lastActiveAt, false) })}
                                </h2>
                                <span className="font-medium text-sg-muted">
                                    {t("week.dayOf", { day: enrollment.currentDay, total: enrollment.program.durationDays })}
                                </span>
                            </div>
                            <ol aria-label={t("week.days")} className="grid grid-cols-7 gap-1.5">
                                {Array.from({ length: 7 }, (_, i) => {
                                    const day = weekStart + i;
                                    const done = practisedDays.has(day);
                                    const date = new Date(day * DAY_MS + DAY_MS / 2);
                                    return (
                                        <li key={day} className="flex flex-col items-center gap-1.5">
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "flex size-[34px] items-center justify-center rounded-full",
                                                    done ? "bg-sg-coral text-sg-coral-ink" : "border-2 border-dashed border-sg-field-border",
                                                    day === today && !done && "border-solid border-sg-text"
                                                )}
                                            >
                                                {done && <Check className="size-4" strokeWidth={3} />}
                                            </span>
                                            <span className="text-[13px] font-semibold leading-4 text-sg-muted">
                                                <span aria-hidden="true">{weekdayShort.format(date).charAt(0)}</span>
                                                <span className="sr-only">
                                                    {weekdayLong.format(date)}, {done ? t("week.practised") : t("week.notYet")}
                                                </span>
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                            <Link
                                href={`/candidate/placement-program/${enrollment.program.slug}`}
                                className={cn("mt-auto flex min-h-12 items-center justify-between gap-2 rounded-2xl bg-sg-row px-4 py-2 font-semibold", focusRing)}
                            >
                                <span className="min-w-0">
                                    {todayModule && todayTasks.length > 0
                                        ? todayDone >= todayTasks.length
                                            ? t("week.allDone", { title: todayModule.title })
                                            : t("week.tasks", { title: todayModule.title, done: todayDone, total: todayTasks.length })
                                        : t("week.openPlan")}
                                </span>
                                <ArrowRight className="size-[18px] shrink-0" aria-hidden="true" />
                            </Link>
                        </section>
                    ) : (
                        showPlan && (
                            <section aria-labelledby="plan-title" className={cn(card, "gap-3")}>
                                <h2 id="plan-title" className={cardTitle}>
                                    {t("week.joinTitle")}
                                </h2>
                                <p className="text-sg-muted">{t("week.joinBody")}</p>
                                <Link
                                    href="/candidate/placement-program"
                                    className={cn("mt-auto flex min-h-12 items-center justify-between gap-2 rounded-2xl bg-sg-row px-4 font-semibold", focusRing)}
                                >
                                    {t("week.joinCta")}
                                    <ArrowRight className="size-[18px] shrink-0" aria-hidden="true" />
                                </Link>
                            </section>
                        )
                    )}

                    <section aria-labelledby="score-title" className={cn(card, "items-center gap-1.5 text-center")}>
                        <h2 id="score-title" className={cn(cardTitle, "self-stretch text-left")}>
                            {t("score.title")}
                        </h2>
                        {average !== null ? (
                            <>
                                <ScoreGauge value={average} className="w-[200px] max-w-full" />
                                <span className="font-medium text-sg-muted">
                                    {delta === null
                                        ? t("score.one")
                                        : delta > 0
                                          ? t("score.up", { delta: delta.toFixed(1) })
                                          : delta < 0
                                            ? t("score.down", { delta: Math.abs(delta).toFixed(1) })
                                            : t("score.same")}
                                </span>
                            </>
                        ) : (
                            <>
                                <div aria-hidden="true" className="flex justify-center self-stretch">
                                    <ScoreGauge value={0} showValue={false} className="w-[200px] max-w-full" />
                                </div>
                                <span className="font-medium text-sg-muted">{t("score.empty")}</span>
                            </>
                        )}
                    </section>

                    {showPractice && (
                        <section aria-labelledby="practice-title" className={cn(card, "gap-4")}>
                            <h2 id="practice-title" className={cardTitle}>
                                {t("practice.title")}
                            </h2>
                            <p className="text-sg-muted">{t("practice.body")}</p>
                            <Link href="/candidate/practice" className={cn(inkButton, "mt-auto h-12 w-full px-[22px]")}>
                                <Mic className="size-[18px]" aria-hidden="true" />
                                {t("practice.cta")}
                            </Link>
                        </section>
                    )}
                </div>
            )}

            <section id="interviews" aria-labelledby="interviews-title" className="flex scroll-mt-6 flex-col gap-4">
                <h2 id="interviews-title" className={cardTitle}>
                    {t("list.title")}
                </h2>
                {upcoming.length + pastCount === 0 ? (
                    <EmptyState
                        title={t("list.emptyTitle")}
                        headingLevel="h3"
                        action={
                            <Link href="/candidate/practice" className={cn(glassButton, "h-12")}>
                                {t("list.emptyAction")}
                            </Link>
                        }
                    >
                        {t("list.empty")}
                    </EmptyState>
                ) : (
                    <>
                        <InterviewList title={t("list.upcoming")} items={upcoming} now={now} t={t} />
                        <InterviewList title={t("list.past")} items={past} now={now} t={t} />
                        {pastCount > past.length && (
                            <Link
                                href={`?past=${past.length + PAST_PAGE}#interviews`}
                                scroll={false}
                                className={cn("inline-flex h-11 items-center justify-center gap-2 self-center rounded-full bg-sg-chip px-5 font-semibold", focusRing)}
                            >
                                {t("list.showMore", { count: Math.min(PAST_PAGE, pastCount - past.length) })}
                                <span className="sr-only">{t("list.shownOf", { shown: past.length, total: pastCount })}</span>
                            </Link>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

interface NextInterviewProps {
    interview: InterviewWithJob;
    state: "inProgress" | "open" | "expired" | "waiting";
    docs: { key: string; done: boolean }[];
    now: Date;
    t: T;
}

function NextInterview({ interview, state, docs, now, t }: NextInterviewProps) {
    const scheduled = interview.scheduledTime;
    const questionCount = interview.job._count.questions;
    const interviewHref = interview.token ? `/interview/${interview.id}?token=${interview.token}` : null;

    let panel: React.ReactNode;
    if (state === "waiting" && scheduled) {
        const diff = Math.max(0, scheduled.getTime() - now.getTime());
        const days = Math.floor(diff / DAY_MS);
        const hours = Math.floor((diff % DAY_MS) / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const at = { day: weekdayLong.format(scheduled), time: clockTime(scheduled) };
        const [big, rest] =
            days > 0
                ? [t("next.days", { count: days }), hours > 0 ? t("next.hours", { count: hours }) : null]
                : hours > 0
                  ? [t("next.hours", { count: hours }), minutes > 0 ? t("next.minutes", { count: minutes }) : null]
                  : [t("next.minutes", { count: Math.max(1, minutes) }), null];
        panel = (
            <>
                <span className="font-semibold opacity-80">{t("next.startsIn")}</span>
                <div className="flex flex-col gap-1">
                    <span className="font-display sg-soft text-[48px] font-semibold leading-[1.06] tracking-[-0.035em] sm:text-[62px]">{big}</span>
                    <span className="font-medium opacity-80">{rest ? t("next.andRest", { rest, ...at }) : t("next.at", at)}</span>
                </div>
            </>
        );
    } else if (state === "expired") {
        panel = (
            <div className="flex flex-col gap-2">
                <TriangleAlert className="size-7" aria-hidden="true" />
                <span className="font-display sg-soft text-[28px] font-semibold leading-[34px]">{t("next.expiredTitle")}</span>
                <span className="font-medium opacity-80">{t("next.expiredBody")}</span>
            </div>
        );
    } else {
        const inProgress = state === "inProgress";
        panel = (
            <>
                <span className="font-semibold opacity-80">{inProgress ? t("next.inProgressTitle") : t("next.openTitle")}</span>
                <div className="flex flex-col gap-4">
                    <span className="font-medium opacity-80">{inProgress ? t("next.inProgressBody") : t("next.openBody")}</span>
                    {interviewHref && (
                        <Link href={interviewHref} className={cn(coralButton, "h-12 w-full px-6")}>
                            {inProgress ? t("next.continue") : t("next.start")}
                            <ArrowRight className="size-[18px]" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </>
        );
    }

    return (
        <section
            aria-labelledby="next-title"
            className="sg-glass sg-shadow-lg grid gap-7 rounded-3xl p-5 [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))] sm:rounded-[28px] sm:p-7"
        >
            <div className="flex min-w-0 flex-col gap-[18px]">
                <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-sg-muted">{state === "inProgress" ? t("next.labelInProgress") : t("next.label")}</span>
                    <h2 id="next-title" className="font-display sg-soft text-[28px] font-semibold leading-[34px] tracking-[-0.015em] break-words">
                        {interview.job.title}
                    </h2>
                </div>
                <ul className="flex flex-wrap gap-2">
                    {scheduled ? (
                        <>
                            <li className={chip}>
                                <CalendarDays className="size-4" aria-hidden="true" />
                                {shortDate(scheduled)}
                            </li>
                            <li className={chip}>
                                <Clock className="size-4" aria-hidden="true" />
                                {clockTime(scheduled)} IST
                            </li>
                        </>
                    ) : (
                        <li className={chip}>
                            <Clock className="size-4" aria-hidden="true" />
                            {t("next.anyTime")}
                        </li>
                    )}
                    {questionCount > 0 && (
                        <li className={chip}>
                            <ListChecks className="size-4" aria-hidden="true" />
                            {t("next.questions", { count: questionCount })}
                        </li>
                    )}
                </ul>
                {docs.length > 0 && state !== "expired" && (
                    <ul aria-label={t("next.checklist")} className="flex flex-col gap-2">
                        {docs.map((doc) => (
                            <li key={doc.key} className="flex items-center gap-3 rounded-2xl bg-sg-row px-3 py-2.5">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-[10px]",
                                        doc.done ? "bg-sg-coral text-sg-coral-ink" : "bg-sg-lavender-soft text-sg-lavender-ink"
                                    )}
                                >
                                    {doc.done ? <Check className="size-4" strokeWidth={3} /> : <FileUp className="size-4" />}
                                </span>
                                <span className={cn("min-w-0 flex-1", doc.done ? "text-sg-muted" : "font-semibold")}>
                                    {t(`next.${doc.done ? "done" : "todo"}${doc.key}` as "next.doneResume")}
                                </span>
                                {!doc.done && (
                                    <Link href={`/candidate/interview/${interview.id}/documents`} className={cn(inkButton, "h-9 shrink-0 px-3.5 text-sm font-semibold")}>
                                        {t("next.add")}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex min-h-[240px] flex-col justify-between gap-5 rounded-[22px] bg-sg-ink p-6 text-sg-ink-foreground">
                {panel}
                <span className="text-[13px] leading-[18px] opacity-80">{t("next.browserNote")}</span>
            </div>
        </section>
    );
}

interface InterviewListProps {
    title: string;
    items: InterviewWithJob[];
    now: Date;
    t: T;
}

function InterviewList({ title, items, now, t }: InterviewListProps) {
    if (items.length === 0) return null;
    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-[13px] font-bold leading-[18px] text-sg-muted">{title}</h3>
            <ul className="sg-glass flex flex-col gap-1 rounded-3xl p-2">
                {items.map((interview) => (
                    <InterviewRow key={interview.id} interview={interview} now={now} t={t} />
                ))}
            </ul>
        </div>
    );
}

function InterviewRow({ interview, now, t }: { interview: InterviewWithJob; now: Date; t: T }) {
    const expired = interview.status === "PENDING" && !!interview.expiresAt && now > interview.expiresAt;
    const href = interview.token ? `/interview/${interview.id}?token=${interview.token}` : null;

    const status: { icon: LucideIcon; label: string; className?: string } = expired
        ? { icon: TriangleAlert, label: t("list.expired"), className: "bg-sg-danger/10 text-sg-danger" }
        : interview.status === "COMPLETED"
          ? { icon: CircleCheck, label: t("list.completed"), className: "bg-sg-success/10 text-sg-success" }
          : interview.status === "IN_PROGRESS"
            ? { icon: Hourglass, label: t("list.inProgress"), className: "bg-sg-lavender-soft text-sg-lavender-ink" }
            : { icon: Circle, label: t("list.notStarted"), className: "bg-sg-chip" };
    const StatusIcon = status.icon;

    // Same actions as before: start when it opens, continue, or read the feedback.
    let action: React.ReactNode = null;
    if (interview.status === "COMPLETED") {
        action = (
            <Link href={`/candidate/interview/${interview.id}/feedback`} className={cn(inkButton, "h-10 px-4 text-[15px]")}>
                <FileText className="size-4" aria-hidden="true" />
                {t("list.feedback")}
            </Link>
        );
    } else if (interview.status === "IN_PROGRESS" && href) {
        action = (
            <Link href={href} className={cn(inkButton, "h-10 px-4 text-[15px]")}>
                {t("list.continue")}
            </Link>
        );
    } else if (interview.status === "PENDING" && !expired) {
        action =
            canStartInterview(interview.scheduledTime) && href ? (
                <Link href={href} className={cn(inkButton, "h-10 px-4 text-[15px]")}>
                    {t("list.start")}
                </Link>
            ) : (
                <span className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-sg-muted">
                    <Clock className="size-4" aria-hidden="true" />
                    {getTimeUntilInterview(interview.scheduledTime)}
                </span>
            );
    }

    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl px-3 py-3 sm:px-4">
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                <span className="font-bold break-words">{interview.job.title}</span>
                <span className="text-sm text-sg-muted">
                    {interview.scheduledTime
                        ? `${shortDate(interview.scheduledTime)} · ${clockTime(interview.scheduledTime)} IST`
                        : t("list.invited", { date: dayMonth.format(interview.createdAt) })}
                    {interview.status === "PENDING" && interview.expiresAt && !expired && (
                        <> · {t("list.expires", { date: dayMonth.format(interview.expiresAt) })}</>
                    )}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold", status.className)}>
                    <StatusIcon className="size-4" aria-hidden="true" />
                    {status.label}
                </span>
                {typeof interview.score === "number" && (
                    <span className="inline-flex h-8 items-center rounded-full bg-sg-lavender-soft px-3 text-sm font-semibold text-sg-lavender-ink">
                        {t("list.score", { score: interview.score.toFixed(1) })}
                    </span>
                )}
                {action}
            </div>
        </li>
    );
}
