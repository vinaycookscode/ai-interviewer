"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { submitDailyChallenge } from "@/actions/daily-challenge";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** The answer box for today's challenge (AIIN-99). */
export function ChallengeForm({ type, limit }: { type: string; limit: number }) {
    const t = useTranslations("Challenge");
    const router = useRouter();
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const tooLong = answer.length > limit;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim()) return setError(t("errors.empty"));
        if (tooLong) return setError(t("errors.tooLong", { limit }));
        setError(null);
        startTransition(async () => {
            const result = await submitDailyChallenge(answer).catch(() => ({ error: "failed" as const }));
            if ("error" in result) {
                setError(t(`errors.${result.error}`, { limit }));
                if (result.error === "alreadyAnswered") router.refresh();
                return;
            }
            router.refresh();
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
            <label htmlFor="ch-answer" className="text-sm font-semibold">
                {t("yourAnswer")}
            </label>
            <textarea
                id="ch-answer"
                rows={6}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={type === "HR" ? t("placeholderHr") : t("placeholderAptitude")}
                aria-invalid={!!error || tooLong}
                aria-describedby="ch-count ch-error"
                className={cn(
                    "w-full resize-y rounded-2xl border border-sg-field-border bg-sg-row px-4 py-3 text-base leading-6 placeholder:text-sg-muted/70 aria-invalid:border-sg-danger",
                    focusRing
                )}
            />
            <span id="ch-count" className={cn("text-[13px]", tooLong ? "font-semibold text-sg-danger" : "text-sg-muted")}>
                {t("counter", { count: answer.length, limit })}
            </span>
            <p id="ch-error" role="alert" className="text-[15px] font-semibold text-sg-danger empty:hidden">
                {error}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 pt-1">
                <button type="submit" disabled={isPending} className={cn(coralButton, "h-12 px-6 text-base")}>
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {isPending ? t("submitting") : t("submit")}
                </button>
                <span className="text-sm text-sg-muted">{t("oneADay")}</span>
            </div>
        </form>
    );
}
