// The aptitude round (AIIN-169): drawing an attempt's questions, mapping shown options back to the real ones, the
// deadline, and scoring. Plain module, tested on its own (lib/aptitude.test.ts). The server owns all of it.

export const GRACE_MS = 30_000;

/** Fisher–Yates with a random source that tests can fix. */
export function shuffled<T>(items: T[], rng: () => number = Math.random): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** A test is ready when every section has at least as many checked questions as it asks (AIIN-226 AC1). */
export function readiness(sections: { id: string; name: string; askCount: number }[], checked: Map<string, number>) {
    const missing = sections
        .map((s) => ({ section: s.name, have: checked.get(s.id) ?? 0, ask: s.askCount }))
        .filter((m) => m.have < m.ask || m.ask < 1);
    return { ready: sections.length > 0 && missing.length === 0, missing, total: sections.reduce((n, s) => n + s.askCount, 0) };
}

/**
 * Draw an attempt: askCount questions from each section's checked pool, sections in order, questions shuffled within
 * a section, and each question's options in a shuffled order when the test shuffles (AIIN-226 AC2).
 */
export function drawAttempt(
    sections: { id: string; askCount: number; order: number }[],
    pool: { id: string; sectionId: string; options: number }[],
    shuffle: boolean,
    rng: () => number = Math.random,
): { questionIds: string[]; optionOrders: number[][] } {
    const questionIds: string[] = [];
    const optionOrders: number[][] = [];
    for (const s of [...sections].sort((a, b) => a.order - b.order)) {
        const picked = shuffled(
            pool.filter((q) => q.sectionId === s.id),
            rng,
        ).slice(0, s.askCount);
        for (const q of picked) {
            questionIds.push(q.id);
            const order = Array.from({ length: q.options }, (_, i) => i);
            optionOrders.push(shuffle ? shuffled(order, rng) : order);
        }
    }
    return { questionIds, optionOrders };
}

/** The option the candidate picked, in the question's own order, from the position they saw it in. */
export function originalOption(order: number[] | undefined, shown: number): number | null {
    if (!order || !Number.isInteger(shown) || shown < 0 || shown >= order.length) return null;
    return order[shown];
}

/** Answers still count until the deadline plus a short grace for the network (AC5). */
export function canAnswer(deadline: Date, now: Date): boolean {
    return now.getTime() <= deadline.getTime() + GRACE_MS;
}

/** Score saved answers against the answer key (AC1, AC2). Percent is rounded to one decimal. */
export function scoreAttempt(questionIds: string[], answers: Record<string, number>, key: Map<string, number>, cutoff: number) {
    const total = questionIds.length;
    const score = questionIds.filter((id) => key.has(id) && answers[id] === key.get(id)).length;
    const percent = total ? Math.round((score / total) * 1000) / 10 : 0;
    return { score, total, percent, passed: total > 0 && (score / total) * 100 >= cutoff };
}

/** Saved answers from the database: only question ids of this attempt with whole-number choices. */
export function readAnswers(v: unknown, questionIds: string[]): Record<string, number> {
    const out: Record<string, number> = {};
    if (!v || typeof v !== "object") return out;
    for (const id of questionIds) {
        const a = (v as Record<string, unknown>)[id];
        if (typeof a === "number" && Number.isInteger(a) && a >= 0) out[id] = a;
    }
    return out;
}
