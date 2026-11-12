// The anonymous card employers see when matching (AIIN-198). One function for the candidate's preview and for
// employers' match lists (AIIN-200), so they can't drift apart (AC3). Plain module: no names, contacts or companies.
import type { ResumeFacts } from "./resume-facts.ts";

export interface AnonymousCard {
    code: string;
    role: string | null;
    years: number | null;
    skills: string[];
    city: string | null;
    noticeDays: number | null;
    practiceScore: number | null;
    degree: string | null;
}

/** A stable, short, non-reversible label like "Candidate 4F2A" (FNV-1a of the id): the same in every list. */
export function candidateCode(userId: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < userId.length; i++) {
        h ^= userId.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return `Candidate ${(h >>> 16).toString(16).toUpperCase().padStart(4, "0")}`;
}

/** The average of the latest practice scores (0–10), one decimal; null with none. */
export function practiceScore(scores: (number | null)[]): number | null {
    const s = scores.filter((n): n is number => typeof n === "number" && n >= 0 && n <= 10).slice(0, 5);
    return s.length ? Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10 : null;
}

/**
 * The card, from confirmed facts only. Never a name, contact, employer name, college name or photo: the role is the
 * job title without the company, education is the degree without the institution.
 */
export function anonymousCard(input: { userId: string; facts: ResumeFacts; primaryRole: string | null; noticeDays: number | null; practiceScores: (number | null)[] }): AnonymousCard {
    const f = input.facts;
    return {
        code: candidateCode(input.userId),
        role: f.experience[0]?.title ?? input.primaryRole ?? null,
        years: f.totalYears,
        skills: f.skills.slice(0, 5).map((s) => s.name),
        city: f.city,
        noticeDays: input.noticeDays,
        practiceScore: practiceScore(input.practiceScores),
        degree: f.education[0] ? `${f.education[0].degree}${f.education[0].year ? ` · ${f.education[0].year}` : ""}` : null,
    };
}
