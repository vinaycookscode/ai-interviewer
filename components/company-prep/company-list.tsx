"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Building2, Search } from "lucide-react";
import { focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { field, glassButton } from "@/components/jobs/employer-ui";
import { companyInitial } from "@/lib/company-prep-format";
import { cn } from "@/lib/utils";

export interface CompanyCard {
    slug: string;
    name: string;
    description: string;
    difficulty: string;
    rounds: number;
    questions: number;
    salary: string | null;
}

const LEVELS = ["EASY", "MEDIUM", "HARD"] as const;
type Level = (typeof LEVELS)[number];

const chip = "inline-flex h-7 items-center rounded-full bg-sg-chip px-2.5 text-sm font-semibold";

export function CompanyList({ companies }: { companies: CompanyCard[] }) {
    const t = useTranslations("CompanyPrep");
    const tSystem = useTranslations("System");
    const [query, setQuery] = useState("");
    const [level, setLevel] = useState<Level | "ALL">("ALL");

    const matching = useMemo(() => {
        const q = query.trim().toLowerCase();
        return companies.filter((c) => (level === "ALL" || c.difficulty === level) && (!q || c.name.toLowerCase().includes(q)));
    }, [companies, query, level]);

    const levelName = (l: string) => (LEVELS.includes(l as Level) ? t(`levels.${l as Level}`) : l);

    return (
        <>
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full max-w-[420px] flex-[1_1_260px]">
                    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" />
                    <label htmlFor="co-search" className="sr-only">
                        {t("list.search")}
                    </label>
                    <input
                        id="co-search"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("list.search")}
                        className={cn(field, "h-12 pl-11")}
                    />
                </div>
                <div role="group" aria-label={t("list.difficulty")} className="flex flex-wrap gap-2">
                    {(["ALL", ...LEVELS] as const).map((l) => {
                        const count = l === "ALL" ? companies.length : companies.filter((c) => c.difficulty === l).length;
                        const on = level === l;
                        return (
                            <button
                                key={l}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setLevel(l)}
                                className={cn(
                                    "h-10 rounded-full border-2 px-4 text-sm font-semibold",
                                    on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text hover:bg-sg-chip",
                                    focusRing
                                )}
                            >
                                {t("list.filter", { label: l === "ALL" ? t("list.all") : levelName(l), count })}
                            </button>
                        );
                    })}
                </div>
            </div>

            {companies.length === 0 ? (
                <p className="sg-glass rounded-[24px] p-8 text-center text-sg-muted">{t("list.empty")}</p>
            ) : matching.length === 0 ? (
                <div role="status">
                    <EmptyState
                        title={tSystem("empty.noMatch", { query: query.trim() || levelName(level) })}
                        icon={
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-sg-lavender-soft text-sg-lavender-ink">
                                <Search className="size-[22px]" aria-hidden="true" />
                            </span>
                        }
                        action={
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    setLevel("ALL");
                                }}
                                className={cn(glassButton, "h-12")}
                            >
                                {tSystem("empty.clear")}
                            </button>
                        }
                    >
                        {tSystem("empty.noMatchBody")}
                    </EmptyState>
                </div>
            ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
                    {matching.map((c) => (
                        <li key={c.slug} className="flex">
                            <Link
                                href={`/candidate/company-prep/${c.slug}`}
                                className={cn("sg-glass flex w-full min-w-0 flex-col gap-3.5 rounded-[24px] p-5 transition-transform hover:-translate-y-0.5 sm:p-6", focusRing)}
                            >
                                <span className="flex items-center gap-3">
                                    <span
                                        aria-hidden="true"
                                        className="font-display sg-soft flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-sg-chip text-[22px] font-semibold"
                                    >
                                        {companyInitial(c.name)}
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-xl leading-7 font-bold">{c.name}</span>
                                        {c.salary && (
                                            <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("list.salary", { range: c.salary })}</span>
                                        )}
                                    </span>
                                    <ArrowRight aria-hidden="true" className="size-[18px] shrink-0 text-sg-muted" />
                                </span>
                                <span className="line-clamp-2 text-sg-muted">{c.description}</span>
                                <span className="mt-auto flex flex-wrap gap-1.5">
                                    <span className={chip}>{levelName(c.difficulty)}</span>
                                    <span className={chip}>{t("list.rounds", { count: c.rounds })}</span>
                                    <span className={chip}>{t("list.questions", { count: c.questions })}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <div className="sg-glass flex flex-wrap items-center justify-between gap-4 rounded-[22px] p-5">
                <span className="flex min-w-0 items-center gap-3">
                    <Building2 aria-hidden="true" className="size-5 shrink-0 text-sg-muted" />
                    <span className="flex flex-col">
                        <span className="font-bold">{t("list.askTitle")}</span>
                        <span className="text-sg-muted">{t("list.askBody")}</span>
                    </span>
                </span>
                <a href={`mailto:hello@getbacktou.com?subject=${encodeURIComponent(t("list.askSubject"))}`} className={cn(glassButton, "h-11 text-[15px]")}>
                    {t("list.ask")}
                </a>
            </div>
        </>
    );
}
