// Talent Match invitations (AIIN-201). Plain module: tested on its own, shared by actions and pages.

export const INVITE_DAYS = 14;
export const INVITE_MESSAGE_MAX = 300;
const IST_MS = 5.5 * 60 * 60 * 1000;

/** The start of the current calendar month in IST, as a UTC instant: the allowance resets then (AIIN-204). */
export function istMonthStart(now: Date): Date {
    const ist = new Date(now.getTime() + IST_MS);
    return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_MS);
}

/** How many invitations are left this month. A limit of -1 is unlimited (null left). */
export function invitesLeft(limit: number, used: number): number | null {
    return limit < 0 ? null : Math.max(0, limit - used);
}

export function inviteExpiry(now: Date): Date {
    return new Date(now.getTime() + INVITE_DAYS * 24 * 60 * 60 * 1000);
}

/** An invitation still waiting can be answered until it lapses. */
export function inviteOpen(app: { stage: string; inviteExpiresAt: Date | null }, now: Date): boolean {
    return app.stage === "INVITED" && !!app.inviteExpiresAt && app.inviteExpiresAt > now;
}

/** The employer's optional message: trimmed, bounded, no links (it's shown to a candidate who didn't ask for it). */
export function cleanInviteMessage(v: unknown): string | null | undefined {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") return undefined;
    const s = v.replace(/\s+/g, " ").trim();
    if (s.length > INVITE_MESSAGE_MAX || /https?:\/\/|www\./i.test(s)) return undefined;
    return s || null;
}

/** Whether the employer may see who the candidate is: only once they've applied or accepted (AC1, AC2). */
export function revealsCandidate(stage: string): boolean {
    return stage !== "INVITED" && stage !== "DECLINED";
}
