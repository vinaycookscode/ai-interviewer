import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubscribe } from "@/lib/weekly-report/unsubscribe-token";

// One-click unsubscribe from the mail app (RFC 8058: List-Unsubscribe-Post) for the weekly report (AIIN-103).
export async function POST(req: Request) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("u") ?? undefined;
    if (!verifyUnsubscribe(userId, url.searchParams.get("t") ?? undefined)) {
        return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }
    await db.user.updateMany({ where: { id: userId }, data: { weeklyReportEmails: false } });
    return NextResponse.json({ ok: true });
}
