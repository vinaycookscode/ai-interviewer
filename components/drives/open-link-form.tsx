"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { rotateOpenLink, saveOpenLink } from "@/actions/drives";
import { focusRing } from "@/components/soft-glass/classes";
import { field, fieldLabel, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Open link settings (AIIN-168), from the approved "Open link" artboards. */
export function OpenLinkForm({ driveId, url, initial, joined }: { driveId: string; url: string | null; initial: { on: boolean; domains: string; cap: string }; joined: number }) {
    const t = useTranslations("OpenLink");
    const router = useRouter();
    const [v, setV] = useState(initial);
    const [isPending, start] = useTransition();
    const save = (next = v) =>
        start(async () => {
            const r = await saveOpenLink(driveId, next).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) {
                toast.success(t("saved"));
                router.refresh();
            } else toast.error(r.error === "invalid" ? t("invalid") : t("failed"));
        });
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
                <span className="flex min-w-0 flex-col">
                    <span id="ol-on-l" className="font-semibold">
                        {t("on")}
                    </span>
                    <span id="ol-on-h" className="text-[13px] text-sg-muted">
                        {t("onHint")}
                    </span>
                </span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={v.on}
                    aria-labelledby="ol-on-l"
                    aria-describedby="ol-on-h"
                    disabled={isPending}
                    onClick={() => {
                        const next = { ...v, on: !v.on };
                        setV(next);
                        save(next);
                    }}
                    className={cn("relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors", v.on ? "border-sg-ink bg-sg-ink" : "border-sg-field-border bg-sg-chip", focusRing)}
                >
                    <span className={cn("absolute size-6 rounded-full bg-sg-bg shadow transition-transform", v.on ? "translate-x-[26px]" : "translate-x-[2px]")} />
                </button>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="ol-url" className={fieldLabel}>
                    {t("link")}
                </label>
                {url ? (
                    <div className="flex flex-wrap gap-2">
                        <input id="ol-url" readOnly value={url} className={cn(field, "h-12 min-w-0 flex-[1_1_220px]")} onFocus={(e) => e.target.select()} />
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(url).then(() => toast.success(t("copied")))}
                            className={cn(inkButton, "h-12 px-5")}
                        >
                            <Copy className="size-4" aria-hidden="true" />
                            {t("copy")}
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-sg-muted">{t("notYet")}</p>
                )}
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    save();
                }}
                className="flex flex-col gap-4"
            >
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="ol-dom" className={fieldLabel}>
                        {t("domains")}
                    </label>
                    <input id="ol-dom" value={v.domains} placeholder="dit.edu.in, sahyadri.ac.in" onChange={(e) => setV({ ...v, domains: e.target.value })} aria-describedby="ol-dom-h" className={cn(field, "h-12")} />
                    <span id="ol-dom-h" className="text-[13px] text-sg-muted">
                        {t("domainsHint")}
                    </span>
                </div>
                <div className="flex max-w-[260px] flex-col gap-1.5">
                    <label htmlFor="ol-cap" className={fieldLabel}>
                        {t("cap")}
                    </label>
                    <input id="ol-cap" inputMode="numeric" value={v.cap} onChange={(e) => setV({ ...v, cap: e.target.value })} aria-describedby="ol-cap-h" className={cn(field, "h-12")} />
                    <span id="ol-cap-h" className="text-[13px] text-sg-muted">
                        {t("capHint", { count: joined })}
                    </span>
                </div>
                <button type="submit" disabled={isPending} className={cn(outlineButton, "h-11 self-start px-5")}>
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {t("save")}
                </button>
            </form>
            {url && (
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                            confirm(t("rotateConfirm")) &&
                            start(async () => {
                                const r = await rotateOpenLink(driveId).catch(() => ({ error: "notFound" as const }));
                                if ("ok" in r) router.refresh();
                                else toast.error(t("failed"));
                            })
                        }
                        className={cn(outlineButton, "h-10 text-sm")}
                    >
                        <RefreshCw className="size-4" aria-hidden="true" />
                        {t("rotate")}
                    </button>
                    <span className="text-[13px] text-sg-muted">{t("rotateHint")}</span>
                </div>
            )}
        </div>
    );
}
