"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { canReopen, cleanDrive, driveStatus, linkExpiry, type DriveError, type DriveField, type DriveInput } from "@/lib/drives";

type SaveResult =
    | { ok: true; id: string }
    | { error: "notFound" | "noQuestions" }
    | { errors: Partial<Record<DriveField, DriveError>> };
type Result = { ok: true } | { error: "notFound" | "invalid" };

async function employerId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id && session.user.role === "EMPLOYER" ? session.user.id : null;
}

/** The signed-in employer's own drive; anyone else's is not found (AC8). */
async function ownDrive(id: unknown) {
    const userId = await employerId();
    if (!userId || typeof id !== "string") return null;
    const drive = await db.drive.findFirst({
        where: { id, employerId: userId },
        select: { id: true, jobId: true, draft: true, opensAt: true, closesAt: true, closedAt: true, _count: { select: { candidates: true } } },
    });
    return drive ? { ...drive, userId } : null;
}

/**
 * Interview links follow the drive (AC6, AC7): unstarted ones stop when it closes, early or on time; ones already started
 * can be finished until its closing time. Both move when the closing time moves.
 */
async function syncLinks(driveId: string) {
    const d = await db.drive.findUnique({ where: { id: driveId }, select: { closesAt: true, closedAt: true } });
    if (!d) return;
    await db.$transaction([
        db.interview.updateMany({ where: { driveId, status: "PENDING" }, data: { expiresAt: linkExpiry(d) } }),
        db.interview.updateMany({ where: { driveId, status: "IN_PROGRESS" }, data: { expiresAt: d.closesAt } }),
    ]);
}

const refresh = (id?: string) => {
    revalidatePath("/dashboard/drives");
    if (id) revalidatePath(`/dashboard/drives/${id}`);
};

/** Create a drive, or save changes to one. Colleges are replaced by the list given; ones with candidates are kept. */
export async function saveDrive(id: string | null, input: DriveInput): Promise<SaveResult> {
    const userId = await employerId();
    if (!userId) return { error: "notFound" };
    const existing = id ? await ownDrive(id) : null;
    if (id && !existing) return { error: "notFound" };

    const checked = cleanDrive(input, { now: new Date(), existingOpensAt: existing?.opensAt ?? null });
    if (!checked.ok) return { errors: checked.errors };
    const v = checked.value;

    // The job must be this employer's, open for new candidates, and have interview questions (AC2)
    const job = await db.job.findFirst({
        where: { id: v.jobId, employerId: userId, archivedAt: null },
        select: { id: true, _count: { select: { questions: { where: { archived: false } } } } },
    });
    if (!job) return { error: "notFound" };
    if (job._count.questions === 0) return { error: "noQuestions" };
    // A drive with candidates can't move to another job, or go back to being a draft
    if (existing && existing._count.candidates > 0 && (existing.jobId !== v.jobId || v.draft)) return { errors: { jobId: "invalid" } };

    const data = {
        jobId: v.jobId,
        name: v.name,
        draft: v.draft,
        opensAt: v.opensAt,
        closesAt: v.closesAt,
        autoShortlist: v.autoShortlist,
        interviewCutoff: v.interviewCutoff,
    };
    const driveId = await db.$transaction(async (tx) => {
        const d = existing
            ? await tx.drive.update({ where: { id: existing.id }, data, select: { id: true } })
            : await tx.drive.create({ data: { ...data, employerId: userId, createdById: userId }, select: { id: true } });
        const current = await tx.driveCollege.findMany({ where: { driveId: d.id }, select: { id: true, _count: { select: { candidates: true } } } });
        const keep = new Set(v.colleges.flatMap((c) => (c.id ? [c.id] : [])));
        const removable = current.filter((c) => !keep.has(c.id) && c._count.candidates === 0).map((c) => c.id);
        if (removable.length) await tx.driveCollege.deleteMany({ where: { id: { in: removable }, driveId: d.id } });
        const known = new Set(current.map((c) => c.id));
        for (const c of v.colleges) {
            const row = { name: c.name, city: c.city, placementOfficerEmail: c.placementOfficerEmail };
            if (c.id && known.has(c.id)) await tx.driveCollege.update({ where: { id: c.id }, data: row });
            else await tx.driveCollege.create({ data: { ...row, driveId: d.id } });
        }
        return d.id;
    });
    await syncLinks(driveId);
    refresh(driveId);
    return { ok: true, id: driveId };
}

/** Close early: unstarted links stop at once; interviews already started can still be finished (AC6). */
export async function closeDrive(id: string): Promise<Result> {
    const d = await ownDrive(id);
    if (!d) return { error: "notFound" };
    if (driveStatus(d, new Date()) === "CLOSED" || d.draft) return { error: "invalid" };
    await db.drive.update({ where: { id: d.id }, data: { closedAt: new Date() } });
    await syncLinks(d.id);
    refresh(d.id);
    return { ok: true };
}

/** Reopen a drive closed early, within a week and while its closing time is ahead. */
export async function reopenDrive(id: string): Promise<Result> {
    const d = await ownDrive(id);
    if (!d) return { error: "notFound" };
    if (!canReopen(d, new Date())) return { error: "invalid" };
    await db.drive.update({ where: { id: d.id }, data: { closedAt: null } });
    await syncLinks(d.id);
    refresh(d.id);
    return { ok: true };
}

/** Only a drive nobody has been invited to can be deleted; otherwise close it, so its history is kept (AC9). */
export async function deleteDrive(id: string): Promise<Result> {
    const d = await ownDrive(id);
    if (!d) return { error: "notFound" };
    if (d._count.candidates > 0) return { error: "invalid" };
    await db.drive.delete({ where: { id: d.id } });
    refresh();
    return { ok: true };
}
