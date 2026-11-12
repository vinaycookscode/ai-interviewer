"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { inviteToApply } from "@/actions/invitations";
import { INVITE_MESSAGE_MAX } from "@/lib/invitations";
import { Dialog, DialogClose, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { field, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** "Invite to apply" on a match card (AIIN-201): an optional message, within the month's allowance. */
export function InviteButton({ jobId, candidateProfileId, code, left }: { jobId: string; candidateProfileId: string; code: string; left: number | null }) {
    const t = useTranslations("Matches.invite");
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const none = left === 0;
    return (
        <Dialog open={open} onOpenChange={(o) => (setOpen(o), setError(null))}>
            <DialogTrigger disabled={none} className={cn(outlineButton, "h-10 text-sm")}>
                <Send className="size-4" aria-hidden="true" />
                {t("open")}
            </DialogTrigger>
            <DialogPanel
                title={t("title", { code })}
                description={left === null ? t("unlimited") : t("left", { count: left })}
                closeLabel={t("close")}
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    document.getElementById("inv-msg")?.focus();
                }}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        startTransition(async () => {
                            setError(null);
                            const r = await inviteToApply({ jobId, candidateProfileId, message }).catch(() => ({ error: "notFound" as const }));
                            if ("ok" in r) {
                                toast.success(t("sent", { code }));
                                setOpen(false);
                                router.refresh();
                            } else setError(t(`errors.${r.error}`));
                        });
                    }}
                    className="flex flex-col gap-3"
                >
                    <label htmlFor="inv-msg" className="text-sm font-semibold">
                        {t("message")}
                    </label>
                    <textarea
                        id="inv-msg"
                        rows={3}
                        maxLength={INVITE_MESSAGE_MAX}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("placeholder")}
                        className={cn(field, "resize-y py-3")}
                    />
                    <p className="text-[13px] text-sg-muted">{t("hint")}</p>
                    {error && (
                        <p role="alert" className="text-sm font-bold text-sg-danger">
                            {error}
                        </p>
                    )}
                    <span className="flex flex-wrap justify-end gap-2">
                        <DialogClose className={cn(outlineButton, "h-11 text-[15px]")}>{t("cancel")}</DialogClose>
                        <button type="submit" disabled={isPending} className={cn(inkButton, "h-11 text-[15px]")}>
                            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                            {t("send")}
                        </button>
                    </span>
                </form>
            </DialogPanel>
        </Dialog>
    );
}
