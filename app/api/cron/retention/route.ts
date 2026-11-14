import { NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/lib/db";
import { EVENTS_KEPT_DAYS } from "@/lib/integrity/notice";
import { REVIEWS_KEPT_DAYS } from "@/lib/resume-reviews";

// Vercel Cron calls this daily (vercel.json) with the CRON_SECRET as a bearer token. It keeps the integrity notice true:
// proctoring events are kept with the report for 1 year, then deleted (AIIN-176); so are resume reviews (AIIN-64).
export async function GET(req: Request) {
    if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const before = new Date(Date.now() - EVENTS_KEPT_DAYS * 24 * 60 * 60 * 1000);
    const { count } = await db.proctoringEvent.deleteMany({ where: { timestamp: { lt: before } } });
    // Resume reviews, with the resume text they hold, are kept for a year (AIIN-64)
    const reviews = await db.resumeReview.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - REVIEWS_KEPT_DAYS * 24 * 60 * 60 * 1000) } } });
    return NextResponse.json({ proctoringEventsDeleted: count, resumeReviewsDeleted: reviews.count });
}
