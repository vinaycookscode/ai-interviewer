"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteJob } from "@/actions/job";
import { dangerButton, outlineButton } from "@/components/jobs/employer-ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";

export function DeleteJobButton({ jobId }: { jobId: string }) {
    const t = useTranslations("Employer.deleteJob");
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        setIsDeleting(true);
        try {
            const { archived } = await deleteJob(jobId);
            toast.success(t(archived ? "archived" : "deleted"));
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            console.error("Failed to delete job", error);
            toast.error(t("failed"));
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger disabled={isDeleting} className={cn(outlineButton, "h-10 self-start border-transparent text-sm text-sg-danger")}>
                {isDeleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                {t("trigger")}
            </AlertDialogTrigger>
            <AlertDialogPanel title={t("title")} description={t("body")}>
                <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={dangerButton}>
                    {t("confirm")}
                </AlertDialogAction>
            </AlertDialogPanel>
        </AlertDialog>
    );
}
