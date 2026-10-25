"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { field } from "@/components/jobs/employer-ui";
import { STATUS_FILTERS, type StatusFilter } from "./status-filters";


interface CandidateFiltersProps {
    jobs: { id: string; title: string }[];
    q: string;
    jobId: string;
    status: StatusFilter;
}

/** Search, job and status filters. They live in the URL, so a filtered list can be shared or reloaded. */
export function CandidateFilters({ jobs, q, jobId, status }: CandidateFiltersProps) {
    const t = useTranslations("Employer.candidates");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    function update(changes: Record<string, string>) {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(changes)) {
            if (value && value !== "all") params.set(key, value);
            else params.delete(key);
        }
        params.delete("page");
        const query = params.toString();
        startTransition(() => router.push(query ? `/dashboard/candidates?${query}` : "/dashboard/candidates"));
    }

    return (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3" aria-busy={isPending}>
            <form
                role="search"
                className="relative max-w-[360px] min-w-0 flex-[1_1_260px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    update({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
                }}
            >
                <Search className="pointer-events-none absolute top-3.5 left-4 size-5 text-sg-muted" aria-hidden="true" />
                <label htmlFor="cd-search" className="sr-only">
                    {t("search")}
                </label>
                <input id="cd-search" name="q" type="search" defaultValue={q} placeholder={t("search")} className={cn(field, "h-12 pl-12")} />
            </form>

            <div className="flex min-w-0 flex-[0_1_240px] flex-col gap-1.5">
                <label htmlFor="cd-job" className="text-[13px] font-bold">
                    {t("job")}
                </label>
                <select id="cd-job" value={jobId} onChange={(e) => update({ job: e.target.value })} className={cn(field, "h-12 px-3.5")}>
                    <option value="">{t("allJobs")}</option>
                    {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                            {job.title}
                        </option>
                    ))}
                </select>
            </div>

            <div role="group" aria-label={t("statusGroup")} className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((value) => {
                    const on = status === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => update({ status: value })}
                            className={cn(
                                "h-10 rounded-full border-2 px-4 text-sm font-semibold",
                                on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
                                focusRing
                            )}
                        >
                            {t(`filter.${value}`)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
