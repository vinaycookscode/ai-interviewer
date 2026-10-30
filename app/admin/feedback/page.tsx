import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getUserFeedbackList } from "@/actions/user-feedback";
import { AdminHeading } from "@/components/admin/admin-ui";
import { FeedbackListClient } from "./client";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.feedback");
    return { title: t("metaTitle") };
}

const STATUSES = ["NEW", "REVIEWED", "RESOLVED", "DISMISSED"] as const;
const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Feedback from the feedback button, by status (AIIN-138). getUserFeedbackList checks for an admin. */
export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
    const t = await getTranslations("Admin.feedback");
    const params = await searchParams;
    const status = STATUSES.find((s) => s === params.status) ?? "ALL";
    const page = Math.max(1, Number(params.page) || 1);
    const [{ feedback, totalPages }, counts] = await Promise.all([
        getUserFeedbackList(page, 20, status),
        db.feedback.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <FeedbackListClient
                items={feedback.map((f) => ({
                    id: f.id,
                    who: f.userName || f.userEmail || null,
                    content: f.content,
                    page: f.page,
                    category: f.category,
                    status: f.status,
                    when: when.format(f.createdAt),
                }))}
                filters={["ALL", ...STATUSES].map((s) => ({ status: s, count: s === "ALL" ? counts.reduce((sum, c) => sum + c._count._all, 0) : count(s) }))}
                status={status}
                page={page}
                pages={Math.max(1, totalPages)}
            />
        </>
    );
}
