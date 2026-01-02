"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
    ChevronRight
} from "lucide-react";
import { TaskList } from "@/components/placement/task-list";
import { TaskModal } from "@/components/placement/task-modal";
import { StreakCounter, StreakWarning } from "@/components/placement/streak-counter";
import { completeTask, startTask, advanceToNextDay, pauseEnrollment, resumeEnrollment } from "@/actions/placement-program";
import { cn } from "@/lib/utils";
import { TaskType } from "@prisma/client";

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
}

interface DayData {
    module: {
        id: string;
        dayNumber: number;
        title: string;
        description: string | null;
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
}

export function ProgramDashboardClient({
    program,
    enrollment,
    dayData
}: ProgramDashboardClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
    const progressPercent = (enrollment.currentDay / program.durationDays) * 100;

    const handleCompleteTask = async (taskId: string, score?: number) => {
        startTransition(async () => {
            await completeTask(enrollment.id, taskId, score);
            setSelectedTask(null);
            router.refresh();
        });
    };

    const handleStartTask = async (taskId: string) => {
        const task = dayData?.tasks.find(t => t.id === taskId);
        if (task) {
            // Mark task as started in database
            startTransition(async () => {
                await startTask(enrollment.id, taskId);
                router.refresh();
            });
            setSelectedTask(task);
        }
    };

    const handleAdvanceDay = async () => {
        startTransition(async () => {
            const result = await advanceToNextDay(enrollment.id);
            if (result.success) {
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

            {/* Today's Tasks */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-orange-500 mb-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Day {enrollment.currentDay}</span>
                        </div>
                        <h2 className="text-xl font-bold">
                            {dayData?.module.title || "Today's Tasks"}
                        </h2>
                        {dayData?.module.description && (
                            <p className="text-muted-foreground text-sm mt-1">
                                {dayData.module.description}
                            </p>
                        )}
                    </div>

                    {/* Day Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            disabled={enrollment.currentDay <= 1}
                            className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            disabled={!dayData?.allCompleted || isPending}
                            className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-4 text-center">
                    <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{enrollment.streak}</p>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
                <div className="bg-card border rounded-xl p-4 text-center">
                    <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{enrollment.longestStreak}</p>
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                </div>
                <div className="bg-card border rounded-xl p-4 text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{enrollment.currentDay - 1}</p>
                    <p className="text-sm text-muted-foreground">Days Completed</p>
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
