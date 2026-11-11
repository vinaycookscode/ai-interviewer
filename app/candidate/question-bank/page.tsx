import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpen, ChevronRight, Mic } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { similarities } from "@/lib/bank/meaning";
import { keywordMatch, meaningMatches, mergeResults, parseBankFilters } from "@/lib/bank/search";
import { AddQuestion } from "@/components/question-bank/add-question";
import { BankFilters } from "@/components/question-bank/bank-filters";
import { SourceChip, StatusChip, bankChip } from "@/components/question-bank/chips";
import { focusRing } from "@/components/soft-glass/classes";
import { glassButton, inkButton, textLink } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("QuestionBank");
    return { title: t("title") };
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
        db.bankItem.findMany({ where: { userId, companyName: { not: null } }, distinct: ["companyName"], select: { companyName: true }, orderBy: { companyName: "asc" } }),
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
                mockAnswer: { select: { score: true } },
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

    const counts = { all: found.length, NEW: 0, PRACTISING: 0, CONFIDENT: 0 };
    for (const item of found) counts[item.status]++;
    const shown = filters.status ? found.filter((item) => item.status === filters.status) : found;

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
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
                <section aria-labelledby="qb-list" className="sg-glass flex min-w-0 flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7">
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
                                                <SourceChip source={item.source} label={t(`sources.${item.source}`)} />
                                                <span className={bankChip}>{t(`types.${item.type as "HR"}`)}</span>
                                                {item.companyName && <span className={cn(bankChip, "max-w-full truncate")}>{item.companyName}</span>}
                                                <span className={cn(bankChip, "bg-transparent px-1 text-sg-muted")}>
                                                    {item.mockAnswer?.score != null ? t("last", { score: item.mockAnswer.score.toFixed(1) }) : t("notPractised")}
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
            )}
        </div>
    );
}
