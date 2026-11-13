"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { retryScoring } from "@/actions/grading";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** "Scoring", or "Couldn't score N answers" with "Try again", where a ranked row would show a score (AIIN-170). */
export function ScoringNote({ interviewId, state, failed, withRetry }: { interviewId: string; state: "SCORING" | "FAILED"; failed: number; withRetry: boolean }) {
    const t = useTranslations("Shortlist");
    const router = useRouter();
    const [isPending, start] = useTransition();
    if (state === "SCORING")
        return (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sg-muted">
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                {t("scoring")}
            </span>
        );
    return (
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                {t("couldntScore", { count: failed })}
            </span>
            {withRetry && (
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                        start(async () => {
                            const r = await retryScoring(interviewId).catch(() => ({ error: "notFound" as const }));
                            if ("ok" in r) router.refresh();
                            else toast.error(t("retryFailed"));
                        })
                    }
                    className={cn("inline-flex items-center gap-1 rounded-md font-bold underline", focusRing)}
                >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    {t("tryAgain")}
                </button>
            )}
        </span>
    );
}
