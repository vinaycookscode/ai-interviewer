"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Loader2, PauseCircle, PlayCircle, Plus, XCircle } from "lucide-react";
import { addApplicationNote, moveApplication, setApplicationHold } from "@/actions/applications";
import { NOTE_MAX, type Stage } from "@/lib/applications";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Move to the next stage (the one coral action), hold, not moving forward with a reason, or another stage (AIIN-195). */
export function ApplicationMove({
    id,
    next,
    onHold,
    closed,
    others,
}: {
    id: string;
    next: { stage: Stage; label: string } | null;
    onHold: boolean;
    closed: boolean;
    others: { stage: Stage; label: string }[];
}) {
    const t = useTranslations("Applications");
    const router = useRouter();
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [other, setOther] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const run = (fn: () => Promise<{ ok: true } | { error: string }>) =>
        startTransition(async () => {
            setError(null);
            const r = await fn().catch(() => ({ error: "failed" }));
            if ("ok" in r) {
                setRejecting(false);
                setReason("");
                setOther("");
                router.refresh();
            } else if (r.error === "reasonRequired") setError(t("reasonRequired"));
            else toast.error(t("failed"));
        });
    const wide = "h-12 w-full justify-center text-[15px]";

    return (
        <div className="flex flex-col gap-2">
            {closed && <p className="text-sm text-sg-muted">{t("closed")}</p>}
            {next && (
                <button type="button" disabled={isPending} onClick={() => run(() => moveApplication(id, next.stage))} className={cn(coralButton, wide)}>
                    {isPending ? (
                        <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
                    ) : (
                        <ArrowRight className="size-[18px]" aria-hidden="true" />
                    )}
                    {next.label}
                </button>
            )}
            {!closed && (
                <button type="button" disabled={isPending} onClick={() => run(() => setApplicationHold(id, !onHold))} className={cn(outlineButton, wide)}>
                    {onHold ? <PlayCircle className="size-4" aria-hidden="true" /> : <PauseCircle className="size-4" aria-hidden="true" />}
                    {onHold ? t("unhold") : t("hold")}
                </button>
            )}
            {!closed &&
                (rejecting ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            run(() => moveApplication(id, "REJECTED", reason));
                        }}
                        className="flex flex-col gap-2 rounded-[18px] bg-sg-row p-3.5"
                    >
                        <label htmlFor="ap-reason" className="text-sm font-semibold">
                            {t("reasonLabel")}
                        </label>
                        <textarea
                            id="ap-reason"
                            rows={3}
                            maxLength={NOTE_MAX}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            aria-invalid={!!error}
                            aria-describedby={error ? "ap-reason-error" : "ap-reason-note"}
                            autoFocus
                            className={cn(field, "resize-y py-3")}
                        />
                        <p id="ap-reason-note" className="text-[13px] text-sg-muted">
                            {t("rejectNote")}
                        </p>
                        {error && (
                            <p id="ap-reason-error" role="alert" className="text-sm font-bold text-sg-danger">
                                {error}
                            </p>
                        )}
                        <span className="flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={() => setRejecting(false)} className={cn(outlineButton, "h-10 text-sm")}>
                                {t("cancel")}
                            </button>
                            <button type="submit" disabled={isPending} className={cn(inkButton, "h-10 text-sm")}>
                                {t("confirmReject")}
                            </button>
                        </span>
                    </form>
                ) : (
                    <button type="button" onClick={() => setRejecting(true)} className={cn(outlineButton, wide)}>
                        <XCircle className="size-4" aria-hidden="true" />
                        {t("reject")}
                    </button>
                ))}
            {others.length > 0 && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (other) run(() => moveApplication(id, other));
                    }}
                    className="flex flex-wrap items-end gap-2"
                >
                    <span className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
                        <label htmlFor="ap-other" className="text-sm font-semibold">
                            {t("otherStage")}
                        </label>
                        <select id="ap-other" value={other} onChange={(e) => setOther(e.target.value)} className={cn(field, "h-11")}>
                            <option value="">{t("choose")}</option>
                            {others.map((o) => (
                                <option key={o.stage} value={o.stage}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </span>
                    <button type="submit" disabled={!other || isPending} className={cn(outlineButton, "h-11 text-sm")}>
                        {t("move")}
                    </button>
                </form>
            )}
        </div>
    );
}

/** A call note for the team. */
export function ApplicationNote({ id }: { id: string }) {
    const t = useTranslations("Applications");
    const router = useRouter();
    const [note, setNote] = useState("");
    const [isPending, startTransition] = useTransition();
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                startTransition(async () => {
                    const r = await addApplicationNote(id, note).catch(() => ({ error: "failed" as const }));
                    if ("ok" in r) {
                        setNote("");
                        router.refresh();
                    } else toast.error(t("failed"));
                });
            }}
            className="flex flex-col gap-2"
        >
            <label htmlFor="ap-note" className="text-sm font-semibold">
                {t("noteLabel")}
            </label>
            <textarea
                id="ap-note"
                rows={3}
                maxLength={NOTE_MAX}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={cn(field, "resize-y py-3")}
            />
            <button type="submit" disabled={isPending || !note.trim()} className={cn(outlineButton, "h-10 self-start text-sm", focusRing)}>
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {t("addNote")}
            </button>
        </form>
    );
}
