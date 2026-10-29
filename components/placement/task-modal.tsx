"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { TaskType } from "@prisma/client";
import { VideoTask } from "./task-content/video-task";
import { ProblemTask } from "./task-content/problem-task";
import { AptitudeTask } from "./task-content/aptitude-task";
import { QuizTask } from "./task-content/quiz-task";
import { ReadingTask } from "./task-content/reading-task";
import { HRPrepTask } from "./task-content/hr-prep-task";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

// TODO: Phase 2 - Replace any with proper types from @/types after updating child components
interface TaskModalProps {
    task: {
        id: string;
        title: string;
        type: TaskType;
        duration: number;
        content: any;
        metadata?: any;
    };
    onComplete: (taskId: string, score?: number, metadata?: any) => void;
    onClose: () => void;
    isPending?: boolean;
}

export function TaskModal({ task, onComplete, onClose, isPending }: TaskModalProps) {
    const t = useTranslations("Placement.day");
    const [isCompleting, setIsCompleting] = useState(false);
    const closeRef = useRef<HTMLButtonElement>(null);

    // Focus the close button on open; Escape closes unless the code editor has focus.
    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !(e.target instanceof HTMLElement && e.target.closest(".monaco-editor"))) onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const handleComplete = (score?: number, metadata?: any) => {
        setIsCompleting(true);
        onComplete(task.id, score, metadata);
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
                        initialCode={task.metadata?.code}
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
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <p className="text-sg-muted">{t("mock")}</p>
                        <Link href="/candidate/practice" className={cn(coralButton, "h-12 px-6")}>
                            {t("mockStart")}
                        </Link>
                        <button type="button" onClick={() => handleComplete()} disabled={isCompleting || isPending} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("mockDone")}
                        </button>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <p className="text-sg-muted">{t("unknownTask")}</p>
                        <button type="button" onClick={() => handleComplete()} disabled={isCompleting || isPending} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("markDone")}
                        </button>
                    </div>
                );
        }
    };

    // A problem needs room for the editor
    const isProblemTask = task.type === "PROBLEM";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[6px] sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-title"
                className={cn(
                    "flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-[24px] border border-sg-glass-border bg-sg-bg text-sg-text shadow-[var(--sg-shadow-lg)] sm:rounded-[28px]",
                    isProblemTask ? "max-w-[95vw]" : "max-w-4xl"
                )}
            >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-sg-rule px-5 py-4">
                    <div className="flex min-w-0 flex-col">
                        <h2 id="task-title" className="font-display sg-soft text-[22px] leading-7 font-semibold">
                            {task.title}
                        </h2>
                        <p className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("taskMeta", { type: t(`types.${task.type}`), minutes: task.duration })}</p>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label={t("close")}
                        className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">{renderContent()}</div>
            </div>
        </div>
    );
}
