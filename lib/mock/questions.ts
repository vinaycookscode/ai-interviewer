// A practice's questions and how an answer is graded (AIIN-208). Pure: no database, no "@/" imports.

/** How many questions Gemini writes; one more comes from the question bank when there's one to use. */
export const PRACTICE_SIZE = 5;

export interface BankQuestion {
    id: string;
    question: string;
}

/**
 * Gemini's questions with the bank's one last, as the behavioural closer, and for each question the bank id it came
 * from ("" when Gemini wrote it). Five in all; without a bank question, Gemini's five.
 */
export function mergeBankQuestion(written: string[], bank: BankQuestion | null): { questions: string[]; bankQuestionIds: string[] } {
    const own = written.filter((q) => q.trim() && q !== bank?.question).slice(0, bank ? PRACTICE_SIZE - 1 : PRACTICE_SIZE);
    return bank
        ? { questions: [...own, bank.question], bankQuestionIds: [...own.map(() => ""), bank.id] }
        : { questions: own, bankQuestionIds: own.map(() => "") };
}

/** The bank id a stored question came from, or null. */
export function bankIdFor(questions: string[], bankQuestionIds: string[], question: string): string | null {
    const i = questions.indexOf(question);
    return (i >= 0 && bankQuestionIds[i]) || null;
}

export interface Reference {
    answer: string | null;
    tips: string | null;
}

/** The grading prompt. A bank question's model answer and tips go in, so the score is against them. */
export function gradingPrompt(question: string, transcript: string, role: string, reference: Reference | null): string {
    const guide = [
        reference?.answer ? `A strong answer, for reference (the candidate needn't match its wording): ${reference.answer}` : "",
        reference?.tips ? `What interviewers look for: ${reference.tips}` : "",
    ].filter(Boolean);
    return `
      Question: ${question}
      Candidate Answer: ${transcript}
${guide.map((g) => `      ${g}`).join("\n")}

      Evaluate this answer for a ${role} role${guide.length ? ", judging it against the reference above" : ""}.
      Provide a JSON response with:
      - score (1-10 number)
      - feedback (concise string, max 2 sentences)

      Return ONLY valid JSON.
    `;
}
