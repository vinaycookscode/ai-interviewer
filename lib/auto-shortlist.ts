// A drive's auto-shortlist (AIIN-171): who it decides for, and what. Plain module, tested on its own.

export type Decision = "UNDECIDED" | "SHORTLISTED" | "ON_HOLD" | "REJECTED";

/**
 * At or above the cutoff: Shortlisted, or On hold when the integrity verdict has strong concerns (AC1, AC6). Below it:
 * nothing (never a rejection, AC2). Only for drive interviews with auto-shortlist on (AC3, AC7), and never over a
 * decision a person already made (AC4).
 */
export function autoDecision(i: {
    inDrive: boolean;
    enabled: boolean;
    cutoff: number | null;
    score: number | null;
    decision: Decision;
    strongConcerns: boolean;
}): { to: "SHORTLISTED" | "ON_HOLD"; note: string } | null {
    if (!i.inDrive || !i.enabled || i.cutoff === null || i.score === null) return null;
    if (i.decision !== "UNDECIDED") return null;
    if (i.score < i.cutoff) return null;
    return i.strongConcerns
        ? { to: "ON_HOLD", note: "Integrity review needed" }
        : { to: "SHORTLISTED", note: `Scored ${i.score.toFixed(1)}, at or above the drive's cutoff of ${i.cutoff}` };
}
