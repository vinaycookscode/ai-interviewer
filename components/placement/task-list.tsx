"use client";

import {
    Video,
    BookOpen,
    Code,
    HelpCircle,
    Mic,
    Brain,
    MessageSquare,
    CheckCircle,
    Circle,
    Clock,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskType } from "@prisma/client";

// Task type icon mapping
const TASK_ICONS: Record<TaskType, React.ElementType> = {
    VIDEO: Video,
    READING: BookOpen,
    PROBLEM: Code,
    QUIZ: HelpCircle,
    MOCK_INTERVIEW: Mic,
    APTITUDE: Brain,
    HR_PREP: MessageSquare,
};

const TASK_COLORS: Record<TaskType, string> = {
    VIDEO: "text-red-500 bg-red-500/10",
    READING: "text-blue-500 bg-blue-500/10",
    PROBLEM: "text-green-500 bg-green-500/10",
    QUIZ: "text-purple-500 bg-purple-500/10",
    MOCK_INTERVIEW: "text-orange-500 bg-orange-500/10",
    APTITUDE: "text-cyan-500 bg-cyan-500/10",
    HR_PREP: "text-pink-500 bg-pink-500/10",
};

const TASK_LABELS: Record<TaskType, string> = {
    VIDEO: "Video",
    READING: "Reading",
    PROBLEM: "Problem",
    QUIZ: "Quiz",
    MOCK_INTERVIEW: "Mock Interview",
    APTITUDE: "Aptitude",
    HR_PREP: "HR Prep",
};

interface DailyTask {
    id: string;
    title: string;
    type: TaskType;
    duration: number;
    order: number;
    content: any;
    isCompleted: boolean;
    isStarted?: boolean;
}

interface TaskCardProps {
    task: DailyTask;
    onComplete?: (taskId: string) => void;
    onStart?: (taskId: string) => void;
    disabled?: boolean;
}

export function TaskCard({ task, onComplete, onStart, disabled }: TaskCardProps) {
    const Icon = TASK_ICONS[task.type];
    const colorClass = TASK_COLORS[task.type];
    const [bgColor, textColor] = colorClass.split(" ");

    return (
        <div className={cn(
            "flex items-center gap-4 p-4 bg-card border rounded-xl transition-all",
            task.isCompleted && "opacity-60",
            !disabled && !task.isCompleted && "hover:border-primary/50 cursor-pointer"
        )}>
            {/* Completion Status */}
            <button
                onClick={() => !task.isCompleted && onComplete?.(task.id)}
                disabled={disabled || task.isCompleted}
                className={cn(
                    "flex-shrink-0",
                    task.isCompleted ? "text-green-500" : "text-muted-foreground hover:text-primary"
                )}
            >
                {task.isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                ) : (
                    <Circle className="h-6 w-6" />
                )}
            </button>

            {/* Task Type Icon */}
            <div className={cn("p-2 rounded-lg", bgColor)}>
                <Icon className={cn("h-5 w-5", textColor.replace("bg-", "text-"))} />
            </div>

            {/* Task Details */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "font-medium",
                    task.isCompleted && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        bgColor,
                        textColor.replace("bg-", "text-")
                    )}>
                        {TASK_LABELS[task.type]}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.duration} min
                    </span>
                    {task.isStarted && !task.isCompleted && (
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-500">
                            In Progress
                        </span>
                    )}
                </div>
            </div>

            {/* Action */}
            {!task.isCompleted && (
                <button
                    onClick={() => onStart?.(task.id)}
                    disabled={disabled}
                    className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors",
                        task.isStarted
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    {task.isStarted ? "Resume" : "Start"}
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

interface TaskListProps {
    tasks: DailyTask[];
    onComplete?: (taskId: string) => void;
    onStart?: (taskId: string) => void;
    disabled?: boolean;
}

export function TaskList({ tasks, onComplete, onStart, disabled }: TaskListProps) {
    const completedCount = tasks.filter(t => t.isCompleted).length;
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);

    return (
        <div className="space-y-4">
            {/* Summary Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {completedCount}/{tasks.length} completed
                    </span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                        />
                    </div>
                </div>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    ~{totalDuration} min total
                </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={onComplete}
                        onStart={onStart}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
}

// Progress summary by task type
export function TaskTypeProgress({
    tasksByType
}: {
    tasksByType: Record<string, { total: number; completed: number }>
}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(tasksByType).map(([type, stats]) => {
                const Icon = TASK_ICONS[type as TaskType];
                const colorClass = TASK_COLORS[type as TaskType];
                const [bgColor] = colorClass.split(" ");
                const percent = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

                return (
                    <div key={type} className="bg-card border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={cn("p-1.5 rounded", bgColor)}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">
                                {TASK_LABELS[type as TaskType]}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {stats.completed}/{stats.total}
                            </span>
                            <span className="font-medium">{Math.round(percent)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", bgColor.replace("/10", ""))}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
