// When a bank question comes back for review (AIIN-212). Pure: no database, no "@/" imports.
// Leitner boxes, as for flashcards, with the intervals the approved "A question" artboard states: a strong answer
// moves a question to every 3 days, and two strong answers in a row make it Confident.
import { istDay, startOfIstDay } from "../ist.ts";

/** A score this high or higher counts as a strong answer. */
export const STRONG = 7;
/** Days until the next review, by box. Box 0 is a question not yet scored. */
export const BOX_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
const TOP_BOX = 5;
/** From this box a question is Confident. */
const CONFIDENT_BOX = 3;

export type ReviewStatus = "PRACTISING" | "CONFIDENT";

export interface Review {
    box: number;
    status: ReviewStatus;
    nextReview: Date;
    /** Days from today to the next review. */
    inDays: number;
}

/** Where a question goes after an answer scored `score` (0–10): up a box if strong, back to box 1 if not. */
export function review(box: number, score: number, now: Date): Review {
    const next = score >= STRONG ? Math.min(Math.max(box, 1) + 1, TOP_BOX) : 1;
    const inDays = BOX_DAYS[next];
    // Due from midnight IST on that day, so an evening answer is due first thing (as flashcards, AIIN-67)
    return { box: next, status: next >= CONFIDENT_BOX ? "CONFIDENT" : "PRACTISING", nextReview: startOfIstDay(istDay(now) + inDays), inDays };
}

/** Whether a question is due for review now. A question never scheduled isn't due. */
export function isDue(nextReview: Date | null, now: Date): boolean {
    return !!nextReview && nextReview.getTime() <= now.getTime();
}

/** Whole IST days until a review: 0 for today or overdue. */
export function daysUntil(nextReview: Date, now: Date): number {
    return Math.max(0, istDay(nextReview) - istDay(now));
}
