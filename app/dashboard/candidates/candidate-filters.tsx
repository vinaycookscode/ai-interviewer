"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { HiringDecision } from "@prisma/client";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { field } from "@/components/jobs/employer-ui";

const DECISIONS: HiringDecision[] = ["UNDECIDED", "SHORTLISTED", "ON_HOLD", "REJECTED"];

interface CandidateFiltersProps {
    q: string;
    decision: HiringDecision | null;
}

/** Search and the decision filter, across every job (AIIN-217). They live in the URL, so a view can be shared or reloaded. */
export function CandidateFilters({ q, decision }: CandidateFiltersProps) {
    const t = useTranslations("Employer.candidates");
    const tShortlist = useTranslations("Shortlist");
    const router = useRouter();
    const [query, setQuery] = useState(q);
    const [isPending, startTransition] = useTransition();

    function go(next: { q: string; decision: HiringDecision | null }) {
        const params = new URLSearchParams();
        if (next.q) params.set("q", next.q);
        if (next.decision) params.set("d", next.decision);
        const s = params.toString();
        startTransition(() => router.push(s ? `/dashboard/candidates?${s}` : "/dashboard/candidates"));
    }

    const pill = (value: HiringDecision | null, label: string) => {
        const on = decision === value;
        return (
            <button
                key={value ?? "ALL"}
                type="button"
                aria-pressed={on}
                onClick={() => go({ q, decision: value })}
                className={cn(
                    "h-10 rounded-full border-2 px-4 text-sm font-semibold",
                    on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row hover:bg-sg-chip",
                    focusRing
                )}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3" aria-busy={isPending}>
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    go({ q: query.trim(), decision });
                }}
                className="relative w-full max-w-[360px] flex-[1_1_260px]"
            >
                <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" aria-hidden="true" />
                <label htmlFor="cd-search" className="sr-only">
                    {t("search")}
                </label>
                <input
                    id="cd-search"
                    type="search"
                    value={query}
                    maxLength={100}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!e.target.value && q) go({ q: "", decision });
                    }}
                    placeholder={t("search")}
                    className={cn(field, "h-12 pl-11")}
                />
            </form>
            <div role="group" aria-label={t("decisionGroup")} className="flex flex-wrap gap-2">
                {pill(null, t("everyone"))}
                {DECISIONS.map((d) => pill(d, tShortlist(`decisions.${d}`)))}
            </div>
        </div>
    );
}
