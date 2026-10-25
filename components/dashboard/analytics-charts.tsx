"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";

export interface ScoreBin {
    /** Display label, e.g. "6–8". */
    label: string;
    from: number;
    to: number;
    count: number;
}

/** Completed interviews by score: one colour, counts written on the bars. */
export function ScoreChart({ bins }: { bins: ScoreBin[] }) {
    const t = useTranslations("Employer.overview");
    const max = Math.max(1, ...bins.map((b) => b.count));
    const busiest = bins.reduce((best, b, i) => (b.count > bins[best].count ? i : best), 0);
    const [selected, setSelected] = useState(busiest);
    const current = bins[selected];

    return (
        <>
            <ul aria-label={t("scoresAria")} className="flex h-[200px] items-end gap-2.5 border-b border-sg-rule">
                {bins.map((bin, i) => (
                    <li key={bin.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="text-sm font-bold" aria-hidden="true">
                            {bin.count}
                        </span>
                        <button
                            type="button"
                            aria-label={t("binAria", { range: bin.label, count: bin.count })}
                            aria-pressed={selected === i}
                            onMouseEnter={() => setSelected(i)}
                            onFocus={() => setSelected(i)}
                            onClick={() => setSelected(i)}
                            style={{ height: Math.round((bin.count / max) * 140) + 4 }}
                            className={cn(
                                "w-full max-w-16 rounded-t-[4px] transition-colors",
                                selected === i ? "bg-sg-ink" : "bg-sg-lavender-ink",
                                focusRing
                            )}
                        />
                        <span className="text-[13px] text-sg-muted" aria-hidden="true">
                            {bin.label}
                        </span>
                    </li>
                ))}
            </ul>
            <p aria-live="polite" className="text-sm text-sg-muted">
                {t("binTip", { count: current.count, from: current.from, to: current.to })}
            </p>
        </>
    );
}

export interface StatusCount {
    label: string;
    count: number;
}

/** Where candidates are: horizontal bars with the number beside each. */
export function StatusChart({ rows }: { rows: StatusCount[] }) {
    const total = Math.max(1, rows.reduce((sum, r) => sum + r.count, 0));
    return (
        <ul className="flex flex-col gap-3.5">
            {rows.map((r) => (
                <li key={r.label} className="grid grid-cols-[minmax(96px,170px)_1fr_auto] items-center gap-3">
                    <span className="font-semibold">{r.label}</span>
                    <span className="h-3.5 min-w-0">
                        <span
                            aria-hidden="true"
                            className="block h-full rounded-[4px] bg-sg-lavender-ink"
                            style={{ width: `${Math.max(r.count > 0 ? 2 : 0, (r.count / total) * 100)}%` }}
                        />
                    </span>
                    <span className="font-bold tabular-nums">{r.count}</span>
                </li>
            ))}
        </ul>
    );
}
