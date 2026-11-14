// Kept resume reviews (AIIN-64). Plain module.

/** Reviews are kept this long, then deleted by the daily retention job. */
export const REVIEWS_KEPT_DAYS = 365;
/** How many past reviews the page lists. */
export const REVIEWS_SHOWN = 20;

/** What a review was for: the job description's first line, trimmed, or null for a general review. */
export function reviewLabel(jobDescription: string | null | undefined): string | null {
    const line = (jobDescription ?? "")
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .find((l) => l.length > 0);
    if (!line) return null;
    return line.length > 80 ? `${line.slice(0, 79).trimEnd()}…` : line;
}

export interface StoredAnalysis {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywords: string[];
    atsCompatibility: number;
    formattingIssues?: string[];
}

/** A stored review read back safely: missing or odd fields become empty, never a crash. */
export function readStoredAnalysis(v: unknown, score: number): StoredAnalysis {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    const list = (k: string) => (Array.isArray(o[k]) ? (o[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);
    return {
        score,
        summary: typeof o.summary === "string" ? o.summary : "",
        strengths: list("strengths"),
        weaknesses: list("weaknesses"),
        suggestions: list("suggestions"),
        keywords: list("keywords"),
        atsCompatibility: typeof o.atsCompatibility === "number" ? o.atsCompatibility : 0,
        ...(Array.isArray(o.formattingIssues) ? { formattingIssues: list("formattingIssues") } : {}),
    };
}
