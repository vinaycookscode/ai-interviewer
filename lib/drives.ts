// Hiring drives (AIIN-165): status from the dates, India-time inputs, and checking a drive before it's saved.
// Plain module, tested on its own (lib/drives.test.ts).

export type DriveStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED";
export const DRIVE_STATUSES: DriveStatus[] = ["DRAFT", "SCHEDULED", "LIVE", "CLOSED"];

export const NAME_MAX = 80;
export const COLLEGE_MAX = 120;
export const CITY_MAX = 60;
export const REOPEN_DAYS = 7;

interface Dates {
    draft: boolean;
    opensAt: Date | null;
    closesAt: Date | null;
    closedAt: Date | null;
}

/** Worked out from the dates, so a drive goes Live and then Closed without anyone touching it (AC5). */
export function driveStatus(d: Dates, now: Date): DriveStatus {
    if (d.draft || !d.opensAt || !d.closesAt) return "DRAFT";
    if (d.closedAt || now >= d.closesAt) return "CLOSED";
    if (now < d.opensAt) return "SCHEDULED";
    return "LIVE";
}

/** When an interview link of this drive stops working: when it closes, early or on time. */
export function linkExpiry(d: Pick<Dates, "closesAt" | "closedAt">): Date | null {
    return d.closedAt ?? d.closesAt;
}

/** A drive closed early can be reopened for a week, if its closing time is still ahead. */
export function canReopen(d: Pick<Dates, "closedAt" | "closesAt">, now: Date): boolean {
    return !!d.closedAt && !!d.closesAt && d.closesAt > now && now.getTime() - d.closedAt.getTime() <= REOPEN_DAYS * 86_400_000;
}

const IST = "+05:30";
/** "2026-11-18T09:00" typed in India time → the instant. Anything else is undefined. */
export function fromIstInput(v: unknown): Date | undefined {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return undefined;
    const d = new Date(v + ":00" + IST);
    return Number.isNaN(d.getTime()) ? undefined : d;
}
/** The instant → "2026-11-18T09:00" in India time, for a datetime-local field. */
export function toIstInput(d: Date | null | undefined): string {
    if (!d) return "";
    return new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 16);
}

export interface CollegeInput {
    id?: string;
    name: string;
    city?: string;
    placementOfficerEmail?: string;
}
export interface DriveInput {
    jobId: string;
    name: string;
    opensAt: string;
    closesAt: string;
    colleges: CollegeInput[];
    autoShortlist: boolean;
    interviewCutoff: string;
    draft: boolean;
}
/** What the drive form edits: dates as India-time "2026-11-18T09:00" strings. */
export type DriveFormValues = Omit<DriveInput, "draft">;

export interface CleanDrive {
    jobId: string;
    name: string;
    draft: boolean;
    opensAt: Date | null;
    closesAt: Date | null;
    colleges: { id?: string; name: string; city: string | null; placementOfficerEmail: string | null }[];
    autoShortlist: boolean;
    interviewCutoff: number | null;
}
export type DriveField = "jobId" | "name" | "opensAt" | "closesAt" | "colleges" | "interviewCutoff";
export type DriveError = "required" | "tooLong" | "invalid" | "inPast" | "beforeOpen" | "range";

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const text = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/**
 * Check a drive before saving. A draft needs only a job and a name; saving for real needs both dates, with closing after
 * opening, and opening not in the past unless it's unchanged on an existing drive (AC3). Auto-shortlist needs a cutoff (AC4).
 */
export function cleanDrive(
    input: DriveInput,
    opts: { now: Date; existingOpensAt?: Date | null },
): { ok: true; value: CleanDrive } | { ok: false; errors: Partial<Record<DriveField, DriveError>> } {
    const errors: Partial<Record<DriveField, DriveError>> = {};
    if (!input || typeof input !== "object") return { ok: false, errors: { name: "invalid" } };
    const draft = input.draft === true;
    const jobId = typeof input.jobId === "string" ? input.jobId : "";
    if (!jobId) errors.jobId = "required";
    const name = text(input.name);
    if (!name) errors.name = "required";
    else if (name.length > NAME_MAX) errors.name = "tooLong";

    const opensAt = input.opensAt ? fromIstInput(input.opensAt) : null;
    const closesAt = input.closesAt ? fromIstInput(input.closesAt) : null;
    if (opensAt === undefined) errors.opensAt = "invalid";
    if (closesAt === undefined) errors.closesAt = "invalid";
    if (!draft) {
        if (opensAt === null) errors.opensAt = "required";
        if (closesAt === null) errors.closesAt = "required";
    }
    if (opensAt && closesAt && closesAt <= opensAt) errors.closesAt = "beforeOpen";
    const unchanged = opensAt && opts.existingOpensAt && opensAt.getTime() === opts.existingOpensAt.getTime();
    if (opensAt && !unchanged && opensAt.getTime() < opts.now.getTime() - 60_000) errors.opensAt = "inPast";

    const colleges: CleanDrive["colleges"] = [];
    if (!Array.isArray(input.colleges) || input.colleges.length > 50) errors.colleges = "invalid";
    else
        for (const c of input.colleges) {
            const cn = text(c?.name);
            const city = text(c?.city);
            const email = text(c?.placementOfficerEmail).toLowerCase();
            if (!cn) {
                errors.colleges = "required";
                continue;
            }
            if (cn.length > COLLEGE_MAX || city.length > CITY_MAX || (email && (!EMAIL.test(email) || email.length > 200))) {
                errors.colleges = "invalid";
                continue;
            }
            colleges.push({ id: typeof c.id === "string" ? c.id : undefined, name: cn, city: city || null, placementOfficerEmail: email || null });
        }

    const autoShortlist = input.autoShortlist === true;
    let interviewCutoff: number | null = null;
    const raw = text(input.interviewCutoff);
    if (raw) {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0 || n > 10) errors.interviewCutoff = "range";
        else interviewCutoff = Math.round(n * 10) / 10;
    } else if (autoShortlist) errors.interviewCutoff = "required";

    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, value: { jobId, name, draft, opensAt: opensAt ?? null, closesAt: closesAt ?? null, colleges, autoShortlist, interviewCutoff } };
}
