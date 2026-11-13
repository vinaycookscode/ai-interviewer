"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Lock, RotateCcw, Trash2 } from "lucide-react";
import { closeDrive, deleteDrive, reopenDrive } from "@/actions/drives";
import { outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Close early, reopen within a week, or delete a drive nobody was invited to (AIIN-165). */
export function DriveActions({ id, canClose, canReopen, canDelete }: { id: string; canClose: boolean; canReopen: boolean; canDelete: boolean }) {
    const t = useTranslations("Drives");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const run = (fn: () => Promise<{ ok: true } | { error: string }>, after?: () => void) =>
        startTransition(async () => {
            const r = await fn().catch(() => ({ error: "failed" }));
            if ("ok" in r) {
                after?.();
                router.refresh();
            } else toast.error(t("failed"));
        });
    const cls = cn(outlineButton, "h-10 text-sm");
    return (
        <>
            {canClose && (
                <button type="button" disabled={isPending} className={cls} onClick={() => confirm(t("closeConfirm")) && run(() => closeDrive(id))}>
                    <Lock className="size-4" aria-hidden="true" />
                    {t("close")}
                </button>
            )}
            {canReopen && (
                <button type="button" disabled={isPending} className={cls} onClick={() => run(() => reopenDrive(id))}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    {t("reopen")}
                </button>
            )}
            {canDelete && (
                <button type="button" disabled={isPending} className={cls} onClick={() => confirm(t("deleteConfirm")) && run(() => deleteDrive(id), () => router.push("/dashboard/drives"))}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t("delete")}
                </button>
            )}
        </>
    );
}
