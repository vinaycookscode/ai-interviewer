import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AdminHeading, StatTile, statGrid, td, th, tr } from "@/components/admin/admin-ui";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.integrity");
    return { title: t("metaTitle") };
}

const RULES = ["timesAway", "awayTotal", "fullscreen", "pastes", "devTools"] as const;

/**
 * How employers review the integrity verdicts, per rule that fired, to tune its thresholds (AIIN-179).
 * Counts only: no candidate, employer or interview is named. The current review of each interview counts once.
 */
export default async function AdminIntegrityPage() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/dashboard");
    const t = await getTranslations("Admin.integrity");

    const [byRule, byOutcome, flagged] = await Promise.all([
        db.$queryRaw<{ code: string; outcome: string; n: bigint }[]>`
            WITH latest AS (
                SELECT DISTINCT ON ("interviewId") "outcome", "reasonCodes"
                FROM "IntegrityReview"
                ORDER BY "interviewId", "createdAt" DESC
            )
            SELECT code, "outcome"::text AS outcome, COUNT(*) AS n
            FROM latest, UNNEST("reasonCodes") AS code
            GROUP BY code, "outcome"`,
        db.interview.groupBy({ by: ["integrityReviewOutcome"], where: { integrityVerdict: { in: ["WORTH_A_LOOK", "STRONG_CONCERNS"] } }, _count: { _all: true } }),
        db.interview.count({ where: { integrityVerdict: { in: ["WORTH_A_LOOK", "STRONG_CONCERNS"] } } }),
    ]);

    const count = (code: string, outcome: string) => Number(byRule.find((r) => r.code === code && r.outcome === outcome)?.n ?? 0);
    const outcome = (o: "NO_ISSUE" | "CONFIRMED" | null) => byOutcome.find((b) => b.integrityReviewOutcome === o)?._count._all ?? 0;
    const n = (v: number) => v.toLocaleString("en-IN");
    const rows = RULES.map((code) => {
        const noIssue = count(code, "NO_ISSUE");
        const confirmed = count(code, "CONFIRMED");
        const total = noIssue + confirmed;
        return { code, noIssue, confirmed, total, falseAlarms: total ? Math.round((noIssue / total) * 100) : null };
    });

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <ul className={statGrid}>
                <StatTile value={n(flagged)} label={t("flagged")} note={t("flaggedNote")} />
                <StatTile value={n(outcome(null))} label={t("unreviewed")} />
                <StatTile value={n(outcome("NO_ISSUE"))} label={t("noIssue")} />
                <StatTile value={n(outcome("CONFIRMED"))} label={t("confirmed")} />
            </ul>
            <section aria-labelledby="rules-title" className={panel}>
                <h2 id="rules-title" className={panelTitle}>
                    {t("rulesTitle")}
                </h2>
                <p className="text-sg-muted">{t("rulesNote")}</p>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] border-collapse text-[15px]">
                        <caption className="sr-only">{t("caption")}</caption>
                        <thead>
                            <tr>
                                <th scope="col" className={th}>{t("rule")}</th>
                                <th scope="col" className={cn(th, "text-right")}>{t("colNoIssue")}</th>
                                <th scope="col" className={cn(th, "text-right")}>{t("colConfirmed")}</th>
                                <th scope="col" className={cn(th, "text-right")}>{t("colFalseAlarms")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.code} className={tr}>
                                    <th scope="row" className={cn(td, "font-semibold")}>{t(`rules.${r.code}`)}</th>
                                    <td className={cn(td, "text-right tabular-nums")}>{n(r.noIssue)}</td>
                                    <td className={cn(td, "text-right tabular-nums")}>{n(r.confirmed)}</td>
                                    <td className={cn(td, "text-right tabular-nums")}>{r.falseAlarms === null ? "—" : t("percent", { value: r.falseAlarms })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
