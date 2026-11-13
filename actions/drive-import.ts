"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { driveStatus, linkExpiry } from "@/lib/drives";
import { MAX_BYTES, MAX_ROWS, checkRows, guessMapping, parseCsv, validMapping, type CheckedRow, type Mapping, type RowStatus } from "@/lib/drive-csv";
import { createInterview, findOrCreateCandidate } from "@/lib/candidate-invites";
import { aptitudeLink, drivePayload, interviewLink } from "@/lib/drive-mail";
import { enqueue, processOutbox, type QueuedEmail } from "@/lib/outbox";

type FileError = "notFound" | "notReady" | "tooBig" | "tooManyRows" | "empty";
export interface PreviewRow {
    line: number;
    name: string;
    email: string;
    college: string;
    status: RowStatus;
}
export type Preview = {
    ok: true;
    headers: string[];
    samples: string[];
    mapping: Mapping;
    mappingValid: boolean;
    total: number;
    counts: Record<RowStatus, number>;
    rows: PreviewRow[]; // every row with a problem (up to 500), then the first ready ones, up to 550 in all
    unknownColleges: string[];
};

const collegeKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");
/** Colleges in the file that the drive doesn't have, once each however they're capitalised (first spelling wins). */
function unknownColleges(rows: CheckedRow[]): string[] {
    const seen = new Map<string, string>();
    for (const r of rows) if (r.status === "UNKNOWN_COLLEGE" && !seen.has(collegeKey(r.college))) seen.set(collegeKey(r.college), r.college);
    return [...seen.values()].slice(0, 50);
}

/** The employer's own drive, open for invitations: saved with dates and not closed. Anyone else's is not found (AC9). */
async function openDrive(id: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || typeof id !== "string") return null;
    const drive = await db.drive.findFirst({
        where: { id, employerId: userId },
        select: {
            id: true,
            name: true,
            jobId: true,
            draft: true,
            opensAt: true,
            closesAt: true,
            closedAt: true,
            aptitudeEnabled: true,
            colleges: { select: { id: true, name: true } },
            job: { select: { title: true, employer: { select: { name: true } }, _count: { select: { questions: { where: { archived: false } } } } } },
        },
    });
    return drive ? { ...drive, userId } : null;
}

/** Parse and check the file against the drive (AC1, AC6). Nothing is created. */
async function read(drive: NonNullable<Awaited<ReturnType<typeof openDrive>>>, csv: unknown, mapping: unknown) {
    if (typeof csv !== "string" || !csv.trim()) return { ok: false as const, error: "empty" as const };
    if (new TextEncoder().encode(csv).length > MAX_BYTES) return { ok: false as const, error: "tooBig" as const };
    const all = parseCsv(csv);
    if (all.length < 2) return { ok: false as const, error: "empty" as const };
    if (all.length - 1 > MAX_ROWS) return { ok: false as const, error: "tooManyRows" as const };
    const [headers, ...rows] = all;
    const map: Mapping = validMapping(mapping, headers.length) ? mapping : guessMapping(headers);
    const emailCol = map.indexOf("email");
    const emails = emailCol >= 0 ? [...new Set(rows.map((r) => (r[emailCol] ?? "").trim().toLowerCase()).filter(Boolean))] : [];
    const [inDrive, staff] = emails.length
        ? await Promise.all([
              db.driveCandidate.findMany({ where: { driveId: drive.id, userId: { in: (await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } })).map((u) => u.id) } }, select: { userId: true } }),
              db.user.findMany({ where: { email: { in: emails }, role: { not: "CANDIDATE" } }, select: { email: true } }),
          ])
        : [[], []];
    const inDriveEmails = inDrive.length
        ? new Set((await db.user.findMany({ where: { id: { in: inDrive.map((d) => d.userId) } }, select: { email: true } })).map((u) => u.email.toLowerCase()))
        : new Set<string>();
    const checked = checkRows(rows, map, { colleges: drive.colleges, inDrive: inDriveEmails, staff: new Set(staff.map((u) => u.email.toLowerCase())) });
    return { ok: true as const, headers, rows, mapping: map, checked };
}

export async function previewDriveImport(driveId: string, csv: string, mapping: Mapping | null): Promise<Preview | { error: FileError }> {
    const drive = await openDrive(driveId);
    if (!drive) return { error: "notFound" };
    if (drive.draft || !drive.closesAt || driveStatus(drive, new Date()) === "CLOSED") return { error: "notReady" };
    const r = await read(drive, csv, mapping);
    if (!r.ok) return { error: r.error };
    const problems = r.checked.rows.filter((x) => x.status !== "READY").slice(0, 500);
    const ready = r.checked.rows.filter((x) => x.status === "READY").slice(0, 550 - problems.length);
    const pick = (x: CheckedRow): PreviewRow => ({ line: x.line, name: x.name, email: x.email, college: x.college, status: x.status });
    return {
        ok: true,
        headers: r.headers.map((h) => h.slice(0, 60)),
        samples: r.headers.map((_, i) => (r.rows.find((row) => (row[i] ?? "").trim())?.[i] ?? "").trim().slice(0, 60)),
        mapping: r.mapping,
        mappingValid: validMapping(r.mapping, r.headers.length),
        total: r.rows.length,
        counts: r.checked.counts,
        rows: [...problems, ...ready].map(pick),
        unknownColleges: unknownColleges(r.checked.rows),
    };
}

/**
 * Invite the ready rows (AC2): find or create each candidate, add them to the drive (source CSV) with an interview
 * that expires when the drive closes, and queue their invitation. With addColleges, unknown colleges are added to the
 * drive and their rows invited too; otherwise those rows are left out (AC4). Rows are processed 100 at a time.
 */
export async function importDriveCsv(
    driveId: string,
    csv: string,
    mapping: Mapping,
    addColleges: boolean,
): Promise<{ ok: true; invited: number; skipped: number } | { error: FileError | "invalid" }> {
    const drive = await openDrive(driveId);
    if (!drive) return { error: "notFound" };
    if (drive.draft || !drive.closesAt || driveStatus(drive, new Date()) === "CLOSED") return { error: "notReady" };
    if (drive.job._count.questions === 0) return { error: "notReady" };
    if (!Array.isArray(mapping)) return { error: "invalid" };
    const r = await read(drive, csv, mapping);
    if (!r.ok) return { error: r.error };
    if (!validMapping(mapping, r.headers.length) || typeof addColleges !== "boolean") return { error: "invalid" };

    const collegeIds = new Map(drive.colleges.map((c) => [collegeKey(c.name), c.id]));
    if (addColleges) {
        for (const name of unknownColleges(r.checked.rows)) {
            const c = await db.driveCollege.create({ data: { driveId: drive.id, name }, select: { id: true } });
            collegeIds.set(collegeKey(name), c.id);
        }
    }
    const todo = r.checked.rows.filter((x) => x.status === "READY" || (addColleges && x.status === "UNKNOWN_COLLEGE"));
    const expiresAt = linkExpiry(drive);
    let invited = 0;
    for (let i = 0; i < todo.length; i += 100) {
        const emails: QueuedEmail[] = [];
        for (const row of todo.slice(i, i + 100)) {
            const person = await findOrCreateCandidate(row.email, row.name);
            if ("error" in person) continue; // a staff account appeared since the preview
            const collegeId = row.college ? (collegeIds.get(collegeKey(row.college)) ?? null) : null;
            // One per person per drive (AC8): a row already there is skipped, never duplicated
            const existing = await db.driveCandidate.findUnique({ where: { driveId_userId: { driveId: drive.id, userId: person.id } }, select: { id: true } });
            if (existing) continue;
            // With an aptitude round, the interview is created when they pass it (AIIN-169)
            const interview = drive.aptitudeEnabled
                ? null
                : await createInterview({ jobId: drive.jobId, candidateId: person.id, employerId: drive.userId, expiresAt, driveId: drive.id });
            const dc = await db.driveCandidate.create({
                data: { driveId: drive.id, userId: person.id, driveCollegeId: collegeId, interviewId: interview?.id ?? null, rollNumber: row.roll || null, source: "CSV" },
                select: { id: true },
            });
            emails.push({
                to: row.email,
                template: "DRIVE_INVITE",
                driveId: drive.id,
                driveCandidateId: dc.id,
                interviewId: interview?.id,
                dedupeKey: `DRIVE_INVITE:${dc.id}`,
                payload: { ...drivePayload({
                    candidateName: person.name ?? row.name,
                    drive: { name: drive.name, closesAt: drive.closesAt },
                    job: { title: drive.job.title, employerName: drive.job.employer.name, questions: drive.job._count.questions },
                    link: interview ? interviewLink(interview) : aptitudeLink(dc.id),
                    aptitude: drive.aptitudeEnabled,
                }) },
            });
            invited++;
        }
        await enqueue(emails);
    }
    // Sending happens after the response, in batches (AIIN-167): never inside this request
    if (invited) after(() => processOutbox());
    revalidatePath(`/dashboard/drives/${drive.id}`);
    return { ok: true, invited, skipped: r.checked.rows.length - invited };
}

