"use client";

import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
    currentStreak: number;
    longestStreak: number;
    size?: "sm" | "md" | "lg";
    showDetails?: boolean;
}

export function StreakCounter({
    currentStreak,
    longestStreak,
    size = "md",
    showDetails = false
}: StreakCounterProps) {
    const sizeClasses = {
        sm: { icon: "h-4 w-4", text: "text-lg", container: "p-2" },
        md: { icon: "h-6 w-6", text: "text-2xl", container: "p-3" },
        lg: { icon: "h-8 w-8", text: "text-4xl", container: "p-4" }
    };

    const classes = sizeClasses[size];

    // Determine flame color based on streak
    const getFlameColor = (streak: number) => {
        if (streak >= 30) return "text-orange-500"; // Hot streak!
        if (streak >= 7) return "text-amber-500";    // Building momentum
        if (streak >= 1) return "text-yellow-500";   // Starting out
        return "text-muted-foreground";              // No streak
    };

    return (
        <div className="space-y-4">
            {/* Main Streak Display */}
            <div className={cn(
                "flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl",
                classes.container
            )}>
                <div className={cn(
                    "p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg"
                )}>
                    <Flame className={cn(classes.icon, "text-white")} />
                </div>
                <div>
                    <p className={cn(classes.text, "font-bold text-orange-500")}>
                        {currentStreak}
                    </p>
                    <p className="text-sm text-muted-foreground">day streak</p>
                </div>
            </div>

            {/* Details */}
            {showDetails && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs">Best Streak</span>
                        </div>
                        <p className="text-xl font-bold">{longestStreak}</p>
                    </div>
                    <div className="bg-card border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="text-xs">This Week</span>
                        </div>
                        <p className="text-xl font-bold">{Math.min(currentStreak, 7)}/7</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Streak badges for milestones
export function StreakBadges({ streak }: { streak: number }) {
    const badges = [
        { days: 7, label: "Week Warrior", icon: "🔥", unlocked: streak >= 7 },
        { days: 30, label: "Monthly Master", icon: "⚡", unlocked: streak >= 30 },
        { days: 60, label: "Consistency Champion", icon: "🏆", unlocked: streak >= 60 },
        { days: 90, label: "Program Graduate", icon: "🎓", unlocked: streak >= 90 },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
                <div
                    key={badge.days}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                        badge.unlocked
                            ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30"
                            : "bg-muted/50 border border-muted"
                    )}
                >
                    <span className={cn(
                        "text-base",
                        !badge.unlocked && "grayscale opacity-50"
                    )}>
                        {badge.icon}
                    </span>
                    <span className={cn(
                        badge.unlocked ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {badge.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

// Streak warning for potential streak break
export function StreakWarning({ lastActiveDate }: { lastActiveDate: Date }) {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60));
    const hoursLeft = Math.max(0, 24 - (diffHours % 24));

    if (diffHours < 20) return null; // No warning needed

    return (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <Flame className="h-5 w-5 text-red-500" />
            <div className="flex-1">
                <p className="text-sm font-medium text-red-500">Streak at risk!</p>
                <p className="text-xs text-muted-foreground">
                    Complete a task in the next {hoursLeft}h to keep your streak
                </p>
            </div>
        </div>
    );
}
