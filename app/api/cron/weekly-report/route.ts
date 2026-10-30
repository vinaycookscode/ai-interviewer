import { NextResponse } from "next/server";
import { env } from "@/env";
import { sendWeeklyReports } from "@/lib/weekly-report/send";

// Vercel Cron calls this every Monday at 9:00 IST (vercel.json) with the CRON_SECRET as a bearer token (AIIN-103).
export const maxDuration = 300;

export async function GET(req: Request) {
    if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await sendWeeklyReports());
}
