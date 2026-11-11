"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { focusRing } from "@/components/soft-glass/classes";
import { BANK_SOURCES, BANK_STATUSES, bankQuery, type BankFilters as Filters } from "@/lib/bank/search";
import { BANK_TYPES } from "@/lib/bank/items";
import { cn } from "@/lib/utils";

interface BankFiltersProps {
    filters: Filters;
    /** Companies in the candidate's bank, for the Company filter. */
    companies: string[];
    /** Items per status for the current search and filters; `all` is their total. */
    counts: { all: number; DUE: number; NEW: number; PRACTISING: number; CONFIDENT: number };
}

const select = cn("h-11 rounded-full border border-sg-field-border bg-sg-row px-3.5 text-sm font-semibold", focusRing);
const label = "flex flex-col gap-1 text-[13px] leading-[18px] font-bold text-sg-muted";

/** Search, filters and status tabs; every choice lives in the URL (AC2), so the page is shareable and the back button works. */
export function BankFilters({ filters, companies, counts }: BankFiltersProps) {
    const t = useTranslations("QuestionBank");
    const router = useRouter();
    const [query, setQuery] = useState(filters.q);
    const [pending, startTransition] = useTransition();

    const go = (change: Partial<Filters>) => startTransition(() => router.replace(`/candidate/question-bank${bankQuery(filters, change)}`, { scroll: false }));

    const tab = (status: Filters["status"], text: string) => {
        const on = filters.status === status;
        return (
            <button
                key={status ?? "ALL"}
                type="button"
                aria-pressed={on}
                onClick={() => go({ status })}
                className={cn(
                    "h-10 rounded-full border-2 px-4 text-sm font-semibold",
                    on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row hover:bg-sg-chip",
                    focusRing
                )}
            >
                {text}
            </button>
        );
    };

    return (
        <>
            <div className="flex flex-wrap items-end gap-2.5">
                <form
                    role="search"
                    onSubmit={(e) => {
                        e.preventDefault();
                        go({ q: query.trim() });
                    }}
                    className="relative min-w-[min(240px,100%)] flex-[1_1_260px]"
                >
                    {pending ? (
                        <Loader2 aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 animate-spin text-sg-muted" />
                    ) : (
                        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" />
                    )}
                    <label htmlFor="qb-search" className="sr-only">
                        {t("search")}
                    </label>
                    <input
                        id="qb-search"
                        type="search"
                        value={query}
                        maxLength={200}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            // Clearing the box clears the search
                            if (!e.target.value && filters.q) go({ q: "" });
                        }}
                        placeholder={t("searchPlaceholder")}
                        className={cn("h-11 w-full rounded-full border border-sg-field-border bg-sg-row pr-4 pl-11", focusRing)}
                    />
                    <button type="submit" className="sr-only">
                        {t("searchButton")}
                    </button>
                </form>
                <label className={label}>
                    {t("source")}
                    <select value={filters.source ?? ""} onChange={(e) => go({ source: (e.target.value || null) as Filters["source"] })} className={select}>
                        <option value="">{t("allSources")}</option>
                        {BANK_SOURCES.map((s) => (
                            <option key={s} value={s}>
                                {t(`sourceFilters.${s}`)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={label}>
                    {t("type")}
                    <select value={filters.type ?? ""} onChange={(e) => go({ type: (e.target.value || null) as Filters["type"] })} className={select}>
                        <option value="">{t("anyType")}</option>
                        {BANK_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {t(`types.${type}`)}
                            </option>
                        ))}
                    </select>
                </label>
                {companies.length > 0 && (
                    <label className={label}>
                        {t("company")}
                        <select value={filters.company ?? ""} onChange={(e) => go({ company: e.target.value || null })} className={cn(select, "max-w-[220px]")}>
                            <option value="">{t("anyCompany")}</option>
                            {companies.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
            <div role="group" aria-label={t("status")} className="flex flex-wrap gap-2">
                {tab(null, t("all", { count: counts.all }))}
                {tab("DUE", t("statusCount", { label: t("dueFilter"), count: counts.DUE }))}
                {BANK_STATUSES.map((s) => tab(s, t("statusCount", { label: t(`statuses.${s}`), count: counts[s] })))}
            </div>
        </>
    );
}
