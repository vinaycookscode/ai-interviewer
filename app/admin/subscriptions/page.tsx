import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminSubscriptionPlans, getAllSubscribers, getSubscriptionStats } from "@/actions/admin-subscription";
import { AdminHeading, StatTile, statGrid } from "@/components/admin/admin-ui";
import { SubscribersTable } from "./subscribers-table";
import { PlansManager } from "./plans-manager";
import { ResetSubscribersButton } from "./reset-subscribers-button";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.subscriptions");
    return { title: t("metaTitle") };
}

const STATUSES = ["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;
const PAGE_SIZE = 20;
const since = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "Asia/Kolkata" });
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Revenue, subscribers and plans (AIIN-138). Every action here checks for an admin. */
export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
    const t = await getTranslations("Admin.subscriptions");
    const params = await searchParams;
    const q = params.q?.trim() ?? "";
    const status = STATUSES.find((s) => s === params.status);
    const page = Math.max(1, Number(params.page) || 1);
    const [stats, { subscribers, pagination }, plans] = await Promise.all([getSubscriptionStats(), getAllSubscribers(page, PAGE_SIZE, q, status), getAdminSubscriptionPlans()]);

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <ul className={statGrid}>
                <StatTile value={rupees(stats.totalRevenue)} label={t("total")} note={t("allTime")} />
                <StatTile value={rupees(stats.monthRevenue)} label={t("month")} note={monthName.format(new Date())} />
                <StatTile value={stats.activeSubscriptions.toLocaleString("en-IN")} label={t("paying")} note={t("payingNote", { pro: stats.proSubscribers, premium: stats.premiumSubscribers })} />
                <StatTile value={stats.todayPurchases.toLocaleString("en-IN")} label={t("today")} note={rupees(stats.todayRevenue)} />
            </ul>
            <SubscribersTable
                rows={subscribers.map((s) => ({
                    id: s.id,
                    name: s.user.name,
                    email: s.user.email,
                    plan: s.plan,
                    billing: s.billingPeriod,
                    status: s.status,
                    left: s.status === "ACTIVE" || s.status === "CANCELLED" ? s.daysRemaining : null,
                    amount: rupees(s.totalPaid),
                    since: since.format(s.createdAt),
                }))}
                q={q}
                status={status ?? null}
                page={page}
                pages={Math.max(1, pagination.totalPages)}
            />
            <PlansManager
                plans={plans.map((p) => ({
                    id: p.id,
                    name: p.name,
                    tier: p.tier,
                    monthlyPrice: p.monthlyPrice,
                    yearlyPrice: p.yearlyPrice,
                    mockInterviewLimit: p.mockInterviewLimit,
                    resumeAnalysisLimit: p.resumeAnalysisLimit,
                    questionGenerationLimit: p.questionGenerationLimit,
                    coverLetterLimit: p.coverLetterLimit,
                    resumeRewriteLimit: p.resumeRewriteLimit,
                    aiEvaluationEnabled: p.aiEvaluationEnabled,
                    prioritySupport: p.prioritySupport,
                    activeSubscribers: p.activeSubscribers,
                }))}
            />
            <ResetSubscribersButton />
        </>
    );
}
