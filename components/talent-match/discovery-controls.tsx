"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Search, X } from "lucide-react";
import { blockEmployer, searchEmployers, setDiscoverable, unblockEmployer } from "@/actions/discovery";
import { focusRing } from "@/components/soft-glass/classes";
import { field, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** The "Let employers find me" switch (AIIN-198). */
export function DiscoverableSwitch({ on, canTurnOn }: { on: boolean; canTurnOn: boolean }) {
    const t = useTranslations("Discover");
    const router = useRouter();
    const [value, setValue] = useState(on);
    const [isPending, startTransition] = useTransition();
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
                <h2 id="fm-title" className="font-display sg-soft text-[22px] leading-7 font-semibold">
                    {t("switch")}
                </h2>
                <span className="text-sg-muted">{value ? t("on") : t("off")}</span>
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                aria-labelledby="fm-title"
                disabled={isPending || (!value && !canTurnOn)}
                onClick={() => {
                    const next = !value;
                    setValue(next);
                    startTransition(async () => {
                        const r = await setDiscoverable(next).catch(() => ({ error: "failed" as const }));
                        if ("ok" in r) {
                            toast.success(next ? t("turnedOn") : t("turnedOff"));
                            router.refresh();
                        } else {
                            setValue(!next);
                            toast.error(r.error === "noFacts" ? t("needFacts") : t("failed"));
                        }
                    });
                }}
                className={cn("relative h-[34px] w-[60px] shrink-0 rounded-full transition-colors disabled:opacity-50", value ? "bg-sg-ink" : "bg-sg-field-border", focusRing)}
            >
                <span className={cn("absolute top-1 size-[26px] rounded-full bg-white shadow transition-[left]", value ? "left-[30px]" : "left-1")} />
            </button>
        </div>
    );
}

/** Employers blocked from seeing or inviting you, and a search to add one. */
export function BlockedEmployers({ blocked }: { blocked: { id: string; name: string }[] }) {
    const t = useTranslations("Discover");
    const router = useRouter();
    const [q, setQ] = useState("");
    const [found, setFound] = useState<{ id: string; name: string }[] | null>(null);
    const [isPending, startTransition] = useTransition();
    const act = (fn: () => Promise<{ ok: true } | { error: string }>, done: string) =>
        startTransition(async () => {
            const r = await fn().catch(() => ({ error: "failed" }));
            if ("ok" in r) {
                toast.success(done);
                setFound(null);
                setQ("");
                router.refresh();
            } else toast.error(t("failed"));
        });
    const ids = new Set(blocked.map((b) => b.id));
    return (
        <div className="flex flex-col gap-3">
            {blocked.length === 0 ? (
                <p className="text-sm text-sg-muted">{t("noBlocks")}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {blocked.map((b) => (
                        <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-sg-row px-4 py-2.5">
                            <span className="inline-flex min-w-0 items-center gap-2 font-bold break-words">
                                <Ban className="size-4 shrink-0" aria-hidden="true" />
                                {b.name}
                            </span>
                            <button type="button" disabled={isPending} onClick={() => act(() => unblockEmployer(b.id), t("unblocked"))} className={cn(outlineButton, "h-9 text-sm")}>
                                {t("unblock")}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    startTransition(async () => setFound(await searchEmployers(q).catch(() => [])));
                }}
                className="flex flex-wrap gap-2"
            >
                <label htmlFor="fm-block" className="sr-only">
                    {t("searchLabel")}
                </label>
                <span className="relative min-w-0 flex-[1_1_180px]">
                    <Search className="pointer-events-none absolute top-[15px] left-4 size-4 text-sg-muted" aria-hidden="true" />
                    <input id="fm-block" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchLabel")} className={cn(field, "h-12 w-full pl-11")} />
                </span>
                <button type="submit" disabled={isPending || q.trim().length < 2} className={cn(outlineButton, "h-12 text-[15px]")}>
                    {t("find")}
                </button>
            </form>
            {found && (
                <ul aria-live="polite" className="flex flex-col gap-2">
                    {found.length === 0 && <li className="text-sm text-sg-muted">{t("noneFound")}</li>}
                    {found.map((e) => (
                        <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-sg-row px-4 py-2.5">
                            <span className="min-w-0 font-bold break-words">{e.name}</span>
                            {ids.has(e.id) ? (
                                <span className="text-sm text-sg-muted">{t("alreadyBlocked")}</span>
                            ) : (
                                <button type="button" disabled={isPending} onClick={() => act(() => blockEmployer(e.id), t("blocked", { name: e.name }))} className={cn(outlineButton, "h-9 text-sm")}>
                                    <X className="size-4" aria-hidden="true" />
                                    {t("block")}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
