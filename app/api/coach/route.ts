import { NextResponse } from "next/server";
import type { Content } from "@google/generative-ai";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getGeminiModelInstance } from "@/lib/gemini";
import { MESSAGE_LIMIT, chatTitle, systemPrompt } from "@/lib/coach/context";
import { loadCoachFacts, ownConversation, recentMessages, takeMessage } from "@/lib/coach/server";

export const maxDuration = 60;

/**
 * Sends a message to Ask U, or tries the last one again, and streams the reply (AIIN-100).
 * Body: { conversationId?, message } or { conversationId, retry: true }.
 * The reply comes as lines of JSON: { conversation, quota } first, then { t } pieces, then { done } or { error }.
 * The candidate's message is kept even if U can't answer, so it can be tried again without using another one.
 */
export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role === "EMPLOYER") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { conversationId?: unknown; message?: unknown; retry?: unknown } | null;
    if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

    // Only the candidate's own chats: another user's id is not found
    let conversation = typeof body.conversationId === "string" ? await ownConversation(userId, body.conversationId) : null;
    if (body.conversationId !== undefined && !conversation) return NextResponse.json({ error: "notFound" }, { status: 404 });

    let quota = null;
    if (body.retry === true) {
        if (!conversation) return NextResponse.json({ error: "notFound" }, { status: 404 });
        const last = await db.coachMessage.findFirst({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, select: { role: true } });
        if (last?.role !== "user") return NextResponse.json({ error: "nothingToRetry" }, { status: 409 });
    } else {
        const text = typeof body.message === "string" ? body.message.trim() : "";
        if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
        if (text.length > MESSAGE_LIMIT) return NextResponse.json({ error: "tooLong" }, { status: 400 });
        // Checked and counted on the server, before Gemini is called
        quota = await takeMessage(userId);
        if (!quota) return NextResponse.json({ error: "limit" }, { status: 429 });
        conversation ??= await db.coachConversation.create({ data: { userId, title: chatTitle(text) }, select: { id: true, title: true } });
        await db.coachMessage.create({ data: { conversationId: conversation.id, role: "user", content: text } });
        await db.coachConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    }

    const chat = conversation;
    const history = await recentMessages(chat.id);
    // Gemini wants the conversation to start with the candidate
    const first = history.findIndex((m) => m.role === "user");
    const contents: Content[] = history.slice(first).map((m) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: m.content }] }));
    const system = systemPrompt(await loadCoachFacts(userId));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            send({ conversation: chat, quota });
            try {
                const model = await getGeminiModelInstance();
                const result = await model.generateContentStream({ contents, systemInstruction: system });
                let reply = "";
                for await (const chunk of result.stream) {
                    const piece = chunk.text();
                    if (!piece) continue;
                    reply += piece;
                    send({ t: piece });
                }
                if (!reply.trim()) throw new Error("Empty reply");
                await db.coachMessage.create({ data: { conversationId: chat.id, role: "model", content: reply } });
                await db.coachConversation.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });
                send({ done: true });
            } catch (error) {
                console.error("Ask U couldn't answer:", error);
                send({ error: true });
            }
            controller.close();
        },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
