"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { coralButton } from "@/components/soft-glass/classes";
import { row, textLink } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Runs the admin-only seed route and says how it went (AIIN-138). */
export function SeedPlacementButton() {
    const t = useTranslations("Admin.seed");
    const [state, setState] = useState<"idle" | "running" | "done" | "failed">("idle");
    const [error, setError] = useState("");

    const run = async () => {
        setState("running");
        try {
            const response = await fetch("/api/seed-placement", { method: "POST" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || response.statusText);
            setState("done");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setState("failed");
        }
    };

    if (state === "done") {
        return (
            <>
                <p role="status" className={cn(row, "flex items-start gap-2.5")}>
                    <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                    <span>{t("done")}</span>
                </p>
                <span className="flex flex-wrap gap-4">
                    <Link href="/candidate/placement-program" className={textLink}>
                        {t("seePlan")}
                    </Link>
                    <Link href="/candidate/company-prep" className={textLink}>
                        {t("seePrep")}
                    </Link>
                </span>
            </>
        );
    }

    return (
        <>
            <button type="button" onClick={run} disabled={state === "running"} className={cn(coralButton, "h-12 self-start px-6 text-base")}>
                {state === "running" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {state === "running" ? t("running") : t("run")}
            </button>
            {state === "failed" && (
                <p role="alert" className={cn(row, "flex items-start gap-2.5 text-sg-danger")}>
                    <XCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                    <span>{t("failed", { error })}</span>
                </p>
            )}
        </>
    );
}
