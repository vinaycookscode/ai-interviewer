// A drive's funnel (AIIN-172): counts per stage, as a share of everyone invited. Plain module, tested on its own.

export const FUNNEL_KEYS = ["invited", "opened", "aptitudePassed", "started", "finished", "scored", "aboveCutoff", "shortlisted"] as const;
export type FunnelKey = (typeof FUNNEL_KEYS)[number];
export type FunnelCounts = Record<FunnelKey, number>;

export const emptyCounts = (): FunnelCounts => Object.fromEntries(FUNNEL_KEYS.map((k) => [k, 0])) as FunnelCounts;

/** Every college's counts add up to the drive's (AC2). */
export function totals(rows: FunnelCounts[]): FunnelCounts {
    const t = emptyCounts();
    for (const r of rows) for (const k of FUNNEL_KEYS) t[k] += r[k];
    return t;
}

/** The stages shown, in order: aptitude only when the drive has the round, the cutoff only when it has one. */
export function funnelStages(c: FunnelCounts, opts: { aptitude: boolean; cutoff: boolean }) {
    return FUNNEL_KEYS.filter((k) => (k !== "aptitudePassed" || opts.aptitude) && (k !== "aboveCutoff" || opts.cutoff)).map((k) => ({
        key: k,
        count: c[k],
        percent: c.invited ? Math.round((c[k] / c.invited) * 100) : 0,
    }));
}
