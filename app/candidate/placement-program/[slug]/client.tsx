"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import {
    ArrowLeft,
    BookOpen,
    Brain,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Code2,
    Flame,
    Loader2,
    MessageSquare,
    Mic,
    Pause,
    PlayCircle,
    Sparkles,
    Calculator,
    Check,
    Target,
    type LucideIcon,
} from "lucide-react";
import type { TaskType } from "@prisma/client";
import { advanceToNextDay, completeTask, pauseEnrollment, resumeEnrollment, startCheckpoint, startTask } from "@/actions/placement-program";
import { TaskModal } from "@/components/placement/task-modal";
import { WeekStreak } from "@/components/placement/week-streak";
import { Mascot } from "@/components/soft-glass/mascot";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { iconButton, inkButton, outlineButton, panel, panelTitle, sectionTitle } from "@/components/jobs/employer-ui";
import type { WeekDay } from "@/lib/streak";
import type { SkillLabel } from "@/lib/plan/checkpoints";
import { cn } from "@/lib/utils";

export interface DayTask {
    id: string;
    title: string;
    type: TaskType;
    duration: number;
    content: unknown;
    isStarted: boolean;
    isCompleted: boolean;
    /** Code saved from an earlier attempt at a problem task. */
    savedCode: string | null;
    /** "New for you" or "Revision", by the career path's skills (AIIN-101). */
    skill: SkillLabel;
}

/** The day 30, 60 or 90 checkpoint interview (AIIN-101). */
export interface DayCheckpoint {
    day: number;
    /** The first day it covers. */
    from: number;
    started: boolean;
    score: number | null;
    resultHref: string | null;
}

export interface DayIdea {
    title: string;
    /** Markdown */
    explanation: string;
    takeaways: string[];
}

interface ProgramDayClientProps {
    program: { name: string; durationDays: number };
    enrollment: {
        id: string;
        paused: boolean;
        finished: boolean;
        currentDay: number;
        streak: number;
        longestStreak: number;
        atRisk: boolean;
    };
    day: { number: number; title: string | null; idea: DayIdea | null };
    tasks: DayTask[];
    checkpoint: DayCheckpoint | null;
    week: WeekDay[];
    nav: { prev: string | null; next: string | null; today: string | null };
}

const TASK_ICONS: Record<TaskType, LucideIcon> = {
    READING: BookOpen,
    VIDEO: PlayCircle,
    PROBLEM: Code2,
    QUIZ: Brain,
    APTITUDE: Calculator,
    HR_PREP: MessageSquare,
    MOCK_INTERVIEW: Mic,
};

const markdown = "flex flex-col gap-3 [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-sg-chip [&_code]:px-1";

export function ProgramDayClient({ program, enrollment, day, tasks, checkpoint, week, nav }: ProgramDayClientProps) {
    const t = useTranslations("Placement");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [openTask, setOpenTask] = useState<DayTask | null>(null);
    const [checkpointError, setCheckpointError] = useState(false);
    const [openingCheckpoint, startOpeningCheckpoint] = useTransition();

    const isToday = day.number === enrollment.currentDay;
    const doneCount = tasks.filter((task) => task.isCompleted).length;
    const checkpointDone = !checkpoint || checkpoint.score !== null;
    // On a checkpoint day, the checkpoint is the day's task; the others still count
    const allDone = (tasks.length > 0 || !!checkpoint) && doneCount === tasks.length && checkpointDone;
    const minutesLeft = tasks.filter((task) => !task.isCompleted).reduce((sum, task) => sum + task.duration, 0);
    const nextTask = tasks.find((task) => !task.isCompleted) ?? null;
    const quickest = tasks.filter((task) => !task.isCompleted).sort((a, b) => a.duration - b.duration)[0];
    const lastDay = enrollment.currentDay >= program.durationDays;
    const percent = Math.round((Math.min(enrollment.currentDay, program.durationDays) / program.durationDays) * 100);
    const typeName = (type: TaskType) => t(`day.types.${type}`);

    const open = (task: DayTask) => {
        setOpenTask(task);
        // Recording the start shouldn't hold up the task's own buttons, so it isn't part of the page's transition.
        if (!task.isStarted && !enrollment.paused) void startTask(enrollment.id, task.id);
    };

    const complete = (taskId: string, score?: number, metadata?: unknown) =>
        startTransition(async () => {
            await completeTask(enrollment.id, taskId, score, metadata);
            setOpenTask(null);
            router.refresh();
        });

    const advance = () =>
        startTransition(async () => {
            const result = await advanceToNextDay(enrollment.id);
            if ("newDayToken" in result && result.newDayToken) router.push(`?d=${result.newDayToken}`);
            router.refresh();
        });

    const openCheckpoint = () =>
        startOpeningCheckpoint(async () => {
            setCheckpointError(false);
            const result = await startCheckpoint(enrollment.id, day.number);
            if ("mockInterviewId" in result && result.mockInterviewId) router.push(`/candidate/practice/${result.mockInterviewId}`);
            else setCheckpointError(true);
        });

    const togglePause = () =>
        startTransition(async () => {
            await (enrollment.paused ? resumeEnrollment(enrollment.id) : pauseEnrollment(enrollment.id));
            router.refresh();
        });

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <Link href="/candidate/placement-program" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {t("day.back")}
                    </Link>
                    {checkpoint && (
                        <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("day.checkpointKicker", { day: day.number, total: program.durationDays })}</span>
                    )}
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                        {checkpoint
                            ? t("day.checkpointHeading")
                            : day.title
                              ? t("day.title", { day: day.number, topic: day.title })
                              : t("day.titleNoTopic", { day: day.number })}
                    </h1>
                </div>
                <span className="font-semibold text-sg-muted">{t("day.week", { week: Math.ceil(day.number / 7), program: program.name })}</span>
            </div>

            {enrollment.paused && (
                <div role="status" className="sg-glass flex flex-wrap items-center justify-between gap-4 rounded-[22px] p-4 sm:p-5">
                    <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-chip">
                            <Pause className="size-5" />
                        </span>
                        <span className="flex flex-col">
                            <span className="font-bold">{t("day.paused")}</span>
                            <span className="text-sg-muted">
                                {enrollment.streak > 0 ? t("day.pausedStreak", { count: enrollment.streak }) : t("day.pausedNoStreak")}
                            </span>
                        </span>
                    </span>
                    <button type="button" onClick={togglePause} disabled={isPending} className={cn(inkButton, "h-11 text-[15px]")}>
                        {t("day.resume")}
                    </button>
                </div>
            )}

            {enrollment.atRisk && isToday && quickest && (
                <div role="status" className="flex items-start gap-3 rounded-[22px] bg-sg-lavender-soft p-4 sm:p-5">
                    <Flame className="mt-0.5 size-5 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                    <span className="flex flex-col">
                        <span className="font-bold">{t("day.atRisk", { count: enrollment.streak })}</span>
                        <span>{t("day.atRiskTask", { task: quickest.title, minutes: quickest.duration })}</span>
                    </span>
                </div>
            )}

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
                    {checkpoint && (
                        <section aria-labelledby="check-title" className={cn(panel, "sg-shadow-lg")}>
                            <div className="flex items-center gap-3">
                                <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sg-lavender-soft text-sg-lavender-ink">
                                    <Target className="size-[22px]" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <h2 id="check-title" className={panelTitle}>
                                        {t("day.checkpointTitle", { day: checkpoint.day })}
                                    </h2>
                                    <span className="text-sg-muted">{t("day.checkpointMeta", { from: checkpoint.from })}</span>
                                </span>
                            </div>
                            {checkpoint.score === null ? (
                                <>
                                    <p>{t("day.checkpointBody")}</p>
                                    <button type="button" onClick={openCheckpoint} disabled={openingCheckpoint || enrollment.paused} className={cn(coralButton, "h-12 self-start px-6 text-base")}>
                                        {openingCheckpoint ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Mic className="size-[18px]" aria-hidden="true" />}
                                        {openingCheckpoint ? t("day.checkpointStarting") : checkpoint.started ? t("day.checkpointContinue") : t("day.checkpointStart")}
                                    </button>
                                    {checkpointError && (
                                        <p role="alert" className="text-sm font-semibold text-sg-danger">
                                            {t("day.checkpointFailed")}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                                    <span className="flex flex-col">
                                        <span className="font-display sg-soft text-[30px] leading-9 font-semibold">{t("day.checkpointScore", { score: checkpoint.score.toFixed(1) })}</span>
                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                                            <CheckCircle2 className="size-4 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                                            {t("day.checkpointDone")}
                                        </span>
                                    </span>
                                    {checkpoint.resultHref && (
                                        <Link href={checkpoint.resultHref} className={cn(outlineButton, "h-10 text-sm")}>
                                            {t("day.checkpointSee")}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    <section aria-label={isToday ? t("day.today") : t("day.viewing", { day: day.number })} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className={sectionTitle}>{checkpoint ? t("day.alsoToday") : isToday ? t("day.today") : t("day.viewing", { day: day.number })}</h2>
                                <span className="flex shrink-0 items-center gap-1">
                                    {nav.prev ? (
                                        <Link href={nav.prev} aria-label={t("day.prev")} className={iconButton}>
                                            <ChevronLeft className="size-5" aria-hidden="true" />
                                        </Link>
                                    ) : (
                                        <span aria-hidden="true" className={cn(iconButton, "opacity-40")}>
                                            <ChevronLeft className="size-5" />
                                        </span>
                                    )}
                                    {nav.next ? (
                                        <Link href={nav.next} aria-label={t("day.next")} className={iconButton}>
                                            <ChevronRight className="size-5" aria-hidden="true" />
                                        </Link>
                                    ) : (
                                        <span aria-hidden="true" className={cn(iconButton, "opacity-40")}>
                                            <ChevronRight className="size-5" />
                                        </span>
                                    )}
                                </span>
                            </div>
                            {tasks.length > 0 && (
                                <span className="font-semibold text-sg-muted">
                                    {doneCount === tasks.length ? t("day.doneOf", { done: doneCount, total: tasks.length }) : t("day.doneLeft", { done: doneCount, total: tasks.length, minutes: minutesLeft })}
                                </span>
                            )}
                        </div>

                        {nav.today && (
                            <Link href={nav.today} className={cn(outlineButton, "h-10 self-start text-sm")}>
                                {t("day.toToday")}
                            </Link>
                        )}

                        {tasks.length === 0 ? (
                            !checkpoint && <p className="sg-glass rounded-[22px] p-6 text-sg-muted">{t("day.noTasks")}</p>
                        ) : (
                            <ul className="flex flex-col gap-2.5">
                                {tasks.map((task) => {
                                    const Icon = TASK_ICONS[task.type] ?? Sparkles;
                                    const isNext = task.id === nextTask?.id;
                                    return (
                                        <li key={task.id} className="sg-glass flex flex-wrap items-center gap-3 rounded-[22px] p-3.5 sm:p-4">
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    "flex size-11 shrink-0 items-center justify-center rounded-[14px]",
                                                    task.isCompleted ? "bg-sg-lavender-soft text-sg-lavender-ink" : isNext ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip"
                                                )}
                                            >
                                                <Icon className="size-5" />
                                            </span>
                                            <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                                                <span className="font-bold">{task.title}</span>
                                                <span className="text-[13px] leading-[18px] font-medium text-sg-muted">
                                                    {t("day.taskMeta", { type: typeName(task.type), minutes: task.duration })}
                                                </span>
                                            </span>
                                            {task.skill && (
                                                <span
                                                    className={cn(
                                                        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold",
                                                        task.skill.kind === "new" ? "bg-sg-lavender-soft text-sg-lavender-ink" : "bg-sg-chip"
                                                    )}
                                                >
                                                    {task.skill.kind === "new" ? <Sparkles className="size-3.5" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
                                                    {task.skill.kind === "new" ? t("day.skillNew", { skill: task.skill.skill }) : t("day.skillRevision", { skill: task.skill.skill })}
                                                </span>
                                            )}
                                            {task.isCompleted ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 font-semibold text-sg-lavender-ink">
                                                    <CheckCircle2 className="size-[18px]" aria-hidden="true" />
                                                    {t("day.done")}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => open(task)}
                                                    disabled={enrollment.paused}
                                                    aria-label={`${task.isStarted ? t("day.continue") : t("day.start")}: ${task.title}`}
                                                    className={isNext ? cn(inkButton, "h-11 text-[15px]") : cn(outlineButton, "h-10 text-sm")}
                                                >
                                                    {task.isStarted ? t("day.continue") : t("day.start")}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {tasks.some((task) => task.skill) && <p className="text-sm text-sg-muted">{t("day.skillNote")}</p>}

                        {allDone && isToday && !enrollment.finished && (
                            <div role="status" className="sg-glass sg-shadow-lg flex flex-wrap items-center gap-4 rounded-[24px] p-5">
                                <Mascot className="size-12" />
                                <span className="flex min-w-0 flex-[1_1_240px] flex-col">
                                    <span className="text-lg font-bold">
                                        {enrollment.streak > 0
                                            ? t("day.allDone", { day: day.number, count: enrollment.streak })
                                            : t("day.allDoneNoStreak", { day: day.number })}
                                    </span>
                                    <span className="text-sg-muted">{lastDay ? t("day.planDone") : t("day.nextDay", { day: day.number + 1 })}</span>
                                </span>
                                <button type="button" onClick={advance} disabled={isPending} className={cn(coralButton, "h-12 px-6 text-base")}>
                                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                    {lastDay ? t("completed") : t("day.startNext", { day: day.number + 1 })}
                                </button>
                            </div>
                        )}
                    </section>

                    {day.idea && (
                        <section aria-label={t("day.idea", { title: day.idea.title })} className={panel}>
                            <h2 className={panelTitle}>{t("day.idea", { title: day.idea.title })}</h2>
                            <div className={markdown}>
                                <ReactMarkdown>{day.idea.explanation}</ReactMarkdown>
                            </div>
                            {day.idea.takeaways.length > 0 && (
                                <ul className="flex flex-col gap-2.5">
                                    {day.idea.takeaways.map((point) => (
                                        <li key={point} className="flex items-start gap-2.5">
                                            <CheckCircle2 aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-sg-lavender-ink" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}
                </div>

                <aside aria-label={t("day.progress")} className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]">
                    <div className={panel}>
                        <div className="flex flex-col gap-2">
                            <span className="flex justify-between gap-3 text-sm">
                                <span className="text-sg-muted">{t("daysProgress", { day: enrollment.currentDay, total: program.durationDays })}</span>
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
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="flex flex-col rounded-[18px] bg-sg-row px-4 py-3">
                                <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("day.streak")}</span>
                                <span className="font-bold">{t("day.daysCount", { count: enrollment.streak })}</span>
                            </div>
                            <div className="flex flex-col rounded-[18px] bg-sg-row px-4 py-3">
                                <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("day.best")}</span>
                                <span className="font-bold">{t("day.daysCount", { count: enrollment.longestStreak })}</span>
                            </div>
                        </div>
                        <WeekStreak days={week} />
                    </div>
                    {!enrollment.paused && !enrollment.finished && (
                        <button
                            type="button"
                            onClick={togglePause}
                            disabled={isPending}
                            className={cn("inline-flex min-h-10 items-center gap-2 self-start rounded-full px-3 font-semibold text-sg-muted hover:bg-sg-chip hover:text-sg-text", focusRing)}
                        >
                            <Pause className="size-4" aria-hidden="true" />
                            {t("day.pause")}
                        </button>
                    )}
                </aside>
            </div>

            {openTask && (
                <TaskModal
                    task={{ id: openTask.id, title: openTask.title, type: openTask.type, duration: openTask.duration, content: openTask.content, metadata: openTask.savedCode ? { code: openTask.savedCode } : null }}
                    onComplete={complete}
                    onClose={() => setOpenTask(null)}
                    isPending={isPending}
                />
            )}
        </div>
    );
}
