import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { bestOf, firstSentence, mostTelling, parseCompareIds } from "@/lib/compare";
import { DecisionChip } from "@/components/jobs/ranked-candidates";
import { CompareDecision } from "@/components/jobs/compare-decision";
import { focusRing } from "@/components/soft-glass/classes";
import { outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ ids?: string | string[] }>;
}

const card = "flex flex-col gap-1 rounded-[18px] bg-sg-row px-3.5 py-3 text-left";

/** Two to four of a job's finished candidates side by side, question by question (AIIN-160), from the approved Compare artboards. */
export default async function ComparePage({ params, searchParams }: PageProps) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    if (session.user.role !== "EMPLOYER") notFound();

    const { id: jobId } = await params;
    // Only the signed-in employer's job (AC5)
    const job = await db.job.findFirst({ where: { id: jobId, employerId: userId }, select: { id: true, title: true } });
    if (!job) notFound();
    const t = await getTranslations("Shortlist");

    const refuse = (title: string, body: string) => (
        <div className="flex flex-col gap-6">
            <section role="alert" className={cn(panel, "max-w-[560px]")}>
                <h1 className={panelTitle}>{title}</h1>
                <p className="text-sg-muted">{body}</p>
                <Link href={`/dashboard/jobs/${job.id}#candidates`} className={cn(outlineButton, "h-11 self-start")}>
                    {t("compare.backToJob")}
                </Link>
            </section>
        </div>
    );

    const parsed = parseCompareIds((await searchParams).ids);
    if (!parsed.ok) return refuse(t("compare.pickCount"), t("compare.pickCountBody"));

    const interviews = await db.interview.findMany({
        // Any id that isn't one of this employer's interviews makes the whole page not-found (AC5)
        where: { id: { in: parsed.ids }, job: { employerId: userId } },
        select: {
            id: true,
            jobId: true,
            status: true,
            score: true,
            decision: true,
            candidate: { select: { name: true, email: true } },
            personalityProfile: { select: { strengths: true, weaknesses: true, confidenceScore: true, cultureFitScore: true } },
            answers: { select: { questionId: true, score: true, feedback: true, transcript: true } },
        },
    });
    if (interviews.length !== parsed.ids.length) notFound();
    if (interviews.some((i) => i.jobId !== job.id)) return refuse(t("compare.sameJob"), t("compare.sameJobBody"));
    const unfinished = interviews.find((i) => i.status !== "COMPLETED");
    if (unfinished) return refuse(t("compare.notFinished", { name: unfinished.candidate.name || unfinished.candidate.email }), t("compare.notFinishedBody"));

    // In the order picked, which is the order on the ranked list
    const people = parsed.ids.map((id) => interviews.find((i) => i.id === id)!);
    const answered = new Set(people.flatMap((p) => p.answers.map((a) => a.questionId)));
    // The job's questions in order, keeping an archived one if someone here answered it
    const questions = (await db.question.findMany({ where: { jobId: job.id }, orderBy: { createdAt: "asc" }, select: { id: true, text: true, archived: true } })).filter(
        (q) => !q.archived || answered.has(q.id)
    );
    const cell = (p: (typeof people)[number], questionId: string) => p.answers.find((a) => a.questionId === questionId) ?? null;
    const grid = questions.map((q) => people.map((p) => cell(p, q.id)?.score ?? null));
    const quoteAt = mostTelling(grid);
    const name = (p: (typeof people)[number]) => p.candidate.name || p.candidate.email;
    const outOf10 = (n: number | null | undefined) => (n == null ? "—" : t("compare.outOf10", { score: Math.round(n) }));

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-2">
                <Link href={`/dashboard/jobs/${job.id}#candidates`} className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {job.title}
                </Link>
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                    {t("compare.title", { count: people.length })}
                </h1>
                <p className="text-lg text-sg-muted">{t("compare.lead", { job: job.title, count: questions.length })}</p>
                <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-sg-muted">
                    {questions.map((q, i) => (
                        <li key={q.id}>
                            <span className="font-bold text-sg-text">Q{i + 1}</span> {q.text}
                        </li>
                    ))}
                </ol>
            </div>

            {/* Scrolls inside itself on a phone, never the page (AC7) */}
            <div className="-mx-1 overflow-x-auto px-1 pb-2">
                <table className="border-separate border-spacing-x-3 border-spacing-y-2" style={{ minWidth: `${people.length * 240}px` }}>
                    <caption className="sr-only">{t("compare.tableCaption")}</caption>
                    <colgroup>
                        <col className="w-12" />
                        {people.map((p) => (
                            <col key={p.id} className="w-[min(280px,72vw)]" />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            <td />
                            {people.map((p) => (
                                <th key={p.id} scope="col" className="sg-glass rounded-[22px] p-4 text-left align-top font-normal">
                                    <span className="flex items-start justify-between gap-3">
                                        <span className="min-w-0 font-bold break-words">{name(p)}</span>
                                        <span className="font-display sg-soft text-[26px] leading-none font-semibold">{p.score?.toFixed(1) ?? "—"}</span>
                                    </span>
                                    <span className="mt-2 flex flex-col items-start gap-2 text-[13px]">
                                        <DecisionChip decision={p.decision} label={t(`decisions.${p.decision}`)} />
                                        {p.personalityProfile?.strengths[0] && (
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp className="size-3.5 shrink-0" aria-hidden="true" />
                                                <span>
                                                    <span className="sr-only">{t("compare.strongest")}: </span>
                                                    {p.personalityProfile.strengths[0]}
                                                </span>
                                            </span>
                                        )}
                                        {p.personalityProfile?.weaknesses[0] && (
                                            <span className="flex items-center gap-1.5 text-sg-muted">
                                                <TrendingDown className="size-3.5 shrink-0" aria-hidden="true" />
                                                <span>
                                                    <span className="sr-only">{t("compare.weakest")}: </span>
                                                    {p.personalityProfile.weaknesses[0]}
                                                </span>
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q, qi) => {
                            const best = bestOf(grid[qi]);
                            return (
                                <tr key={q.id}>
                                    <th scope="row" className="align-top pt-3 text-left text-[13px] font-bold">
                                        Q{qi + 1}
                                        <span className="sr-only">: {q.text}</span>
                                    </th>
                                    {people.map((p, pi) => {
                                        const a = cell(p, q.id);
                                        return (
                                            <td key={p.id} className="align-top">
                                                {a ? (
                                                    <details className={cn(card, "group")}>
                                                        <summary className={cn("flex cursor-pointer list-none flex-col gap-1 rounded-md", focusRing)}>
                                                            <span className="flex items-center justify-between gap-2">
                                                                <span className="font-bold">{a.score?.toFixed(1) ?? "—"}</span>
                                                                {best[pi] && (
                                                                    <span className="rounded-full bg-sg-lavender-soft px-2 py-0.5 text-[12px] font-bold text-sg-lavender-ink">{t("compare.best")}</span>
                                                                )}
                                                            </span>
                                                            {firstSentence(a.feedback) && <span className="text-sm">{firstSentence(a.feedback)}</span>}
                                                            <span className="text-[13px] font-bold text-sg-muted underline-offset-4 group-open:hidden">{t("compare.readAnswer")}</span>
                                                        </summary>
                                                        <p className="mt-1 text-sm whitespace-pre-line text-sg-muted">{a.transcript}</p>
                                                    </details>
                                                ) : (
                                                    <p className={cn(card, "text-sm text-sg-muted")}>{t("compare.notAnswered")}</p>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {questions.length > 0 && (
                            <tr>
                                <th scope="row" className="align-top pt-3 text-left text-[13px] font-bold">
                                    <span className="sr-only">{t("compare.inTheirWords", { n: quoteAt + 1 })}</span>
                                </th>
                                {people.map((p) => {
                                    const a = cell(p, questions[quoteAt].id);
                                    return (
                                        <td key={p.id} className="align-top px-1">
                                            <span className="text-[13px] font-bold text-sg-muted">{t("compare.inTheirWords", { n: quoteAt + 1 })}</span>
                                            <p className="text-sm text-sg-muted">{a?.transcript ? `“${a.transcript.slice(0, 110).trimEnd()}${a.transcript.length > 110 ? "…" : ""}”` : t("compare.notAnswered")}</p>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                        <tr>
                            <th scope="row" className="sr-only">
                                {t("compare.confidence")} · {t("compare.cultureFit")}
                            </th>
                            {people.map((p) => (
                                <td key={p.id} className="align-top">
                                    <span className="grid grid-cols-2 gap-2">
                                        <span className={card}>
                                            <span className="text-[13px] font-bold">{t("compare.confidence")}</span>
                                            <span className="font-bold">{outOf10(p.personalityProfile?.confidenceScore)}</span>
                                        </span>
                                        <span className={card}>
                                            <span className="text-[13px] font-bold">{t("compare.cultureFit")}</span>
                                            {/* Stored 0–100 */}
                                            <span className="font-bold">{outOf10(p.personalityProfile ? p.personalityProfile.cultureFitScore / 10 : null)}</span>
                                        </span>
                                    </span>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <th scope="row" className="sr-only">
                                {t("compare.decision")}
                            </th>
                            {people.map((p) => (
                                <td key={p.id} className="align-top pt-2">
                                    <CompareDecision interviewId={p.id} name={name(p)} current={p.decision} />
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
