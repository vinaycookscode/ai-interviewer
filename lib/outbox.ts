// The email outbox (AIIN-167). Server only. Emails are queued as rows and sent here in batches, with retries and
// without exceeding Resend's rate limit. Two workers never send the same row: rows are claimed with SKIP LOCKED.
import { Resend } from "resend";
import { Prisma } from "@prisma/client";
import { env } from "@/env";
import { db } from "@/lib/db";
import { DRIVE_TEMPLATES, MAX_ATTEMPTS, driveEmail, readPayload, retryDelayMs, type DriveTemplate } from "@/lib/drive-email";

const FROM = "Get Back To U <noreply@getbacktou.com>";
const BATCH = 100; // Resend's batch limit
const GAP_MS = 600; // Resend allows 2 requests a second
const STUCK_MS = 10 * 60_000; // a row left SENDING this long (a worker died mid-send) is tried again

export interface QueuedEmail {
    to: string;
    template: DriveTemplate;
    payload: Prisma.InputJsonValue;
    driveId?: string;
    driveCandidateId?: string;
    interviewId?: string;
    dedupeKey?: string;
}

/** Queue emails. A row with a dedupeKey already used is skipped, so the same reminder is never queued twice. */
export async function enqueue(rows: QueuedEmail[]): Promise<number> {
    if (!rows.length) return 0;
    const { count } = await db.outboundEmail.createMany({ data: rows.map((r) => ({ ...r, to: r.to.trim().toLowerCase() })), skipDuplicates: true });
    return count;
}

interface Claimed {
    id: string;
    to: string;
    template: string;
    payload: unknown;
    attempts: number;
}

/** Claim up to `limit` due rows for this worker only (AC3). Times are stored in UTC without a zone, so compare in UTC. */
async function claim(limit: number): Promise<Claimed[]> {
    return db.$queryRaw<Claimed[]>`
        UPDATE "OutboundEmail" SET status = 'SENDING', attempts = attempts + 1, "updatedAt" = (now() AT TIME ZONE 'UTC')
        WHERE id IN (
            SELECT id FROM "OutboundEmail"
            WHERE status = 'QUEUED' AND "sendAfter" <= (now() AT TIME ZONE 'UTC')
            ORDER BY "sendAfter", id
            LIMIT ${limit}
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, "to", template, payload, attempts`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fail(row: Claimed, error: string) {
    const final = row.attempts >= MAX_ATTEMPTS;
    await db.outboundEmail.update({
        where: { id: row.id },
        data: final
            ? { status: "FAILED", lastError: error.slice(0, 500) }
            : { status: "QUEUED", lastError: error.slice(0, 500), sendAfter: new Date(Date.now() + retryDelayMs(row.attempts)) },
    });
}

/**
 * Send what's due, until the deadline: batches of 100 through Resend's batch endpoint, paced under its rate limit.
 * An invalid address fails on its own; a refused batch is retried with backoff. Never throws.
 */
export async function processOutbox(opts: { deadlineMs?: number } = {}): Promise<{ sent: number; retried: number; failed: number }> {
    const stopAt = Date.now() + (opts.deadlineMs ?? 40_000);
    const tally = { sent: 0, retried: 0, failed: 0 };
    try {
        await db.outboundEmail.updateMany({ where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - STUCK_MS) } }, data: { status: "QUEUED" } });
        const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
        while (Date.now() < stopAt) {
            const rows = await claim(BATCH);
            if (!rows.length) break;
            const ready: { row: Claimed; mail: { from: string; to: string; subject: string; html: string; text: string } }[] = [];
            for (const row of rows) {
                const payload = readPayload(row.payload);
                if (!payload || !(DRIVE_TEMPLATES as string[]).includes(row.template)) {
                    await db.outboundEmail.update({ where: { id: row.id }, data: { status: "FAILED", lastError: "Unknown template or bad payload" } });
                    tally.failed++;
                    continue;
                }
                ready.push({ row, mail: { from: FROM, to: row.to, ...driveEmail(row.template as DriveTemplate, payload) } });
            }
            if (!ready.length) continue;
            if (!resend) {
                // No email service configured: nothing can be sent, so say so and keep the rows for later
                console.log(`Outbox: Resend isn't configured; ${ready.length} emails wait.`);
                await db.outboundEmail.updateMany({ where: { id: { in: ready.map((r) => r.row.id) } }, data: { status: "QUEUED", attempts: { decrement: 1 } } });
                break;
            }
            // Permissive: Resend sends the valid emails and names the invalid ones by index, so one bad address can't hold up 99
            const { data, error } = await resend.batch.send(
                ready.map((r) => r.mail),
                { batchValidation: "permissive" },
            );
            await sleep(GAP_MS);
            if (error || !data) {
                // The whole batch was refused (rate limit, outage): every row waits and tries again
                for (const r of ready) {
                    await fail(r.row, error?.message ?? "Send failed");
                    if (r.row.attempts >= MAX_ATTEMPTS) tally.failed++;
                    else tally.retried++;
                }
                continue;
            }
            const bad = new Map((data.errors ?? []).map((e) => [e.index, e.message]));
            const ids = [...data.data];
            const now = new Date();
            for (const [i, r] of ready.entries()) {
                const reason = bad.get(i);
                const id = reason === undefined ? ids.shift()?.id : undefined;
                if (id) {
                    await db.outboundEmail.update({ where: { id: r.row.id }, data: { status: "SENT", sentAt: now, providerId: id, lastError: null } });
                    tally.sent++;
                } else {
                    await fail(r.row, reason ?? "No id returned");
                    if (r.row.attempts >= MAX_ATTEMPTS) tally.failed++;
                    else tally.retried++;
                }
            }
        }
    } catch (error) {
        console.error("Outbox worker failed:", error);
    }
    return tally;
}

/** Re-queue a drive's failed and bounced emails, once (AC6). Callers have checked the employer owns the drive. */
export async function requeueFailed(driveId: string, driveCandidateId?: string): Promise<number> {
    const { count } = await db.outboundEmail.updateMany({
        where: { driveId, status: { in: ["FAILED", "BOUNCED"] }, ...(driveCandidateId ? { driveCandidateId } : {}) },
        data: { status: "QUEUED", attempts: 0, sendAfter: new Date(), lastError: null, providerId: null },
    });
    return count;
}
