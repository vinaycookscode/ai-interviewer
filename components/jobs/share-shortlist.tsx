"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { createShortlistShare, revokeShortlistShare } from "@/actions/shortlist-share";
import { SHARE_DAYS, type ShareDays } from "@/lib/share-days";
import { focusRing } from "@/components/soft-glass/classes";
import { field, glassButton, inkButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

export interface ActiveShare {
    id: string;
    label: string;
    expiresAt: string;
    openCount: number;
    lastOpenedAt: string | null;
}

const short = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const shortTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** "Share shortlist" and its dialog (AIIN-161), from the approved Share dialog artboards. */
export function ShareShortlist({ jobId, shortlisted, onHold, shares }: { jobId: string; shortlisted: number; onHold: number; shares: ActiveShare[] }) {
    const t = useTranslations("Shortlist.share");
    const router = useRouter();
    const [label, setLabel] = useState("");
    const [includeOnHold, setIncludeOnHold] = useState(false);
    const [days, setDays] = useState<ShareDays>(7);
    const [url, setUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const create = () =>
        startTransition(async () => {
            setError(null);
            const r = await createShortlistShare({ jobId, label, includeOnHold, days }).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) {
                setUrl(r.url);
                setLabel("");
                router.refresh();
            } else setError(r.error === "invalid" ? t("labelRequired") : t("failed"));
        });

    const copy = async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.getElementById("share-url") as HTMLInputElement | null;
            input?.focus();
            input?.select();
            toast.error(t("copyFailed"));
        }
    };

    const turnOff = (id: string) =>
        startTransition(async () => {
            const r = await revokeShortlistShare(id).catch(() => ({ ok: false }));
            if (r.ok) router.refresh();
            else toast.error(t("failed"));
        });

    return (
        <Dialog onOpenChange={(open) => !open && (setUrl(null), setError(null))}>
            <DialogTrigger className={cn(glassButton, "h-10 text-sm")}>
                <Link2 className="size-4" aria-hidden="true" />
                {t("open")}
            </DialogTrigger>
            <DialogPanel
                title={t("title")}
                description={t("body")}
                closeLabel={t("close")}
                className="max-w-[500px]"
                // Straight to who it's for, not the close button
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    document.getElementById("share-label")?.focus();
                }}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        create();
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <label htmlFor="share-label" className="text-sm font-semibold">
                            {t("label")}
                        </label>
                        <input
                            id="share-label"
                            value={label}
                            maxLength={80}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder={t("labelPlaceholder")}
                            aria-invalid={!!error}
                            aria-describedby={error ? "share-error" : undefined}
                            className={cn(field, "h-12")}
                        />
                    </div>
                    <fieldset className="flex flex-col gap-2">
                        <legend className="mb-2 text-sm font-semibold">{t("include")}</legend>
                        <label className="flex items-center gap-2.5">
                            <input
                                type="radio"
                                name="share-include"
                                checked={!includeOnHold}
                                onChange={() => setIncludeOnHold(false)}
                                className={cn("size-4 accent-sg-ink", focusRing)}
                            />
                            {t("onlyShortlisted", { count: shortlisted })}
                        </label>
                        <label className="flex items-center gap-2.5">
                            <input
                                type="radio"
                                name="share-include"
                                checked={includeOnHold}
                                onChange={() => setIncludeOnHold(true)}
                                className={cn("size-4 accent-sg-ink", focusRing)}
                            />
                            {t("withOnHold", { count: shortlisted + onHold })}
                        </label>
                    </fieldset>
                    <div role="radiogroup" aria-label={t("duration")} className="flex flex-col gap-2">
                        <span className="text-sm font-semibold" aria-hidden="true">
                            {t("duration")}
                        </span>
                        <span className="flex gap-1 rounded-full bg-sg-chip p-1">
                            {SHARE_DAYS.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    role="radio"
                                    aria-checked={days === d}
                                    onClick={() => setDays(d)}
                                    className={cn(
                                        "h-9 flex-1 rounded-full text-sm font-semibold",
                                        days === d && "bg-(--sg-glass-strong) shadow-[var(--sg-shadow)]",
                                        focusRing,
                                    )}
                                >
                                    {t("days", { count: d })}
                                </button>
                            ))}
                        </span>
                    </div>
                    {error && (
                        <p id="share-error" role="alert" className="text-sm font-bold text-sg-danger">
                            {error}
                        </p>
                    )}
                    <button type="submit" disabled={isPending} className={cn(inkButton, "h-12 self-start text-base")}>
                        {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Link2 className="size-[18px]" aria-hidden="true" />}
                        {isPending ? t("creating") : t("create")}
                    </button>
                </form>

                {url && (
                    <div role="status" className="flex flex-col gap-2 rounded-[18px] bg-sg-lavender-soft px-3.5 py-3">
                        <span className="text-sm font-bold">{t("created")}</span>
                        <span className="flex gap-2">
                            <label htmlFor="share-url" className="sr-only">
                                {t("link")}
                            </label>
                            <input
                                id="share-url"
                                readOnly
                                value={url}
                                onFocus={(e) => e.currentTarget.select()}
                                className={cn(field, "h-11 min-w-0 flex-1 font-mono text-sm")}
                            />
                            <button type="button" onClick={copy} className={cn(inkButton, "h-11 text-sm")}>
                                {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                                {copied ? t("copied") : t("copy")}
                            </button>
                        </span>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-sg-muted">{t("active")}</span>
                    {shares.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noActive")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {shares.map((s) => (
                                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-sg-row px-3.5 py-3">
                                    <span className="flex min-w-0 flex-col">
                                        <span className="font-bold break-words">{t("forLabel", { label: s.label })}</span>
                                        <span className="text-[13px] text-sg-muted">
                                            {t("expires", { date: short.format(new Date(s.expiresAt)) })} ·{" "}
                                            {s.lastOpenedAt
                                                ? t("opened", { count: s.openCount, when: shortTime.format(new Date(s.lastOpenedAt)) })
                                                : t("notOpened")}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => turnOff(s.id)}
                                        disabled={isPending}
                                        aria-label={t("turnOffAria", { label: s.label })}
                                        className={cn(
                                            "h-9 rounded-full border border-sg-danger px-3.5 text-sm font-semibold text-sg-danger hover:bg-sg-danger/10",
                                            focusRing,
                                        )}
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
