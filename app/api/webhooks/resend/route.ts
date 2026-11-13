import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { env } from "@/env";
import { db } from "@/lib/db";

// Resend tells us about bounces and spam complaints here (AIIN-167). Calls are signed with Svix; anything unsigned or
// wrongly signed is refused with 401 and changes nothing (AC4).
export async function POST(req: Request) {
    const body = await req.text();
    if (!env.RESEND_WEBHOOK_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 401 });
    let event: { type?: string; data?: { email_id?: string } };
    try {
        event = new Webhook(env.RESEND_WEBHOOK_SECRET).verify(body, {
            "svix-id": req.headers.get("svix-id") ?? "",
            "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
            "svix-signature": req.headers.get("svix-signature") ?? "",
        }) as typeof event;
    } catch {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const id = event.data?.email_id;
    if ((event.type === "email.bounced" || event.type === "email.complained") && id) {
        await db.outboundEmail.updateMany({
            where: { providerId: id },
            data: { status: "BOUNCED", lastError: event.type === "email.bounced" ? "Bounced" : "Marked as spam" },
        });
    }
    return NextResponse.json({ ok: true });
}
