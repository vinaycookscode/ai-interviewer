// Signed one-click unsubscribe links for the weekly report (AIIN-103). The link carries the user id and an
// HMAC of it, so it works without signing in and can't be forged for someone else.
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

const sign = (userId: string) => {
    if (!env.AUTH_SECRET) throw new Error("AUTH_SECRET is needed to sign unsubscribe links");
    return createHmac("sha256", env.AUTH_SECRET).update(`weekly-report:${userId}`).digest("base64url");
};

export function unsubscribeQuery(userId: string): string {
    return new URLSearchParams({ u: userId, t: sign(userId) }).toString();
}

export function verifyUnsubscribe(userId: string | undefined, token: string | undefined): userId is string {
    if (!userId || !token || !env.AUTH_SECRET) return false;
    const expected = Buffer.from(sign(userId));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
}
