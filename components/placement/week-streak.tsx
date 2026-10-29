"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { WeekDay } from "@/lib/streak";
import { cn } from "@/lib/utils";

/** Monday to Sunday: a coral tick for each day a task was done, "Now" for today. */
export function WeekStreak({ days }: { days: WeekDay[] }) {
    const t = useTranslations("Placement");
    const labels = t.raw("weekdays") as string[];

    return (
        <ol aria-label={t("week")} className="grid grid-cols-7 gap-1">
            {days.map((day) => (
                <li key={day.weekday} className="flex flex-col items-center gap-1.5">
                    <span
                        aria-hidden="true"
                        className={cn(
                            "flex size-9 items-center justify-center rounded-full text-[13px] font-bold sm:size-10",
                            day.state === "done" && "bg-sg-coral text-sg-coral-ink",
                            day.state === "missed" && "bg-sg-chip",
                            day.state === "today" && "border-2 border-dashed border-sg-ink",
                            day.state === "upcoming" && "border-2 border-sg-track",
                            day.state === "before" && "border-2 border-dashed border-sg-track"
                        )}
                    >
                        {day.state === "done" ? <Check className="size-4" strokeWidth={3} /> : day.state === "today" ? t("now") : null}
                    </span>
                    <span className="text-[13px] leading-[18px] font-semibold text-sg-muted">
                        {labels[day.weekday]}
                        <span className="sr-only">{t(`weekState.${day.state}`)}</span>
                    </span>
                </li>
            ))}
        </ol>
    );
}
