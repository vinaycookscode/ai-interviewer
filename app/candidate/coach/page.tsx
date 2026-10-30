import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { starterPrompts } from "@/lib/coach/context";
import { loadCoachFacts, loadQuota, ownConversation } from "@/lib/coach/server";
import { CoachChat } from "@/components/candidate/coach-chat";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Coach");
    return { title: t("metaTitle") };
}

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });

/** Ask U, the coach: a chat that knows the candidate's path, scores and plan (AIIN-100). `?c=` opens a past chat. */
export default async function CoachPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");
    const userId = session.user.id;
    const { c } = await searchParams;
    const t = await getTranslations("Coach");

    const active = c ? await ownConversation(userId, c) : null;
    if (c && !active) redirect("/candidate/coach");

    const [chats, messages, quota, facts] = await Promise.all([
        db.coachConversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, title: true, updatedAt: true } }),
        active
            ? db.coachMessage.findMany({ where: { conversationId: active.id }, orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true } })
            : [],
        loadQuota(userId),
        loadCoachFacts(userId),
    ]);

    const now = new Date().getTime();
    const when = (date: Date) => {
        const days = (now - date.getTime()) / 86_400_000;
        return days < 1 ? t("now") : days < 7 ? weekday.format(date) : shortDate.format(date);
    };

    return (
        <CoachChat
            key={active?.id ?? "new"}
            chats={chats.map((chat) => ({ id: chat.id, title: chat.title, when: when(chat.updatedAt) }))}
            activeId={active?.id ?? null}
            messages={messages.map((m) => ({ id: m.id, fromU: m.role === "model", content: m.content }))}
            starters={starterPrompts(facts)}
            firstName={facts.firstName}
            quota={{ limit: quota.limit, left: quota.left, free: quota.free, resetAt: quota.resetAt.toISOString() }}
        />
    );
}
