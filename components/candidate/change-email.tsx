"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2, Mail } from "lucide-react";
import { requestEmailChange } from "@/actions/email-change";
import { field, fieldLabel, glassButton, inkButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

/** "Change" beside the email, and its dialog (AIIN-227), from the approved ChangeEmail boards. */
export function ChangeEmail({ email }: { email: string }) {
    const t = useTranslations("Profile.changeEmail");
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const reset = () => {
        setNewEmail("");
        setPassword("");
        setSentTo(null);
        setError(null);
    };

    const send = (e: React.FormEvent) => {
        e.preventDefault();
        // The dialog sits inside the profile's form in React's tree: don't submit that one too
        e.stopPropagation();
        startTransition(async () => {
            setError(null);
            const r = await requestEmailChange({ email: newEmail, password }).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) {
                setSentTo(r.email);
                setPassword("");
                router.refresh();
            } else setError(t(`errors.${r.error}`));
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) reset();
            }}
        >
            <DialogTrigger className={cn(glassButton, "h-12 shrink-0 px-[18px] text-[15px]")}>{t("open")}</DialogTrigger>
            <DialogPanel title={sentTo ? t("sentTitle") : t("title")} closeLabel={t("close")} className="max-w-[480px]">
                {sentTo ? (
                    <div role="status" className="flex flex-col gap-3">
                        <p>{t.rich("sentBody", { email: sentTo, b: (c) => <strong className="break-all">{c}</strong> })}</p>
                        <p className="flex gap-2.5 rounded-2xl bg-sg-row px-4 py-3 text-sm">
                            <Mail className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                            <span className="[overflow-wrap:anywhere]">{t("sentNote", { email })}</span>
                        </p>
                        <DialogClose className={cn(inkButton, "h-12 self-start px-[22px]")}>{t("done")}</DialogClose>
                    </div>
                ) : (
                    <>
                        <p className="text-sg-muted">{t.rich("intro", { email, b: (c) => <strong className="break-all text-sg-text">{c}</strong> })}</p>
                        <form onSubmit={send} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="ce-new" className={fieldLabel}>
                                    {t("newEmail")}
                                </label>
                                <input id="ce-new" type="email" required autoComplete="email" maxLength={254} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={cn(field, "h-12")} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="ce-pw" className={fieldLabel}>
                                    {t("password")}
                                </label>
                                <input
                                    id="ce-pw"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-describedby="ce-pw-hint"
                                    className={cn(field, "h-12")}
                                />
                                <span id="ce-pw-hint" className="text-[13px] text-sg-muted">
                                    {t("passwordHint")}
                                </span>
                            </div>
                            {error && (
                                <div role="alert" className="flex items-start gap-2.5 rounded-2xl bg-sg-danger/10 px-4 py-3 text-sm font-semibold text-sg-danger">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2.5">
                                <button type="submit" disabled={isPending} className={cn(inkButton, "h-12 px-[22px]")}>
                                    {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Mail className="size-[18px]" aria-hidden="true" />}
                                    {t("send")}
                                </button>
                                <DialogClose className={cn(glassButton, "h-12 px-[22px]")}>{t("cancel")}</DialogClose>
                            </div>
                        </form>
                    </>
                )}
            </DialogPanel>
        </Dialog>
    );
}
