import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPlatformStats } from "@/actions/admin";
import { db } from "@/lib/db";
import { AdminHeading, RoleChip, StatTile, statGrid, td, th, tr } from "@/components/admin/admin-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { panel, panelTitle, textLink } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.overview");
    return { title: t("metaTitle") };
}

const joined = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** The whole platform at a glance (AIIN-138). The layout lets only admins in; getPlatformStats checks again. */
export default async function AdminOverviewPage() {
    const t = await getTranslations("Admin.overview");
    const roles = await getTranslations("Admin.roles");
    const [stats, newest, newFeedback, pastDue, featuresOff] = await Promise.all([
        getPlatformStats(),
        db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
        db.feedback.count({ where: { status: "NEW" } }),
        db.subscription.count({ where: { status: "PAST_DUE" } }),
        db.featureFlag.count({ where: { enabled: false } }),
    ]);
    const n = (v: number) => v.toLocaleString("en-IN");

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <ul className={statGrid}>
                <StatTile value={n(stats.totalUsers)} label={t("users")} note={t("usersNote", { count: stats.recentUsers })} />
                <StatTile value={n(stats.totalJobs)} label={t("jobs")} note={t("jobsNote")} />
                <StatTile value={n(stats.totalInterviews)} label={t("interviews")} note={t("interviewsNote")} />
                <StatTile value={n(stats.visitorsToday)} label={t("visitors")} note={t("visitorsNote", { count: stats.viewsToday })} />
            </ul>
            <div className="grid items-start gap-5 lg:grid-cols-[2fr_1fr]">
                <section aria-labelledby="newest-title" className={panel}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 id="newest-title" className={panelTitle}>
                            {t("newest")}
                        </h2>
                        <Link href="/admin/users" className={textLink}>
                            {t("allUsers")}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[15px]">
                            <caption className="sr-only">{t("newest")}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>{t("person")}</th>
                                    <th scope="col" className={th}>{t("role")}</th>
                                    <th scope="col" className={th}>{t("joined")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newest.map((u) => (
                                    <tr key={u.id} className={tr}>
                                        <th scope="row" className={cn(td, "font-semibold")}>
                                            <span className="flex flex-col">
                                                <span>{u.name || t("noName")}</span>
                                                <span className="text-[13px] font-medium text-sg-muted [overflow-wrap:anywhere]">{u.email}</span>
                                            </span>
                                        </th>
                                        <td className={td}>
                                            <RoleChip role={u.role} label={roles(u.role)} />
                                        </td>
                                        <td className={cn(td, "whitespace-nowrap text-sg-muted")}>{joined.format(u.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section aria-labelledby="needs-title" className={panel}>
                    <h2 id="needs-title" className={panelTitle}>
                        {t("needs")}
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {[
                            { label: t("newFeedback"), count: newFeedback, href: "/admin/feedback" },
                            { label: t("pastDue"), count: pastDue, href: "/admin/subscriptions" },
                            { label: t("featuresOff"), count: featuresOff, href: "/admin/features" },
                        ].map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} className={cn("flex items-center justify-between gap-2.5 rounded-2xl bg-sg-row px-3.5 py-3 font-semibold hover:bg-sg-chip", focusRing)}>
                                    <span>{item.label}</span>
                                    <span className="font-bold">{item.count}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link href="/admin/seed-placement" className={cn(textLink, "self-start")}>
                        {t("sample")}
                    </Link>
                </section>
            </div>
        </>
    );
}
