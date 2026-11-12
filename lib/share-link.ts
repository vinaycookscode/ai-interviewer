// Read-only shortlist links for hiring managers (AIIN-161). No database, no "@/" imports.
import { createHash, randomBytes } from "node:crypto";

import type { ShareDays } from "./share-days.ts";

export { SHARE_DAYS, type ShareDays } from "./share-days.ts";
/** Tries per minute per IP on the share route, right token or wrong (AC7). */
export const SHARE_TRIES_PER_MINUTE = 30;

/** A new link token: 256 random bits, URL-safe. Shown to the employer once; only its hash is stored (AC1). */
export function newShareToken(): string {
    return randomBytes(32).toString("base64url");
}

/** What's stored and looked up: SHA-256 of the token, so a database leak can't open a link. */
export function hashShareToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/** Whether a string could be a token at all: anything else is not-found without touching the database. */
export function looksLikeShareToken(token: string): boolean {
    return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export type ShareState = "valid" | "expired" | "revoked";

/** Turned off wins over expired: the employer's choice is the more useful thing to say. */
export function shareState(share: { expiresAt: Date; revokedAt: Date | null }, now: Date): ShareState {
    if (share.revokedAt) return "revoked";
    return share.expiresAt.getTime() <= now.getTime() ? "expired" : "valid";
}

export function shareExpiry(days: ShareDays, now: Date): Date {
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
