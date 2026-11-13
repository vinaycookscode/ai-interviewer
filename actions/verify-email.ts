"use server";

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { issueVerification, needsVerification } from "@/lib/email-verification";

/** "Send it again" (AIIN-55): a new link for the signed-in, unverified user; 3 an hour. */
export async function resendVerification(): Promise<{ ok: true } | { error: "signedOut" | "verified" | "limit" | "failed" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "signedOut" };
    const pending = await needsVerification(userId);
    if (!pending) return { error: "verified" };
    if (!(await checkRateLimit(`verify-resend:${userId}`, 3, 60)).success) return { error: "limit" };
    return (await issueVerification({ email: pending.email, name: session.user?.name ?? null })) ? { ok: true } : { error: "failed" };
}
