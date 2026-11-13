"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bot, CalendarClock, Loader2, Plus, Users } from "lucide-react";
import { addHumanRound, cancelHumanRound, rescheduleHumanRound, scheduleAiRound, setRoundOutcome } from "@/actions/rounds";
import { DURATIONS, ROUND_NAME_MAX } from "@/lib/rounds";
import { focusRing } from "@/components/soft-glass/classes";
import { field, fieldLabel, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

type Result = { ok: true } | { error: string };

function useRun(onDone?: () => void) {
    const t = useTranslations("Rounds");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const run = (fn: () => Promise<Result>) =>
        startTransition(async () => {
            setError(null);
            const r = await fn().catch(() => ({ error: "failed" }));
            if ("ok" in r) {
                onDone?.();
                router.refresh();
            } else if (r.error === "invalid") setError(t("invalid"));
            else if (r.error === "aiFailed") setError(t("aiFailed"));
            else toast.error(t("failed"));
        });
    return { run, isPending, error };
}

/** "2026-11-14T11:00" in the employer's own time zone, from a Date. */
const localValue = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

interface HumanValues {
    roundName: string;
    startsAt: string;
    durationMins: number;
    interviewer: string;
    meetingLink: string;
}

function HumanFields({ prefix, values, set }: { prefix: string; values: HumanValues; set: (v: HumanValues) => void }) {
    const t = useTranslations("Rounds");
    const input = (key: keyof HumanValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
            <label htmlFor={`${prefix}-${key}`} className={fieldLabel}>
                {label}
            </label>
            <input
                id={`${prefix}-${key}`}
                value={values[key]}
                onChange={(e) => set({ ...values, [key]: e.target.value })}
                className={cn(field, "h-12 min-w-0")}
                {...props}
            />
        </div>
    );
    return (
        <>
            {input("roundName", t("name"), {
                required: true,
                maxLength: ROUND_NAME_MAX,
                placeholder: t("namePlaceholder"),
            })}
            {input("startsAt", t("when"), { type: "datetime-local", required: true })}
            <div className="flex min-w-0 flex-[1_1_120px] flex-col gap-1.5">
                <label htmlFor={`${prefix}-duration`} className={fieldLabel}>
                    {t("duration")}
                </label>
                <select
                    id={`${prefix}-duration`}
                    value={values.durationMins}
                    onChange={(e) => set({ ...values, durationMins: Number(e.target.value) })}
                    className={cn(field, "h-12 min-w-0")}
                >
                    {DURATIONS.map((d) => (
                        <option key={d} value={d}>
                            {t("minutes", { count: d })}
                        </option>
                    ))}
                </select>
            </div>
            {input("interviewer", t("interviewer"), {
                maxLength: ROUND_NAME_MAX,
                placeholder: t("optional"),
            })}
            {input("meetingLink", t("link"), {
                type: "url",
                required: true,
                placeholder: "https://meet.google.com/…",
                pattern: "https://.*",
            })}
        </>
    );
}

const toInput = (v: HumanValues) => ({
    ...v,
    startsAt: new Date(v.startsAt).toISOString(),
});

/** Add a round: an AI interview (today's invite flow) or a human one with a calendar invite (AIIN-196). */
export function AddRound({ id }: { id: string }) {
    const t = useTranslations("Rounds");
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<"HUMAN" | "AI">("HUMAN");
    const blank = (): HumanValues => {
        const d = new Date(Date.now() + 86_400_000);
        d.setMinutes(0, 0, 0);
        return {
            roundName: "",
            startsAt: localValue(d),
            durationMins: 45,
            interviewer: "",
            meetingLink: "",
        };
    };
    const [values, setValues] = useState<HumanValues>(blank);
    const { run, isPending, error } = useRun(() => {
        setOpen(false);
        setKind("HUMAN");
        setValues(blank());
    });

    if (!open)
        return (
            <button type="button" onClick={() => setOpen(true)} className={cn(outlineButton, "h-11 self-start px-4")}>
                <Plus className="size-4" aria-hidden="true" />
                {t("add")}
            </button>
        );

    const pill = (on: boolean) =>
        cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold",
            on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
            focusRing,
        );

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (kind === "AI") run(() => scheduleAiRound(id, new Date(values.startsAt).toISOString()));
                else run(() => addHumanRound(id, toInput(values)));
            }}
            className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-3.5"
        >
            <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">{t("kind")}</legend>
                <button type="button" aria-pressed={kind === "HUMAN"} onClick={() => setKind("HUMAN")} className={pill(kind === "HUMAN")}>
                    <Users className="size-4" aria-hidden="true" />
                    {t("human")}
                </button>
                <button type="button" aria-pressed={kind === "AI"} onClick={() => setKind("AI")} className={pill(kind === "AI")}>
                    <Bot className="size-4" aria-hidden="true" />
                    {t("ai")}
                </button>
            </fieldset>
            <div className="flex flex-wrap gap-3">
                {kind === "HUMAN" ? (
                    <HumanFields prefix="ar" values={values} set={setValues} />
                ) : (
                    <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
                        <label htmlFor="ar-ai-when" className={fieldLabel}>
                            {t("aiWhen")}
                        </label>
                        <input
                            id="ar-ai-when"
                            type="datetime-local"
                            required
                            value={values.startsAt}
                            onChange={(e) => setValues({ ...values, startsAt: e.target.value })}
                            className={cn(field, "h-12 min-w-0")}
                        />
                    </div>
                )}
            </div>
            <p className="text-[13px] text-sg-muted">{kind === "HUMAN" ? t("humanHint") : t("aiHint")}</p>
            {error && (
                <p role="alert" className="text-[13px] font-semibold text-sg-danger">
                    {error}
                </p>
            )}
            <span className="flex flex-wrap gap-2">
                <button type="submit" disabled={isPending} className={cn(inkButton, "h-11 px-5")}>
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {kind === "HUMAN" ? t("schedule") : t("sendAi")}
                </button>
                <button type="button" onClick={() => setOpen(false)} className={cn(outlineButton, "h-11 px-5")}>
                    {t("cancelForm")}
                </button>
            </span>
        </form>
    );
}

/** Outcome, new time and cancel for one human round. */
export function HumanRoundActions({
    round,
}: {
    round: {
        id: string;
        roundName: string;
        startsAt: string;
        durationMins: number;
        interviewer: string | null;
        meetingLink: string;
        outcome: string | null;
    };
}) {
    const t = useTranslations("Rounds");
    const [editing, setEditing] = useState(false);
    const [values, setValues] = useState<HumanValues>({
        roundName: round.roundName,
        startsAt: localValue(new Date(round.startsAt)),
        durationMins: round.durationMins,
        interviewer: round.interviewer ?? "",
        meetingLink: round.meetingLink,
    });
    const { run, isPending, error } = useRun(() => setEditing(false));

    if (editing)
        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    run(() => rescheduleHumanRound(round.id, toInput(values)));
                }}
                className="flex w-full flex-col gap-3 pt-1"
            >
                <div className="flex flex-wrap gap-3">
                    <HumanFields prefix={`r-${round.id}`} values={values} set={setValues} />
                </div>
                {error && (
                    <p role="alert" className="text-[13px] font-semibold text-sg-danger">
                        {error}
                    </p>
                )}
                <span className="flex flex-wrap gap-2">
                    <button type="submit" disabled={isPending} className={cn(inkButton, "h-10 px-4")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {t("saveTime")}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className={cn(outlineButton, "h-10 px-4")}>
                        {t("cancelForm")}
                    </button>
                </span>
            </form>
        );

    return (
        <span className="flex w-full flex-wrap items-center gap-2">
            <label htmlFor={`o-${round.id}`} className="sr-only">
                {t("outcomeFor", { name: round.roundName })}
            </label>
            <select
                id={`o-${round.id}`}
                value={round.outcome ?? ""}
                disabled={isPending}
                onChange={(e) => run(() => setRoundOutcome(round.id, e.target.value || null))}
                className={cn(field, "h-10 w-auto min-w-0 py-0 text-sm")}
            >
                <option value="">{t("outcomes.NONE")}</option>
                <option value="PASSED">{t("outcomes.PASSED")}</option>
                <option value="FAILED">{t("outcomes.FAILED")}</option>
                <option value="NO_SHOW">{t("outcomes.NO_SHOW")}</option>
            </select>
            <button type="button" onClick={() => setEditing(true)} className={cn(outlineButton, "h-10 px-3.5 text-sm")}>
                <CalendarClock className="size-4" aria-hidden="true" />
                {t("reschedule")}
            </button>
            <button
                type="button"
                disabled={isPending}
                onClick={() => {
                    if (confirm(t("cancelConfirm"))) run(() => cancelHumanRound(round.id));
                }}
                className={cn("rounded-md px-1 text-sm font-semibold text-sg-danger", focusRing)}
            >
                {t("cancelRound")}
            </button>
            {error && (
                <span role="alert" className="text-[13px] font-semibold text-sg-danger">
                    {error}
                </span>
            )}
        </span>
    );
}
