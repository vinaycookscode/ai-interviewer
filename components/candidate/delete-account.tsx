"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { deleteMyAccount } from "@/actions/account";
import { focusRing } from "@/components/soft-glass/classes";
import { dangerButton, field, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

/** The "Delete your account" section on the profile, and its confirmation (AIIN-58, approved Delete account artboards). */
export function DeleteAccount({ email }: { email: string }) {
    const t = useTranslations("DeleteAccount");
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const matches = typed.trim().toLowerCase() === email.toLowerCase();

    const confirm = () => {
        if (!matches) return;
        setError(null);
        startTransition(async () => {
            // On success the action signs out and moves to /account-deleted, so only an error comes back
            const result = await deleteMyAccount(typed);
            if (result?.error) setError(t(`errors.${result.error}`));
        });
    };

    return (
        <section aria-labelledby="del-title" className={panel}>
            <h2 id="del-title" className={panelTitle}>
                {t("title")}
            </h2>
            <p>{t("body")}</p>
            <p className="text-[15px] leading-[23px] text-sg-muted">{t("employers")}</p>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (isPending) return;
                    setOpen(next);
                    setTyped("");
                    setError(null);
                }}
            >
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={cn(
                        "inline-flex h-12 items-center gap-2 self-start rounded-full border-2 border-sg-danger px-5 font-bold text-sg-danger hover:bg-sg-danger/10",
                        focusRing
                    )}
                >
                    <Trash2 className="size-[18px]" aria-hidden="true" />
                    {t("open")}
                </button>
                <DialogPanel title={t("confirmTitle")} description={t("confirmBody")} closeLabel={t("close")}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            confirm();
                        }}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-2">
                            <label htmlFor="dl-email" className="text-sm font-semibold">
                                {t("emailLabel", { email })}
                            </label>
                            <input
                                id="dl-email"
                                type="email"
                                autoComplete="off"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                disabled={isPending}
                                aria-invalid={!!error}
                                aria-describedby={error ? "dl-error" : undefined}
                                className={cn(field, focusRing)}
                            />
                            {error && (
                                <span id="dl-error" role="alert" className="text-sm font-bold text-sg-danger">
                                    {error}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {/* Locked until the email matches (AIIN-58) */}
                            <button type="submit" disabled={!matches || isPending} className={dangerButton}>
                                {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Trash2 className="size-[18px]" aria-hidden="true" />}
                                {isPending ? t("deleting") : t("confirm")}
                            </button>
                            <DialogClose disabled={isPending} className={cn(outlineButton, "h-12 px-5 text-base")}>
                                {t("cancel")}
                            </DialogClose>
                        </div>
                    </form>
                </DialogPanel>
            </Dialog>
        </section>
    );
}
