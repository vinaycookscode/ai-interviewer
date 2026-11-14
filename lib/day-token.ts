import crypto from "crypto";

// Day tokens keep placement-program URLs opaque. They are not the access
// check: pages must still verify the day against the enrollment's progress.
// Server-only on purpose: exporting these from a "use server" file would let
// any client mint tokens.

function getSecret(): string {
    const secret = process.env.DAY_TOKEN_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("DAY_TOKEN_SECRET (or AUTH_SECRET) must be set to sign placement day tokens");
    }
    return secret;
}

function signature(enrollmentId: string, dayNumber: number): string {
    return crypto.createHmac("sha256", getSecret()).update(`${enrollmentId}-${dayNumber}`).digest("hex").substring(0, 16);
}

/** Token = "<day>.<first 16 hex chars of HMAC-SHA256(enrollmentId-day)>": the day is readable, the signature isn't forgeable. */
export function generateDayToken(enrollmentId: string, dayNumber: number): string {
    return `${dayNumber}.${signature(enrollmentId, dayNumber)}`;
}

/**
 * The day a token was issued for, or null (AIIN-66): one signature check, in constant time, instead of trying every
 * day. Older tokens (the signature alone) no longer validate; the page sends those to today.
 */
export function validateDayToken(enrollmentId: string, token: string, maxDay: number = 90): number | null {
    const m = /^(\d{1,3})\.([0-9a-f]{16})$/.exec(token);
    if (!m) return null;
    const day = Number(m[1]);
    if (day < 1 || day > maxDay) return null;
    const expected = Buffer.from(signature(enrollmentId, day));
    const given = Buffer.from(m[2]);
    return crypto.timingSafeEqual(expected, given) ? day : null;
}
