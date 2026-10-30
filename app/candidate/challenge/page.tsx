import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Check, Clock, Flame } from "lucide-react";
import { auth } from "@/auth";
import { dateDay, istDay } from "@/lib/daily-challenge/logic";
import { ANSWER_LIMIT, loadAnswers, loadStreak, todaysQuestion } from "@/lib/daily-challenge/server";
import { ChallengeForm } from "@/components/candidate/challenge-form";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { Mascot } from "@/components/soft-glass/mascot";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
    const t = await getTranslations("Challenge");
    return { title: t("metaTitle") };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;
const panel = "sg-glass flex flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7";
const panelTitle = "font-display sg-soft text-[22px] font-semibold leading-7";
const label = "text-[13px] font-bold leading-[18px] text-sg-muted";
const row = "rounded-2xl bg-sg-row px-3.5 py-3";
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", ...options });
const longDate = fmt({ weekday: "long", day: "numeric", month: "short" });
const weekdayShort = fmt({ weekday: "short" });
const weekdayLong = fmt({ weekday: "long" });
const topicOf = (tags: string[], type: string) => tags[0] ?? (type === "HR" ? "HR" : "Aptitude");

/** Today's challenge: answer once, then U's score, a model answer and the streak (AIIN-99). */
export default async function ChallengePage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const t = await getTranslations("Challenge");
    const now = new Date();
    const [question, { todays, history }, streak] = await Promise.all([todaysQuestion(userId, now), loadAnswers(userId, now), loadStreak(userId, now)]);

    // Time until the next IST midnight
    const msLeft = (istDay(now) + 1) * DAY_MS - IST_OFFSET_MS - now.getTime();
    const hours = Math.floor(msLeft / 3_600_000);
    const minutes = Math.floor((msLeft % 3_600_000) / 60_000);

    const back = (
        <Link href="/candidate/dashboard" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("back")}
        </Link>
    );

    if (!question) {
        return (
            <div className="flex flex-col gap-6">
                {back}
                <h1 className="sr-only">{t("metaTitle")}</h1>
                <EmptyState title={t("noneTitle")}>
                    {t("noneBody")}
                </EmptyState>
            </div>
        );
    }

    const verdict = todays?.score == null ? null : todays.score >= 8 ? "strong" : todays.score >= 5 ? "good" : "again";

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex min-w-0 flex-col gap-2">
                {back}
                <span className={label}>{t("eyebrow", { date: longDate.format(now), type: question.type })}</span>
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                    {topicOf(question.tags, question.type)}
                </h1>
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
                    <section aria-labelledby="q-title" className={cn(panel, "sg-shadow-lg")}>
                        <h2 id="q-title" className="sr-only">
                            {t("questionHeading")}
                        </h2>
                        <p className="text-lg leading-7">{question.question}</p>
                        {todays ? (
                            <div className="flex flex-col gap-1.5">
                                <span className={label}>{t("yourAnswer")}</span>
                                <p className={cn(row, "whitespace-pre-line [overflow-wrap:anywhere]")}>{todays.answer}</p>
                            </div>
                        ) : (
                            <ChallengeForm type={question.type} limit={ANSWER_LIMIT} />
                        )}
                    </section>

                    {todays && verdict && (
                        <section aria-labelledby="r-title" className={panel}>
                            <div className="flex flex-wrap items-center gap-3.5">
                                <span className="flex items-baseline gap-1 text-sg-lavender-ink">
                                    <span className="font-display sg-soft text-[44px] font-semibold leading-[48px]">{todays.score}</span>
                                    <span className="font-bold">{t("scoreUnit")}</span>
                                </span>
                                <h2 id="r-title" className={cn(panelTitle, "flex-[1_1_220px]")}>
                                    {t(`verdict.${verdict}`)}
                                </h2>
                            </div>
                            {todays.feedback && (
                                <div className="flex items-start gap-3">
                                    <Mascot className="size-10" />
                                    <p className="rounded-[18px] bg-sg-glass-strong px-4 py-3">{todays.feedback}</p>
                                </div>
                            )}
                            {question.answer && (
                                <details open className={row}>
                                    <summary className={cn("cursor-pointer rounded-md font-bold", focusRing)}>{t("modelAnswer")}</summary>
                                    <p className="mt-2.5 whitespace-pre-line">{question.answer}</p>
                                </details>
                            )}
                            <p className="flex items-center gap-2 text-sg-muted">
                                <Clock className="size-4 shrink-0" aria-hidden="true" />
                                {t("next", { hours, minutes })}
                            </p>
                        </section>
                    )}

                    {todays && !verdict && (
                        <section role="status" className={cn(panel, "flex-row items-center gap-3.5")}>
                            <span className="sg-skeleton size-10 shrink-0 rounded-full" aria-hidden="true" />
                            <div className="flex flex-col gap-0.5">
                                <strong>{t("pendingTitle")}</strong>
                                <span className="text-sg-muted">{t("pendingBody")}</span>
                            </div>
                        </section>
                    )}
                </div>

                <aside className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]">
                    <section aria-labelledby="s-title" className={panel}>
                        <div className="flex items-center gap-2.5">
                            <Flame className="size-[22px] text-sg-coral" aria-hidden="true" />
                            <h2 id="s-title" className={panelTitle}>
                                {t("streak", { count: streak.streak })}
                            </h2>
                        </div>
                        <ol aria-label={t("days")} className="grid grid-cols-7 gap-1.5">
                            {streak.week.map(({ day, done, isToday }) => {
                                const date = new Date(day * DAY_MS + DAY_MS / 2);
                                return (
                                    <li key={day} className="flex flex-col items-center gap-1.5">
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                "flex size-[34px] items-center justify-center rounded-full",
                                                done ? "bg-sg-coral text-sg-coral-ink" : "border-2 border-dashed border-sg-field-border",
                                                isToday && !done && "border-solid border-sg-text"
                                            )}
                                        >
                                            {done && <Check className="size-4" strokeWidth={3} />}
                                        </span>
                                        <span className="text-[13px] font-semibold leading-4 text-sg-muted">
                                            <span aria-hidden="true">{weekdayShort.format(date).charAt(0)}</span>
                                            <span className="sr-only">
                                                {weekdayLong.format(date)}, {done ? t("practised") : t("notYet")}
                                            </span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                        <p className="text-sm text-sg-muted">{t("streakHelp")}</p>
                    </section>

                    <section aria-labelledby="h-title" className={panel}>
                        <h2 id="h-title" className={panelTitle}>
                            {t("history")}
                        </h2>
                        {history.length ? (
                            <ol className="flex flex-col gap-1.5">
                                {history.map((h) => (
                                    <li key={h.day.toISOString()} className={cn(row, "flex items-center justify-between gap-2.5")}>
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate font-semibold">{t("historyItem", { type: h.question.type, topic: topicOf(h.question.tags, h.question.type) })}</span>
                                            <span className="text-[13px] text-sg-muted">{weekdayLong.format(new Date(dateDay(h.day) * DAY_MS + DAY_MS / 2))}</span>
                                        </span>
                                        <span className="whitespace-nowrap font-bold">{h.score === null ? t("historyPending") : t("historyScore", { score: h.score })}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sg-muted">{t("historyEmpty")}</p>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
