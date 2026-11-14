// The day a visit counts towards (AIIN-82): the calendar day in India, stored as that day's midnight IST. Plain module.

const IST = "Asia/Kolkata";

/** "YYYY-MM-DD" in India. */
export function istDate(now: Date): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Midnight in India on the day `now` falls on, as an instant: the key of that day's DailyStat row. */
export function istDayStart(now: Date): Date {
    return new Date(`${istDate(now)}T00:00:00+05:30`);
}
