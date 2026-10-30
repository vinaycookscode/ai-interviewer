// What the Monday report says (AIIN-103). Pure functions (no database, no "@/" imports), tested with `npm test`.
//
// The report covers last Monday to Sunday in IST. A candidate gets:
//   "active": they did something that week;
//   "quiet":  nothing that week, but something in the 3 weeks before (so at most 3 quiet emails in a row);
//   nothing:  no activity in the last 4 weeks.

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Days since the epoch, counted in IST. */
export const istDay = (d: Date) => Math.floor((d.getTime() + IST_OFFSET_MS) / DAY_MS);

export interface Week {
    /** First instant of Monday, IST. */
    start: Date;
    /** First instant of the following Monday, IST. */
    end: Date;
    /** The Monday as YYYY-MM-DD, for the sent log. */
    monday: string;
}

/** The last full Monday-to-Sunday week before `now`, in IST. */
export function lastWeek(now: Date): Week {
    const today = istDay(now);
    const thisMonday = today - ((today + 3) % 7); // day 0 was a Thursday
    const monday = thisMonday - 7;
    const toInstant = (day: number) => new Date(day * DAY_MS - IST_OFFSET_MS);
    return { start: toInstant(monday), end: toInstant(thisMonday), monday: new Date(monday * DAY_MS).toISOString().slice(0, 10) };
}

export interface WeekActivity {
    /** Practice interviews finished this week (scored or not). */
    practice: { score: number | null; role: string }[];
    /** Average practice score the week before, if any were scored. */
    previousAverage: number | null;
    /** Scored practice answers this week. */
    answers: { question: string; score: number }[];
    /** When anything happened this week: practice, plan tasks, flashcard reviews. */
    activity: Date[];
    flashcardsReviewed: number;
    /** The 90-day plan, if they're enrolled. */
    plan: { streak: number; paused: boolean } | null;
    /** Anything in the 3 weeks before this one. */
    activeBefore: boolean;
}

export type NextStep =
    | { kind: "practiseRole"; role: string }
    | { kind: "startPlan" }
    | { kind: "planTask" }
    | { kind: "practice" };

export interface Report {
    kind: "active" | "quiet";
    practice: { count: number; average: number | null; change: number | null };
    daysActive: number;
    flashcardsReviewed: number;
    planStreak: number | null;
    strongest: { question: string; score: number } | null;
    weakest: { question: string; score: number } | null;
    next: NextStep;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildReport(a: WeekActivity): Report | null {
    const active = a.activity.length > 0;
    if (!active && !a.activeBefore) return null;

    const scored = a.practice.map((p) => p.score).filter((s): s is number => s !== null);
    const average = scored.length ? round1(scored.reduce((x, y) => x + y, 0) / scored.length) : null;
    const change = average !== null && a.previousAverage !== null ? round1(average - round1(a.previousAverage)) : null;

    const byScore = [...a.answers].sort((x, y) => y.score - x.score);
    const strongest = byScore.length >= 2 ? byScore[0] : null;
    const weakest = byScore.length >= 2 ? byScore[byScore.length - 1] : null;

    // One next step, by a plain rule
    let next: NextStep;
    if (weakest && weakest.score < 7 && a.practice.length) next = { kind: "practiseRole", role: a.practice[0].role };
    else if (!a.plan) next = { kind: "startPlan" };
    else if (!a.plan.paused) next = { kind: "planTask" };
    else next = { kind: "practice" };
    if (!active) next = a.plan && !a.plan.paused ? { kind: "planTask" } : { kind: "practice" };

    return {
        kind: active ? "active" : "quiet",
        practice: { count: a.practice.length, average, change },
        daysActive: new Set(a.activity.map(istDay)).size,
        flashcardsReviewed: a.flashcardsReviewed,
        planStreak: a.plan ? a.plan.streak : null,
        strongest,
        weakest,
        next,
    };
}

/** "3 practice interviews · average 7.4 (up 0.6)" */
export function practiceLine(p: Report["practice"]): string {
    const count = `${p.count} practice interview${p.count === 1 ? "" : "s"}`;
    if (p.average === null) return count;
    const change = p.change === null || p.change === 0 ? "" : ` (${p.change > 0 ? "up" : "down"} ${Math.abs(p.change).toFixed(1)})`;
    return `${count} · average ${p.average.toFixed(1)}${change}`;
}
