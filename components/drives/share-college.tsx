"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, EyeOff, Loader2, Send } from "lucide-react";
import { createCollegeShare, revokeCollegeShare } from "@/actions/college-share";
import { focusRing } from "@/components/soft-glass/classes";
import { field, glassButton, inkButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

export interface CollegeShareRow {
    id: string;
    sentTo: string | null;
    showShortlisted: boolean;
    expiresAt: string;
    openCount: number;
    lastOpenedAt: string | null;
}

const short = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const shortTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** "Share" on a college's row and its dialog (AIIN-173), from the approved "Share with a placement officer" artboards. */
export function ShareCollege(props: {
    collegeId: string;
    college: string;
    students: number;
    email: string;
    until: string;
    minUntil: string;
    maxUntil: string;
    shares: CollegeShareRow[];
}) {
    const t = useTranslations("CollegeShare.dialog");
    const router = useRouter();
    const [showShortlisted, setShowShortlisted] = useState(false);
    const [email, setEmail] = useState(props.email);
    const [until, setUntil] = useState(props.until);
    const [made, setMade] = useState<{ url: string; sentTo: string | null; copied: boolean } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const copy = async (url: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return true;
        } catch {
            // No clipboard access: the link is shown selected below, to copy by hand
            requestAnimationFrame(() => (document.getElementById(`cs-url-${props.collegeId}`) as HTMLInputElement | null)?.select());
            return false;
        }
    };

    const create = (send: boolean) =>
        startTransition(async () => {
            setError(null);
            if (send && !email.trim()) return setError(t("emailRequired"));
            const r = await createCollegeShare({ collegeId: props.collegeId, showShortlisted, until, email: send ? email : undefined }).catch(() => ({
                error: "failed" as const,
            }));
            if ("ok" in r) {
                setMade({ url: r.url, sentTo: r.sentTo, copied: !send && (await copy(r.url)) });
                router.refresh();
            } else setError(t(r.error === "email" ? "emailInvalid" : r.error === "invalid" ? "untilInvalid" : "failed"));
        });

    const turnOff = (id: string) =>
        startTransition(async () => {
            const r = await revokeCollegeShare(id).catch(() => ({ ok: false }));
            if (r.ok) router.refresh();
            else toast.error(t("failed"));
        });

    const ids = { switch: `cs-sl-${props.collegeId}`, email: `cs-email-${props.collegeId}`, until: `cs-until-${props.collegeId}`, err: `cs-err-${props.collegeId}` };

    return (
        <Dialog onOpenChange={(open) => !open && (setMade(null), setError(null))}>
            <DialogTrigger className={cn("rounded-md px-1 text-sm font-bold underline underline-offset-4", focusRing)} aria-label={t("openAria", { college: props.college })}>
                {t("open")}
            </DialogTrigger>
            <DialogPanel title={t("title")} description={t("subtitle", { college: props.college, count: props.students })} closeLabel={t("close")} className="max-w-[520px]">
                <p className="flex gap-2.5 rounded-[18px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                    <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{t("what")}</span>
                </p>
                <div className="flex items-center justify-between gap-4">
                    <span className="flex min-w-0 flex-col">
                        <label htmlFor={ids.switch} className="font-semibold">
                            {t("showShortlisted")}
                        </label>
                        <span id={`${ids.switch}-hint`} className="text-[13px] text-sg-muted">
                            {t("showShortlistedHint")}
                        </span>
                    </span>
                    <button
                        id={ids.switch}
                        type="button"
                        role="switch"
                        aria-checked={showShortlisted}
                        aria-describedby={`${ids.switch}-hint`}
                        onClick={() => setShowShortlisted((v) => !v)}
                        className={cn(
                            "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors",
                            showShortlisted ? "border-sg-ink bg-sg-ink" : "border-sg-field-border bg-sg-chip",
                            focusRing,
                        )}
                    >
                        <span className={cn("absolute size-6 rounded-full bg-sg-bg shadow transition-transform", showShortlisted ? "translate-x-[26px]" : "translate-x-[2px]")} />
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor={ids.email} className="text-sm font-semibold">
                        {t("email")}
                    </label>
                    <input
                        id={ids.email}
                        type="email"
                        value={email}
                        maxLength={254}
                        autoComplete="off"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        aria-describedby={`${ids.email}-hint`}
                        className={cn(field, "h-12")}
                    />
                    <span id={`${ids.email}-hint`} className="text-[13px] text-sg-muted">
                        {t("emailHint")}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor={ids.until} className="text-sm font-semibold">
                        {t("until")}
                    </label>
                    <input
                        id={ids.until}
                        type="date"
                        value={until}
                        min={props.minUntil}
                        max={props.maxUntil}
                        onChange={(e) => setUntil(e.target.value)}
                        aria-describedby={`${ids.until}-hint`}
                        className={cn(field, "h-12")}
                    />
                    <span id={`${ids.until}-hint`} className="text-[13px] text-sg-muted">
                        {t("untilHint")}
                    </span>
                </div>
                {error && (
                    <p id={ids.err} role="alert" className="text-sm font-bold text-sg-danger">
                        {error}
                    </p>
                )}
                <div className="flex flex-wrap gap-2.5">
                    <button type="button" disabled={isPending} onClick={() => create(false)} className={cn(glassButton, "h-12 text-base")}>
                        {copied ? <Check className="size-[18px]" aria-hidden="true" /> : <Copy className="size-[18px]" aria-hidden="true" />}
                        {copied ? t("copied") : t("copy")}
                    </button>
                    <button type="button" disabled={isPending} onClick={() => create(true)} className={cn(inkButton, "h-12 text-base")}>
                        {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Send className="size-[18px]" aria-hidden="true" />}
                        {t("send")}
                    </button>
                </div>

                {made && (
                    <div role="status" className="flex flex-col gap-2 rounded-[18px] bg-sg-row px-3.5 py-3">
                        <span className="text-sm font-bold">{made.sentTo ? t("sent", { email: made.sentTo }) : t(made.copied ? "created" : "createdCopy")}</span>
                        <span className="flex gap-2">
                            <label htmlFor={`cs-url-${props.collegeId}`} className="sr-only">
                                {t("link")}
                            </label>
                            <input
                                id={`cs-url-${props.collegeId}`}
                                readOnly
                                value={made.url}
                                onFocus={(e) => e.currentTarget.select()}
                                className={cn(field, "h-11 min-w-0 flex-1 font-mono text-sm")}
                            />
                        </span>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-sg-muted">{t("active")}</span>
                    {props.shares.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noActive")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {props.shares.map((s) => (
                                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-sg-row px-3.5 py-3">
                                    <span className="flex min-w-0 flex-col">
                                        <span className="font-bold break-all">{s.sentTo ? t("sentToLabel", { email: s.sentTo }) : t("copiedLabel")}</span>
                                        <span className="text-[13px] text-sg-muted">
                                            {t("expires", { date: short.format(new Date(s.expiresAt)) })}
                                            {s.showShortlisted ? ` · ${t("withShortlist")}` : ""} ·{" "}
                                            {s.lastOpenedAt ? t("opened", { count: s.openCount, when: shortTime.format(new Date(s.lastOpenedAt)) }) : t("notOpened")}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => turnOff(s.id)}
                                        disabled={isPending}
                                        className={cn("h-9 rounded-full border border-sg-danger px-3.5 text-sm font-semibold text-sg-danger hover:bg-sg-danger/10", focusRing)}
                                    >
                                        {t("turnOff")}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogPanel>
        </Dialog>
    );
}
