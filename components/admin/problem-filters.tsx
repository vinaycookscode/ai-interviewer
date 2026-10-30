"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { fieldInput, focusRing } from "@/components/soft-glass/classes";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProblemFiltersProps {
    kits: { id: string; company: string }[];
    types: { value: string; label: string }[];
    difficulties: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
}

const select = cn("h-11 rounded-full border border-sg-field-border bg-sg-row pr-9 pl-3.5 text-sm font-semibold text-sg-text", focusRing);
const filterLabel = "flex flex-col gap-1 text-[13px] leading-[18px] font-bold text-sg-muted";

/** Search and filters for the problem list, kept in the address so a view can be shared and reloaded (AIIN-107). */
export function ProblemFilters({ kits, types, difficulties, statuses }: ProblemFiltersProps) {
    const t = useTranslations("AdminProblems");
    const router = useRouter();
    const params = useSearchParams();

    const go = (changes: Record<string, string>) => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        next.delete("page");
        router.push(`/admin/problems${next.size ? `?${next}` : ""}`);
    };

    const filter = (key: string, label: string, options: { value: string; label: string }[], all: string) => (
        <label className={filterLabel}>
            {label}
            <select value={params.get(key) ?? ""} onChange={(e) => go({ [key]: e.target.value })} className={select}>
                <option value="">{all}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <form
                role="search"
                className="relative min-w-[min(280px,100%)] flex-[1_1_280px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
                }}
            >
                <label htmlFor="ap-search" className="sr-only">
                    {t("search")}
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" aria-hidden="true" />
                <Input id="ap-search" name="q" type="search" defaultValue={params.get("q") ?? ""} placeholder={t("searchPlaceholder")} className={cn(fieldInput, "pl-11")} />
            </form>
            {filter("kit", t("company"), kits.map((k) => ({ value: k.id, label: k.company })), t("allCompanies"))}
            {filter("type", t("type"), types, t("allTypes"))}
            {filter("difficulty", t("difficulty"), difficulties, t("anyDifficulty"))}
            {filter("status", t("status"), statuses, t("statusActive"))}
        </div>
    );
}
