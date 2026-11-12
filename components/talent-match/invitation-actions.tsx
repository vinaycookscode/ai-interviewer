"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Loader2, X } from "lucide-react";
import { respondToInvitation } from "@/actions/invitations";
import { NOTE_MAX } from "@/lib/applications";
import { coralButton } from "@/components/soft-glass/classes";
import { field, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Accept (phone required, note optional) or say Not interested to one invitation (AIIN-201). */
export function InvitationActions({ id, jobId, company, phone, primary }: { id: string; jobId: string; company: string; phone: string; primary: boolean }) {
    const t = useTranslations("Invitations");
    const router = useRouter();
    const [accepting, setAccepting] = useState(false);
    const [values, setValues] = useState({ phone, note: "" });
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const respond = (accept: boolean) =>
        startTransition(async () => {
            setError(null);
            const r = await respondToInvitation({ id, accept, ...values }).catch(() => ({ error: "notFound" as const }));
            if ("ok" in r) {
                toast.success(accept ? t("accepted", { company }) : t("declined"));
                router.refresh();
            } else setError(t(`errors.${r.error}`));
        });

    if (accepting)
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    respond(true);
                }}
                className="flex w-full flex-col gap-3 rounded-[18px] bg-sg-row p-4"
            >
                <span className="flex flex-col gap-1.5">
                    <label htmlFor={`iv-phone-${id}`} className="text-sm font-semibold">
                        {t("phone")}
                    </label>
                    <input
                        id={`iv-phone-${id}`}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        aria-required="true"
                        value={values.phone}
                        onChange={(e) => setValues({ ...values, phone: e.target.value })}
                        autoFocus
                        className={cn(field, "h-12")}
                    />
                </span>
                <span className="flex flex-col gap-1.5">
                    <label htmlFor={`iv-note-${id}`} className="text-sm font-semibold">
                        {t("note")}
                    </label>
                    <textarea
                        id={`iv-note-${id}`}
                        rows={3}
                        maxLength={NOTE_MAX}
                        value={values.note}
                        onChange={(e) => setValues({ ...values, note: e.target.value })}
                        className={cn(field, "resize-y py-3")}
                    />
                </span>
                <p className="text-[13px] text-sg-muted">{t("consent", { company })}</p>
                {error && (
                    <p role="alert" className="text-sm font-bold text-sg-danger">
                        {error}
                    </p>
                )}
                <span className="flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={() => setAccepting(false)} className={cn(outlineButton, "h-11 text-sm")}>
                        {t("cancel")}
                    </button>
                    <button type="submit" disabled={isPending} className={cn(primary ? coralButton : inkButton, "h-11 px-5 text-sm")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {t("confirmApply")}
                    </button>
                </span>
            </form>
        );

    return (
        <span className="flex w-full flex-col items-end gap-2">
            <span className="flex flex-wrap justify-end gap-2">
                <button type="button" disabled={isPending} onClick={() => respond(false)} className={cn(outlineButton, "h-10 text-sm")}>
                    <X className="size-4" aria-hidden="true" />
                    {t("notInterested")}
                </button>
                <Link href={`/candidate/jobs/${jobId}`} className={cn(outlineButton, "h-10 text-sm")}>
                    {t("seeJob")}
                </Link>
                <button type="button" onClick={() => setAccepting(true)} className={cn(primary ? coralButton : inkButton, "h-10 px-5 text-sm")}>
                    <ArrowRight className="size-4" aria-hidden="true" />
                    {t("apply")}
                </button>
            </span>
            {error && (
                <p role="alert" className="text-sm font-bold text-sg-danger">
                    {error}
                </p>
            )}
        </span>
    );
}
