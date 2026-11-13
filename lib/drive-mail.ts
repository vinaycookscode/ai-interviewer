// What drive emails say and when they're queued (AIIN-167). Server only; callers have checked who may act.
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { enqueue, type QueuedEmail } from "@/lib/outbox";
import type { DriveEmailPayload } from "@/lib/drive-email";

export const REMINDER_WINDOW_MS = 30 * 60 * 60 * 1000; // the daily run queues reminders for drives closing in the next 30 hours

export function interviewLink(interview: { id: string; token: string | null }): string {
    return `${APP_URL}/interview/${interview.id}?token=${interview.token ?? ""}`;
}

/** A drive with an aptitude round sends candidates to it first (AIIN-169); they sign in as themselves there. */
export function aptitudeLink(driveCandidateId: string): string {
    return `${APP_URL}/aptitude/${driveCandidateId}`;
}

/** The payload an invitation or reminder needs, from the drive, its job and the candidate. */
export function drivePayload(input: {
    candidateName: string | null;
    drive: { name: string; closesAt: Date };
    job: { title: string; employerName: string | null; questions: number };
    link: string;
    aptitude: boolean;
}): DriveEmailPayload {
    return {
        name: input.candidateName,
        job: input.job.title,
        company: input.job.employerName?.trim() || "The employer",
        drive: input.drive.name,
        closesAt: input.drive.closesAt.toISOString(),
        link: input.link,
        questions: input.job.questions,
        aptitude: input.aptitude,
    };
}

/**
 * Queue a reminder for everyone in a drive closing within the window who hasn't started (AC5). The dedupe key makes it
 * one reminder per candidate per drive, however often this runs.
 */
export async function queueDriveReminders(now = new Date()): Promise<number> {
    const drives = await db.drive.findMany({
        where: { draft: false, closedAt: null, opensAt: { lte: now }, closesAt: { gt: now, lte: new Date(now.getTime() + REMINDER_WINDOW_MS) } },
        select: {
            id: true,
            name: true,
            closesAt: true,
            aptitudeEnabled: true,
            job: { select: { title: true, employer: { select: { name: true } }, _count: { select: { questions: { where: { archived: false } } } } } },
            candidates: {
                where: { stage: { in: ["INVITED", "OPENED"] } },
                select: { id: true, interviewId: true, userId: true },
            },
        },
    });
    const rows: QueuedEmail[] = [];
    for (const d of drives) {
        if (!d.closesAt || !d.candidates.length) continue;
        const job = { title: d.job.title, employerName: d.job.employer.name, questions: d.job._count.questions };
        if (d.aptitudeEnabled) {
            // Not started the aptitude round yet: remind them to take it
            const people = await db.user.findMany({ where: { id: { in: d.candidates.map((c) => c.userId) } }, select: { id: true, email: true, name: true } });
            const byUser = new Map(people.map((p) => [p.id, p]));
            for (const c of d.candidates) {
                const p = byUser.get(c.userId);
                if (!p) continue;
                rows.push({
                    to: p.email,
                    template: "DRIVE_REMINDER",
                    driveId: d.id,
                    driveCandidateId: c.id,
                    dedupeKey: `DRIVE_REMINDER:${c.id}`,
                    payload: { ...drivePayload({ candidateName: p.name, drive: { name: d.name, closesAt: d.closesAt }, job, link: aptitudeLink(c.id), aptitude: true }) },
                });
            }
            continue;
        }
        const interviews = await db.interview.findMany({
            where: { id: { in: d.candidates.flatMap((c) => (c.interviewId ? [c.interviewId] : [])) }, status: "PENDING" },
            select: { id: true, token: true, candidate: { select: { email: true, name: true } } },
        });
        const byId = new Map(interviews.map((i) => [i.id, i]));
        for (const c of d.candidates) {
            const iv = c.interviewId ? byId.get(c.interviewId) : undefined;
            if (!iv) continue; // started or finished: no reminder
            rows.push({
                to: iv.candidate.email,
                template: "DRIVE_REMINDER",
                driveId: d.id,
                driveCandidateId: c.id,
                interviewId: iv.id,
                dedupeKey: `DRIVE_REMINDER:${c.id}`,
                payload: { ...drivePayload({
                    candidateName: iv.candidate.name,
                    drive: { name: d.name, closesAt: d.closesAt },
                    job,
                    link: interviewLink(iv),
                    aptitude: false,
                }) },
            });
        }
    }
    return enqueue(rows);
}
