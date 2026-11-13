// A college's placement officer's read-only view of a drive (AIIN-173). No database, no "@/" imports.

/** How far a student got, as the officer sees it: never a score or a decision other than shortlisted. */
export type OfficerStage = "NOT_STARTED" | "STARTED" | "APTITUDE_FAILED" | "FINISHED";
/** The officer's filters. "Started" includes those who didn't pass aptitude: they began and stopped. */
export const OFFICER_FILTERS = ["NOT_STARTED", "STARTED", "FINISHED"] as const;
export type OfficerFilter = (typeof OFFICER_FILTERS)[number];

export function officerStage(stage: string): OfficerStage {
    switch (stage) {
        case "INVITED":
        case "OPENED":
            return "NOT_STARTED";
        case "APTITUDE_FAILED":
            return "APTITUDE_FAILED";
        case "INTERVIEW_FINISHED":
            return "FINISHED";
        default:
            return "STARTED";
    }
}

export function inFilter(stage: OfficerStage, filter: OfficerFilter | null): boolean {
    if (!filter) return true;
    if (filter === "STARTED") return stage === "STARTED" || stage === "APTITUDE_FAILED";
    return stage === filter;
}

const DAY = 24 * 60 * 60 * 1000;
/** Links last this long after the drive closes, by default. */
export const AFTER_CLOSE_DAYS = 14;
/** And never longer than this after the drive closes. */
export const MAX_AFTER_CLOSE_DAYS = 60;

/** The default: two weeks after the drive closes, or two weeks from now if it has no close date or closed already. */
export function defaultExpiry(closesAt: Date | null, now: Date): Date {
    const base = closesAt && closesAt > now ? closesAt : now;
    return new Date(base.getTime() + AFTER_CLOSE_DAYS * DAY);
}

/**
 * The expiry the employer picked, as a "YYYY-MM-DD" date (end of that day in India), if it's in the future and no later
 * than 60 days after the drive closes. Null otherwise.
 */
export function pickedExpiry(day: unknown, closesAt: Date | null, now: Date): Date | null {
    if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const at = new Date(`${day}T23:59:59+05:30`);
    if (Number.isNaN(at.getTime()) || at <= now) return null;
    const latest = (closesAt && closesAt > now ? closesAt : now).getTime() + MAX_AFTER_CLOSE_DAYS * DAY;
    return at.getTime() > latest ? null : at;
}

/** "YYYY-MM-DD" in India, for a date input. */
export function istDay(d: Date): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** A plausible email address, lower-cased, or null. */
export function cleanEmail(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const e = v.trim().toLowerCase();
    return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}
