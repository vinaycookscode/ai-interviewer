"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { setApplicationEmails, withdrawMyApplication } from "@/actions/my-applications";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";
import { focusRing } from "@/components/soft-glass/classes";
import { dangerButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Withdraw, after a confirm (AIIN-197 AC2). */
export function WithdrawApplication({ id, job }: { id: string; job: string }) {
    const t = useTranslations("MyApplications");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    return (
        <AlertDialog>
            <AlertDialogTrigger className={cn(outlineButton, "h-10 text-sm")}>
                <XCircle className="size-4" aria-hidden="true" />
                {t("withdraw")}
            </AlertDialogTrigger>
            <AlertDialogPanel title={t("withdrawTitle", { job })} description={t("withdrawBody")}>
                <div className="flex flex-wrap justify-end gap-2">
                    <AlertDialogCancel className={cn(outlineButton, "h-11 text-[15px]")}>{t("keep")}</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isPending}
                        onClick={(e) => {
                            e.preventDefault();
                            startTransition(async () => {
                                const r = await withdrawMyApplication(id).catch(() => ({ error: "failed" as const }));
                                if ("ok" in r) {
                                    toast.success(t("withdrawn"));
                                    router.refresh();
                                } else toast.error(t("failed"));
                            });
                        }}
                        className={cn(dangerButton, "h-11 text-[15px]")}
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {t("confirmWithdraw")}
                    </AlertDialogAction>
                </div>
            </AlertDialogPanel>
        </AlertDialog>
    );
}

/** "Email me when an application changes", off until they turn it on. */
export function ApplicationEmailsSwitch({ on }: { on: boolean }) {
    const t = useTranslations("MyApplications");
    const router = useRouter();
    const [value, setValue] = useState(on);
    const [isPending, startTransition] = useTransition();
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
                <span className="font-bold">{t("emails")}</span>
                <span className="text-sm text-sg-muted">{t("emailsBody")}</span>
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                aria-label={t("emails")}
                disabled={isPending}
                onClick={() => {
                    const next = !value;
                    setValue(next);
                    startTransition(async () => {
                        const r = await setApplicationEmails(next).catch(() => ({ error: "failed" as const }));
                        if (!("ok" in r)) {
                            setValue(!next);
                            toast.error(t("failed"));
                        } else router.refresh();
                    });
                }}
                className={cn("relative h-[34px] w-[60px] shrink-0 rounded-full transition-colors", value ? "bg-sg-ink" : "bg-sg-field-border", focusRing)}
            >
                <span className={cn("absolute top-1 size-[26px] rounded-full bg-white shadow transition-[left]", value ? "left-[30px]" : "left-1")} />
            </button>
        </label>
    );
}
