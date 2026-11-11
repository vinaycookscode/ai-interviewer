// Browsing and searching the Question Bank (AIIN-210). Pure: no database, no "@/" imports.
import { BANK_TYPES, type BankType } from "./items.ts";

export const BANK_SOURCES = ["MOCK", "INTERVIEW", "COMPANY_PREP", "SELF_ADDED"] as const;
export type BankSourceFilter = (typeof BANK_SOURCES)[number];
export const BANK_STATUSES = ["NEW", "PRACTISING", "CONFIDENT"] as const;
/** The status tabs: what's due for review today (AIIN-212), then each status. */
export const STATUS_TABS = ["DUE", ...BANK_STATUSES] as const;
export type BankStatusFilter = (typeof STATUS_TABS)[number];

export interface BankFilters {
    q: string;
    source: BankSourceFilter | null;
    type: BankType | null;
    company: string | null;
    status: BankStatusFilter | null;
}

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const pick = <T extends string>(allowed: readonly T[], v: string): T | null => ((allowed as readonly string[]).includes(v) ? (v as T) : null);

/** The filters from the URL (AC2). Anything unknown is ignored rather than trusted. */
export function parseBankFilters(params: Params): BankFilters {
    return {
        q: one(params.q).slice(0, 200),
        source: pick(BANK_SOURCES, one(params.source)),
        type: pick(BANK_TYPES, one(params.type)),
        company: one(params.company).slice(0, 100) || null,
        status: pick(STATUS_TABS, one(params.status)),
    };
}

/** The same filters as a query string, dropping empty ones; `change` overrides. */
export function bankQuery(filters: BankFilters, change: Partial<BankFilters> = {}): string {
    const next = { ...filters, ...change };
    const params = new URLSearchParams();
    for (const key of ["q", "source", "type", "company", "status"] as const) {
        const value = next[key];
        if (value) params.set(key, value);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
}

/** A word-for-word match on the question, its company, topic or tags. */
export function keywordMatch(item: { questionText: string; companyName: string | null; topic: string | null; tags: string[] }, q: string): boolean {
    const needle = q.toLowerCase();
    return [item.questionText, item.companyName ?? "", item.topic ?? "", ...item.tags].some((field) => field.toLowerCase().includes(needle));
}

/** Below this similarity nothing counts as a match, however close the rest are. */
export const MEANING_FLOOR = 0.6;
/** Matches must be this close to the best one: Gemini's similarities sit in a narrow band, so a fixed cut-off misleads. */
export const MEANING_BAND = 0.06;

/** The ids whose meaning matches the query, best first: above the floor and within the band of the best. */
export function meaningMatches(scored: { id: string; similarity: number }[]): string[] {
    const best = Math.max(...scored.map((s) => s.similarity), -1);
    const cut = Math.max(MEANING_FLOOR, best - MEANING_BAND);
    return scored
        .filter((s) => s.similarity >= cut)
        .sort((a, b) => b.similarity - a.similarity)
        .map((s) => s.id);
}

/** Word matches first, in the bank's order, then matches by meaning that aren't already there. */
export function mergeResults(keyword: string[], meaning: string[]): string[] {
    const seen = new Set(keyword);
    return [...keyword, ...meaning.filter((id) => !seen.has(id))];
}
