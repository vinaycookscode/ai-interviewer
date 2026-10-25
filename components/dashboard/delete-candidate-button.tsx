"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteCandidateInterview } from "@/actions/candidate";
import { dangerButton, iconButton, outlineButton } from "@/components/jobs/employer-ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";

export function DeleteCandidateButton({ interviewId, candidateName }: { interviewId: string; candidateName?: string }) {
    const t = useTranslations("Employer.deleteCandidate");
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteCandidateInterview(interviewId);
            if (result.success) {
                toast.success(t("done"));
            } else {
                toast.error(result.error || t("failed"));
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger
                disabled={isPending}
                aria-label={candidateName ? t("triggerAria", { name: candidateName }) : t("trigger")}
                className={cn(iconButton, "text-sg-danger")}
            >
                <Trash2 className="size-4" aria-hidden="true" />
            </AlertDialogTrigger>
            <AlertDialogPanel title={t("title")} description={t("body")}>
                <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={dangerButton}>
                    {isPending ? t("deleting") : t("confirm")}
                </AlertDialogAction>
            </AlertDialogPanel>
        </AlertDialog>
    );
}
