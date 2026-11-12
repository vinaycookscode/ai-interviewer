import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Lock } from "lucide-react";
import type { HiringDecision } from "@prisma/client";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { loadRankingByJob } from "@/lib/candidate-ranking";
import { DecisionChip } from "@/components/jobs/ranked-candidates";
import { focusRing } from "@/components/soft-glass/classes";
import { PageHeading, caption, outlineButton, panel, panelTitle, textLink } from "@/components/jobs/employer-ui";
import { CandidateFilters } from "./candidate-filters";

/** How many of each job's best candidates the page shows; the job page has the rest. */
const PER_JOB = 5;
const DECISIONS: HiringDecision[] = ["UNDECIDED", "SHORTLISTED", "ON_HOLD", "REJECTED"];
const th = "px-3 py-2.5 text-left text-[13px] font-bold whitespace-nowrap text-sg-muted";
const td = "border-t border-sg-rule px-3 py-3 align-middle";

/** Every job's top finished candidates, ranked as on the job page (AIIN-217), from the approved "Candidates by job" artboards. */
export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ q?: string; d?: string }> }) {
    const t = await getTranslations("Employer.candidates");
    const tApps = await getTranslations("Applications");
    const tShortlist = await getTranslations("Shortlist");
    const isEnabled = await checkFeature(FEATURES.CANDIDATE_SEARCH);

    if (!isEnabled) {
        return (
            <div className="flex flex-col gap-6 sm:gap-9">
                <PageHeading title={t("title")} />
                <section className={cn(panel, "max-w-[560px] items-center text-center")}>
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-sg-chip">
                        <Lock className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="font-display sg-soft text-[22px] leading-7 font-semibold">{t("lockedTitle")}</h2>
                    <p className="text-sg-muted">{t("lockedBody")}</p>
                </section>
            </div>
        );
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const params = await searchParams;
    const q = params.q?.trim().slice(0, 100) ?? "";
    const decision = (DECISIONS as string[]).includes(params.d ?? "") ? (params.d as HiringDecision) : null;
    const filtering = !!(q || decision);
    // The report's back link returns to this view, filters and all
    const here = `/dashboard/candidates${filtering ? `?${new URLSearchParams({ ...(q && { q }), ...(decision && { d: decision }) })}` : ""}`;
    const reportHref = (id: string) => `/interview/${id}/feedback?from=${encodeURIComponent(here)}`;

    // Only the signed-in employer's open jobs
    const jobs = await loadRankingByJob(userId, { q, decision }, PER_JOB);
    // With a filter on, a job shows only if someone in it matches
    const shown = filtering ? jobs.filter((j) => j.rows.length) : jobs;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading title={t("title")} subtitle={t("subtitle")} />

            {jobs.length === 0 ? (
                <section className={cn(panel, "items-center text-center")}>
                    <h2 className="font-display sg-soft text-[22px] leading-7 font-semibold">{t("emptyTitle")}</h2>
                    <p className="max-w-[460px] text-sg-muted">{t("emptyBody")}</p>
                    <Link href="/dashboard/jobs" className={cn(outlineButton, "h-12 px-5 text-base")}>
                        {t("emptyCta")}
                    </Link>
                </section>
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        <CandidateFilters q={q} decision={decision} />
                        <p className={caption}>{t("topNote", { count: PER_JOB })}</p>
                    </div>

                    {shown.length === 0 ? (
                        <section className={cn(panel, "items-start")} role="status">
                            <p className="text-sg-muted">{t("noOneMatches")}</p>
                            <Link href="/dashboard/candidates" className={textLink}>
                                {t("clearFilters")}
                            </Link>
                        </section>
                    ) : (
                        shown.map((job) => (
                            <section key={job.id} aria-labelledby={`job-${job.id}`} className={cn(panel, "gap-3 sm:p-6")}>
                                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <h2 id={`job-${job.id}`} className={cn(panelTitle, "break-words")}>
                                            {job.title}
                                        </h2>
                                        <span className="text-sm text-sg-muted">
                                            {job.finished
                                                ? t("jobMeta", { finished: job.finished, unfinished: job.unfinished })
                                                : t("jobMetaNone", { unfinished: job.unfinished })}
                                        </span>
                                    </div>
                                    <span className="flex flex-wrap items-center gap-4">
                                        <Link href={`/dashboard/jobs/${job.id}/applications`} className={cn(textLink, "inline-flex items-center gap-1")}>
                                            {tApps("open")}
                                            <ChevronRight className="size-3.5" aria-hidden="true" />
                                        </Link>
                                        <Link href={`/dashboard/jobs/${job.id}#candidates`} className={cn(textLink, "inline-flex items-center gap-1")}>
                                            {job.finished ? t("fullRanking") : t("openJob")}
                                            <ChevronRight className="size-3.5" aria-hidden="true" />
                                        </Link>
                                    </span>
                                </div>

                                {job.rows.length === 0 ? (
                                    <p className="rounded-[18px] bg-sg-row px-4 py-3.5 text-sg-muted">{t("ranksAppear")}</p>
                                ) : (
                                    <>
                                        <div className="-mx-2 hidden overflow-x-auto sm:block">
                                            <table className="w-full min-w-[560px] border-collapse text-[15px]">
                                                <caption className="sr-only">{t("tableCaption", { job: job.title })}</caption>
                                                <thead>
                                                    <tr>
                                                        <th scope="col" className={th}>
                                                            {t("colRank")}
                                                        </th>
                                                        <th scope="col" className={th}>
                                                            {t("colCandidate")}
                                                        </th>
                                                        <th scope="col" className={cn(th, "text-right")}>
                                                            {t("colScore")}
                                                        </th>
                                                        <th scope="col" className={th}>
                                                            {t("colDecision")}
                                                        </th>
                                                        <th scope="col" className={th}>
                                                            <span className="sr-only">{t("colActions")}</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {job.rows.map((r) => (
                                                        <tr key={r.id}>
                                                            <td className={cn(td, "w-11 font-bold text-sg-muted")}>#{r.rank}</td>
                                                            <td className={td}>
                                                                <span className="flex min-w-0 flex-col">
                                                                    <span className="font-semibold break-words">{r.name || r.email}</span>
                                                                    {r.name && <span className="text-[13px] break-all text-sg-muted">{r.email}</span>}
                                                                </span>
                                                            </td>
                                                            <td className={cn(td, "text-right text-[17px] font-bold")}>{r.score?.toFixed(1) ?? "—"}</td>
                                                            <td className={td}>
                                                                <DecisionChip decision={r.decision} label={tShortlist(`decisions.${r.decision}`)} />
                                                            </td>
                                                            <td className={cn(td, "text-right")}>
                                                                <Link
                                                                    href={reportHref(r.id)}
                                                                    aria-label={t("viewReportAria", { name: r.name || r.email })}
                                                                    className={cn(textLink, "text-sm")}
                                                                >
                                                                    {t("viewReport")}
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <ul className="flex flex-col gap-2 sm:hidden">
                                            {job.rows.map((r) => (
                                                <li key={r.id}>
                                                    <Link
                                                        href={reportHref(r.id)}
                                                        aria-label={t("viewReportAria", { name: r.name || r.email })}
                                                        className={cn("flex items-center gap-3 rounded-[18px] bg-sg-row px-3.5 py-3", focusRing)}
                                                    >
                                                        <span className="w-7 font-bold text-sg-muted">
                                                            <span aria-hidden="true">#{r.rank}</span>
                                                            <span className="sr-only">{t("rank", { rank: r.rank })}</span>
                                                        </span>
                                                        <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                                                            <span className="font-semibold break-words">{r.name || r.email}</span>
                                                            <DecisionChip decision={r.decision} label={tShortlist(`decisions.${r.decision}`)} />
                                                        </span>
                                                        <span className="font-display sg-soft text-[22px] font-semibold">{r.score?.toFixed(1) ?? "—"}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </section>
                        ))
                    )}
                </>
            )}
        </div>
    );
}
