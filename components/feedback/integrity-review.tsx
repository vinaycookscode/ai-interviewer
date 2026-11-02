"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleCheck, Loader2, OctagonAlert, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { IntegrityReviewOutcome } from "@prisma/client";
import { reviewIntegrity } from "@/actions/integrity-review";
import { NOTE_LIMIT } from "@/lib/decision";
import { focusRing } from "@/components/soft-glass/classes";
import { field, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

export interface ReviewEntry {
    id: string;
    outcome: IntegrityReviewOutcome;
    note: string | null;
    /** Who reviewed, or null if their account is gone */
    by: string | null;
    /** Already formatted in IST */
    when: string;
}

interface IntegrityReviewProps {
    interviewId: string;
    /** The verdict and its reasons, already in words */
    verdict: string;
    reasons: string[];
    /** Newest first; the first is the current review */
    history: ReviewEntry[];
}

const OUTCOMES = ["NO_ISSUE", "CONFIRMED"] as const;
const ICONS = { NO_ISSUE: CircleCheck, CONFIRMED: OctagonAlert } satisfies Record<IntegrityReviewOutcome, unknown>;

/** The current review of a flagged verdict, and the dialog to review it: No issue, or Confirmed with a note (AIIN-179). */
export function IntegrityReview({ interviewId, verdict, reasons, history }: IntegrityReviewProps) {
    const t = useTranslations("Integrity.review");
    const router = useRouter();
    const current = history[0] ?? null;
    const [open, setOpen] = useState(false);
    const [choice, setChoice] = useState<IntegrityReviewOutcome>(current?.outcome ?? "NO_ISSUE");
    const [note, setNote] = useState("");
    const [noteError, setNoteError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const radios = useRef<(HTMLButtonElement | null)[]>([]);

    const onKeyDown = (e: React.KeyboardEvent, index: number) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = (index + step + OUTCOMES.length) % OUTCOMES.length;
        setChoice(OUTCOMES[next]);
        radios.current[next]?.focus();
    };

    const save = () => {
        const trimmed = note.trim();
        // Confirming a concern needs a reason, checked here and again on the server
        if (choice === "CONFIRMED" && !trimmed) {
            setNoteError(t("noteNeeded"));
            document.getElementById("rv-note")?.focus();
            return;
        }
        if (trimmed.length > NOTE_LIMIT) {
            setNoteError(t("tooLong", { limit: NOTE_LIMIT }));
            document.getElementById("rv-note")?.focus();
            return;
        }
        startTransition(async () => {
            const result = await reviewIntegrity(interviewId, choice, trimmed);
            if ("error" in result) {
                if (result.field === "note") setNoteError(result.error);
                else toast.error(result.error);
                return;
            }
            setOpen(false);
            setNote("");
            setNoteError(null);
            toast.success(t("saved"));
            router.refresh();
        });
    };

    const CurrentIcon = current ? ICONS[current.outcome] : ShieldAlert;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sg-row px-3.5 py-3">
            <p className="flex min-w-0 items-start gap-2.5">
                <CurrentIcon className={cn("mt-0.5 size-[18px] shrink-0", current?.outcome === "CONFIRMED" && "text-sg-danger")} aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{current ? t(`current.${current.outcome}`) : t("notReviewed")}</span>
                    {current && (
                        <span className="text-[13px] leading-[18px] text-sg-muted">{current.by ? t("byWhen", { name: current.by, when: current.when }) : current.when}</span>
                    )}
                </span>
            </p>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (next) {
                        setChoice(current?.outcome ?? "NO_ISSUE");
                        setNoteError(null);
                    }
                }}
            >
                <button type="button" onClick={() => setOpen(true)} className={cn(outlineButton, "h-11 text-[15px]")}>
                    {current ? t("change") : t("open")}
                </button>
                <DialogPanel title={t("title")} closeLabel={t("close")} className="max-w-[480px]">
                    <div className="flex flex-col gap-0.5 rounded-2xl bg-sg-row px-3.5 py-3">
                        <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("verdict")}</span>
                        <span className="font-semibold">{verdict}</span>
                        {reasons.length > 0 && <span className="text-sm text-sg-muted">{reasons.join(" · ")}</span>}
                    </div>

                    <div role="radiogroup" aria-label={t("group")} className="grid grid-cols-2 gap-2">
                        {OUTCOMES.map((o, i) => {
                            const Icon = ICONS[o];
                            const on = choice === o;
                            return (
                                <button
                                    key={o}
                                    ref={(el) => {
                                        radios.current[i] = el;
                                    }}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    tabIndex={on ? 0 : -1}
                                    onClick={() => {
                                        setChoice(o);
                                        setNoteError(null);
                                    }}
                                    onKeyDown={(e) => onKeyDown(e, i)}
                                    className={cn(
                                        "inline-flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 text-left text-[15px] font-bold",
                                        on ? "border-2 border-sg-ink bg-(--sg-glass-strong)" : "border border-sg-field-border bg-sg-row hover:bg-sg-chip",
                                        focusRing
                                    )}
                                >
                                    <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                                    {t(`options.${o}`)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="rv-note" className="text-sm font-semibold">
                            {t("note")} <span className="font-medium text-sg-muted">{choice === "CONFIRMED" ? t("noteRequired") : t("noteOptional")}</span>
                        </label>
                        <textarea
                            id="rv-note"
                            rows={3}
                            value={note}
                            onChange={(e) => {
                                setNote(e.target.value);
                                setNoteError(null);
                            }}
                            aria-invalid={!!noteError}
                            aria-describedby={noteError ? "rv-note-error" : undefined}
                            className={cn(field, "resize-y py-3", noteError && "border-2 border-sg-danger", focusRing)}
                        />
                        {noteError && (
                            <span id="rv-note-error" role="alert" className="text-sm font-bold text-sg-danger">
                                {noteError}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        <button type="button" onClick={save} disabled={isPending} className={cn(inkButton, "h-12 px-5")}>
                            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {t("save")}
                        </button>
                        <DialogClose className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</DialogClose>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("history")}</span>
                        {history.length === 0 ? (
                            <p className="border-t border-sg-rule py-2.5 text-sm text-sg-muted">{t("noHistory")}</p>
                        ) : (
                            <ol>
                                {history.map((h) => {
                                    const Icon = ICONS[h.outcome];
                                    return (
                                        <li key={h.id} className="flex gap-2.5 border-t border-sg-rule py-2.5 text-sm leading-[21px]">
                                            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                            <span className="flex min-w-0 flex-col">
                                                <span>
                                                    <strong>{t(`options.${h.outcome}`)}</strong> {h.by ? t("by", { name: h.by }) : null}
                                                </span>
                                                <span className="text-sg-muted">{h.when}</span>
                                                {h.note && <span className="mt-0.5 [overflow-wrap:anywhere]">“{h.note}”</span>}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>
                </DialogPanel>
            </Dialog>
        </div>
    );
}
