"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setWeeklyEmails } from "@/actions/weekly-report";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** The Monday report email, on or off (AIIN-103). */
export function WeeklyEmailSwitch({ on: initial }: { on: boolean }) {
    const t = useTranslations("Profile");
    const [on, setOn] = useState(initial);
    const [failed, setFailed] = useState(false);
    const [isPending, startTransition] = useTransition();

    const toggle = () => {
        const next = !on;
        setOn(next);
        setFailed(false);
        startTransition(async () => {
            const result = await setWeeklyEmails(next);
            if (result.error) {
                setOn(!next);
                setFailed(true);
            }
        });
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-sg-row px-4 py-3">
                <span className="flex min-w-0 flex-col">
                    <span id="weekly-label" className="font-semibold">
                        {t("weeklyTitle")}
                    </span>
                    <span id="weekly-hint" className="text-sm text-sg-muted">
                        {t("weeklyHint")}
                    </span>
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby="weekly-label"
                    aria-describedby="weekly-hint"
                    disabled={isPending}
                    onClick={toggle}
                    className={cn(
                        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-60",
                        on ? "border-sg-ink bg-sg-ink" : "border-sg-field-border bg-sg-chip",
                        focusRing
                    )}
                >
                    <span className={cn("absolute size-6 rounded-full bg-sg-bg shadow transition-transform", on ? "translate-x-[26px]" : "translate-x-[2px]")} />
                    <span className="sr-only">{on ? t("weeklyOn") : t("weeklyOff")}</span>
                </button>
            </div>
            {failed && (
                <p role="alert" className="text-[13px] font-semibold text-sg-danger">
                    {t("weeklyFailed")}
                </p>
            )}
        </div>
    );
}
