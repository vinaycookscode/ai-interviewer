import { NextResponse } from "next/server";
import { env } from "@/env";
import { processOutbox } from "@/lib/outbox";
import { queueDriveReminders } from "@/lib/drive-mail";

// Vercel Cron calls this daily (vercel.json) with the CRON_SECRET as a bearer token (AIIN-167). It queues reminders for
// drives closing within 30 hours and sends whatever is due, including retries. New emails are sent straight away when
// they're queued; this run is the safety net.
export async function GET(req: Request) {
    if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reminders = await queueDriveReminders();
    const result = await processOutbox({ deadlineMs: 50_000 });
    return NextResponse.json({ reminders, ...result });
}

export const maxDuration = 60;
