"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelSubscription } from "@/actions/subscription";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";
import { focusRing } from "@/components/soft-glass/classes";
import { dangerButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Cancels at the end of the paid period, after a confirmation that says what changes. */
export function CancelSubscriptionButton({ planName, until }: { planName: string; until: string }) {
    const t = useTranslations("Subscription.page");
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const cancel = async () => {
        setBusy(true);
        try {
            const result = await cancelSubscription();
            if (result.success) {
                toast.success(t("cancelled"));
                router.refresh();
            } else {
                toast.error(t("cancelFailed"));
            }
        } catch {
            toast.error(t("cancelFailed"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger disabled={busy} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold text-sg-danger hover:bg-sg-danger/10", focusRing)}>
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("cancel")}
            </AlertDialogTrigger>
            <AlertDialogPanel
                title={t("cancelTitle", { plan: planName })}
                description={`${t("cancelBody", { plan: planName, date: until })} ${t("cancelKeep")}`}
            >
                <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("keep", { plan: planName })}</AlertDialogCancel>
                <AlertDialogAction onClick={cancel} className={dangerButton}>
                    {t("cancel")}
                </AlertDialogAction>
            </AlertDialogPanel>
        </AlertDialog>
    );
}
