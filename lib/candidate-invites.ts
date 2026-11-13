// Inviting a person to an AI interview, shared by the job's bulk invite and the drive CSV import (AIIN-166).
// Server only; callers have checked the employer owns the job.
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { ensureApplication } from "@/lib/application-sync";

/**
 * Find the candidate with this email, or create an invited account (no password: they set one from the link).
 * An employer's or admin's email is refused, so no staff account is ever given an interview (AC3).
 */
export async function findOrCreateCandidate(email: string, name: string): Promise<{ id: string; name: string | null } | { error: "staff" }> {
    const e = email.trim().toLowerCase();
    const found = await db.user.findUnique({ where: { email: e }, select: { id: true, name: true, role: true } });
    if (found) return found.role === "CANDIDATE" ? { id: found.id, name: found.name } : { error: "staff" };
    try {
        return await db.user.create({ data: { email: e, name: name.trim() || null, role: "CANDIDATE" }, select: { id: true, name: true } });
    } catch {
        // Created by another request a moment ago
        const again = await db.user.findUnique({ where: { email: e }, select: { id: true, name: true, role: true } });
        if (!again) throw new Error("Couldn't create the candidate");
        return again.role === "CANDIDATE" ? { id: again.id, name: again.name } : { error: "staff" };
    }
}

/** An interview with its own secret token, and the application it belongs to (AIIN-195). */
export async function createInterview(input: {
    jobId: string;
    candidateId: string;
    employerId: string;
    expiresAt: Date | null;
    scheduledTime?: Date | null;
    driveId?: string | null;
}): Promise<{ id: string; token: string }> {
    const token = randomBytes(32).toString("hex");
    const interview = await db.interview.create({
        data: {
            candidateId: input.candidateId,
            jobId: input.jobId,
            status: "PENDING",
            token,
            scheduledTime: input.scheduledTime ?? null,
            expiresAt: input.expiresAt,
            driveId: input.driveId ?? null,
        },
        select: { id: true },
    });
    await ensureApplication(input.jobId, input.candidateId, input.employerId);
    return { id: interview.id, token };
}
