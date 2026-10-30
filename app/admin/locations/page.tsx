import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTotalVisitors, getVisitorLocationStats } from "@/actions/location";
import { AdminHeading, StatTile, statGrid, td, th, tr } from "@/components/admin/admin-ui";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.visitors");
    return { title: t("metaTitle") };
}

const TOP = 10;

/** Where visits come from (AIIN-138). Both actions check for an admin. */
export default async function AdminVisitorsPage() {
    const t = await getTranslations("Admin.visitors");
    const [stats, totals] = await Promise.all([getVisitorLocationStats(), getTotalVisitors()]);
    const total = totals.totalVisits;
    const share = (count: number) => (total > 0 ? Math.round((count / total) * 1000) / 10 : 0);
    const top = stats.slice(0, TOP);
    const rest = stats.slice(TOP);
    const restCount = rest.reduce((sum, s) => sum + s.count, 0);
    const rows = [
        ...top.map((s, i) => ({ key: s.countryCode, rank: String(i + 1), country: s.country, code: s.countryCode, count: s.count })),
        ...(rest.length ? [{ key: "other", rank: String(TOP + 1), country: t("other", { count: rest.length }), code: "—", count: restCount }] : []),
    ];
    const n = (v: number) => v.toLocaleString("en-IN");

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <ul className={statGrid}>
                <StatTile value={n(total)} label={t("visits")} note={t("visitsNote")} />
                <StatTile value={n(totals.uniqueCountries)} label={t("countries")} note={t("countriesNote")} />
                <StatTile value={stats[0]?.country ?? "—"} label={t("top")} note={stats[0] ? t("topNote", { share: share(stats[0].count) }) : t("none")} />
            </ul>
            <section aria-labelledby="top-title" className={panel}>
                <h2 id="top-title" className={panelTitle}>
                    {t("topTitle")}
                </h2>
                {rows.length === 0 ? (
                    <p className="text-sg-muted">{t("empty")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-[15px]">
                            <caption className="sr-only">{t("caption")}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>{t("rank")}</th>
                                    <th scope="col" className={th}>{t("country")}</th>
                                    <th scope="col" className={th}>{t("code")}</th>
                                    <th scope="col" className={th}>{t("share")}</th>
                                    <th scope="col" className={cn(th, "text-right")}>{t("colVisits")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.key} className={tr}>
                                        <th scope="row" className={cn(td, "font-semibold text-sg-muted")}>{r.rank}</th>
                                        <td className={td}>{r.country}</td>
                                        <td className={td}>
                                            <code className="font-mono text-[13px]">{r.code}</code>
                                        </td>
                                        <td className={td}>
                                            <span className="flex items-center gap-2.5">
                                                <span aria-hidden="true" className="h-2 w-[min(160px,30vw)] overflow-hidden rounded-full bg-sg-track">
                                                    <span className="block h-full rounded-full bg-sg-lavender-ink" style={{ width: `${share(r.count)}%` }} />
                                                </span>
                                                <span className="text-sm font-semibold tabular-nums">{share(r.count)}%</span>
                                            </span>
                                        </td>
                                        <td className={cn(td, "text-right font-bold tabular-nums")}>{n(r.count)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}
