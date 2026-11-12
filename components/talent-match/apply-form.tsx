"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { applyToJob } from "@/actions/apply";
import { NOTE_MAX } from "@/lib/applications";
import { coralButton } from "@/components/soft-glass/classes";
import { field } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Apply to a job directly (AIIN-202): a phone (required, AIIN-204) and an optional note. Shares your name with this one employer. */
export function ApplyForm({ jobId, company, phone }: { jobId: string; company: string; phone: string }) {
    const t = useTranslations("Jobs");
    const router = useRouter();
    const [values, setValues] = useState({ phone, note: "" });
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                    setError(null);
                    const r = await applyToJob({ jobId, ...values }).catch(() => ({ error: "notFound" as const }));
                    if ("ok" in r) {
                        toast.success(t("appliedToast", { company }));
                        router.refresh();
                    } else setError(t(`errors.${r.error}`));
                });
            }}
            className="flex flex-col gap-3"
        >
            <span className="flex flex-col gap-1.5">
                <label htmlFor="ap-phone" className="text-sm font-semibold">
                    {t("phone")}
                </label>
                <input
                    id="ap-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    aria-required="true"
                    value={values.phone}
                    onChange={(e) => setValues({ ...values, phone: e.target.value })}
                    aria-describedby="ap-phone-hint"
                    className={cn(field, "h-12")}
                />
                <span id="ap-phone-hint" className="text-[13px] text-sg-muted">
                    {t("phoneHint")}
                </span>
            </span>
            <span className="flex flex-col gap-1.5">
                <label htmlFor="ap-note" className="text-sm font-semibold">
                    {t("note")}
                </label>
                <textarea id="ap-note" rows={4} maxLength={NOTE_MAX} value={values.note} onChange={(e) => setValues({ ...values, note: e.target.value })} className={cn(field, "resize-y py-3")} />
            </span>
            <p className="text-[13px] text-sg-muted">{t("consent", { company })}</p>
            {error && (
                <p role="alert" className="text-sm font-bold text-sg-danger">
                    {error}
                </p>
            )}
            <button type="submit" disabled={isPending} className={cn(coralButton, "h-12 justify-center text-base")}>
                {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Send className="size-[18px]" aria-hidden="true" />}
                {t("apply")}
            </button>
        </form>
    );
}
