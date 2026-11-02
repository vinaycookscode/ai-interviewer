"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, Loader2, Lock } from "lucide-react";
import { getBestSolutions } from "@/actions/best-solutions";
import { SOLUTION_LANGUAGES, type SolutionLanguage } from "@/lib/problems/best-solutions";
import type { BestSolution } from "@/lib/problems/best-solutions-server";
import { focusRing } from "@/components/soft-glass/classes";
import { field, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

const NAMES: Record<SolutionLanguage, string> = { javascript: "JavaScript", python: "Python", java: "Java", cpp: "C++" };
const chip = "inline-flex h-7 items-center gap-1.5 rounded-full bg-sg-chip px-2.5 text-[13px] font-bold whitespace-nowrap";

type State = { kind: "loading" } | { kind: "ready"; solutions: BestSolution[] } | { kind: "error"; reason: "unavailable" | "none" | "notFound" };

/**
 * Two or three ways to solve the problem, each checked against its tests (AIIN-221, approved Best solutions artboards).
 * Locked until the candidate has submitted an attempt; `language` is the one they're writing in.
 */
export function BestSolutions({ questionId, unlocked, language }: { questionId: string; unlocked: boolean; language: string }) {
    const t = useTranslations("CompanyPrep.solutions");
    const [state, setState] = useState<State>({ kind: "loading" });
    const [active, setActive] = useState(0);
    const [lang, setLang] = useState<SolutionLanguage>((SOLUTION_LANGUAGES as readonly string[]).includes(language) ? (language as SolutionLanguage) : "javascript");
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (!unlocked) return;
        let cancelled = false;
        setState({ kind: "loading" });
        getBestSolutions(questionId)
            .catch(() => ({ error: "unavailable" as const }))
            .then((result) => {
                if (cancelled) return;
                if ("solutions" in result) {
                    setState({ kind: "ready", solutions: result.solutions });
                    // Open on the last (usually the best) approach
                    setActive(result.solutions.length - 1);
                } else setState({ kind: "error", reason: result.error === "locked" ? "notFound" : result.error });
            });
        return () => {
            cancelled = true;
        };
    }, [questionId, unlocked]);

    if (!unlocked) {
        return (
            <section aria-labelledby="bs-title" className="flex items-start gap-3 rounded-[18px] bg-sg-row p-4">
                <Lock className="mt-0.5 size-5 shrink-0 text-sg-muted" aria-hidden="true" />
                <span className="flex flex-col gap-1">
                    <span id="bs-title" className="font-bold">
                        {t("title")}
                    </span>
                    <span className="text-sg-muted">{t("locked")}</span>
                </span>
            </section>
        );
    }

    const solutions = state.kind === "ready" ? state.solutions : [];
    const current = solutions[active];
    const available = current ? SOLUTION_LANGUAGES.filter((l) => current.code[l]) : [];
    const shown: SolutionLanguage | undefined = available.includes(lang) ? lang : available[0];

    const onTabKey = (e: React.KeyboardEvent, i: number) => {
        const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = (i + step + solutions.length) % solutions.length;
        setActive(next);
        tabs.current[next]?.focus();
    };

    return (
        <section aria-labelledby="bs-title" className="flex flex-col gap-3.5 rounded-[18px] bg-sg-row p-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h2 id="bs-title" className="font-display sg-soft text-xl font-semibold leading-[26px]">
                    {t("title")}
                </h2>
                {current && available.length > 0 && (
                    <label className="flex items-center gap-2">
                        <span className="sr-only">{t("language")}</span>
                        <select value={shown} onChange={(e) => setLang(e.target.value as SolutionLanguage)} className={cn(field, "h-10 w-auto rounded-full px-3 text-sm font-semibold", focusRing)}>
                            {available.map((l) => (
                                <option key={l} value={l}>
                                    {NAMES[l]}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {state.kind === "loading" && (
                <p role="status" className="flex items-center gap-2.5 text-sg-muted">
                    <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                    {t("loading")}
                </p>
            )}

            {state.kind === "error" && (
                <div className="flex flex-col items-start gap-2.5">
                    <p className="text-sg-muted">{t(`errors.${state.reason}`)}</p>
                    {state.reason === "unavailable" && (
                        <button
                            type="button"
                            onClick={() => {
                                setState({ kind: "loading" });
                                getBestSolutions(questionId)
                                    .catch(() => ({ error: "unavailable" as const }))
                                    .then((r) => setState("solutions" in r ? { kind: "ready", solutions: r.solutions } : { kind: "error", reason: r.error === "locked" ? "notFound" : r.error }));
                            }}
                            className={cn(outlineButton, "h-10 text-sm")}
                        >
                            {t("retry")}
                        </button>
                    )}
                </div>
            )}

            {current && (
                <>
                    <div role="tablist" aria-label={t("approaches")} className="flex flex-wrap gap-1.5">
                        {solutions.map((s, i) => (
                            <button
                                key={s.name}
                                ref={(el) => {
                                    tabs.current[i] = el;
                                }}
                                type="button"
                                role="tab"
                                id={`bs-tab-${i}`}
                                aria-selected={i === active}
                                aria-controls="bs-panel"
                                tabIndex={i === active ? 0 : -1}
                                onClick={() => setActive(i)}
                                onKeyDown={(e) => onTabKey(e, i)}
                                className={cn(
                                    "flex min-h-11 flex-col items-start rounded-[14px] px-3.5 py-1.5 text-left text-sm font-bold",
                                    i === active ? "border-2 border-sg-ink bg-(--sg-glass-strong)" : "border border-sg-field-border hover:bg-sg-chip",
                                    focusRing
                                )}
                            >
                                <span>{s.name}</span>
                                <span className="font-mono font-semibold opacity-80">{s.time}</span>
                            </button>
                        ))}
                    </div>
                    <div role="tabpanel" id="bs-panel" aria-labelledby={`bs-tab-${active}`} className="flex flex-col gap-3">
                        {current.explanation && <p>{current.explanation}</p>}
                        <div className="flex flex-wrap gap-2">
                            <span className={chip}>
                                {t("time")} <span className="font-mono">{current.time}</span>
                            </span>
                            <span className={chip}>
                                {t("space")} <span className="font-mono">{current.space}</span>
                            </span>
                            <span className={cn(chip, "text-sg-success")}>
                                <CircleCheck className="size-3.5" aria-hidden="true" />
                                {t("passes")}
                            </span>
                        </div>
                        {shown && (
                            <pre className="overflow-x-auto rounded-[14px] bg-(--sg-glass-strong) px-4 py-3.5 font-mono text-sm leading-[22px]">
                                <code>{current.code[shown]}</code>
                            </pre>
                        )}
                        <span className="text-[13px] text-sg-muted">{t("note")}</span>
                    </div>
                </>
            )}
        </section>
    );
}
