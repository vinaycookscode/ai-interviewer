import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { InviteCandidateDialog } from "@/components/interviews/invite-candidate-dialog";
import { BulkInviteDialog } from "@/components/interviews/bulk-invite-dialog";
import { CandidateList } from "@/components/jobs/candidate-list";
import { Chip, PageHeading, caption, formatShortDate, glassButton, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { RankedCandidates } from "@/components/jobs/ranked-candidates";
import { RankedFilters } from "@/components/jobs/ranked-filters";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { hasFilters, parseFilters } from "@/lib/candidate-filters";
import { loadRanking, unfinishedWhere } from "@/lib/candidate-ranking";

export default async function JobDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { id } = await params;
    const filters = parseFilters(await searchParams);
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    // Loaded only if the signed-in employer owns it.
    const job = await db.job.findFirst({
        where: { id, employerId: userId, archivedAt: null },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            requireResume: true,
            requireAadhar: true,
            requirePAN: true,
            questions: { where: { archived: false }, orderBy: { createdAt: "asc" }, select: { id: true, text: true } },
            // Everyone invited, for the bulk invite's duplicate check
            interviews: { select: { candidate: { select: { email: true } } } },
        },
    });

    if (!job) notFound();

    // Ranked finished interviews, and the unfinished ones below them (AIIN-158)
    const showRanked = !filters.status || filters.status === "completed";
    const showUnfinished = filters.status !== "completed";
    const [ranking, unfinished] = await Promise.all([
        showRanked ? loadRanking(job.id, filters) : null,
        showUnfinished
            ? db.interview.findMany({
                  where: unfinishedWhere(job.id, filters),
                  orderBy: { createdAt: "desc" },
                  select: {
                    id: true,
                    status: true,
                    score: true,
                    token: true,
                    resumeUrl: true,
                    aadhaarUrl: true,
                    panUrl: true,
                    createdAt: true,
                    candidate: { select: { name: true, email: true } },
                },
              })
            : [],
    ]);

    const t = await getTranslations("Employer.job");
    const requirements = { requireResume: job.requireResume, requireAadhar: job.requireAadhar, requirePAN: job.requirePAN };
    const docs = [job.requireResume && t("docResume"), job.requirePAN && t("docPan"), job.requireAadhar && t("docAadhaar")].filter(Boolean) as string[];
    const tList = await getTranslations("Shortlist");
    const finished = ranking?.finished ?? (await db.interview.count({ where: { jobId: job.id, status: "COMPLETED" } }));
    const rows = unfinished.map((interview) => ({ ...interview, job: { title: job.title, ...requirements } }));
    const invitedEmails = job.interviews.map((i) => i.candidate.email.toLowerCase());
    const filtered = hasFilters(filters);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-3">
                <PageHeading
                    back={{ href: "/dashboard/jobs", label: t("back") }}
                    title={job.title}
                    actions={
                        <>
                            <Link href={`/dashboard/jobs/${job.id}/edit`} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                                {t("edit")}
                            </Link>
                            <BulkInviteDialog jobId={job.id} invitedEmails={invitedEmails} />
                            <InviteCandidateDialog jobId={job.id} />
                        </>
                    }
                />
                <div className="flex flex-wrap gap-2">
                    <Chip className="h-8 text-sm">{t("posted", { date: formatShortDate(job.createdAt) })}</Chip>
                    <Chip className="h-8 text-sm">{t("length", { count: job.questions.length, minutes: job.questions.length * 2 })}</Chip>
                    <Chip className="h-8 text-sm">
                        {docs.length > 0 ? t("docsRequired", { docs: new Intl.ListFormat("en-GB").format(docs) }) : t("noDocs")}
                    </Chip>
                </div>
            </div>

            <section id="candidates" aria-labelledby="candidates-title" className={cn(panel, "scroll-mt-24 gap-4 sm:p-6")}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="candidates-title" className={panelTitle}>
                        {t("candidates")}
                    </h2>
                    <span className={caption}>{t("invitedCompleted", { invited: job.interviews.length, completed: finished })}</span>
                </div>
                {ranking && finished > 0 && (
                    <ul className="flex flex-wrap gap-2">
                        <li>
                            <Chip className="h-8 text-sm">{tList("summary.finished", { count: finished })}</Chip>
                        </li>
                        {(["SHORTLISTED", "ON_HOLD", "REJECTED"] as const).map((d) => (
                            <li key={d}>
                                <Chip className="h-8 text-sm">{tList(`summary.${d}`, { count: ranking.counts[d] ?? 0 })}</Chip>
                            </li>
                        ))}
                    </ul>
                )}
                {job.interviews.length > 0 && <RankedFilters filters={filters} />}

                {ranking &&
                    (finished === 0 && !filtered ? (
                        <EmptyState
                            title={tList("noFinishedTitle")}
                            headingLevel="h3"
                            className="bg-sg-row shadow-none"
                            action={<InviteCandidateDialog jobId={job.id} />}
                        >
                            {tList("noFinishedBody", { invited: job.interviews.length })}
                        </EmptyState>
                    ) : ranking.total === 0 ? (
                        <EmptyState
                            title={tList("noMatchTitle")}
                            headingLevel="h3"
                            className="bg-sg-row shadow-none"
                            action={
                                <Link href={`/dashboard/jobs/${job.id}#candidates`} scroll={false} className={cn(glassButton, "h-12")}>
                                    {tList("clear")}
                                </Link>
                            }
                        >
                            {tList("noMatchBody")}
                        </EmptyState>
                    ) : (
                        <section aria-labelledby="ranked-title" className="flex flex-col gap-2">
                            <div className="flex flex-col">
                                <h3 id="ranked-title" className="font-bold">
                                    {tList("count", { count: ranking.total })}
                                </h3>
                                <p className="text-sm text-sg-muted">{tList("rankedNote")}</p>
                            </div>
                            <RankedCandidates jobId={job.id} rows={ranking.rows} total={ranking.total} filters={filters} />
                        </section>
                    ))}

                {rows.length > 0 && (
                    <section aria-labelledby="unfinished-title" className="flex flex-col gap-2 border-t border-sg-rule pt-4">
                        <div className="flex flex-col">
                            <h3 id="unfinished-title" className="font-bold">
                                {tList("unfinished")}
                            </h3>
                            <p className="text-sm text-sg-muted">{tList("unfinishedNote")}</p>
                        </div>
                        <CandidateList interviews={rows} />
                    </section>
                )}
            </section>

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
                    <section aria-labelledby="questions-title" className={panel}>
                        <h2 id="questions-title" className={panelTitle}>
                            {t("questions")}
                        </h2>
                        {job.questions.length > 0 ? (
                            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[23px]">
                                {job.questions.map((question) => (
                                    <li key={question.id} className="break-words">
                                        {question.text}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sg-muted">{t("noQuestions")}</p>
                        )}
                    </section>

                    <details className={cn(panel, "group gap-0")}>
                        <summary className="cursor-pointer rounded-md font-display sg-soft text-[22px] leading-7 font-semibold focus-visible:ring-[3px] focus-visible:ring-sg-lavender/50 focus-visible:outline-none">
                            {t("description")}
                        </summary>
                        <p className="mt-4 text-[15px] leading-[23px] break-words whitespace-pre-wrap text-sg-muted">{job.description}</p>
                    </details>

                    <DeleteJobButton jobId={job.id} />
                </div>
            </div>
        </div>
    );
}
