"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { HiringDecision } from "@prisma/client";
import { FINISHED_WITHIN, MIN_SCORES, STATUSES, filtersQuery, type RankingFilters } from "@/lib/candidate-filters";
import { DECISIONS } from "@/lib/decision";
import { focusRing } from "@/components/soft-glass/classes";
import { field } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Search and filters for the ranked list. Every change goes into the URL, so a view can be bookmarked (AIIN-158). */
export function RankedFilters({ filters }: { filters: RankingFilters }) {
    const t = useTranslations("Shortlist");
    const router = useRouter();
    const pathname = usePathname();
    const [q, setQ] = useState(filters.q);
    const first = useRef(true);

    const go = (next: Partial<RankingFilters>) => {
        // Any filter change starts again from page 1
        const qs = filtersQuery({ ...filters, ...next, page: 1 });
        router.replace(`${pathname}${qs ? `?${qs}` : ""}#candidates`, { scroll: false });
    };

    // Search as you type, after a short pause
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const id = setTimeout(() => go({ q: q.trim() }), 300);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should trigger a search
    }, [q]);

    const toggle = (d: HiringDecision) =>
        go({ decisions: filters.decisions.includes(d) ? filters.decisions.filter((x) => x !== d) : [...filters.decisions, d] });

    const select = cn(field, "h-11 w-auto rounded-full pr-9 pl-4 text-sm font-semibold", focusRing);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2.5">
                <div className="relative min-w-[min(240px,100%)] flex-[1_1_260px]">
                    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" />
                    <label htmlFor="sl-search" className="sr-only">
                        {t("search")}
                    </label>
                    <input id="sl-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className={cn(field, "h-11 pl-11", focusRing)} />
                </div>
                <label className="flex flex-col gap-1 text-[13px] font-bold text-sg-muted">
                    {t("score")}
                    <select value={filters.min ?? ""} onChange={(e) => go({ min: e.target.value ? Number(e.target.value) : null })} className={select}>
                        <option value="">{t("anyScore")}</option>
                        {MIN_SCORES.map((s) => (
                            <option key={s} value={s}>
                                {t("minScore", { score: s })}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-bold text-sg-muted">
                    {t("finished")}
                    <select value={filters.within ?? ""} onChange={(e) => go({ within: e.target.value ? Number(e.target.value) : null })} className={select}>
                        <option value="">{t("anyTime")}</option>
                        {FINISHED_WITHIN.map((d) => (
                            <option key={d} value={d}>
                                {t("lastDays", { count: d })}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-[13px] font-bold text-sg-muted">
                    {t("status")}
                    <select
                        value={filters.status ?? ""}
                        onChange={(e) => go({ status: (e.target.value || null) as RankingFilters["status"] })}
                        className={select}
                    >
                        <option value="">{t("anyStatus")}</option>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {t(`statuses.${s}`)}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div role="group" aria-label={t("decision")} className="flex flex-wrap gap-2">
                {DECISIONS.map((d) => {
                    const on = filters.decisions.includes(d);
                    return (
                        <button
                            key={d}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(d)}
                            className={cn(
                                "h-10 rounded-full border-2 px-4 text-sm font-semibold",
                                on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row hover:bg-sg-chip",
                                focusRing
                            )}
                        >
                            {t(`decisions.${d}`)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
