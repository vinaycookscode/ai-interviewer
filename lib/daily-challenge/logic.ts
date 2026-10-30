// The daily challenge and the one streak (AIIN-99). Pure functions (no database, no "@/" imports), tested with `npm test`.
import { istDay } from "../weekly-report/report.ts";
import { roleFromName, type CareerRole } from "../career-path.ts";

export { istDay };

export type Track = CareerRole | "general";

/** The track from the career path; no role means the general track. */
export function trackFor(primaryRole: string | null | undefined): Track {
    return roleFromName(primaryRole) ?? "general";
}

/** Aptitude and HR alternate by day. Coding joins when code runs on the server (AIIN-105). */
export const CHALLENGE_TYPES = ["APTITUDE", "HR"] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export interface PoolQuestion {
    id: string;
    type: string;
    question: string;
    roles: string[];
}

/** FNV-1a: a stable shuffle key, so every candidate on a track sees the same order. */
function hash(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
    return h;
}

/**
 * Today's question for a track: the same for everyone on it all IST day, new at midnight. Questions of the
 * day's type are put in a fixed order for the track and taken one per day of that type, so none repeats
 * until the whole pool has been used. Duplicate texts (the same question in several companies) count once.
 */
export function pickQuestion(day: number, track: Track, pool: PoolQuestion[]): PoolQuestion | null {
    const type = CHALLENGE_TYPES[day % CHALLENGE_TYPES.length];
    const ofType = pool.filter((q) => q.type === type);
    const forTrack = ofType.filter((q) => q.roles.some((r) => r.toLowerCase() === track));
    const candidates = forTrack.length ? forTrack : ofType;

    const unique = new Map<string, PoolQuestion>();
    for (const q of [...candidates].sort((a, b) => a.id.localeCompare(b.id))) {
        const key = q.question.trim().toLowerCase();
        if (!unique.has(key)) unique.set(key, q);
    }
    const ordered = [...unique.values()].sort((a, b) => hash(`${track}:${a.question}`) - hash(`${track}:${b.question}`));
    if (!ordered.length) return null;
    return ordered[Math.floor(day / CHALLENGE_TYPES.length) % ordered.length];
}

/** Consecutive active IST days ending today, or yesterday if today isn't done yet. A missed day ends it. */
export function dailyStreak(activeDays: number[], today: number): number {
    const days = new Set(activeDays);
    let day = days.has(today) ? today : today - 1;
    let streak = 0;
    while (days.has(day)) {
        streak++;
        day--;
    }
    return streak;
}

/** Monday to Sunday of the IST week containing `today`. */
export function weekDays(today: number): number[] {
    const monday = today - ((today + 3) % 7);
    return Array.from({ length: 7 }, (_, i) => monday + i);
}

/** An IST day number as the YYYY-MM-DD date stored in the database. */
export const dayDate = (day: number) => new Date(day * 24 * 60 * 60 * 1000);
/** A stored date (midnight UTC of that calendar day) back to an IST day number. */
export const dateDay = (date: Date) => Math.round(date.getTime() / (24 * 60 * 60 * 1000));

/** The shared week row in the plan's shape: done, missed, today, upcoming, or before the plan started. */
export function planWeek(week: { day: number; done: boolean }[], today: number, planStart: number) {
    return week.map(({ day, done }, weekday) => ({
        weekday,
        state: (done ? "done" : day === today ? "today" : day > today ? "upcoming" : day < planStart ? "before" : "missed") as
            | "done" | "today" | "upcoming" | "before" | "missed",
    }));
}
