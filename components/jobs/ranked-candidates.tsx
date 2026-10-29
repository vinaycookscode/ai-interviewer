import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import type { HiringDecision } from "@prisma/client";
import { PAGE_SIZE, filtersQuery, type RankingFilters, type Sort } from "@/lib/candidate-filters";
import type { RankedRow } from "@/lib/candidate-ranking";
import { DECISION_ICONS } from "@/lib/decision";
import { focusRing } from "@/components/soft-glass/classes";
import { formatShortDate, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface RankedCandidatesProps {
    jobId: string;
    rows: RankedRow[];
    total: number;
    filters: RankingFilters;
}

const decisionChip: Record<HiringDecision, string> = {
    UNDECIDED: "bg-sg-chip text-sg-muted",
    SHORTLISTED: "bg-sg-lavender-soft text-sg-lavender-ink",
    ON_HOLD: "bg-sg-chip text-sg-text",
    REJECTED: "bg-sg-danger/10 text-sg-danger",
};
const th = "px-3 py-2.5 text-left text-[13px] font-bold whitespace-nowrap text-sg-muted";
const one = (n: number | null) => (n === null ? null : n.toFixed(1));

function DecisionChip({ decision, label }: { decision: HiringDecision; label: string }) {
    const Icon = DECISION_ICONS[decision];
    return (
        <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold whitespace-nowrap", decisionChip[decision])}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

/** A table from 640px, and a list on phones with rank, name, score and decision (AIIN-158). */
export function RankedCandidates({ jobId, rows, total, filters }: RankedCandidatesProps) {
    const t = useTranslations("Shortlist");
    const here = `/dashboard/jobs/${jobId}`;
    const query = filtersQuery(filters);
    // The report's back link returns to this exact view
    const reportHref = (id: string) => `/interview/${id}/feedback?from=${encodeURIComponent(`${here}${query ? `?${query}` : ""}`)}`;
    const sortHref = (sort: Sort) => {
        const qs = filtersQuery({ ...filters, sort, page: 1 });
        return `${here}${qs ? `?${qs}` : ""}#candidates`;
    };
    const pageHref = (page: number) => {
        const qs = filtersQuery({ ...filters, page });
        return `${here}${qs ? `?${qs}` : ""}#candidates`;
    };
    const from = (filters.page - 1) * PAGE_SIZE + 1;
    const to = from + rows.length - 1;
    const pages = Math.ceil(total / PAGE_SIZE);

    const sortHeader = (sort: Sort, label: string, direction: "descending" | "ascending") => (
        <th scope="col" aria-sort={filters.sort === sort ? direction : undefined} className={th}>
            <Link href={sortHref(sort)} scroll={false} className={cn("inline-flex items-center gap-1 rounded-md hover:text-sg-text", filters.sort === sort && "text-sg-text", focusRing)}>
                <span className="sr-only">{t("sortBy", { column: label })}: </span>
                {label}
                {filters.sort === sort && <ArrowDown className={cn("size-3.5", direction === "ascending" && "rotate-180")} aria-hidden="true" />}
            </Link>
        </th>
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-separate border-spacing-y-1.5 text-[15px]">
                    <caption className="sr-only">{t("caption")}</caption>
                    <thead>
                        <tr>
                            <th scope="col" className={th}>
                                <abbr title={t("rankLabel")} className="no-underline">
                                    {t("rank")}
                                </abbr>
                            </th>
                            {sortHeader("name", t("candidate"), "ascending")}
                            {sortHeader("score", t("scoreCol"), "descending")}
                            <th scope="col" className={th}>
                                {t("spread")}
                            </th>
                            <th scope="col" className={cn(th, "hidden lg:table-cell")}>
                                {t("skills")}
                            </th>
                            <th scope="col" className={th}>
                                {t("decisionCol")}
                            </th>
                            {sortHeader("finished", t("finishedCol"), "descending")}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="bg-sg-row [&>*:first-child]:rounded-l-[16px] [&>*:last-child]:rounded-r-[16px]">
                                <td className="px-3 py-3 font-bold tabular-nums">{r.rank}</td>
                                <th scope="row" className="max-w-[260px] px-3 py-3 text-left font-normal">
                                    <Link href={reportHref(r.id)} className={cn("flex min-w-0 flex-col rounded-md hover:underline", focusRing)}>
                                        <span className="truncate font-bold">{r.name || r.email}</span>
                                        {r.name && <span className="truncate text-[13px] text-sg-muted">{r.email}</span>}
                                    </Link>
                                </th>
                                <td className="px-3 py-3">
                                    <span className="font-display sg-soft text-xl font-semibold tabular-nums">{one(r.score) ?? t("none")}</span>
                                    {r.score !== null && <span className="sr-only"> {t("outOfTen")}</span>}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sg-muted tabular-nums">{r.low !== null && r.high !== null ? `${one(r.low)}–${one(r.high)}` : t("none")}</td>
                                <td className="hidden max-w-[240px] px-3 py-3 lg:table-cell">
                                    <span className="flex flex-col text-sm">
                                        <span className="truncate">{r.strongest ?? t("none")}</span>
                                        <span className="truncate text-sg-muted">{r.weakest ?? t("none")}</span>
                                    </span>
                                </td>
                                <td className="px-3 py-3">
                                    <DecisionChip decision={r.decision} label={t(`decisions.${r.decision}`)} />
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sg-muted">{r.completedAt ? formatShortDate(r.completedAt) : t("none")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="flex flex-col gap-2 sm:hidden">
                {rows.map((r) => (
                    <li key={r.id}>
                        <Link href={reportHref(r.id)} aria-label={t("openReport", { name: r.name || r.email })} className={cn("flex items-center gap-3 rounded-[18px] bg-sg-row px-3.5 py-3", focusRing)}>
                            <span className="w-9 shrink-0 font-bold tabular-nums text-sg-muted">{t("rankShort", { rank: r.rank })}</span>
                            <span className="min-w-0 flex-1 truncate font-bold">{r.name || r.email}</span>
                            <span className="font-display sg-soft text-lg font-semibold tabular-nums">{one(r.score) ?? t("none")}</span>
                            <DecisionChip decision={r.decision} label={t(`decisions.${r.decision}`)} />
                        </Link>
                    </li>
                ))}
            </ul>

            {pages > 1 && (
                <nav aria-label={t("pages")} className="flex flex-wrap items-center justify-between gap-3">
                    {filters.page > 1 ? (
                        <Link href={pageHref(filters.page - 1)} scroll={false} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("previous")}
                        </Link>
                    ) : (
                        <span aria-hidden="true" className={cn(outlineButton, "h-10 text-sm opacity-40")}>
                            {t("previous")}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-sg-muted">{t("range", { from, to, total })}</span>
                    {filters.page < pages ? (
                        <Link href={pageHref(filters.page + 1)} scroll={false} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("next")}
                        </Link>
                    ) : (
                        <span aria-hidden="true" className={cn(outlineButton, "h-10 text-sm opacity-40")}>
                            {t("next")}
                        </span>
                    )}
                </nav>
            )}
        </div>
    );
}
