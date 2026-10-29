"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { HiringDecision } from "@prisma/client";
import { setInterviewDecision } from "@/actions/decision";
import { DECISIONS, DECISION_ICONS, NOTE_LIMIT } from "@/lib/decision";
import { focusRing } from "@/components/soft-glass/classes";
import { field, inkButton, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export interface DecisionEvent {
    id: string;
    to: HiringDecision;
    note: string | null;
    /** null when the system decided */
    by: string | null;
    /** Already formatted in IST */
    when: string;
}

interface DecisionPanelProps {
    interviewId: string;
    current: HiringDecision;
    finished: boolean;
    history: DecisionEvent[];
}

/** Shortlist, hold or reject a finished interview, with a note and the history of changes (AIIN-157). */
export function DecisionPanel({ interviewId, current, finished, history }: DecisionPanelProps) {
    const t = useTranslations("Decision");
    const router = useRouter();
    const [choice, setChoice] = useState<HiringDecision>(current);
    const [note, setNote] = useState("");
    const [noteError, setNoteError] = useState(false);
    const [isPending, startTransition] = useTransition();
    const radios = useRef<(HTMLButtonElement | null)[]>([]);

    const tooLong = note.trim().length > NOTE_LIMIT;
    const unchanged = choice === current && !note.trim();

    // Arrow keys move the choice, as in a native radio group.
    const onKeyDown = (e: React.KeyboardEvent, index: number) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = (index + step + DECISIONS.length) % DECISIONS.length;
        setChoice(DECISIONS[next]);
        radios.current[next]?.focus();
    };

    const save = () => {
        if (tooLong) {
            setNoteError(true);
            document.getElementById("dc-note")?.focus();
            return;
        }
        startTransition(async () => {
            const result = await setInterviewDecision(interviewId, choice, note);
            if ("error" in result) {
                if (result.field === "note") setNoteError(true);
                toast.error(result.error ?? t("failed"));
                return;
            }
            setNote("");
            setNoteError(false);
            toast.success(t("saved"));
            router.refresh();
        });
    };

    const showError = noteError && tooLong;
    const length = note.trim().length;

    return (
        <section aria-labelledby="decision-title" className="sg-glass sg-shadow-lg flex flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
            <h2 id="decision-title" className={panelTitle}>
                {t("title")}
            </h2>
            {!finished && <p className="text-sg-muted">{t("locked")}</p>}

            <div role="radiogroup" aria-label={t("group")} aria-disabled={!finished} className="grid grid-cols-2 gap-2">
                {DECISIONS.map((d, i) => {
                    const Icon = DECISION_ICONS[d];
                    const on = choice === d;
                    return (
                        <button
                            key={d}
                            ref={(el) => {
                                radios.current[i] = el;
                            }}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            tabIndex={on ? 0 : -1}
                            disabled={!finished || isPending}
                            onClick={() => setChoice(d)}
                            onKeyDown={(e) => onKeyDown(e, i)}
                            className={cn(
                                "inline-flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 text-left text-[15px] font-bold disabled:opacity-50",
                                on ? "border-2 border-sg-ink bg-sg-glass-strong" : "border border-sg-field-border bg-sg-row hover:bg-sg-chip",
                                focusRing
                            )}
                        >
                            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                            {t(`options.${d}`)}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="dc-note" className="text-sm font-semibold">
                    {t("note")} <span className="font-medium text-sg-muted">{t("noteHint")}</span>
                </label>
                <textarea
                    id="dc-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={!finished || isPending}
                    aria-invalid={showError}
                    aria-describedby="dc-note-hint"
                    className={cn(field, "resize-y py-3", showError && "border-2 border-sg-danger", focusRing)}
                />
                <span
                    id="dc-note-hint"
                    aria-live="polite"
                    className={cn(tooLong ? "text-sm font-bold text-sg-danger" : "text-[13px] text-sg-muted")}
                >
                    {tooLong ? t("tooLong", { count: length, limit: NOTE_LIMIT }) : t("count", { count: length, limit: NOTE_LIMIT })}
                </span>
            </div>

            <button type="button" onClick={save} disabled={!finished || isPending || unchanged} className={cn(inkButton, "h-12 self-start")}>
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                {isPending ? t("saving") : t("save")}
            </button>

            <div className="flex flex-col gap-2.5 border-t border-sg-rule pt-4">
                <h3 className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("history")}</h3>
                {history.length === 0 ? (
                    <p className="text-sm text-sg-muted">{t("noHistory")}</p>
                ) : (
                    <ol className="flex flex-col gap-3">
                        {history.map((e) => {
                            const Icon = DECISION_ICONS[e.to];
                            return (
                                <li key={e.id} className="flex items-start gap-2.5">
                                    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <span className="flex min-w-0 flex-col">
                                        <span className="font-bold">
                                            {t(`states.${e.to}`)}{" "}
                                            <span className="font-medium text-sg-muted">{e.by ? t("by", { name: e.by }) : t("system")}</span>
                                        </span>
                                        <span className="text-[13px] leading-[18px] text-sg-muted">{e.when}</span>
                                        {e.note && <span className="mt-1 text-[15px] [overflow-wrap:anywhere]">“{e.note}”</span>}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </section>
    );
}
