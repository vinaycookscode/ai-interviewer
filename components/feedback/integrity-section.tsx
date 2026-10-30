import { useTranslations } from "next-intl";
import { ClipboardPaste, Clock, Code, Copy, Eye, Keyboard, LogOut, Minimize, Monitor, OctagonAlert, ShieldCheck } from "lucide-react";
import type { EventKind, IntegritySummary, Reason, Verdict } from "@/lib/integrity/verdict";
import { Mascot } from "@/components/soft-glass/mascot";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

export interface IntegrityGroup {
    /** The question's position, or null for events before the first question. */
    n: number | null;
    text: string | null;
    events: { offset: number; kind: EventKind; seconds: number | null }[];
}

export type IntegrityProps =
    | { state: "notFinished" }
    | { state: "noEvents" }
    | { state: "ready"; verdict: Verdict; reasons: Reason[]; summary: IntegritySummary; groups: IntegrityGroup[] };

type T = ReturnType<typeof useTranslations<"Integrity">>;

const VERDICT = {
    NO_CONCERNS: { icon: ShieldCheck, box: "bg-sg-row", tone: "text-sg-success" },
    WORTH_A_LOOK: { icon: Eye, box: "bg-sg-lavender-soft", tone: "text-sg-lavender-ink" },
    STRONG_CONCERNS: { icon: OctagonAlert, box: "bg-sg-danger/10", tone: "text-sg-danger" },
} satisfies Record<Verdict, unknown>;

const EVENT_ICONS: Record<EventKind, typeof Eye> = {
    away: LogOut,
    fullscreen: Minimize,
    paste: ClipboardPaste,
    copy: Copy,
    shortcut: Keyboard,
    devTools: Code,
    multiScreen: Monitor,
};

const label = "text-[13px] font-bold leading-[18px] text-sg-muted";
const row = "rounded-2xl bg-sg-row px-3.5 py-3";
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function duration(t: T, secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m === 0 ? t("duration.sec", { s }) : s === 0 ? t("duration.min", { m }) : t("duration.minSec", { m, s });
}

function reasonText(t: T, r: Reason) {
    switch (r.code) {
        case "timesAway":
            return r.seconds === null
                ? t("reasons.timesAway", { count: r.count })
                : t("reasons.timesAwayFor", { count: r.count, duration: duration(t, r.seconds) });
        case "awayTotal":
            return t("reasons.awayTotal", { duration: duration(t, r.seconds) });
        case "fullscreen":
            return t("reasons.fullscreen", { duration: duration(t, r.seconds) });
        case "pastes":
            return t("reasons.pastes", { count: r.count });
        case "devTools":
            return t("reasons.devTools");
    }
}

function eventText(t: T, kind: EventKind, seconds: number | null) {
    if (kind === "away" && seconds !== null) return t("events.awayFor", { duration: duration(t, seconds) });
    if (kind === "fullscreen" && seconds !== null) return t("events.fullscreenFor", { duration: duration(t, seconds) });
    return t(`events.${kind}`);
}

function timeAway(t: T, s: IntegritySummary) {
    if (s.timesAway === 0) return t("summary.none");
    if (s.untimedAway === 0) return duration(t, s.awaySeconds);
    return s.awaySeconds === 0 ? t("summary.notRecorded") : t("summary.atLeast", { duration: duration(t, s.awaySeconds) });
}

/** What happened during the interview, for the employer only (AIIN-177). Kept out of the PDF and anything shared. */
export function IntegritySection(props: IntegrityProps) {
    const t = useTranslations("Integrity");

    return (
        <section aria-labelledby="int-title" className="sg-glass sg-shadow-lg flex flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="int-title" className="font-display sg-soft text-[22px] font-semibold leading-7">
                    {t("title")}
                </h2>
                <span className="text-[13px] font-medium leading-[18px] text-sg-muted">{t("teamOnly")}</span>
            </div>

            {props.state === "notFinished" && (
                <p className={cn(row, "flex items-start gap-2.5")}>
                    <Clock className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                    {t("notFinished")}
                </p>
            )}

            {props.state === "noEvents" && (
                <div className="flex items-center gap-3.5">
                    <Mascot className="size-14" />
                    <div className="flex flex-col gap-0.5">
                        <p className="text-lg font-bold">{t("noEventsTitle")}</p>
                        <p className="text-sg-muted">{t("noEventsBody")}</p>
                    </div>
                </div>
            )}

            {props.state === "ready" && <Details t={t} {...props} />}
        </section>
    );
}

function Details({ t, verdict, reasons, summary, groups }: Extract<IntegrityProps, { state: "ready" }> & { t: T }) {
    const v = VERDICT[verdict];
    const tiles = [
        [t("summary.timesAway"), String(summary.timesAway)],
        [t("summary.timeAway"), timeAway(t, summary)],
        [t("summary.pastes"), String(summary.pastes)],
        [t("summary.fullscreen"), String(summary.fullscreenExits)],
        [t("summary.devTools"), summary.devTools ? t("summary.yes") : t("summary.no")],
    ];

    return (
        <>
            <div className={cn("flex items-start gap-3.5 rounded-[20px] px-[18px] py-4", v.box)}>
                <span aria-hidden="true" className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-glass-strong", v.tone)}>
                    <v.icon className="size-[22px]" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                    <span className={label}>{t("verdict")}</span>
                    <span className="font-display sg-soft text-[26px] font-semibold leading-8">{t(`verdicts.${verdict}`)}</span>
                    <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-[18px]">
                        {reasons.length ? reasons.map((r) => <li key={r.code}>{reasonText(t, r)}</li>) : <li>{t("nothingMajor")}</li>}
                    </ul>
                </div>
            </div>

            <details className={row}>
                <summary className={cn("cursor-pointer rounded-md font-bold", focusRing)}>{t("how.title")}</summary>
                <div className="mt-2.5 flex flex-col gap-2 text-[15px] leading-[23px]">
                    {(["none", "worth", "strong"] as const).map((k) => (
                        <p key={k}>{t.rich(`how.${k}`, { b: (chunks) => <strong>{chunks}</strong> })}</p>
                    ))}
                    <p className="text-sg-muted">{t("how.note")}</p>
                </div>
            </details>

            <dl aria-label={t("summary.label")} className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
                {tiles.map(([term, value]) => (
                    <div key={term} className={cn(row, "flex flex-col")}>
                        <dt className={label}>{term}</dt>
                        <dd className="text-lg font-bold">{value}</dd>
                    </div>
                ))}
            </dl>

            {groups.length > 0 && (
                <ol aria-label={t("timeline")} className="flex flex-col gap-3.5">
                    {groups.map((g) => (
                        <li key={g.n ?? 0} className="flex flex-col gap-2">
                            <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                                <span className={label}>{g.n === null ? t("beforeQuestions") : t("question", { n: g.n })}</span>
                                {g.text && <span className="min-w-0 font-bold [overflow-wrap:anywhere]">{g.text}</span>}
                            </span>
                            <ol className="flex flex-col gap-1.5">
                                {g.events.map((e, i) => {
                                    const Icon = EVENT_ICONS[e.kind];
                                    return (
                                        <li key={i} className={cn(row, "flex items-center gap-3")}>
                                            <time dateTime={`PT${e.offset}S`} className="inline-flex h-[26px] shrink-0 items-center rounded-lg bg-sg-chip px-2 text-[13px] font-bold tabular-nums">
                                                {mmss(e.offset)}
                                            </time>
                                            <Icon className="size-4 shrink-0 text-sg-muted" aria-hidden="true" />
                                            <span className="min-w-0">{eventText(t, e.kind, e.seconds)}</span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </li>
                    ))}
                </ol>
            )}
        </>
    );
}
