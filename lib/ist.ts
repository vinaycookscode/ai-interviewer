// Calendar days in India time (AIIN-67). IST is UTC+5:30 all year, with no daylight saving,
// so a fixed offset gives the right local date without a timezone library.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Which IST calendar day a moment falls on, as a whole number that goes up by 1 each midnight IST. */
export function istDay(date: Date): number {
    return Math.floor((date.getTime() + IST_OFFSET_MS) / DAY_MS);
}

/** Midnight IST at the start of the given IST day. */
export function startOfIstDay(day: number): Date {
    return new Date(day * DAY_MS - IST_OFFSET_MS);
}
