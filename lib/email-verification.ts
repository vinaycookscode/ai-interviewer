// Email verification (AIIN-55). Server only. The link's token is random; only its hash is stored, one per address
// (a new link replaces the old one), for 24 hours.
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export const VERIFY_HOURS = 24;
const PREFIX = "verify:";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Replace any earlier link for this address with a new one and email it. */
export async function issueVerification(user: { email: string; name: string | null }): Promise<boolean> {
    const identifier = PREFIX + user.email.toLowerCase();
    const token = randomBytes(32).toString("base64url");
    await db.$transaction([
        db.verificationToken.deleteMany({ where: { identifier } }),
        db.verificationToken.create({ data: { identifier, token: hash(token), expires: new Date(Date.now() + VERIFY_HOURS * 3600_000) } }),
    ]);
    return (await sendVerificationEmail(user.email, user.name, token)).success;
}

/** Check a link and mark its address verified. "expired" covers unknown, replaced and out-of-date links alike. */
export async function verifyEmailToken(token: unknown): Promise<"done" | "expired"> {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return "expired";
    const row = await db.verificationToken.findUnique({ where: { token: hash(token) } });
    if (!row || !row.identifier.startsWith(PREFIX)) return "expired";
    await db.verificationToken.deleteMany({ where: { identifier: row.identifier } });
    if (row.expires < new Date()) return "expired";
    const email = row.identifier.slice(PREFIX.length);
    const { count } = await db.user.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { emailVerified: new Date() } });
    return count ? "done" : "expired";
}

/** Whether this user still has to verify. */
export async function needsVerification(userId: string): Promise<{ email: string } | null> {
    const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
    return u && !u.emailVerified ? { email: u.email } : null;
}
