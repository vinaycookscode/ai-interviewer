"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { bulkSetInterviewDecision, retryDecisionEmails, type BulkResult } from "@/actions/bulk-decision";
import { usePicked } from "@/components/jobs/candidate-selection";
import { DECISION_ICONS } from "@/lib/decision";
import { decisionEmail, emailsFor } from "@/lib/decision-email";
import { focusRing } from "@/components/soft-glass/classes";
import { field, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogPanel } from "@/components/interviews/sg-dialog";
import { cn } from "@/lib/utils";

type Choice = "SHORTLISTED" | "ON_HOLD" | "REJECTED";
const CHOICES: Choice[] = ["SHORTLISTED", "ON_HOLD", "REJECTED"];
type Done = Extract<BulkResult, { ok: true }>;

/** Shortlist, Hold and Reject in the selection bar, with the approved confirm and result dialog (AIIN-159). */
export function BulkDecision({ jobTitle, company }: { jobTitle: string; company: string }) {
    const t = useTranslations("Shortlist.bulk");
    const router = useRouter();
    const { jobId, picked, clear, all, matching } = usePicked();
    const [choice, setChoice] = useState<Choice | null>(null);
    const [note, setNote] = useState("");
    const [notify, setNotify] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Done | null>(null);
    const [retried, setRetried] = useState(false);
    const [isPending, startTransition] = useTransition();

    const names = [...picked.values()];
    const count = all ? matching.total : picked.size;

    const open = (c: Choice) => {
        setChoice(c);
        setNote("");
        setNotify(false);
        setError(null);
        setResult(null);
        setRetried(false);
    };
    const close = () => {
        if (isPending) return;
        if (result) {
            clear();
            router.refresh();
        }
        setChoice(null);
    };

    const confirm = () =>
        choice &&
        startTransition(async () => {
            const r = await bulkSetInterviewDecision({
                jobId,
                ...(all ? { query: matching.query } : { ids: [...picked.keys()] }),
                decision: choice,
                note,
                notify: notify && emailsFor(choice),
            }).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) setResult(r);
            else setError(r.error === "limit" ? t("limit") : t("failed"));
        });

    const retry = () =>
        result &&
        startTransition(async () => {
            const r = await retryDecisionEmails(
                jobId,
                result.notEmailed.map((n) => n.id)
            ).catch(() => null);
            if (r && "ok" in r) {
                setResult({ ...result, emailed: result.emailed + result.notEmailed.length - r.notEmailed.length, notEmailed: r.notEmailed });
                setRetried(r.notEmailed.length === 0);
            }
        });

    const preview = choice && emailsFor(choice) ? decisionEmail(choice, { name: names[0] ?? null }, jobTitle, { name: company, person: null }) : null;
    const pill = "inline-flex h-10 items-center gap-1.5 rounded-full bg-sg-ink-foreground px-4 text-sm font-bold whitespace-nowrap text-sg-ink hover:opacity-90";

    return (
        <>
            <div role="group" aria-label={t("actions")} className="flex flex-wrap gap-2">
                {CHOICES.map((c) => {
                    const Icon = DECISION_ICONS[c];
                    return (
                        <button key={c} type="button" onClick={() => open(c)} className={cn(pill, focusRing)}>
                            <Icon className="size-4" aria-hidden="true" />
                            {t(c)}
                        </button>
                    );
                })}
            </div>
            <Dialog open={choice !== null} onOpenChange={(o) => !o && close()}>
                {choice && (
                    <DialogPanel title={result ? t("resultTitle", { count: result.updated }) : t(`title.${choice}`, { count })} closeLabel={t("close")} className="max-w-[480px]">
                        {!result ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    confirm();
                                }}
                                className="flex flex-col gap-4"
                            >
                                <p>
                                    {all
                                        ? t("everyoneMatching")
                                        : names.length > 3
                                          ? t("namesMore", { names: names.slice(0, 3).join(", "), more: names.length - 3 })
                                          : t("names", { names: names.join(", ").replace(/, ([^,]*)$/, " and $1") })}
                                </p>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="bulk-note" className="text-sm font-semibold">
                                        {t("note")} <span className="font-medium text-sg-muted">{t("noteHint")}</span>
                                    </label>
                                    <textarea id="bulk-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} className={cn(field, "resize-y py-3")} />
                                </div>
                                {emailsFor(choice) ? (
                                    <>
                                        <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-sg-chip px-3.5 py-3">
                                            <input type="checkbox" role="switch" checked={notify} onChange={(e) => setNotify(e.target.checked)} className={cn("mt-1 size-5 shrink-0 accent-sg-ink", focusRing)} />
                                            <span className="flex flex-col">
                                                <span className="font-bold">{t("email")}</span>
                                                {notify && <span className="text-[13px] text-sg-muted">{t("emailCount", { count })}</span>}
                                            </span>
                                        </label>
                                        {notify && preview && (
                                            <div className="flex flex-col gap-1 rounded-[18px] bg-sg-row px-3.5 py-3 text-sm">
                                                <span className="text-[13px] font-bold text-sg-muted">{t("preview", { company })}</span>
                                                <span className="font-bold">{preview.subject}</span>
                                                <span>{preview.lines.join(" ")}</span>
                                                <span className="text-sg-muted">{preview.signature}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-sg-muted">{t("noEmail")}</p>
                                )}
                                {error && (
                                    <p role="alert" className="text-sm font-bold text-sg-danger">
                                        {error}
                                    </p>
                                )}
                                <div className="flex flex-wrap justify-end gap-2.5">
                                    <button type="button" onClick={close} className={cn(outlineButton, "h-12 px-5 text-base")}>
                                        {t("cancel")}
                                    </button>
                                    <button type="submit" disabled={isPending} className={cn(inkButton, "h-12 text-base")}>
                                        {isPending && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
                                        {isPending ? t("working") : t(`confirm.${choice}`, { count })}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div role="status" className="flex flex-col gap-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        [result.updated, t(`tileDecision.${choice}`)],
                                        [result.emailed, t("tileEmailed")],
                                        [result.unfinished.length + result.concerns.length, t("tileSkipped")],
                                    ].map(([n, label]) => (
                                        <span key={String(label)} className="flex flex-col rounded-[18px] bg-sg-row px-3.5 py-3">
                                            <span className="font-display sg-soft text-[26px] font-semibold">{n}</span>
                                            <span className="text-[13px] font-bold text-sg-muted">{label}</span>
                                        </span>
                                    ))}
                                </div>
                                {result.unfinished.map((p) => (
                                    <p key={p.id} className="text-sm">
                                        {t("unfinished", { name: p.name })}
                                    </p>
                                ))}
                                {result.concerns.map((p) => (
                                    <p key={p.id} className="text-sm">
                                        {t("concerns", { name: p.name })}
                                    </p>
                                ))}
                                {result.unchanged > 0 && <p className="text-sm text-sg-muted">{t("unchanged", { count: result.unchanged })}</p>}
                                {result.notEmailed.length > 0 && (
                                    <div className="flex flex-col items-start gap-2 rounded-[18px] bg-sg-danger/10 px-3.5 py-3">
                                        {result.notEmailed.map((p) => (
                                            <p key={p.id} className="text-sm">
                                                {t("notEmailed", { email: p.email })}
                                            </p>
                                        ))}
                                        <button type="button" onClick={retry} disabled={isPending} className={cn(outlineButton, "h-10 text-sm")}>
                                            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                            {t("retry")}
                                        </button>
                                    </div>
                                )}
                                {retried && <p className="text-sm font-bold text-sg-success">{t("retried")}</p>}
                                <button type="button" onClick={close} className={cn(inkButton, "h-12 self-end text-base")}>
                                    {t("done")}
                                </button>
                            </div>
                        )}
                    </DialogPanel>
                )}
            </Dialog>
        </>
    );
}
