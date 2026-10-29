import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { coralButton } from "@/components/soft-glass/classes";
import { Mascot } from "@/components/soft-glass/mascot";
import { ScoreChart, StatusChart, type ScoreBin } from "@/components/dashboard/analytics-charts";
import { Figure, PageHeading, caption, formatShortDate, panel, panelTitle, row, textLink } from "@/components/jobs/employer-ui";

const BIN_EDGES = [0, 2, 4, 6, 8, 10];

export default async function DashboardPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const t = await getTranslations("Employer.overview");

    const jobs = await db.job.findMany({
        where: { employerId: userId, archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            createdAt: true,
            _count: { select: { questions: { where: { archived: false } } } },
            interviews: { select: { status: true, score: true } },
        },
    });

    const newJob = (
        <Link href="/dashboard/jobs/new" className={cn(coralButton, "h-12 px-[22px]")}>
            <Plus className="size-5" aria-hidden="true" />
            {t("newJob")}
        </Link>
    );

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col gap-6 sm:gap-9">
                <PageHeading title={t("title")} subtitle={t("subtitle")} />
                <section className="sg-glass sg-shadow-lg flex flex-col items-center gap-3 rounded-[28px] px-6 py-7 text-center sm:py-12">
                    <Mascot className="size-16" />
                    <h2 className="font-display sg-soft text-[26px] leading-[33px] font-semibold tracking-[-0.015em]">{t("emptyTitle")}</h2>
                    <p className="max-w-[460px] text-sg-muted">{t("emptyBody")}</p>
                    <Link href="/dashboard/jobs/new" className={cn(coralButton, "mt-1 h-14 w-full px-[26px] text-[17px] sm:w-auto")}>
                        {t("emptyCta")}
                    </Link>
                </section>
            </div>
        );
    }

    const interviews = jobs.flatMap((job) => job.interviews);
    const completed = interviews.filter((i) => i.status === "COMPLETED");
    const inProgress = interviews.filter((i) => i.status === "IN_PROGRESS").length;
    const notStarted = interviews.filter((i) => i.status === "PENDING").length;
    const scored = completed.filter((i): i is typeof i & { score: number } => i.score !== null);
    const average = scored.length > 0 ? scored.reduce((sum, i) => sum + i.score, 0) / scored.length : null;

    const bins: ScoreBin[] = BIN_EDGES.slice(0, -1).map((from, i) => {
        const to = BIN_EDGES[i + 1];
        const last = i === BIN_EDGES.length - 2;
        return {
            label: `${from}–${to}`,
            from,
            to,
            count: scored.filter((s) => s.score >= from && (last ? s.score <= to : s.score < to)).length,
        };
    });

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading title={t("title")} subtitle={t("subtitle")} actions={newJob} />

            <ul className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-4">
                <li className="sg-glass rounded-[24px] p-5">
                    <Figure value={jobs.length} label={t("statJobs")} />
                </li>
                <li className="sg-glass rounded-[24px] p-5">
                    <Figure value={interviews.length} label={t("statInvited")} />
                </li>
                <li className="sg-glass rounded-[24px] p-5">
                    <Figure value={completed.length} label={t("statCompleted")} />
                </li>
                <li className="sg-glass rounded-[24px] p-5">
                    <Figure value={average === null ? "—" : average.toFixed(1)} label={t("statAverage")} />
                </li>
            </ul>

            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                <section aria-labelledby="scores-title" className={panel}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 id="scores-title" className={panelTitle}>
                            {t("scoresTitle")}
                        </h2>
                        <span className={caption}>{t("scoresCaption", { count: scored.length })}</span>
                    </div>
                    {scored.length > 0 ? <ScoreChart bins={bins} /> : <p className="text-sg-muted">{t("scoresEmpty")}</p>}
                </section>

                <section aria-labelledby="status-title" className={panel}>
                    <h2 id="status-title" className={panelTitle}>
                        {t("statusTitle")}
                    </h2>
                    <StatusChart
                        rows={[
                            { label: t("statusCompleted"), count: completed.length },
                            { label: t("statusInProgress"), count: inProgress },
                            { label: t("statusNotStarted"), count: notStarted },
                        ]}
                    />
                    {notStarted > 0 && (
                        <p className="text-[15px] leading-[23px]">
                            <strong>{t("notStartedLead", { count: notStarted })}</strong>{" "}
                            <span className="text-sg-muted">{t("notStartedHint")}</span>
                        </p>
                    )}
                </section>
            </div>

            <section aria-labelledby="recent-title" className={panel}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="recent-title" className={panelTitle}>
                        {t("recentTitle")}
                    </h2>
                    <Link href="/dashboard/jobs" className={textLink}>
                        {t("allJobs")}
                    </Link>
                </div>
                <ul className="flex flex-col gap-2">
                    {jobs.slice(0, 3).map((job) => {
                        const done = job.interviews.filter((i) => i.status === "COMPLETED").length;
                        return (
                            <li key={job.id} className={cn(row, "flex flex-wrap items-center gap-x-4 gap-y-2")}>
                                <div className="flex min-w-0 flex-[1_1_220px] flex-col">
                                    <Link href={`/dashboard/jobs/${job.id}`} className={cn(textLink, "self-start text-base whitespace-normal break-words")}>
                                        {job.title}
                                    </Link>
                                    <span className={caption}>
                                        {t("posted", { date: formatShortDate(job.createdAt), count: job._count.questions })}
                                    </span>
                                </div>
                                <span className="text-sm text-sg-muted">
                                    {t.rich("completedOf", {
                                        done,
                                        invited: job.interviews.length,
                                        strong: (chunks) => <strong className="text-sg-text">{chunks}</strong>,
                                    })}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}
