// Comparing candidates side by side (AIIN-160). Pure: no database, no "@/" imports.

export const COMPARE_MIN = 2;
export const COMPARE_MAX = 4;

/** The ids to compare from `?ids=a,b,c`: unique, in order; or why they can't be compared. */
export function parseCompareIds(raw: string | string[] | undefined): { ok: true; ids: string[] } | { ok: false; reason: "count" } {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const ids = [...new Set((value ?? "").split(",").map((s) => s.trim()).filter((s) => /^[\w-]{1,64}$/.test(s)))];
    return ids.length >= COMPARE_MIN && ids.length <= COMPARE_MAX ? { ok: true, ids } : { ok: false, reason: "count" };
}

/** For one question, which candidates hold the top score. Ties all count; a question nobody scored has none. */
export function bestOf(scores: (number | null)[]): boolean[] {
    const top = Math.max(...scores.map((s) => (s == null ? -Infinity : s)));
    return scores.map((s) => s != null && Number.isFinite(top) && s === top && scores.filter((x) => x != null).length > 1);
}

/** The question whose scores differ most across the candidates: the one where their own words say the most. */
export function mostTelling(rows: (number | null)[][]): number {
    let pick = 0;
    let widest = -1;
    rows.forEach((scores, i) => {
        const known = scores.filter((s): s is number => s != null);
        const spread = known.length > 1 ? Math.max(...known) - Math.min(...known) : -1;
        if (spread > widest) {
            widest = spread;
            pick = i;
        }
    });
    return pick;
}

/** The first sentence of feedback, for the one line under each score. */
export function firstSentence(text: string | null, max = 120): string | null {
    if (!text) return null;
    const sentence = text.trim().split(/(?<=[.!?])\s+/)[0];
    return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}
