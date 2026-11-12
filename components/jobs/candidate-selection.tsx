"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";
import { COMPARE_MAX, COMPARE_MIN } from "@/lib/compare";

// Picking candidates on a job's ranked list for an action on several at once (AIIN-160, AIIN-159), from the approved
// Shortlist artboard: a checkbox per row and a dark bar at the bottom while anything is picked.

interface Selection {
    jobId: string;
    /** Picked candidates, id to display name, in the order picked. */
    picked: Map<string, string>;
    toggle: (id: string, name: string) => void;
    setAll: (rows: { id: string; name: string }[], on: boolean) => void;
    clear: () => void;
}

const SelectionContext = createContext<Selection | null>(null);

function useSelection(): Selection {
    const s = useContext(SelectionContext);
    if (!s) throw new Error("Candidate selection used outside its provider");
    return s;
}

export function CandidateSelection({ jobId, children }: { jobId: string; children: React.ReactNode }) {
    const [picked, setPicked] = useState<Map<string, string>>(new Map());
    const value: Selection = {
        jobId,
        picked,
        toggle: (id, name) =>
            setPicked((prev) => {
                const next = new Map(prev);
                if (next.has(id)) next.delete(id);
                else next.set(id, name);
                return next;
            }),
        setAll: (rows, on) =>
            setPicked((prev) => {
                const next = new Map(prev);
                for (const r of rows) {
                    if (on) next.set(r.id, r.name);
                    else next.delete(r.id);
                }
                return next;
            }),
        clear: () => setPicked(new Map()),
    };
    return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

const box = cn("size-5 shrink-0 cursor-pointer accent-sg-ink", focusRing);

export function PickCandidate({ id, name }: { id: string; name: string }) {
    const t = useTranslations("Shortlist.select");
    const { picked, toggle } = useSelection();
    return <input type="checkbox" checked={picked.has(id)} onChange={() => toggle(id, name)} aria-label={t("one", { name })} className={box} />;
}

export function PickAll({ rows }: { rows: { id: string; name: string }[] }) {
    const t = useTranslations("Shortlist.select");
    const { picked, setAll } = useSelection();
    const ref = useRef<HTMLInputElement>(null);
    const count = rows.filter((r) => picked.has(r.id)).length;
    const all = rows.length > 0 && count === rows.length;
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = count > 0 && !all;
    }, [count, all]);
    return <input ref={ref} type="checkbox" checked={all} onChange={() => setAll(rows, !all)} aria-label={t("all")} className={box} />;
}

/** The bar along the bottom while candidates are picked: how many, the actions, and clear. */
export function SelectionBar({ children }: { children?: React.ReactNode }) {
    const t = useTranslations("Shortlist.select");
    const { jobId, picked, clear } = useSelection();
    if (picked.size === 0) return null;

    const ids = [...picked.keys()];
    const canCompare = ids.length >= COMPARE_MIN && ids.length <= COMPARE_MAX;
    const pill = "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold whitespace-nowrap";

    return (
        <div
            role="region"
            aria-label={t("bar")}
            className="sticky bottom-40 z-20 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[22px] bg-sg-ink px-4 py-3 text-sg-ink-foreground shadow-[var(--sg-shadow-lg)] lg:bottom-4"
        >
            <span className="font-bold" aria-live="polite">
                {t("count", { count: picked.size })}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
                {canCompare ? (
                    <Link
                        href={`/dashboard/jobs/${jobId}/compare?ids=${ids.join(",")}`}
                        className={cn(pill, "border border-sg-ink-foreground/40 hover:bg-sg-ink-foreground/10", focusRing)}
                    >
                        {t("compare")}
                    </Link>
                ) : (
                    <span className="flex items-center gap-2">
                        <button type="button" disabled aria-describedby="compare-hint" className={cn(pill, "border border-sg-ink-foreground/25 opacity-50")}>
                            {t("compare")}
                        </button>
                        <span id="compare-hint" className="text-[13px] opacity-80">
                            {t("compareHint")}
                        </span>
                    </span>
                )}
                {children}
                <button type="button" onClick={clear} aria-label={t("clear")} className={cn("inline-flex size-10 items-center justify-center rounded-full hover:bg-sg-ink-foreground/10", focusRing)}>
                    <X className="size-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/** The picked candidates, for actions in the bar (AIIN-159). */
export function usePicked() {
    const { picked, clear } = useSelection();
    return { picked, clear };
}
