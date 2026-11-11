import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays, ChevronRight, Mic, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { buildPrepSet } from "@/lib/bank/prep-server";
import { daysUntil } from "@/lib/bank/review";
import { StatusChip, bankChip } from "@/components/question-bank/chips";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { panel, panelTitle, textLink } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ interviewId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("QuestionBank.prep");
    return { title: t("titleUnscheduled") };
}

const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
const day = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const dayTime = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Fifteen questions picked for one upcoming interview (AIIN-213), from the approved Prep set artboards. */
export default async function PrepSetPage({ params }: PageProps) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const { interviewId } = await params;
    // The candidate's own interview only
    const interview = await db.interview.findFirst({
        where: { id: interviewId, candidateId: userId },
        select: { scheduledTime: true, job: { select: { title: true, employer: { select: { name: true } } } } },
    });
    if (!interview) notFound();
    const t = await getTranslations("QuestionBank");

    let setId: string | null;
    try {
        setId = await buildPrepSet(userId, interviewId);
    } catch (error) {
        console.error("Building a prep set failed:", error);
        return (
            <section className={cn(panel, "max-w-[640px]")}>
                <h1 className={panelTitle}>{t("prep.failedTitle")}</h1>
                <p className="text-sg-muted">{t("prep.failedBody")}</p>
                <Link href={`/candidate/question-bank/prep/${interviewId}`} className={cn(textLink, "self-start")}>
                    {t("prep.retry")}
                </Link>
            </section>
        );
    }
    if (!setId) notFound();

    const set = await db.prepSet.findUniqueOrThrow({
        where: { id: setId },
        select: {
            createdAt: true,
            skills: true,
            items: {
                orderBy: { position: "asc" },
                select: {
                    reason: true,
                    aiSuggested: true,
                    bankItem: {
                        select: {
                            id: true,
                            questionText: true,
                            status: true,
                            mockAnswer: { select: { score: true, createdAt: true } },
                            attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true, createdAt: true } },
                        },
                    },
                },
            },
        },
    });

    const latest = (b: (typeof set.items)[number]["bankItem"]) =>
        [b.mockAnswer, b.attempts[0]].filter((a) => a && a.score != null).sort((x, y) => y!.createdAt.getTime() - x!.createdAt.getTime())[0] ?? null;
    // Practised since the set was picked
    const practised = (b: (typeof set.items)[number]["bankItem"]) => {
        const answer = latest(b);
        return !!answer && answer.createdAt >= set.createdAt;
    };
    const total = set.items.length;
    const done = set.items.filter((i) => practised(i.bankItem)).length;
    const next = set.items.find((i) => !practised(i.bankItem));

    const company = interview.job.employer.name?.trim() || null;
    const when = interview.scheduledTime;
    const now = new Date();
    const daysLeft = when ? daysUntil(when, now) : null;
    const title = !when ? t("prep.titleUnscheduled") : daysLeft! < 7 ? t("prep.titleDay", { day: weekday.format(when) }) : t("prep.titleDate", { date: day.format(when) });
    const lead = !when
        ? t("prep.leadUnscheduled", { job: interview.job.title, company: company ?? "", count: total })
        : company
          ? t("prep.lead", { job: interview.job.title, company, when: `${dayTime.format(when)} IST`, count: total })
          : t("prep.leadNoCompany", { job: interview.job.title, when: `${dayTime.format(when)} IST`, count: total });

    const groups = (["JOB", "COMPANY", "WEAK"] as const).map((reason) => ({ reason, items: set.items.filter((i) => i.reason === reason) })).filter((g) => g.items.length);
    const count = (reason: string) => set.items.filter((i) => i.reason === reason).length;

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{title}</h1>
                    <p className="text-lg text-sg-muted">{lead}</p>
                </div>
                {next && (
                    <Link href={`/candidate/question-bank/practise?id=${next.bankItem.id}`} className={cn(coralButton, "h-12 px-5")}>
                        <Mic className="size-[18px]" aria-hidden="true" />
                        {t("prep.practiseNext")}
                    </Link>
                )}
            </div>

            <section aria-label={t("prep.progress", { done, total })} className="sg-glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[22px] px-5 py-4">
                <CalendarDays className="size-5 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                <div className="flex min-w-[min(220px,100%)] flex-[1_1_320px] flex-col gap-2">
                    <span className="font-bold">
                        {t("prep.progress", { done, total })}
                        {daysLeft != null && ` · ${t("prep.daysToGo", { days: daysLeft })}`}
                    </span>
                    <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-sg-track">
                        <span className="block h-full rounded-full bg-sg-lavender-ink" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                    </span>
                </div>
                <span className="text-sm text-sg-muted">
                    {done >= total ? t("prep.allDone", { total }) : t("prep.perDay", { count: Math.ceil((total - done) / Math.max(daysLeft ?? 1, 1)), total })}
                </span>
            </section>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-6">
                {groups.map((g) => (
                    <section key={g.reason} aria-labelledby={`prep-${g.reason}`} className={panel}>
                        <div className="flex flex-col gap-0.5">
                            <h2 id={`prep-${g.reason}`} className={panelTitle}>
                                {g.reason === "COMPANY" ? t("prep.groups.COMPANY", { company: company ?? "" }) : t(`prep.groups.${g.reason}`)}
                            </h2>
                            <p className="text-sm text-sg-muted">
                                {g.reason === "JOB"
                                    ? set.skills.length
                                        ? t("prep.groupLead.JOB", { count: g.items.length, skills: set.skills.join(", ") })
                                        : t("prep.groupLead.JOBNoSkills", { count: g.items.length })
                                    : t(`prep.groupLead.${g.reason}`, { count: g.items.length })}
                            </p>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {g.items.map(({ bankItem: b, aiSuggested }) => {
                                const answer = latest(b);
                                return (
                                    <li key={b.id}>
                                        <Link href={`/candidate/question-bank/${b.id}`} className={cn("flex items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3.5 hover:bg-sg-chip", focusRing)}>
                                            <span className="flex min-w-0 flex-1 flex-col gap-2">
                                                <span className="font-bold text-pretty break-words">{b.questionText}</span>
                                                <span className="flex flex-wrap gap-1.5">
                                                    <StatusChip status={b.status} label={t(`statuses.${b.status}`)} />
                                                    {aiSuggested && (
                                                        <span className={bankChip}>
                                                            <Sparkles className="size-3.5" aria-hidden="true" />
                                                            {t("prep.aiSuggested")}
                                                        </span>
                                                    )}
                                                    {answer?.score != null && <span className={cn(bankChip, "bg-transparent px-1 text-sg-muted")}>{t("last", { score: answer.score.toFixed(1) })}</span>}
                                                </span>
                                            </span>
                                            <ChevronRight className="size-5 shrink-0 text-sg-muted" aria-hidden="true" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
                <section aria-labelledby="prep-how" className={panel}>
                    <h2 id="prep-how" className={panelTitle}>
                        {t("prep.howTitle")}
                    </h2>
                    <p className="text-sg-muted">
                        {company && count("COMPANY")
                            ? t("prep.how", { job: count("JOB"), company: count("COMPANY"), name: company, weak: count("WEAK") })
                            : t("prep.howNoCompany", { job: count("JOB"), weak: count("WEAK") })}
                    </p>
                </section>
            </div>
        </div>
    );
}
