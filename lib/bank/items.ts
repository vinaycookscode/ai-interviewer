// What goes into a candidate's Question Bank and under which key (AIIN-209). Pure: no database, no "@/" imports.

/** The four kinds of question the bank sorts by. */
export const BANK_TYPES = ["HR", "TECHNICAL", "CODING", "APTITUDE"] as const;
export type BankType = (typeof BANK_TYPES)[number];

/**
 * One bank item per question: a Company prep question is keyed by its id, so saving it twice or practising it again
 * updates the same item. A question Gemini wrote for one practice is keyed by the answer it came with.
 */
export function bankKey(link: { companyQuestionId?: string | null; mockAnswerId?: string | null }): string {
    if (link.companyQuestionId) return `cq:${link.companyQuestionId}`;
    if (link.mockAnswerId) return `mock:${link.mockAnswerId}`;
    throw new Error("A bank item needs a source");
}

// Phrases that open a behavioural or motivation question.
const HR_OPENERS = /^(tell me about|describe a time|describe a situation|give an example|walk me through a time|why do you|why should|why are you|where do you see|what are your (key )?strengths|what is your greatest|how do you handle|how would you handle a (conflict|disagreement)|what motivates)/i;

/** A rough type for a question with no other signal: behavioural openers are HR, everything else technical. */
export function guessType(question: string): BankType {
    return HR_OPENERS.test(question.trim()) ? "HR" : "TECHNICAL";
}

/**
 * The bank type from a Company prep type ("CODING", "APTITUDE", "HR", "GD") or from the grader's answer, falling back
 * to a guess from the wording. A group discussion practises the same skills as HR.
 */
export function bankType(raw: unknown, question: string): BankType {
    const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    if (value === "GD") return "HR";
    return (BANK_TYPES as readonly string[]).includes(value) ? (value as BankType) : guessType(question);
}
