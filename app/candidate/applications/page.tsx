import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Briefcase, CalendarClock, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CLOSED, type Stage } from "@/lib/applications";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { StageChip } from "@/components/applications/stage-chip";
import { ApplicationEmailsSwitch, WithdrawApplication } from "@/components/applications/my-application-actions";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("MyApplications");
    return { title: t("title") };
}

const when = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
});
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** Every job the candidate applied to, and where it stands (AIIN-197), from the approved "My applications" artboards. */
export default async function MyApplicationsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
    const { show } = await searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("MyApplications");
    const tStage = await getTranslations("MyApplications.stages");

    const [apps, me] = await Promise.all([
        db.application.findMany({
            where: { candidateId: userId },
            orderBy: [{ stageChangedAt: "desc" }, { id: "asc" }],
            select: {
                id: true,
                jobId: true,
                stage: true,
                stageChangedAt: true,
                candidateSeenAt: true,
                createdAt: true,
                job: { select: { title: true, location: true, employer: { select: { name: true } } } },
            },
        }),
        db.user.findUnique({ where: { id: userId }, select: { applicationEmails: true } }),
    ]);
    // The next round for each job: an AI interview still to do, with its date (AC1)
    const rounds = apps.length
        ? await db.interview.findMany({
              where: { candidateId: userId, jobId: { in: apps.map((a) => a.jobId) }, status: { in: ["PENDING", "IN_PROGRESS"] } },
              orderBy: { scheduledTime: "asc" },
              select: { id: true, jobId: true, scheduledTime: true, status: true },
          })
        : [];
    const roundOf = new Map<string, (typeof rounds)[number]>();
    for (const r of rounds) if (!roundOf.has(r.jobId)) roundOf.set(r.jobId, r);

    const closed = apps.filter((a) => CLOSED.includes(a.stage as Stage));
    const active = apps.filter((a) => !CLOSED.includes(a.stage as Stage) && a.stage !== "INVITED");
    const showClosed = show === "closed";
    const list = showClosed ? closed : active;

    // Seen now: "Updated" shows once for each change (in-app notice)
    if (apps.some((a) => !a.candidateSeenAt || a.candidateSeenAt < a.stageChangedAt)) {
        after(() => db.application.updateMany({ where: { candidateId: userId }, data: { candidateSeenAt: new Date() } }).catch(() => undefined));
    }

    const tab = (on: boolean) =>
        cn(
            "inline-flex h-10 items-center rounded-full border-2 px-4 text-sm font-semibold",
            on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
            focusRing,
        );

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="max-w-[640px] text-lg text-sg-muted">{t("subtitle")}</p>
                <Link href="/candidate/jobs" className={cn(coralButton, "mt-2 h-12 self-start px-6 text-base")}>
                    {t("findJobs")}
                </Link>
            </div>
            <nav aria-label={t("show")} className="flex flex-wrap gap-2">
                <Link href="/candidate/applications" aria-current={!showClosed ? "page" : undefined} className={tab(!showClosed)}>
                    {t("active", { count: active.length })}
                </Link>
                <Link href="/candidate/applications?show=closed" aria-current={showClosed ? "page" : undefined} className={tab(showClosed)}>
                    {t("closed", { count: closed.length })}
                </Link>
            </nav>

            {list.length === 0 ? (
                <EmptyState
                    icon={<Briefcase className="size-7" aria-hidden="true" />}
                    title={showClosed ? t("noClosed") : apps.length ? t("noActive") : t("noneTitle")}
                >
                    {showClosed ? t("noClosedBody") : apps.length ? t("noActiveBody") : t("noneBody")}
                </EmptyState>
            ) : (
                <ul className="flex flex-col gap-2.5">
                    {list.map((a) => {
                        const stage = a.stage as Stage;
                        const round = roundOf.get(a.jobId);
                        const updated = !!a.candidateSeenAt && a.candidateSeenAt < a.stageChangedAt;
                        const company = a.job.employer.name?.trim() || t("anEmployer");
                        return (
                            <li key={a.id} className="sg-glass flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] px-5 py-4">
                                <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
                                    <strong className="text-[17px] break-words">{a.job.title}</strong>
                                    <span className="text-sm text-sg-muted">
                                        {company}
                                        {a.job.location ? ` · ${a.job.location}` : ""}
                                    </span>
                                    <span className="mt-1 inline-flex items-center gap-1.5 text-[13px]">
                                        {round?.scheduledTime && !CLOSED.includes(stage) ? (
                                            <>
                                                <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
                                                {t("round", { when: when.format(round.scheduledTime) })}
                                            </>
                                        ) : (
                                            t("since", { date: day.format(a.stageChangedAt) })
                                        )}
                                    </span>
                                </span>
                                <span className="flex flex-wrap items-center gap-2">
                                    {updated && (
                                        <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                                            <Sparkles className="size-3.5" aria-hidden="true" />
                                            {t("updated")}
                                        </span>
                                    )}
                                    <StageChip stage={stage} label={tStage(stage)} />
                                </span>
                                {!CLOSED.includes(stage) && (
                                    <span className="flex flex-wrap items-center gap-3">
                                        {round && (
                                            <Link
                                                href={`/candidate/question-bank/prep/${round.id}`}
                                                className={cn("inline-flex items-center gap-1.5 rounded-md text-sm font-bold", focusRing)}
                                            >
                                                {t("prep")}
                                                <ArrowRight className="size-3.5" aria-hidden="true" />
                                            </Link>
                                        )}
                                        <WithdrawApplication id={a.id} job={a.job.title} />
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <section aria-label={t("emails")} className="sg-glass flex flex-col gap-3 rounded-[22px] px-5 py-4">
                <ApplicationEmailsSwitch on={!!me?.applicationEmails} />
            </section>
        </div>
    );
}
