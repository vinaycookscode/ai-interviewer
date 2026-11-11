import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpen, ChevronRight, Clock, Mic } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { similarities } from "@/lib/bank/meaning";
import { keywordMatch, meaningMatches, mergeResults, parseBankFilters } from "@/lib/bank/search";
import { isDue } from "@/lib/bank/review";
import { upcomingWhere } from "@/lib/bank/prep-server";
import { AddQuestion } from "@/components/question-bank/add-question";
import { BankFilters } from "@/components/question-bank/bank-filters";
import { SourceChip, StatusChip, bankChip } from "@/components/question-bank/chips";
import { focusRing } from "@/components/soft-glass/classes";
import { glassButton, inkButton, outlineButton, textLink } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("QuestionBank");
    return { title: t("title") };
}

const shortDay = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

type Scored = { score: number | null; createdAt: Date } | null | undefined;
/** The newest score, from practice or from the bank (AIIN-212). */
function lastScore(item: { mockAnswer: Scored; attempts: NonNullable<Scored>[] }): number | null {
    const answers = [item.mockAnswer, item.attempts[0]].filter((a): a is NonNullable<Scored> => !!a && a.score != null);
    return answers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.score ?? null;
}

/** The candidate's Question Bank (AIIN-210), built from the approved Question Bank artboards. */
export default async function QuestionBankPage({ searchParams }: PageProps) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const t = await getTranslations("QuestionBank");
    const filters = parseBankFilters(await searchParams);

    // Every query is scoped to the signed-in candidate (AC3)
    const where: Prisma.BankItemWhereInput = {
        userId,
        ...(filters.source && { source: filters.source }),
        ...(filters.type && { type: filters.type }),
        ...(filters.company && { companyName: filters.company }),
    };
    const [total, companyRows, filtered] = await Promise.all([
        db.bankItem.count({ where: { userId } }),
        db.bankItem.findMany({
            where: { userId, companyName: { not: null } },
            distinct: ["companyName"],
            select: { companyName: true },
            orderBy: { companyName: "asc" },
        }),
        db.bankItem.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                questionText: true,
                companyName: true,
                topic: true,
                tags: true,
                type: true,
                source: true,
                status: true,
                nextReview: true,
                mockAnswer: { select: { score: true, createdAt: true } },
                attempts: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { score: true, createdAt: true },
                },
            },
        }),
    ]);

    let found = filtered;
    let meaningUnavailable = false;
    if (filters.q) {
        const words = filtered.filter((item) => keywordMatch(item, filters.q)).map((item) => item.id);
        let meaning: string[] = [];
        try {
            const inFilter = new Set(filtered.map((item) => item.id));
            meaning = meaningMatches((await similarities(userId, filters.q)).filter((s) => inFilter.has(s.id)));
        } catch (error) {
            console.error("Question Bank search by meaning failed:", error);
            meaningUnavailable = true;
        }
        const byId = new Map(filtered.map((item) => [item.id, item]));
        found = mergeResults(words, meaning).flatMap((id) => byId.get(id) ?? []);
    }

    const now = new Date();
    const counts = {
        all: found.length,
        DUE: 0,
        NEW: 0,
        PRACTISING: 0,
        CONFIDENT: 0,
    };
    for (const item of found) {
        counts[item.status]++;
        if (isDue(item.nextReview, now)) counts.DUE++;
    }
    const shown =
        filters.status === "DUE"
            ? found.filter((item) => isDue(item.nextReview, now))
            : filters.status
              ? found.filter((item) => item.status === filters.status)
              : found;
    // Due across the whole bank, whatever the filters, for the panel (AIIN-212)
    const [dueTotal, upcoming] = await Promise.all([
        db.bankItem.count({ where: { userId, nextReview: { lte: now } } }),
        // The next interview to prepare for, and how far through its prep set the candidate is (AIIN-213)
        db.interview.findFirst({
            where: upcomingWhere(userId),
            orderBy: { scheduledTime: { sort: "asc", nulls: "last" } },
            select: {
                id: true,
                scheduledTime: true,
                job: { select: { title: true, employer: { select: { name: true } } } },
                prepSets: {
                    where: { userId },
                    select: {
                        createdAt: true,
                        items: { select: { bankItem: { select: { mockAnswer: { select: { createdAt: true } }, attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } } } } },
                    },
                },
            },
        }),
    ]);
    const prepSet = upcoming?.prepSets[0];
    const nextInterview = upcoming && {
        id: upcoming.id,
        when: upcoming.scheduledTime,
        job: upcoming.job.title,
        company: upcoming.job.employer.name?.trim() || "",
        total: prepSet?.items.length ?? 0,
        done: prepSet?.items.filter(({ bankItem: b }) => [b.mockAnswer?.createdAt, b.attempts[0]?.createdAt].some((d) => d && d >= prepSet.createdAt)).length ?? 0,
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                        {t("title")}
                    </h1>
                    <p className="text-lg text-sg-muted">{t("description")}</p>
                </div>
                <AddQuestion />
            </div>

            {total === 0 ? (
                <section className="sg-glass flex max-w-[640px] flex-col items-start gap-3 rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
                    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-[14px] bg-sg-lavender-soft text-sg-lavender-ink">
                        <BookOpen className="size-6" />
                    </span>
                    <h2 className="font-display sg-soft text-[22px] leading-7 font-semibold">{t("emptyTitle")}</h2>
                    <p className="text-sg-muted">{t("emptyBody")}</p>
                    <div className="flex flex-wrap gap-2.5">
                        <Link href="/candidate/practice" className={cn(inkButton, "h-11")}>
                            <Mic className="size-4" aria-hidden="true" />
                            {t("startPractice")}
                        </Link>
                        <Link href="/candidate/company-prep" className={cn(glassButton, "h-11")}>
                            {t("browseCompanyPrep")}
                        </Link>
                    </div>
                </section>
            ) : (
                <div className="flex flex-wrap items-start gap-6">
                    <section
                        aria-labelledby="qb-list"
                        className="sg-glass flex min-w-0 flex-[999_1_560px] flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7"
                    >
                        <h2 id="qb-list" className="sr-only">
                            {t("listLabel")}
                        </h2>
                        <BankFilters filters={filters} companies={companyRows.flatMap((c) => (c.companyName ? [c.companyName] : []))} counts={counts} />
                        {meaningUnavailable && <p className="text-sm text-sg-muted">{t("meaningUnavailable")}</p>}

                        {shown.length === 0 ? (
                            <div className="flex flex-col items-start gap-2 rounded-[18px] bg-sg-row px-4 py-5">
                                <p className="text-sg-muted">{t("noMatches")}</p>
                                <Link href="/candidate/question-bank" className={textLink}>
                                    {t("clear")}
                                </Link>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {shown.map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            href={`/candidate/question-bank/${item.id}`}
                                            className={cn("flex items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3.5 hover:bg-sg-chip", focusRing)}
                                        >
                                            <span className="flex min-w-0 flex-1 flex-col gap-2">
                                                <span className="font-bold text-pretty break-words">{item.questionText}</span>
                                                <span className="flex flex-wrap gap-1.5">
                                                    <StatusChip status={item.status} label={t(`statuses.${item.status}`)} />
                                                    {isDue(item.nextReview, now) && (
                                                        <span className={cn(bankChip, "bg-sg-coral/15")}>
                                                            <Clock className="size-3.5" aria-hidden="true" />
                                                            {t("dueChip")}
                                                        </span>
                                                    )}
                                                    <SourceChip source={item.source} label={t(`sources.${item.source}`)} />
                                                    <span className={bankChip}>{t(`types.${item.type as "HR"}`)}</span>
                                                    {item.companyName && <span className={cn(bankChip, "max-w-full truncate")}>{item.companyName}</span>}
                                                    <span className={cn(bankChip, "bg-transparent px-1 text-sg-muted")}>
                                                        {lastScore(item) != null
                                                            ? t("last", {
                                                                  score: lastScore(item)!.toFixed(1),
                                                              })
                                                            : t("notPractised")}
                                                    </span>
                                                </span>
                                            </span>
                                            <ChevronRight className="size-5 shrink-0 text-sg-muted" aria-hidden="true" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-[13px] leading-[18px] font-medium text-sg-muted" aria-live="polite">
                            {t("shown", { shown: shown.length, total })}
                        </p>
                    </section>
                    {(dueTotal > 0 || nextInterview) && (
                        <aside className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[340px]">
                            {dueTotal > 0 && (
                                <section aria-labelledby="qb-due" className="sg-glass flex flex-col gap-3 rounded-[24px] bg-sg-lavender-soft/40 p-5 sm:rounded-[28px] sm:p-6">
                                    <h2 id="qb-due" className="font-display sg-soft text-[22px] leading-7 font-semibold">
                                        {t("due.title")}
                                    </h2>
                                    <p className="text-sg-muted">{t("due.body", { count: dueTotal })}</p>
                                    <Link href="/candidate/question-bank/practise" className={cn(inkButton, "h-12 self-start")}>
                                        <Mic className="size-4" aria-hidden="true" />
                                        {t("due.start", { count: dueTotal })}
                                    </Link>
                                </section>
                            )}
                            {nextInterview && (
                                <section aria-labelledby="qb-prep" className="sg-glass flex flex-col gap-3 rounded-[24px] bg-sg-lavender-soft/40 p-5 sm:rounded-[28px] sm:p-6">
                                    <h2 id="qb-prep" className="font-display sg-soft text-[22px] leading-7 font-semibold">
                                        {nextInterview.when ? t("prep.panelTitle", { date: shortDay.format(nextInterview.when) }) : t("prep.panelTitleUnscheduled")}
                                    </h2>
                                    <p className="text-sg-muted">
                                        {nextInterview.total
                                            ? t("prep.panelReady", { job: nextInterview.job, company: nextInterview.company, count: nextInterview.total })
                                            : t("prep.panelNew", { job: nextInterview.job, company: nextInterview.company })}
                                    </p>
                                    {nextInterview.total > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-sg-track">
                                                <span className="block h-full rounded-full bg-sg-lavender-ink" style={{ width: `${(nextInterview.done / nextInterview.total) * 100}%` }} />
                                            </span>
                                            <span className="text-sm font-bold">{t("prep.progress", { done: nextInterview.done, total: nextInterview.total })}</span>
                                        </div>
                                    )}
                                    <Link href={`/candidate/question-bank/prep/${nextInterview.id}`} className={cn(outlineButton, "h-11 self-start")}>
                                        {t("prep.open")}
                                        <ChevronRight className="size-4" aria-hidden="true" />
                                    </Link>
                                </section>
                            )}
                        </aside>
                    )}
                </div>
            )}
        </div>
    );
}
