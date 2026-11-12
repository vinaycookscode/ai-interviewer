// Job search for candidates (AIIN-202). Plain module: rules the page and the apply action share, tested on their own.
import type { Prisma } from "@prisma/client";
import { normalizeSkill } from "./skills.ts";

/** Only jobs that are open for Talent Match: open, not archived, requirements confirmed (AC3). */
export const SEARCHABLE: Prisma.JobWhereInput = { status: "OPEN", archivedAt: null, requirementsConfirmedAt: { not: null } };

export interface SearchFilters {
    q: string;
    location: string;
    mode: "ONSITE" | "HYBRID" | "REMOTE" | null;
    minPay: number | null; // lakh a year
    fitsYears: boolean;
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseSearch(sp: Record<string, string | string[] | undefined>): SearchFilters {
    const mode = one(sp.mode);
    const pay = Number(one(sp.pay));
    return {
        q: one(sp.q).trim().slice(0, 60),
        location: one(sp.loc).trim().slice(0, 60),
        mode: mode === "ONSITE" || mode === "HYBRID" || mode === "REMOTE" ? mode : null,
        minPay: Number.isFinite(pay) && pay > 0 && pay <= 500 ? pay : null,
        fitsYears: one(sp.fits) === "1",
    };
}

/**
 * The search as a Prisma filter. A keyword matches the title, the description or a skill (its one name: "js" finds
 * JavaScript). A place matches jobs there or remote jobs (AC1). Pay keeps jobs whose top of range reaches it.
 */
export function searchWhere(f: SearchFilters, years: number | null): Prisma.JobWhereInput {
    const and: Prisma.JobWhereInput[] = [SEARCHABLE];
    if (f.q) {
        const skill = normalizeSkill(f.q);
        and.push({
            OR: [
                { title: { contains: f.q, mode: "insensitive" } },
                { description: { contains: f.q, mode: "insensitive" } },
                { mustHaveSkills: { has: skill } },
                { niceToHaveSkills: { has: skill } },
            ],
        });
    }
    if (f.location) and.push({ OR: [{ location: { contains: f.location, mode: "insensitive" } }, { workMode: "REMOTE" }] });
    if (f.mode) and.push({ workMode: f.mode });
    if (f.minPay) and.push({ OR: [{ salaryMax: { gte: f.minPay * 100_000 } }, { salaryMax: null }] });
    if (f.fitsYears && years !== null) {
        and.push({ OR: [{ minYears: null }, { minYears: { lte: years + 1 } }] }, { OR: [{ maxYears: null }, { maxYears: { gte: years - 1 } }] });
    }
    return { AND: and };
}

/** A phone number to apply with: required (AIIN-204), digits with an optional +, 10 to 15 digits. */
export function cleanPhone(v: unknown): string | undefined {
    if (typeof v !== "string") return undefined;
    const s = v.replace(/[\s()-]/g, "");
    return /^\+?\d{10,15}$/.test(s) ? s : undefined;
}
