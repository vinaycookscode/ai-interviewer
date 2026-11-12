// Application stages (AIIN-195). Plain module: pages, actions and tests share it. Names follow the approved design.

export const STAGES = ["INVITED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED", "WITHDRAWN", "DECLINED"] as const;
export type Stage = (typeof STAGES)[number];

/** The employer's pipeline, in order, as tabs. Invited, Withdrawn and Declined appear only where they apply. */
export const PIPELINE: Stage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];
/** Stages that end an application. */
export const CLOSED: Stage[] = ["HIRED", "REJECTED", "WITHDRAWN", "DECLINED"];
/** Where an employer can move an application by hand. Withdrawn and Declined are the candidate's to choose. */
export const EMPLOYER_MOVES: Stage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

export const NOTE_MAX = 1000;

/** The next step forward, for the one coral "Move to …" button. None once it's closed or hired. */
export function nextStage(stage: Stage): Stage | null {
    const order: Stage[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"];
    const i = order.indexOf(stage);
    return i >= 0 && i < order.length - 1 ? order[i + 1] : null;
}

/** Whether an employer may move an application from one stage to another. Invited ones wait for the candidate. */
export function canMove(from: Stage, to: Stage): boolean {
    return from !== to && from !== "INVITED" && from !== "WITHDRAWN" && from !== "DECLINED" && EMPLOYER_MOVES.includes(to);
}

/**
 * An AI interview's decision moves the application (the application holds the outcome): Shortlisted to Screening if
 * it's earlier than that, Rejected to Rejected. Undecided and On hold leave the stage alone. Never moves a closed one.
 */
export function stageFromDecision(decision: "UNDECIDED" | "SHORTLISTED" | "ON_HOLD" | "REJECTED", current: Stage): Stage | null {
    if (CLOSED.includes(current) || current === "INVITED") return null;
    if (decision === "REJECTED") return "REJECTED";
    if (decision === "SHORTLISTED" && current === "APPLIED") return "SCREENING";
    return null;
}

/** What the candidate sees for each stage (AC2: a rejection reads "Not selected", never the reason). */
export function candidateStage(
    stage: Stage,
): "Invited" | "Applied" | "In review" | "Interviewing" | "Offer" | "Hired" | "Not selected" | "Withdrawn" | "Declined" {
    return (
        {
            INVITED: "Invited",
            APPLIED: "Applied",
            SCREENING: "In review",
            INTERVIEW: "Interviewing",
            OFFER: "Offer",
            HIRED: "Hired",
            REJECTED: "Not selected",
            WITHDRAWN: "Withdrawn",
            DECLINED: "Declined",
        } as const
    )[stage];
}

/** A note or reason, tidied and bounded; null for nothing. */
export function cleanNote(v: unknown): string | null | undefined {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    return s.length > NOTE_MAX ? undefined : s || null;
}
