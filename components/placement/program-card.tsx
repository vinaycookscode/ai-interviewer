"use client";

import { GraduationCap, Users, Clock, Flame, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramCardProps {
    id: string;
    name: string;
    slug: string;
    description: string;
    durationDays: number;
    enrollmentCount: number;
    moduleCount: number;
    isEnrolled?: boolean;
    currentDay?: number;
    streak?: number;
    onEnroll?: () => void;
    onContinue?: () => void;
}

export function ProgramCard({
    id,
    name,
    slug,
    description,
    durationDays,
    enrollmentCount,
    moduleCount,
    isEnrolled = false,
    currentDay,
    streak,
    onEnroll,
    onContinue
}: ProgramCardProps) {
    const progressPercent = currentDay ? (currentDay / durationDays) * 100 : 0;

    return (
        <div className={cn(
            "bg-card border rounded-2xl p-6 transition-all hover:shadow-lg",
            isEnrolled && "border-violet-500/50 bg-violet-500/5"
        )}>
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                    "p-3 rounded-xl",
                    isEnrolled ? "bg-gradient-to-br from-violet-600 to-indigo-600" : "bg-violet-500/10"
                )}>
                    <GraduationCap className={cn(
                        "h-6 w-6",
                        isEnrolled ? "text-white" : "text-violet-500"
                    )} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {durationDays} days
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {enrollmentCount} enrolled
                        </span>
                    </div>
                </div>
                {isEnrolled && streak !== undefined && streak > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 rounded-full">
                        <Flame className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-500">{streak}</span>
                    </div>
                )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {description}
            </p>

            {/* Progress (if enrolled) */}
            {isEnrolled && currentDay !== undefined && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Day {currentDay} of {durationDays}</span>
                        <span className="font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Button */}
            {isEnrolled ? (
                <button
                    onClick={onContinue}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-violet-500/25"
                >
                    Continue Day {currentDay}
                    <ArrowRight className="h-4 w-4" />
                </button>
            ) : (
                <button
                    onClick={onEnroll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border-2 border-violet-500 text-violet-500 rounded-lg hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 hover:text-white hover:border-transparent transition-all font-medium"
                >
                    Start Program
                    <ArrowRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

// Compact version for sidebar or list views
export function ProgramCardCompact({
    name,
    currentDay,
    durationDays,
    streak,
    onClick
}: {
    name: string;
    currentDay: number;
    durationDays: number;
    streak: number;
    onClick?: () => void;
}) {
    const progressPercent = (currentDay / durationDays) * 100;

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-violet-500/50 transition-all text-left"
        >
            <div className="p-2 bg-violet-500/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{name}</p>
                <p className="text-sm text-muted-foreground">Day {currentDay}/{durationDays}</p>
            </div>
            <div className="flex items-center gap-3">
                {streak > 0 && (
                    <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">{streak}</span>
                    </div>
                )}
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </button>
    );
}
