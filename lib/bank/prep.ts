// Picking a prep set for an upcoming interview (AIIN-213). Pure: no database, no "@/" imports.
import { BANK_TYPES, type BankType } from "./items.ts";

export const PREP_SIZE = 15;
/** How many each group aims for: the job's must-haves, the company's own questions, the candidate's weak spots. */
export const GROUP_SIZE = { JOB: 6, COMPANY: 4, WEAK: 5 } as const;
export type PrepGroup = keyof typeof GROUP_SIZE;
/** Two questions this similar are the same question (AC2), and one this close to the employer's is theirs (AC3). */
export const NEAR_DUPLICATE = 0.92;
/** A bank question this close to the job counts as one of its must-haves. */
export const RELATED = 0.62;
/** Below this score a question is a weak spot. */
export const WEAK_SCORE = 6;

export interface Candidate {
    /** A bank item's id, or "ai:<n>" for one Gemini suggests. */
    key: string;
    text: string;
    group: PrepGroup;
    vector: number[];
}

export function cosine(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const normal = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * The set, in order: candidates are tried group by group in the order given, each kept only if it isn't a near-duplicate
 * of one already kept (AC2) or of an employer's own question (AC3). Spare AI suggestions (group JOB, key "ai:") fill any
 * group left short, so the set reaches PREP_SIZE when there are enough.
 */
export function pickPrepSet(candidates: Candidate[], employerQuestions: { text: string; vector: number[] }[]): Candidate[] {
    const kept: Candidate[] = [];
    const employerTexts = new Set(employerQuestions.map((q) => normal(q.text)));
    const fits = (c: Candidate) =>
        !employerTexts.has(normal(c.text)) &&
        employerQuestions.every((q) => cosine(c.vector, q.vector) <= NEAR_DUPLICATE) &&
        kept.every((k) => k.key !== c.key && cosine(c.vector, k.vector) <= NEAR_DUPLICATE);

    for (const group of ["JOB", "COMPANY", "WEAK"] as const) {
        let taken = 0;
        for (const c of candidates) {
            if (c.group !== group || taken >= GROUP_SIZE[group]) continue;
            // AI suggestions wait until the candidate's own and the company's questions have had their turn
            if (c.key.startsWith("ai:")) continue;
            if (fits(c)) {
                kept.push(c);
                taken++;
            }
        }
    }
    for (const c of candidates) {
        if (kept.length >= PREP_SIZE) break;
        if (c.key.startsWith("ai:") && fits(c)) kept.push({ ...c, group: "JOB" });
    }
    const order: PrepGroup[] = ["JOB", "COMPANY", "WEAK"];
    return kept.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}

/** The prompt for a job's must-have skills and practice questions on them. Never given the employer's own questions. */
export function prepPrompt(job: { title: string; description: string }): string {
    return `A fresher in India has an interview for this job.
Title: ${job.title}
Description: ${job.description.slice(0, 3000)}

Return ONLY JSON: {"skills": [3 to 5 must-have skills, short names], "questions": [12 interview questions on those skills, each {"question": string, "type": "HR" | "TECHNICAL" | "CODING" | "APTITUDE"}]}.
Mostly technical, at most 2 HR. Write your own practice questions; each under 200 characters.`;
}

export interface PrepSuggestion {
    skills: string[];
    questions: { question: string; type: BankType }[];
}

/** Gemini's reply, checked: up to 5 skills, up to 12 usable questions. Anything malformed is dropped, not trusted. */
export function parsePrepSuggestion(raw: string): PrepSuggestion {
    let data: unknown;
    try {
        data = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch {
        return { skills: [], questions: [] };
    }
    const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const skills = (Array.isArray(obj.skills) ? obj.skills : []).filter((s): s is string => typeof s === "string" && !!s.trim()).map((s) => s.trim().slice(0, 40)).slice(0, 5);
    const questions = (Array.isArray(obj.questions) ? obj.questions : [])
        .flatMap((q) => {
            const item = (q && typeof q === "object" ? q : {}) as Record<string, unknown>;
            const question = typeof item.question === "string" ? item.question.trim() : "";
            if (question.length < 10 || question.length > 300) return [];
            const type = (BANK_TYPES as readonly unknown[]).includes(item.type) ? (item.type as BankType) : "TECHNICAL";
            return [{ question, type }];
        })
        .slice(0, 12);
    return { skills, questions };
}
