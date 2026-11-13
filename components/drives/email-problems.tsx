"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MailX, Send } from "lucide-react";
import { resendDriveEmails } from "@/actions/drives";
import { outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Emails that didn't arrive, with "Resend" for one or all (AIIN-167). */
export function EmailProblems({ driveId, rows }: { driveId: string; rows: { driveCandidateId: string | null; to: string; bounced: boolean }[] }) {
    const t = useTranslations("Drives");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const resend = (driveCandidateId?: string) =>
        startTransition(async () => {
            const r = await resendDriveEmails(driveId, driveCandidateId).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) {
                toast.success(t("resent", { count: r.count }));
                router.refresh();
            } else toast.error(t("failed"));
        });
    return (
        <div className="flex flex-col gap-2">
            <button type="button" disabled={isPending} onClick={() => resend()} className={cn(outlineButton, "h-10 self-start text-sm")}>
                <Send className="size-4" aria-hidden="true" />
                {t("resendAll", { count: rows.length })}
            </button>
            <ul className="flex flex-col gap-2">
                {rows.map((r, i) => (
                    <li key={`${r.driveCandidateId}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[18px] bg-sg-row px-4 py-3">
                        <MailX className="size-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-[1_1_180px] break-all">{r.to}</span>
                        <span className="text-[13px] font-semibold text-sg-danger">{r.bounced ? t("emailBounced") : t("emailFailed")}</span>
                        {r.driveCandidateId && (
                            <button type="button" disabled={isPending} onClick={() => resend(r.driveCandidateId!)} className={cn(outlineButton, "h-9 px-3 text-sm")}>
                                {t("resend")}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
