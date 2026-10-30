"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { resetNonPayingSubscribers } from "@/actions/admin-subscription";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";
import { dangerButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Moves paid-plan accounts with no valid payment back to Free, after a confirmation (AIIN-138). */
export function ResetSubscribersButton() {
    const t = useTranslations("Admin.subscriptions");
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [moved, setMoved] = useState<number | null>(null);

    const run = () =>
        startTransition(async () => {
            try {
                const result = await resetNonPayingSubscribers();
                if (!result.success) throw new Error(result.error);
                setMoved(result.resetCount ?? 0);
                router.refresh();
            } catch {
                toast.error(t("downgradeFailed"));
            }
        });

    return (
        <section aria-labelledby="downgrade-title" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] border border-dashed border-sg-field-border p-4 sm:p-5">
            <span className="flex min-w-0 flex-[1_1_280px] flex-col">
                <span id="downgrade-title" className="font-bold">
                    {t("downgrade")}
                </span>
                <span className="text-sm text-sg-muted">{t("downgradeNote")}</span>
                {moved !== null && (
                    <span role="status" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold">
                        <CheckCircle2 className="size-4 text-sg-lavender-ink" aria-hidden="true" />
                        {t("downgraded", { count: moved })}
                    </span>
                )}
            </span>
            <AlertDialog>
                <AlertDialogTrigger disabled={pending} className={cn(outlineButton, "h-10 text-sm")}>
                    {t("check")}
                </AlertDialogTrigger>
                <AlertDialogPanel title={t("downgradeTitle")} description={t("downgradeBody")}>
                    <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={run} className={dangerButton}>
                        {t("confirmDowngrade")}
                    </AlertDialogAction>
                </AlertDialogPanel>
            </AlertDialog>
        </section>
    );
}
