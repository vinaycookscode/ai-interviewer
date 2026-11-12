import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/lib/db";
import { queueMatch, runMatchTasks } from "@/lib/matching";

// Vercel Cron calls this daily (vercel.json) with the CRON_SECRET as a bearer token (AIIN-199): it retries match work
// left in the queue and refreshes jobs whose matches are older than 7 days. New changes are matched straight away.
export async function GET(req: Request) {
    if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale = await db.job.findMany({
        where: { status: "OPEN", archivedAt: null, requirementsConfirmedAt: { not: null }, OR: [{ matches: { none: {} } }, { matches: { some: { computedAt: { lt: weekAgo } } } }] },
        select: { id: true },
        take: 200,
    });
    for (const j of stale) await queueMatch("JOB", j.id);
    const result = await runMatchTasks(50);
    return NextResponse.json({ queued: stale.length, ...result });
}
