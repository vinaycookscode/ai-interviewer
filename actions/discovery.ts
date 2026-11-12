"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

async function candidate() {
    const session = await auth();
    const id = session?.user?.id;
    return id && session.user.role === "CANDIDATE" ? id : null;
}
const refresh = () => revalidatePath("/candidate/profile/discover");

/**
 * Turn "Let employers find me" on or off. On needs confirmed facts, so the card isn't empty. Off takes effect on the
 * next match query (AC2); applications already made are untouched.
 */
export async function setDiscoverable(on: boolean): Promise<{ ok: true } | { error: "unauthorized" | "noFacts" }> {
    const userId = await candidate();
    if (!userId || typeof on !== "boolean") return { error: "unauthorized" };
    if (on) {
        const p = await db.candidateProfile.findUnique({ where: { userId }, select: { factsConfirmedAt: true } });
        if (!p?.factsConfirmedAt) return { error: "noFacts" };
    }
    await db.candidateProfile.upsert({
        where: { userId },
        update: { discoverable: on, discoverableSince: on ? new Date() : null },
        create: { userId, discoverable: on, discoverableSince: on ? new Date() : null },
    });
    refresh();
    return { ok: true };
}

/** Employers by name, to block. Names only, a few at a time, rate limited. */
export async function searchEmployers(q: string): Promise<{ id: string; name: string }[]> {
    const userId = await candidate();
    const term = typeof q === "string" ? q.trim().slice(0, 60) : "";
    if (!userId || term.length < 2) return [];
    if (!(await checkRateLimit(`employer-search:${userId}`, 60, 60)).success) return [];
    const rows = await db.user.findMany({
        where: { role: "EMPLOYER", name: { contains: term, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 8,
        select: { id: true, name: true },
    });
    return rows.flatMap((r) => (r.name ? [{ id: r.id, name: r.name }] : []));
}

/** Block an employer from seeing or inviting you. */
export async function blockEmployer(employerId: string): Promise<{ ok: true } | { error: "notFound" }> {
    const userId = await candidate();
    if (!userId || typeof employerId !== "string") return { error: "notFound" };
    const employer = await db.user.findFirst({ where: { id: employerId, role: "EMPLOYER" }, select: { id: true } });
    if (!employer) return { error: "notFound" };
    await db.candidateBlock.upsert({ where: { candidateId_employerId: { candidateId: userId, employerId } }, update: {}, create: { candidateId: userId, employerId } });
    refresh();
    return { ok: true };
}

export async function unblockEmployer(employerId: string): Promise<{ ok: true } | { error: "notFound" }> {
    const userId = await candidate();
    if (!userId || typeof employerId !== "string") return { error: "notFound" };
    await db.candidateBlock.deleteMany({ where: { candidateId: userId, employerId } });
    refresh();
    return { ok: true };
}
