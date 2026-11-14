"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanEmail } from "@/lib/email-address";
import { issueEmailChange } from "@/lib/email-verification";

/**
 * "Change your email" (AIIN-227): checks the password, then sends a link to the new address. The account keeps its
 * email until that link is opened. An address that has an account is refused without saying whose (AC4).
 */
export async function requestEmailChange(input: {
    email: string;
    password: string;
}): Promise<{ ok: true; email: string } | { error: "signedOut" | "invalid" | "same" | "password" | "taken" | "limit" | "failed" }> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "signedOut" };
    const email = cleanEmail(input?.email);
    if (!email || typeof input?.password !== "string" || !input.password) return { error: "invalid" };

    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true, password: true } });
    if (!user?.password) return { error: "password" };
    if (user.email.toLowerCase() === email) return { error: "same" };
    // 3 an hour, right password or wrong (AC6)
    if (!(await checkRateLimit(`email-change:${userId}`, 3, 60)).success) return { error: "limit" };
    if (!(await bcrypt.compare(input.password, user.password))) return { error: "password" };
    if (await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } })) return { error: "taken" };

    if (!(await issueEmailChange({ id: userId, name: user.name }, email))) return { error: "failed" };
    revalidatePath("/candidate/profile");
    return { ok: true, email };
}
