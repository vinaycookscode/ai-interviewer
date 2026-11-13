"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";
import { startAptitude } from "@/actions/aptitude";
import { coralButton } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** Start the timed round; the timer starts on the server when this is pressed. */
export function StartAptitude({ driveCandidateId }: { driveCandidateId: string }) {
    const t = useTranslations("Aptitude");
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                        startTransition(async () => {
                            const r = await startAptitude(driveCandidateId).catch(() => ({ error: "failed" as const }));
                            if ("ok" in r) router.refresh();
                            else setError(r.error === "notOpen" ? t("notOpen") : t("startFailed"));
                        })
                    }
                    className={cn(coralButton, "h-12 px-6 text-base")}
                >
                    {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                    {t("start")}
                </button>
                <span className="text-[13px] text-sg-muted">{t("startHint")}</span>
            </div>
            {error && (
                <p role="alert" className="text-sm font-semibold text-sg-danger">
                    {error}
                </p>
            )}
        </div>
    );
}
