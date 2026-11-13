// The interview's summary, written by AI from its answers once they're all scored (AIIN-41). Plain module, no
// database or "@/" imports, so `npm test` runs it with Node directly.

export interface SummaryAnswer {
    question: string;
    transcript: string;
    score: number | null;
    feedback: string | null;
}

export interface Summaries {
    /** To the candidate, in the second person. */
    candidate: string;
    /** For the employer, in the third person. */
    employer: string;
}

const LANGUAGES: Record<string, string> = { en: "English", hi: "Hindi", mr: "Marathi" };
const MAX = 600;

export function summaryPrompt(input: { job: string; language: string; answers: SummaryAnswer[] }): string {
    const language = LANGUAGES[input.language] ?? "English";
    const answers = input.answers
        .map(
            (a, i) =>
                `Question ${i + 1}: ${a.question}\nAnswer: ${a.transcript.slice(0, 2000)}\nScore: ${a.score === null ? "not scored" : `${a.score}/10`}\nFeedback: ${a.feedback ?? "none"}`,
        )
        .join("\n\n");
    return `You are U, a warm, direct interview coach. A candidate just finished an interview for "${input.job}".
Write two short summaries of how the interview went, based only on the answers, scores and feedback below.

- "candidate": 2 or 3 sentences to the candidate ("you"). Name the one thing that worked best and the one change that
  would lift their score most, quoting a specific detail from their answers. No greeting, no score number.
- "employer": 2 or 3 sentences for the hiring team about the candidate ("they"). Strengths and gaps, backed by what they
  said. Neutral, no recommendation to hire or reject, no score number.

Write both in ${language}. Plain text only. Return JSON only: {"candidate": "...", "employer": "..."}

${answers}`;
}

/** The two summaries from the model's reply, or null if it isn't usable. */
export function parseSummaries(reply: string): Summaries | null {
    const json = reply.replace(/```(?:json)?/g, "").trim();
    const start = json.indexOf("{");
    const end = json.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
        const o = JSON.parse(json.slice(start, end + 1)) as Record<string, unknown>;
        const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX) : "");
        const candidate = clean(o.candidate);
        const employer = clean(o.employer);
        return candidate && employer ? { candidate, employer } : null;
    } catch {
        return null;
    }
}

/** While a summary may still be on its way: scored in the last 15 minutes and not written yet. */
export function summaryPending(summary: string | null, scored: boolean, completedAt: Date | null, now: Date): boolean {
    return !summary && scored && !!completedAt && now.getTime() - completedAt.getTime() < 15 * 60_000;
}
