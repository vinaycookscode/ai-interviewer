"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Loader2, Timer } from "lucide-react";
import { answerAptitude, noteTabSwitch, submitAptitude } from "@/actions/aptitude";
import { UMark } from "@/components/soft-glass/mascot";
import { focusRing } from "@/components/soft-glass/classes";
import { inkButton, outlineButton } from "@/components/interview/session-shell";
import { cn } from "@/lib/utils";

export interface RoundQuestion {
    id: string;
    section: string;
    text: string;
    options: string[]; // in the order this candidate sees them
}

const mmss = (ms: number) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** The timed aptitude round (AIIN-169), from the approved "Aptitude round — question" artboards. */
export function AptitudeRound({
    attemptId,
    title,
    subtitle,
    deadline,
    serverNow,
    questions,
    saved,
}: {
    attemptId: string;
    title: string;
    subtitle: string;
    deadline: string;
    serverNow: string;
    questions: RoundQuestion[];
    saved: Record<string, number>;
}) {
    const t = useTranslations("Aptitude");
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>(saved);
    const [status, setStatus] = useState<"saved" | "saving" | "error" | null>(null);
    const [announce, setAnnounce] = useState("");
    const [, startTransition] = useTransition();
    const [submitting, setSubmitting] = useState(false);
    // The server's clock decides; correct for this device's clock being off
    const skew = useRef(new Date(serverNow).getTime() - Date.now());
    const end = new Date(deadline).getTime();
    const [left, setLeft] = useState(() => end - (Date.now() + skew.current));
    const spoken = useRef(new Set<number>());

    const submit = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);
        await submitAptitude(attemptId).catch(() => undefined);
        router.refresh();
    }, [attemptId, router, submitting]);

    useEffect(() => {
        const id = setInterval(() => {
            const ms = end - (Date.now() + skew.current);
            setLeft(ms);
            // Said politely at 5 minutes and 1 minute left, never every second
            for (const m of [5, 1])
                if (ms <= m * 60_000 && !spoken.current.has(m)) {
                    spoken.current.add(m);
                    setAnnounce(t("minutesLeft", { count: m }));
                }
            if (ms <= 0) void submit();
        }, 1000);
        return () => clearInterval(id);
    }, [end, submit, t]);

    useEffect(() => {
        const onHide = () => {
            if (document.visibilityState === "hidden") void noteTabSwitch(attemptId).catch(() => undefined);
        };
        document.addEventListener("visibilitychange", onHide);
        return () => document.removeEventListener("visibilitychange", onHide);
    }, [attemptId]);

    const q = questions[current];
    const choose = (shown: number) => {
        setAnswers({ ...answers, [q.id]: shown });
        setStatus("saving");
        startTransition(async () => {
            const r = await answerAptitude(attemptId, q.id, shown).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) setStatus("saved");
            else if (r.error === "timeUp") router.refresh();
            else setStatus("error");
        });
    };
    const answered = questions.filter((x) => answers[x.id] !== undefined).length;

    return (
        <div className="flex flex-col gap-5">
            <header className="sg-glass sticky top-2 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 rounded-[22px] py-2.5 pr-3 pl-4">
                <div className="flex min-w-0 flex-[1_1_200px] items-center gap-3">
                    <UMark />
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate font-bold">{title}</span>
                        <span className="truncate text-[13px] leading-[18px] font-medium text-sg-muted">{subtitle}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold whitespace-nowrap">{t("questionOf", { n: current + 1, total: questions.length })}</span>
                    <span
                        role="timer"
                        aria-label={t("timeLeft", { time: mmss(left) })}
                        className={cn(
                            "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 font-bold whitespace-nowrap tabular-nums",
                            left < 60_000 ? "bg-sg-coral text-sg-coral-ink" : "bg-sg-ink text-sg-ink-foreground",
                        )}
                    >
                        <Timer className="size-4" aria-hidden="true" />
                        {t("left", { time: mmss(left) })}
                    </span>
                </div>
            </header>
            <p aria-live="polite" className="sr-only">
                {announce}
            </p>

            <div className="flex flex-wrap items-start gap-5">
                <main className="sg-glass sg-shadow-lg flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[28px] p-5 sm:p-8">
                    <span className="self-start rounded-full bg-sg-lavender-soft px-3 py-1 text-[13px] font-bold text-sg-lavender-ink">{q.section}</span>
                    <h1 id="apt-q" className="font-display sg-soft text-[length:clamp(22px,5.6vw,28px)] leading-[1.3] font-semibold break-words">
                        {q.text}
                    </h1>
                    <fieldset aria-labelledby="apt-q" className="flex flex-col gap-2.5">
                        <legend className="sr-only">{t("chooseOne")}</legend>
                        {q.options.map((o, i) => {
                            const on = answers[q.id] === i;
                            return (
                                <label
                                    key={i}
                                    className={cn(
                                        "flex min-h-[56px] cursor-pointer items-center gap-3.5 rounded-[18px] border-2 bg-sg-row px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sg-focus",
                                        on ? "border-sg-ink" : "border-transparent",
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${q.id}`}
                                        checked={on}
                                        disabled={submitting}
                                        onChange={() => choose(i)}
                                        className="size-[22px] shrink-0 accent-[var(--sg-ink)]"
                                    />
                                    <span className="text-[17px] break-words">{o}</span>
                                </label>
                            );
                        })}
                    </fieldset>
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <button type="button" disabled={current === 0} onClick={() => setCurrent(current - 1)} className={cn(outlineButton, "h-12")}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            {t("previous")}
                        </button>
                        <span className="text-[13px] text-sg-muted" aria-live="polite">
                            {status === "saving" ? t("saving") : status === "saved" ? t("saved") : status === "error" ? t("saveFailed") : ""}
                        </span>
                        <button type="button" disabled={current === questions.length - 1} onClick={() => setCurrent(current + 1)} className={cn(inkButton, "h-12 px-5")}>
                            {t("next")}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </main>

                <aside aria-label={t("questions")} className="sg-glass flex min-w-[min(260px,100%)] flex-[1_1_280px] flex-col gap-3 rounded-[24px] p-[18px] lg:max-w-[380px]">
                    <span className="font-bold">{t("answered", { n: answered, total: questions.length })}</span>
                    <ol className="grid grid-cols-[repeat(auto-fill,40px)] gap-1.5">
                        {questions.map((x, i) => {
                            const done = answers[x.id] !== undefined;
                            return (
                                <li key={x.id}>
                                    <button
                                        type="button"
                                        onClick={() => setCurrent(i)}
                                        aria-current={i === current ? "step" : undefined}
                                        aria-label={t("goTo", { n: i + 1, state: i === current ? t("current") : done ? t("isAnswered") : t("notAnswered") })}
                                        className={cn(
                                            "inline-flex size-10 items-center justify-center rounded-xl text-sm font-bold",
                                            i === current ? "border-2 border-sg-ink" : done ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip",
                                            focusRing,
                                        )}
                                    >
                                        {i + 1}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                    <span className="flex flex-wrap gap-3 text-[13px] text-sg-muted">
                        <span className="inline-flex items-center gap-1.5">
                            <i className="size-3.5 rounded bg-sg-ink" />
                            {t("isAnswered")}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <i className="size-3.5 rounded bg-sg-chip" />
                            {t("notAnswered")}
                        </span>
                    </span>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => confirm(t("submitConfirm", { n: questions.length - answered })) && void submit()}
                        className={cn(outlineButton, "h-12")}
                    >
                        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {t("submit")}
                    </button>
                    <span className="text-[13px] text-sg-muted">{t("submitHint")}</span>
                </aside>
            </div>
        </div>
    );
}
