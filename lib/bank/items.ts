// What goes into a candidate's Question Bank and under which key (AIIN-209). Pure: no database, no "@/" imports.

/** The four kinds of question the bank sorts by. */
export const BANK_TYPES = ["HR", "TECHNICAL", "CODING", "APTITUDE"] as const;
export type BankType = (typeof BANK_TYPES)[number];

/**
 * One bank item per question: a Company prep question is keyed by its id, so saving it twice or practising it again
 * updates the same item. A question Gemini wrote for one practice is keyed by the answer it came with.
 */
export function bankKey(link: { companyQuestionId?: string | null; mockAnswerId?: string | null; selfId?: string | null }): string {
    if (link.companyQuestionId) return `cq:${link.companyQuestionId}`;
    if (link.mockAnswerId) return `mock:${link.mockAnswerId}`;
    // A question the candidate added (AIIN-211) is its own item, even if they add the same words twice
    if (link.selfId) return `self:${link.selfId}`;
    throw new Error("A bank item needs a source");
}

export const QUESTION_MAX = 500;
export const COMPANY_MAX = 100;
export const NOTES_MAX = 2000;

export interface NewQuestion {
    question: string;
    company: string | null;
    type: BankType;
    notes: string | null;
    writeAnswer: boolean;
}

/** A question the candidate adds from a real interview (AIIN-211), checked and trimmed; or which field is wrong. */
export function parseNewQuestion(input: unknown): { ok: true; value: NewQuestion } | { ok: false; field: "question" | "company" | "type" | "notes" } {
    const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const question = text(raw.question);
    const company = text(raw.company);
    const notes = text(raw.notes);
    if (question.length < 5 || question.length > QUESTION_MAX) return { ok: false, field: "question" };
    if (company.length > COMPANY_MAX) return { ok: false, field: "company" };
    if (!(BANK_TYPES as readonly unknown[]).includes(raw.type)) return { ok: false, field: "type" };
    if (notes.length > NOTES_MAX) return { ok: false, field: "notes" };
    return { ok: true, value: { question, company: company || null, type: raw.type as BankType, notes: notes || null, writeAnswer: raw.writeAnswer === true } };
}

/** The prompt for a model answer to a question the candidate was asked (AIIN-211). Plain text back, no markdown. */
export function modelAnswerPrompt(q: { question: string; type: BankType; company: string | null }): string {
    const how: Record<BankType, string> = {
        HR: "a strong spoken answer a fresher could give, using one specific example with a clear result",
        TECHNICAL: "a clear spoken explanation an interviewer would rate highly, with the key trade-offs",
        CODING: "the approach in words, its time and space complexity, and the edge cases to mention",
        APTITUDE: "the working, step by step, and the final answer",
    };
    return `A candidate in India was asked this in a real ${q.company ? `${q.company} ` : ""}interview:
"${q.question}"

Write ${how[q.type]}. Under 180 words. Start with the answer itself, no preamble such as "Certainly". Plain text, no markdown, no headings. Don't invent facts about the candidate; where a personal detail is needed, write it as a placeholder in square brackets.`;
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
