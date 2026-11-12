"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { HiringDecision } from "@prisma/client";
import { setInterviewDecision } from "@/actions/decision";
import { field, outlineButton, dangerButton } from "@/components/jobs/employer-ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

const DECISIONS: HiringDecision[] = ["UNDECIDED", "SHORTLISTED", "ON_HOLD", "REJECTED"];

/** Change a candidate's decision from the compare page (AIIN-160 AC6), with the same rules as the report. */
export function CompareDecision({ interviewId, name, current }: { interviewId: string; name: string; current: HiringDecision }) {
    const t = useTranslations("Shortlist");
    const router = useRouter();
    const [value, setValue] = useState(current);
    const [confirming, setConfirming] = useState<HiringDecision | null>(null);
    const [isPending, startTransition] = useTransition();

    const save = (decision: HiringDecision, confirmed = false) =>
        startTransition(async () => {
            const result = await setInterviewDecision(interviewId, decision, undefined, confirmed).catch(() => ({ error: "failed" }));
            // Shortlisting with unreviewed strong concerns asks first (AIIN-178)
            if ("confirm" in result) {
                setConfirming(decision);
                return;
            }
            if ("error" in result) {
                setValue(current);
                toast.error(t("compare.failed"));
                return;
            }
            toast.success(t("compare.saved"));
            router.refresh();
        });

    return (
        <>
            <label className="flex flex-col gap-1.5">
                <span className="text-[13px] leading-[18px] font-bold">{t("compare.decision")}</span>
                <select
                    value={value}
                    disabled={isPending}
                    aria-label={t("compare.decisionFor", { name })}
                    onChange={(e) => {
                        const next = e.target.value as HiringDecision;
                        setValue(next);
                        save(next);
                    }}
                    className={cn(field, "h-12")}
                >
                    {DECISIONS.map((d) => (
                        <option key={d} value={d}>
                            {t(`decisions.${d}`)}
                        </option>
                    ))}
                </select>
            </label>
            <AlertDialog
                open={confirming !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirming(null);
                        setValue(current);
                    }
                }}
            >
                <AlertDialogPanel title={t("compare.confirmTitle")} description={t("compare.confirmBody")}>
                    <AlertDialogCancel className={cn(outlineButton, "h-12 px-5")}>{t("compare.confirmCancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(dangerButton)}
                        onClick={() => {
                            const decision = confirming;
                            setConfirming(null);
                            if (decision) save(decision, true);
                        }}
                    >
                        {t("compare.confirmGo")}
                    </AlertDialogAction>
                </AlertDialogPanel>
            </AlertDialog>
        </>
    );
}
