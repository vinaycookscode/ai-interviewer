// Badges for real milestones (AIIN-102): one list, each a measure and the number that earns it.
// Pure functions (no database, no "@/" imports), tested with `npm test`.

/** What a badge is measured by. Each is loaded on its own, so an action only counts what it changed. */
export type Metric = "streak" | "practice" | "bestScore" | "challenges" | CheckpointMetric | "problems" | "flashcards";

/** Each plan checkpoint is its own: 1 once that day's checkpoint interview is finished (AIIN-101). */
export type CheckpointMetric = "checkpoint30" | "checkpoint60" | "checkpoint90";
export const checkpointMetric = (day: number): CheckpointMetric | null =>
    day === 30 || day === 60 || day === 90 ? `checkpoint${day}` : null;

export type Stats = Record<Metric, number>;

export interface Achievement {
    key: string;
    metric: Metric;
    target: number;
}

export const ACHIEVEMENTS = [
    { key: "streak7", metric: "streak", target: 7 },
    { key: "streak14", metric: "streak", target: 14 },
    { key: "streak30", metric: "streak", target: 30 },
    { key: "firstPractice", metric: "practice", target: 1 },
    { key: "fivePractice", metric: "practice", target: 5 },
    { key: "firstEight", metric: "bestScore", target: 8 },
    { key: "challenges7", metric: "challenges", target: 7 },
    { key: "checkpoint30", metric: "checkpoint30", target: 1 },
    { key: "checkpoint60", metric: "checkpoint60", target: 1 },
    { key: "checkpoint90", metric: "checkpoint90", target: 1 },
    { key: "problems25", metric: "problems", target: 25 },
    { key: "flashcards100", metric: "flashcards", target: 100 },
] as const satisfies readonly Achievement[];

export type AchievementKey = (typeof ACHIEVEMENTS)[number]["key"];

const KEYS = new Set<string>(ACHIEVEMENTS.map((a) => a.key));
export const isAchievementKey = (key: string): key is AchievementKey => KEYS.has(key);

/** The badges these stats earn. Only the metrics given are judged, so a partial count never takes one away. */
export function earnedKeys(stats: Partial<Stats>): AchievementKey[] {
    return ACHIEVEMENTS.filter((a) => (stats[a.metric] ?? 0) >= a.target).map((a) => a.key);
}

/** The badges measured by these metrics, or all of them. */
export function metricsFor(only?: Metric[]): Metric[] {
    return only ?? [...new Set(ACHIEVEMENTS.map((a) => a.metric))];
}

/** The longest run of consecutive days, so a streak badge stays earned after the streak ends. */
export function longestRun(days: number[]): number {
    const sorted = [...new Set(days)].sort((a, b) => a - b);
    let best = 0;
    let run = 0;
    for (let i = 0; i < sorted.length; i++) {
        run = i > 0 && sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
        best = Math.max(best, run);
    }
    return best;
}

/** How far a locked counting badge has got, for "9 of 25 solved". Streaks, scores and checkpoints aren't counts. */
export function progressOf(a: Achievement, stats: Stats): number | null {
    if (a.metric === "streak" || a.metric === "bestScore" || a.target === 1) return null;
    const value = Math.min(stats[a.metric], a.target);
    return value > 0 ? value : null;
}

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L

/** A certificate's verification code, GBTU-XXXX-XXXX, from random bytes (8 or more). */
export function certificateCode(bytes: Uint8Array): string {
    const chars = Array.from(bytes.slice(0, 8), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
    return `GBTU-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

export const CERTIFICATE_CODE = /^GBTU-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

/** A finished plan earns a certificate when it's the 90-day one (or longer). */
export const CERTIFICATE_MIN_DAYS = 90;
