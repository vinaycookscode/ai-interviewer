"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from 'swr';
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    CheckCircle,
    Flame,
    Pause,
    Play,
    Trophy,
    ChevronLeft,
    ChevronRight,
    BookOpen
} from "lucide-react";
import { TaskList } from "@/components/placement/task-list";
import { TaskModal } from "@/components/placement/task-modal";
import { StreakCounter, StreakWarning } from "@/components/placement/streak-counter";
import { startTask, completeTask, advanceToNextDay, pauseEnrollment, resumeEnrollment } from "@/actions/placement-program";
import { cn } from "@/lib/utils";
import { TaskType, Prisma } from "@prisma/client";
import { DailyKnowledgePanel } from "@/components/placement/daily-knowledge-panel";
import { KnowledgeSkeleton } from "@/components/placement/knowledge-skeleton";
import { TaskListSkeleton } from "@/components/placement/task-list-skeleton";
import { Loader2 } from "lucide-react";

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface DailyTask {
    id: string;
    title: string;
    type: TaskType;
    duration: number;
    order: number;
    content: any;
    isCompleted: boolean;
    isStarted?: boolean;
    score?: number | null;
    timeSpent?: number | null;
    metadata?: any;
}

interface DayData {
    module: {
        id: string;
        dayNumber: number;
        title: string;
        description: string | null;
        content: any;
    };
    tasks: DailyTask[];
    allCompleted: boolean;
}

interface ProgramDashboardClientProps {
    program: {
        id: string;
        name: string;
        slug: string;
        durationDays: number;
    };
    enrollment: {
        id: string;
        currentDay: number;
        status: string;
        streak: number;
        longestStreak: number;
        lastActiveAt: Date;
    };
    dayData: DayData | null;
    viewDay: number;
    currentDayToken: string;
    prevDayToken?: string;
    nextDayToken?: string;
}

export function ProgramDashboardClient({
    program,
    enrollment,
    dayData,
    viewDay,
    currentDayToken,
    prevDayToken,
    nextDayToken
}: ProgramDashboardClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [currentViewDay, setCurrentViewDay] = useState(viewDay);
    const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
    const progressPercent = (enrollment.currentDay / program.durationDays) * 100;

    // Use stable token from props instead of searchParams to prevent infinite loops
    const currentToken = searchParams.get('d') || currentDayToken;

    // Build stable API URL - only changes when currentViewDay changes
    const apiUrl = `/api/placement/day/${currentViewDay}?enrollmentId=${enrollment.id}&token=${currentToken}`;

    // Fetch current day data with SWR - stable key prevents infinite fetching
    const { data: fetchedDayData, isLoading, mutate } = useSWR(
        apiUrl,
        fetcher,
        {
            fallbackData: dayData,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            revalidateIfStale: false,
            dedupingInterval: 10000 // Prevent duplicate requests within 10s
        }
    );

    // Prefetch adjacent days for instant navigation
    useEffect(() => {
        // Prefetch previous day
        if (currentViewDay > 1 && prevDayToken) {
            const prevUrl = `/api/placement/day/${currentViewDay - 1}?enrollmentId=${enrollment.id}&token=${prevDayToken}`;
            fetch(prevUrl).catch(() => { }); // Silent prefetch
        }

        // Prefetch next day
        if (currentViewDay < enrollment.currentDay && nextDayToken) {
            const nextUrl = `/api/placement/day/${currentViewDay + 1}?enrollmentId=${enrollment.id}&token=${nextDayToken}`;
            fetch(nextUrl).catch(() => { }); // Silent prefetch
        }
    }, [currentViewDay, enrollment.id, enrollment.currentDay, prevDayToken, nextDayToken]);

    const displayDayData = fetchedDayData || dayData;

    // Navigation handler - now uses client-side state + URL update
    const handleNavigateDay = (token: string, targetDay: number) => {
        startTransition(() => {
            setCurrentViewDay(targetDay);
            router.replace(`?d=${token}`, { scroll: false });
        });
    };

    const handleCompleteTask = async (taskId: string, score?: number, metadata?: any) => {
        startTransition(async () => {
            await completeTask(enrollment.id, taskId, score, metadata);
            setSelectedTask(null);
            mutate(); // Revalidate current day data
        });
    };

    const handleStartTask = async (taskId: string) => {
        const task = displayDayData?.tasks.find((t: any) => t.id === taskId);
        if (task) {
            // Mark task as started in database
            startTransition(async () => {
                await startTask(enrollment.id, taskId);
                mutate(); // Revalidate current day data
            });
            setSelectedTask(task);
        }
    };

    const handleAdvanceDay = async () => {
        startTransition(async () => {
            const result = await advanceToNextDay(enrollment.id);
            if (result.success && result.newDayToken) {
                // Force navigation to the new day using secure token
                router.push(`?d=${result.newDayToken}`);
                router.refresh();
            } else if (result.success) {
                // Just refresh if no new day (e.g. program completed)
                router.refresh();
            }
        });
    };

    const handlePause = async () => {
        startTransition(async () => {
            await pauseEnrollment(enrollment.id);
            router.refresh();
        });
    };

    const handleResume = async () => {
        startTransition(async () => {
            await resumeEnrollment(enrollment.id);
            router.refresh();
        });
    };

    const isPaused = enrollment.status === "PAUSED";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link
                        href="/candidate/placement-program"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Programs
                    </Link>
                    <h1 className="text-2xl font-bold">{program.name}</h1>
                </div>

                {/* Pause/Resume */}
                <button
                    onClick={isPaused ? handleResume : handlePause}
                    disabled={isPending}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                        isPaused
                            ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                            : "hover:bg-muted"
                    )}
                >
                    {isPaused ? (
                        <>
                            <Play className="h-4 w-4" />
                            Resume
                        </>
                    ) : (
                        <>
                            <Pause className="h-4 w-4" />
                            Pause
                        </>
                    )}
                </button>
            </div>

            {/* Paused Banner */}
            {isPaused && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                        Program paused. Your streak will not be affected while paused.
                    </p>
                </div>
            )}

            {/* Progress & Streak Row */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Progress */}
                <div className="md:col-span-2 bg-card border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Your Progress</h3>
                        <span className="text-sm text-muted-foreground">
                            Day {enrollment.currentDay} of {program.durationDays}
                        </span>
                    </div>

                    <div className="h-4 bg-muted rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {Math.round(progressPercent)}% complete
                        </span>
                        <span className="text-muted-foreground">
                            {program.durationDays - enrollment.currentDay} days remaining
                        </span>
                    </div>
                </div>

                {/* Streak */}
                <div>
                    <StreakCounter
                        currentStreak={enrollment.streak}
                        longestStreak={enrollment.longestStreak}
                        size="md"
                    />
                </div>
            </div>

            {/* Streak Warning */}
            <StreakWarning lastActiveDate={new Date(enrollment.lastActiveAt)} />

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6 items-start">

                {/* LEFT COLUMN: Educational Content */}
                <div className="order-2 lg:order-1 lg:col-span-2 h-auto lg:h-[calc(100vh-200px)] lg:min-h-[500px] lg:sticky lg:top-24">
                    {isPending || isLoading ? (
                        <div className="bg-card border rounded-xl p-6 h-full overflow-hidden flex flex-col shadow-sm">
                            <KnowledgeSkeleton />
                        </div>
                    ) : displayDayData?.module.content ? (
                        <div className="bg-card border rounded-xl p-6 h-full overflow-hidden flex flex-col shadow-sm">
                            <DailyKnowledgePanel
                                dayNumber={currentViewDay}
                                title={displayDayData.module.title}
                                content={displayDayData.module.content}
                            />
                        </div>
                    ) : (
                        <div className="bg-muted/30 border border-dashed rounded-xl p-8 text-center h-full flex flex-col items-center justify-center text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">Knowledge Section</p>
                            <p className="text-sm">Detailed concepts for this day are coming soon.</p>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Tasks & Actions */}
                <div className="order-1 lg:order-2 space-y-6">
                    {/* Today's Tasks */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-2 text-orange-500 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm font-medium">Day {currentViewDay}</span>
                                </div>
                                <h2 className="text-xl font-bold">
                                    {displayDayData?.module.title || "Today's Tasks"}
                                </h2>
                                {displayDayData?.module.description && (
                                    <p className="text-muted-foreground text-sm mt-1">
                                        {displayDayData.module.description}
                                    </p>
                                )}
                            </div>

                            {/* Day Navigation */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleNavigateDay(prevDayToken!, currentViewDay - 1)}
                                    disabled={isPending || isLoading}
                                    className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Previous day"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-medium min-w-[3rem] text-center">
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                    ) : (
                                        `${currentViewDay}/${enrollment.currentDay}`
                                    )}
                                </span>
                                <button
                                    onClick={() => handleNavigateDay(nextDayToken!, currentViewDay + 1)}
                                    disabled={isPending || isLoading}
                                    className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Next day"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Task List */}
                        {dayData ? (
                            <TaskList
                                tasks={dayData.tasks as any}
                                onComplete={(taskId) => handleCompleteTask(taskId)}
                                onStart={handleStartTask}
                                disabled={isPaused || isPending}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No tasks available for this day yet.</p>
                                <p className="text-sm">Content is being prepared.</p>
                            </div>
                        )}

                        {/* Complete Day Button */}
                        {dayData?.allCompleted && (
                            <div className="mt-6 pt-6 border-t">
                                <button
                                    onClick={handleAdvanceDay}
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:opacity-90 transition-opacity font-semibold text-lg"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Complete Day {enrollment.currentDay} & Continue
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats - Moved here */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border rounded-xl p-3 text-center">
                            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-xl font-bold">{enrollment.streak}</p>
                            <p className="text-xs text-muted-foreground">Streak</p>
                        </div>
                        <div className="bg-card border rounded-xl p-3 text-center">
                            <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                            <p className="text-xl font-bold">{enrollment.longestStreak}</p>
                            <p className="text-xs text-muted-foreground">Best</p>
                        </div>
                        <div className="bg-card border rounded-xl p-3 text-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <p className="text-xl font-bold">{enrollment.currentDay - 1}</p>
                            <p className="text-xs text-muted-foreground">Done</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onComplete={handleCompleteTask}
                    onClose={() => setSelectedTask(null)}
                    isPending={isPending}
                />
            )}
        </div>
    );
}
