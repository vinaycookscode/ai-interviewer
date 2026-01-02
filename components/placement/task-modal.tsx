"use client";

import { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { TaskType } from "@prisma/client";
import { VideoTask } from "./task-content/video-task";
import { ProblemTask } from "./task-content/problem-task";
import { AptitudeTask } from "./task-content/aptitude-task";
import { QuizTask } from "./task-content/quiz-task";
import { ReadingTask } from "./task-content/reading-task";
import { HRPrepTask } from "./task-content/hr-prep-task";

interface TaskModalProps {
    task: {
        id: string;
        title: string;
        type: TaskType;
        duration: number;
        content: any;
    };
    onComplete: (taskId: string, score?: number) => void;
    onClose: () => void;
    isPending?: boolean;
}

export function TaskModal({ task, onComplete, onClose, isPending }: TaskModalProps) {
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = (score?: number) => {
        setIsCompleting(true);
        onComplete(task.id, score);
    };

    const renderContent = () => {
        switch (task.type) {
            case "VIDEO":
                return (
                    <VideoTask
                        content={task.content}
                        onComplete={handleComplete}
                        isPending={isCompleting || isPending}
                    />
                );
            case "PROBLEM":
                return (
                    <ProblemTask
                        content={task.content}
                        onComplete={handleComplete}
                        isPending={isCompleting || isPending}
                    />
                );
            case "APTITUDE":
                return (
                    <AptitudeTask
                        content={task.content}
                        onComplete={handleComplete}
                        isPending={isCompleting || isPending}
                    />
                );
            case "QUIZ":
                return (
                    <QuizTask
                        content={task.content}
                        onComplete={handleComplete}
                        isPending={isCompleting || isPending}
                    />
                );
            case "READING":
                return (
                    <ReadingTask
                        content={task.content}
                        onComplete={handleComplete}
                        isPending={isCompleting || isPending}
                    />
                );
            case "HR_PREP":
                return (
                    <HRPrepTask
                        content={task.content}
                        onComplete={handleComplete}
                        isPending={isCompleting || isPending}
                    />
                );
            case "MOCK_INTERVIEW":
                return (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">
                            Mock interviews are conducted through our AI Interview system.
                        </p>
                        <a
                            href="/candidate/practice"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                        >
                            Start Mock Interview
                        </a>
                        <button
                            onClick={() => handleComplete()}
                            disabled={isCompleting || isPending}
                            className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground"
                        >
                            {isCompleting ? "Completing..." : "Mark as Complete (I'll practice later)"}
                        </button>
                    </div>
                );
            default:
                return (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Content not available for this task type.</p>
                        <button
                            onClick={() => handleComplete()}
                            disabled={isCompleting || isPending}
                            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                        >
                            Mark as Complete
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold">{task.title}</h2>
                        <p className="text-sm text-muted-foreground">
                            ~{task.duration} min
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
