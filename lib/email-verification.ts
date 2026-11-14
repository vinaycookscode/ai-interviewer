// Email verification (AIIN-55). Server only. The link's token is random; only its hash is stored, one per address
// (a new link replaces the old one), for 24 hours.
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmailChangeLink, sendEmailChangedNotice, sendVerificationEmail } from "@/lib/email";

export const VERIFY_HOURS = 24;
const PREFIX = "verify:";
// A change of address (AIIN-227): "change:<userId>:<new email>", one per user
const CHANGE = "change:";

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

/**
 * Check a link. A verification link marks its address verified ("done"); a change link moves the account to the new
 * address ("changed"), unless another account took it meanwhile ("taken"). "expired" covers unknown, replaced and
 * out-of-date links alike.
 */
export async function verifyEmailToken(token: unknown): Promise<"done" | "changed" | "taken" | "expired"> {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return "expired";
    const row = await db.verificationToken.findUnique({ where: { token: hash(token) } });
    if (!row || !(row.identifier.startsWith(PREFIX) || row.identifier.startsWith(CHANGE))) return "expired";
    await db.verificationToken.deleteMany({ where: { identifier: row.identifier } });
    if (row.expires < new Date()) return "expired";
    if (row.identifier.startsWith(CHANGE)) return applyEmailChange(row.identifier);
    const email = row.identifier.slice(PREFIX.length);
    const { count } = await db.user.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { emailVerified: new Date() } });
    return count ? "done" : "expired";
}

/** Whether this user still has to verify. */
export async function needsVerification(userId: string): Promise<{ email: string } | null> {
    const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
    return u && !u.emailVerified ? { email: u.email } : null;
}

/** Start changing a user's address: a link to the new one replaces any earlier change link. Callers checked the password. */
export async function issueEmailChange(user: { id: string; name: string | null }, newEmail: string): Promise<boolean> {
    const token = randomBytes(32).toString("base64url");
    await db.$transaction([
        db.verificationToken.deleteMany({ where: { identifier: { startsWith: `${CHANGE}${user.id}:` } } }),
        db.verificationToken.create({
            data: { identifier: `${CHANGE}${user.id}:${newEmail}`, token: hash(token), expires: new Date(Date.now() + VERIFY_HOURS * 3600_000) },
        }),
    ]);
    return (await sendEmailChangeLink(newEmail, user.name, token)).success;
}

/** The address a user is changing to, while its link is still good. */
export async function pendingEmailChange(userId: string): Promise<string | null> {
    const row = await db.verificationToken.findFirst({
        where: { identifier: { startsWith: `${CHANGE}${userId}:` }, expires: { gt: new Date() } },
        select: { identifier: true },
    });
    return row ? row.identifier.slice(`${CHANGE}${userId}:`.length) : null;
}

async function applyEmailChange(identifier: string): Promise<"changed" | "taken" | "expired"> {
    const rest = identifier.slice(CHANGE.length);
    const at = rest.indexOf(":");
    const userId = rest.slice(0, at);
    const email = rest.slice(at + 1);
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) return "expired";
    if (await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, NOT: { id: userId } }, select: { id: true } })) return "taken";
    await db.user.update({ where: { id: userId }, data: { email, emailVerified: new Date() } });
    // The old address hears about it, in case it wasn't them
    await sendEmailChangedNotice(user.email, user.name, email).catch((e) => console.error("Email change notice failed:", e));
    return "changed";
}
