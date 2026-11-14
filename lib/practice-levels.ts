// Practice interview settings (AIIN-49). Plain module: shared by the practice screen and the server action.

export const PRACTICE_LEVELS = ["Junior", "Mid", "Senior"] as const;
export type PracticeLevel = (typeof PRACTICE_LEVELS)[number];
export const ROLE_MAX = 100;

/** The role and level as the action accepts them, or null. The role goes into a Gemini prompt: one line, capped. */
export function cleanPracticeSettings(role: unknown, difficulty: unknown): { role: string; difficulty: PracticeLevel } | null {
    if (typeof role !== "string" || typeof difficulty !== "string") return null;
    const r = role.replace(/\s+/g, " ").trim();
    if (!r || r.length > ROLE_MAX) return null;
    if (!(PRACTICE_LEVELS as readonly string[]).includes(difficulty)) return null;
    return { role: r, difficulty: difficulty as PracticeLevel };
}
