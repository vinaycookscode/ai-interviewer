import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { CandidatesTable } from "@/components/dashboard/candidates-table";
import { PageHeading, caption, outlineButton, panel } from "@/components/jobs/employer-ui";
import { CandidateFilters } from "./candidate-filters";
import { STATUS_FILTERS, type StatusFilter } from "./status-filters";

const PAGE_SIZE = 10;

export default async function CandidatesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; job?: string; status?: string }>;
}) {
    const t = await getTranslations("Employer.candidates");
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
    const q = params.q?.trim() ?? "";
    const jobId = params.job ?? "";
    const status: StatusFilter = (STATUS_FILTERS as readonly string[]).includes(params.status ?? "") ? (params.status as StatusFilter) : "all";
    const requestedPage = Math.max(1, Math.floor(Number(params.page)) || 1);

    // Always scoped to the signed-in employer's jobs; the filters only narrow it.
    const where: Prisma.InterviewWhereInput = {
        job: { employerId: userId, ...(jobId ? { id: jobId } : {}) },
        ...(status !== "all" ? { status } : {}),
        ...(q
            ? {
                  candidate: {
                      OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
                  },
              }
            : {}),
    };

    const [jobs, total, totalAll] = await Promise.all([
        db.job.findMany({ where: { employerId: userId, archivedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
        db.interview.count({ where }),
        db.interview.count({ where: { job: { employerId: userId } } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);

    const interviews = await db.interview.findMany({
        where,
        orderBy: [{ score: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
            job: { select: { title: true, requireResume: true, requireAadhar: true, requirePAN: true } },
        },
    });

    const pageHref = (n: number) => {
        const next = new URLSearchParams();
        if (q) next.set("q", q);
        if (jobId) next.set("job", jobId);
        if (status !== "all") next.set("status", status);
        if (n > 1) next.set("page", String(n));
        const query = next.toString();
        return query ? `/dashboard/candidates?${query}` : "/dashboard/candidates";
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading title={t("title")} subtitle={t("subtitle")} />

            {totalAll === 0 ? (
                <section className={cn(panel, "items-center text-center")}>
                    <h2 className="font-display sg-soft text-[22px] leading-7 font-semibold">{t("emptyTitle")}</h2>
                    <p className="max-w-[460px] text-sg-muted">{t("emptyBody")}</p>
                    <Link href="/dashboard/jobs" className={cn(outlineButton, "h-12 px-5 text-base")}>
                        {t("emptyCta")}
                    </Link>
                </section>
            ) : (
                <>
                    <CandidateFilters jobs={jobs} q={q} jobId={jobId} status={status} />

                    <section aria-label={t("listLabel")} className={cn(panel, "gap-3.5 sm:p-6")}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-semibold" role="status">
                                {t("count", { count: total })}
                            </span>
                            <span className={caption}>{t("sorted")}</span>
                        </div>

                        {interviews.length === 0 ? (
                            <p className="py-6 text-center text-sg-muted">{t("noMatch")}</p>
                        ) : (
                            <CandidatesTable interviews={interviews} />
                        )}

                        {totalPages > 1 && (
                            <nav aria-label={t("pages")} className="flex items-center justify-between gap-2 pt-1">
                                {page > 1 ? (
                                    <Link href={pageHref(page - 1)} className={cn(outlineButton, "h-10 text-sm")}>
                                        {t("previous")}
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className={cn(outlineButton, "h-10 text-sm opacity-50")}>
                                        {t("previous")}
                                    </span>
                                )}
                                <span className="text-sm text-sg-muted">{t("pageOf", { page, total: totalPages })}</span>
                                {page < totalPages ? (
                                    <Link href={pageHref(page + 1)} className={cn(outlineButton, "h-10 text-sm")}>
                                        {t("next")}
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className={cn(outlineButton, "h-10 text-sm opacity-50")}>
                                        {t("next")}
                                    </span>
                                )}
                            </nav>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
