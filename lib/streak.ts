// Placement-program streaks as they stand today, in IST days (AIIN-134).
import { istDay } from "@/lib/ist";

/** The streak to show: a missed day ends it now, not only when the next task is done. A paused plan keeps it. */
export function liveStreak(streak: number, lastActiveAt: Date, paused: boolean, now = new Date()): number {
    if (paused) return streak;
    return istDay(now) - istDay(lastActiveAt) > 1 ? 0 : streak;
}

/** True when the streak ends tonight unless a task is done today. */
export function streakAtRisk(streak: number, lastActiveAt: Date, paused: boolean, now = new Date()): boolean {
    return !paused && streak > 0 && istDay(now) - istDay(lastActiveAt) === 1;
}

export type WeekDayState = "done" | "missed" | "today" | "upcoming" | "before";

export interface WeekDay {
    /** 0 = Monday … 6 = Sunday */
    weekday: number;
    state: WeekDayState;
}

/** This IST week, Monday to Sunday, with the days a task was completed. Days before the plan started are "before", not missed. */
export function weekRow(completedAt: Date[], startedAt: Date, now = new Date()): WeekDay[] {
    const today = istDay(now);
    // Day 0 of the epoch was a Thursday.
    const monday = today - ((today + 3) % 7);
    const done = new Set(completedAt.map(istDay));
    const start = istDay(startedAt);
    return Array.from({ length: 7 }, (_, weekday) => {
        const day = monday + weekday;
        const state: WeekDayState = done.has(day) ? "done" : day === today ? "today" : day > today ? "upcoming" : day < start ? "before" : "missed";
        return { weekday, state };
    });
}
