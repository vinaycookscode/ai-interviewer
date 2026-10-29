// The ranked list's filters, read from and written to the URL (AIIN-158). No database here: the filter controls use it in the browser.
import type { HiringDecision } from "@prisma/client";

export const PAGE_SIZE = 50;
export const MIN_SCORES = [8, 7, 6, 5] as const;
export const FINISHED_WITHIN = [7, 30] as const;
export const SORTS = ["score", "finished", "name"] as const;
export const STATUSES = ["completed", "in_progress", "pending"] as const;
const DECISION_VALUES = ["UNDECIDED", "SHORTLISTED", "ON_HOLD", "REJECTED"] as const;

export type Sort = (typeof SORTS)[number];
export type StatusFilter = (typeof STATUSES)[number];

export interface RankingFilters {
    q: string;
    decisions: HiringDecision[];
    min: number | null;
    within: number | null;
    status: StatusFilter | null;
    sort: Sort;
    page: number;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Reads the filters from search params, ignoring anything that isn't a known value. */
export function parseFilters(params: Params): RankingFilters {
    const decisions = one(params.d)
        .split(",")
        .filter((d): d is HiringDecision => (DECISION_VALUES as readonly string[]).includes(d));
    const min = Number(one(params.min));
    const within = Number(one(params.within));
    const status = one(params.status);
    const sort = one(params.sort);
    const page = Math.floor(Number(one(params.page)));
    return {
        q: one(params.q).trim().slice(0, 100),
        decisions,
        min: (MIN_SCORES as readonly number[]).includes(min) ? min : null,
        within: (FINISHED_WITHIN as readonly number[]).includes(within) ? within : null,
        status: (STATUSES as readonly string[]).includes(status) ? (status as StatusFilter) : null,
        sort: (SORTS as readonly string[]).includes(sort) ? (sort as Sort) : "score",
        page: page >= 1 ? page : 1,
    };
}

/** The filters back as a query string, without the defaults. */
export function filtersQuery(f: Partial<RankingFilters>): string {
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.decisions?.length) p.set("d", f.decisions.join(","));
    if (f.min) p.set("min", String(f.min));
    if (f.within) p.set("within", String(f.within));
    if (f.status) p.set("status", f.status);
    if (f.sort && f.sort !== "score") p.set("sort", f.sort);
    if (f.page && f.page > 1) p.set("page", String(f.page));
    return p.toString();
}

export function hasFilters(f: RankingFilters): boolean {
    return !!(f.q || f.decisions.length || f.min || f.within || f.status);
}

