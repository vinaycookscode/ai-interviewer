// The grading queue's rules (AIIN-170). Plain module, tested on its own (lib/grading-rules.test.ts).

export const MAX_GRADING_ATTEMPTS = 5;
export const MIN_TRANSCRIPT = 10; // shorter answers aren't scored (as before), and don't count in the average

/** 30 s, 1, 2, 4 minutes: enough for a rate limit to pass without losing anyone (AC3). */
export function gradingBackoffMs(attempts: number): number {
    return 30_000 * 2 ** Math.max(0, attempts - 1);
}

/** The interview's score: the average of its scored answers, as since AIIN-36 (AC7). Null if none were scored. */
export function averageScore(scores: (number | null)[]): number | null {
    const valid = scores.filter((s): s is number => typeof s === "number");
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

export type ScoringState = "SCORED" | "SCORING" | "FAILED" | "UNSCORED";
/** What lists show for a finished interview: never a number from a partial average (AC2, AC4). */
export function scoringState(i: { score: number | null; pending: number; failed: number }): ScoringState {
    if (i.failed > 0) return "FAILED";
    if (i.pending > 0) return "SCORING";
    return i.score === null ? "UNSCORED" : "SCORED";
}
