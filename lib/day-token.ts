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

/** Token = first 16 hex chars of HMAC-SHA256(enrollmentId-dayNumber). */
export function generateDayToken(enrollmentId: string, dayNumber: number): string {
    return crypto
        .createHmac("sha256", getSecret())
        .update(`${enrollmentId}-${dayNumber}`)
        .digest("hex")
        .substring(0, 16);
}

/** Return the day number a token was issued for, or null if it matches none. */
export function validateDayToken(enrollmentId: string, token: string, maxDay: number = 90): number | null {
    for (let day = 1; day <= maxDay; day++) {
        if (generateDayToken(enrollmentId, day) === token) {
            return day;
        }
    }
    return null;
}
