import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BankNotes } from "@/components/question-bank/bank-notes";
import { SourceChip, StatusChip, bankChip } from "@/components/question-bank/chips";
import { focusRing } from "@/components/soft-glass/classes";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("QuestionBank");
    return { title: t("title") };
}

const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** One question in the candidate's bank (AIIN-210), from the approved "A question" artboards. */
export default async function BankQuestionPage({ params }: PageProps) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const { id } = await params;
    // Only the candidate's own item (AC3)
    const item = await db.bankItem.findFirst({
        where: { id, userId },
        select: {
            questionText: true,
            status: true,
            type: true,
            source: true,
            companyName: true,
            notes: true,
            aiAnswer: true,
            companyQuestionId: true,
            companyQuestion: { select: { answer: true } },
            mockAnswer: { select: { id: true, transcript: true, score: true, feedback: true, createdAt: true, mockInterview: { select: { role: true } } } },
        },
    });
    if (!item) notFound();

    const t = await getTranslations("QuestionBank");
    const answerSelect = { createdAt: true, score: true, mockInterview: { select: { role: true } } } as const;
    // Every practice of a Company prep question, newest first; a question Gemini wrote was asked once
    const attempts = item.companyQuestionId
        ? await db.mockAnswer.findMany({ where: { companyQuestionId: item.companyQuestionId, mockInterview: { userId } }, orderBy: { createdAt: "desc" }, take: 10, select: answerSelect })
        : item.mockAnswer
          ? [item.mockAnswer]
          : [];
    const latest = item.mockAnswer;
    // Company prep's own answer, or one Gemini wrote for a question the candidate added (AIIN-211)
    const strong = item.companyQuestion?.answer ?? item.aiAnswer;
    const strongFrom = item.companyQuestion?.answer
        ? item.companyName && t("detail.fromCompany", { company: item.companyName })
        : t("detail.aiWritten");

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-3">
                <Link href="/candidate/question-bank" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t("detail.back")}
                </Link>
                <h1 className="font-display sg-soft max-w-[760px] text-[28px] font-semibold leading-[1.18] tracking-[-0.02em] text-balance break-words sm:text-[36px]">
                    {item.questionText}
                </h1>
                <span className="flex flex-wrap gap-1.5">
                    <StatusChip status={item.status} label={t(`statuses.${item.status}`)} />
                    <span className={bankChip}>{t(`types.${item.type as "HR"}`)}</span>
                    <SourceChip source={item.source} label={t(`sources.${item.source}`)} />
                    {item.companyName && <span className={bankChip}>{item.companyName}</span>}
                </span>
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
                    <section aria-labelledby="qb-latest" className={panel}>
                        {latest ? (
                            <>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h2 id="qb-latest" className={panelTitle}>
                                        {t("detail.latestAnswer")}
                                    </h2>
                                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">
                                        {t("detail.answeredOn", { date: shortDate.format(latest.createdAt), score: (latest.score ?? 0).toFixed(1) })}
                                    </span>
                                </div>
                                <blockquote className="rounded-[18px] bg-sg-row px-4 py-3.5 whitespace-pre-line break-words">“{latest.transcript}”</blockquote>
                                {latest.feedback && (
                                    <div className="flex items-start gap-2.5 rounded-[18px] bg-sg-lavender-soft px-4 py-3.5">
                                        <Sparkles className="mt-1 size-4 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                                        <span className="flex flex-col gap-0.5">
                                            <span className="font-bold">{t("detail.whatToFix")}</span>
                                            <span>{latest.feedback}</span>
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h2 id="qb-latest" className={panelTitle}>
                                    {t("detail.noAnswerTitle")}
                                </h2>
                                <p className="text-sg-muted">{t("detail.noAnswerBody")}</p>
                            </>
                        )}
                    </section>

                    {strong && (
                        <details className="sg-glass group rounded-[22px]">
                            <summary className={cn("flex cursor-pointer list-none items-center gap-2 rounded-[22px] px-5 py-4 font-bold", focusRing)}>
                                <span aria-hidden="true" className="inline-block text-[11px] transition-transform group-open:rotate-90">
                                    ▶
                                </span>
                                {t("detail.strongAnswer")}
                            </summary>
                            <div className="flex flex-col gap-1 px-5 pb-5">
                                {strongFrom && <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{strongFrom}</span>}
                                <p className="whitespace-pre-line">{strong}</p>
                            </div>
                        </details>
                    )}
                </div>

                <aside className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]">
                    {attempts.length > 0 && (
                        <section aria-labelledby="qb-attempts" className={panel}>
                            <h2 id="qb-attempts" className={panelTitle}>
                                {t("detail.attempts")}
                            </h2>
                            <ul className="flex flex-col">
                                {attempts.map((a, i) => (
                                    <li key={i} className="flex items-center justify-between gap-3 border-t border-sg-rule py-3 first:border-t-0 first:pt-0">
                                        <span className="flex min-w-0 flex-col">
                                            <span className="font-bold">{shortDate.format(a.createdAt)}</span>
                                            <span className="text-[13px] leading-[18px] text-sg-muted">{t("detail.attemptSource", { role: a.mockInterview.role })}</span>
                                        </span>
                                        <span className="font-display sg-soft text-[22px] font-semibold">{(a.score ?? 0).toFixed(1)}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    <BankNotes itemId={id} initial={item.notes ?? ""} />
                </aside>
            </div>
        </div>
    );
}
