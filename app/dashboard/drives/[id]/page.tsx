import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowRight, CheckCircle2, Flag, MailX, PencilLine, Upload, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { REOPEN_DAYS, canReopen, driveStatus } from "@/lib/drives";
import { PageHeading, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { DriveStatusChip, istShort } from "@/components/drives/drive-status";
import { ApplyCutoff, DriveActions } from "@/components/drives/drive-actions";
import { EmailProblems } from "@/components/drives/email-problems";
import { processOutbox } from "@/lib/outbox";
import { processGrading } from "@/lib/grading-queue";
import { driveFunnel, driveProblems } from "@/lib/drive-dashboard";
import { emptyCounts, funnelStages } from "@/lib/drive-funnel";
import { AutoRefresh } from "@/components/drives/auto-refresh";
import { coralButton, focusRing } from "@/components/soft-glass/classes";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Drives");
    return { title: t("title") };
}


/** One drive (AIIN-165): its dates, status, colleges and how far candidates got. Only its employer sees it (AC8). */
export default async function DrivePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Drives");

    const drive = await db.drive.findFirst({
        where: { id, employerId: userId },
        select: {
            id: true,
            name: true,
            draft: true,
            opensAt: true,
            closesAt: true,
            closedAt: true,
            autoShortlist: true,
            interviewCutoff: true,
            aptitudeEnabled: true,
            aptitudeCutoff: true,
            aptitudeTest: { select: { name: true } },
            job: { select: { id: true, title: true } },
            colleges: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, city: true } },
            _count: { select: { candidates: true } },
        },
    });
    if (!drive) notFound();

    const [byStage, byEmail, problems] = await Promise.all([
        db.driveCandidate.groupBy({ by: ["stage"], where: { driveId: drive.id }, _count: { _all: true } }),
        db.outboundEmail.groupBy({ by: ["status"], where: { driveId: drive.id }, _count: { _all: true } }),
        db.outboundEmail.findMany({
            where: { driveId: drive.id, status: { in: ["FAILED", "BOUNCED"] } },
            orderBy: { updatedAt: "desc" },
            take: 50,
            select: { driveCandidateId: true, to: true, status: true },
        }),
    ]);
    // Aptitude results, best first: percent, pass or not, and how often they left the tab (AIIN-169 AC9)
    const results = drive.aptitudeEnabled
        ? await db.aptitudeAttempt.findMany({
              where: { driveCandidate: { driveId: drive.id }, submittedAt: { not: null } },
              orderBy: [{ percent: "desc" }, { submittedAt: "asc" }],
              take: 50,
              select: { id: true, percent: true, passed: true, tabSwitches: true, driveCandidate: { select: { userId: true, college: { select: { name: true } } } } },
          })
        : [];
    const people = results.length
        ? new Map((await db.user.findMany({ where: { id: { in: results.map((r) => r.driveCandidate.userId) } }, select: { id: true, name: true, email: true } })).map((u) => [u.id, u]))
        : new Map<string, { id: string; name: string | null; email: string }>();
    const emailCount = (s: string) => byEmail.find((r) => r.status === s)?._count._all ?? 0;
    // Emails waiting to go out are sent after this page is served (no per-minute cron on this plan, AIIN-167)
    if (emailCount("QUEUED") > 0) after(() => processOutbox());
    // ...and answers waiting to be graded (AIIN-170)
    if (await db.answer.count({ where: { interview: { driveId: drive.id }, gradingStatus: "PENDING" } })) after(() => processGrading());
    const now = new Date();
    const status = driveStatus(drive, now);
    const reopen = canReopen(drive, now);
    const [funnelData, attention] = await Promise.all([driveFunnel(drive.id, drive.interviewCutoff), driveProblems(drive.id)]);
    const stages = funnelStages(funnelData.total, { aptitude: drive.aptitudeEnabled, cutoff: drive.interviewCutoff !== null });
    const collegeRows = [
        ...drive.colleges.map((c) => ({ id: c.id as string | null, name: c.name, counts: funnelData.byCollege.get(c.id) ?? emptyCounts() })),
        ...(funnelData.byCollege.has(null) ? [{ id: null, name: t("noCollege"), counts: funnelData.byCollege.get(null)! }] : []),
    ];
    const stageCount = (s: string) => byStage.find((r) => r.stage === s)?._count._all ?? 0;
    const dates =
        drive.opensAt && drive.closesAt ? t("range", { from: istShort.format(drive.opensAt), to: istShort.format(drive.closesAt) }) : t("notScheduled");

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={{ href: "/dashboard/drives", label: t("back") }}
                title={drive.name}
                subtitle={`${drive.job.title} · ${dates} · ${t("colleges", { count: drive.colleges.length })}`}
                actions={
                    <span className="flex flex-wrap items-center gap-2">
                        <DriveStatusChip status={status} label={t(`status.${status}`)} />
                        <Link href={`/dashboard/drives/${drive.id}/edit`} className={cn(outlineButton, "h-10 text-sm")}>
                            <PencilLine className="size-4" aria-hidden="true" />
                            {t("edit")}
                        </Link>
                        {(status === "SCHEDULED" || status === "LIVE") && (
                            <Link href={`/dashboard/drives/${drive.id}/import`} className={cn(outlineButton, "h-10 text-sm")}>
                                <Upload className="size-4" aria-hidden="true" />
                                {t("inviteCsv")}
                            </Link>
                        )}
                        <DriveActions
                            id={drive.id}
                            canClose={status === "LIVE" || status === "SCHEDULED"}
                            canReopen={reopen}
                            canDelete={drive._count.candidates === 0}
                        />
                    </span>
                }
            />
            {status === "CLOSED" && (
                <p className="rounded-2xl bg-sg-chip px-4 py-3 text-sm">
                    {t("closedNote")}{" "}
                    {reopen && drive.closedAt && t("reopenUntil", { when: istShort.format(new Date(drive.closedAt.getTime() + REOPEN_DAYS * 86_400_000)) })}
                </p>
            )}
            <AutoRefresh live={status === "LIVE"} at={now.toISOString()} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section aria-labelledby="dr-funnel" className={cn(panel, "gap-3")}>
                    <h2 id="dr-funnel" className={panelTitle}>
                        {t("funnel")}
                    </h2>
                    {drive._count.candidates === 0 ? (
                        <p className="text-sm text-sg-muted">{t("nobodyYet")}</p>
                    ) : (
                        <>
                            <p className="text-[13px] text-sg-muted">{t("funnelHint")}</p>
                            <ol aria-label={t("funnelLabel")} className="flex flex-col gap-3.5">
                                {stages.map((x) => (
                                    <li key={x.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                                        <span className="min-w-0 font-semibold">{t(`funnelStages.${x.key}`)}</span>
                                        <span className="whitespace-nowrap tabular-nums">
                                            <strong className="text-[17px]">{x.count}</strong> <span className="text-sm text-sg-muted">· {x.percent}%</span>
                                        </span>
                                        <span aria-hidden="true" className="col-span-2 h-2 overflow-hidden rounded-full bg-sg-chip">
                                            <span className="block h-full rounded-full bg-sg-ink" style={{ width: `${x.percent}%` }} />
                                        </span>
                                    </li>
                                ))}
                            </ol>
                            <Link href={`/dashboard/jobs/${drive.job.id}?drive=${drive.id}`} className={cn(coralButton, "mt-1 h-12 self-start px-6 text-base")}>
                                {t("viewRanked")}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                        </>
                    )}
                </section>
                <section aria-labelledby="dr-attention" className={cn(panel, "gap-3")}>
                    <h2 id="dr-attention" className={panelTitle}>
                        {t("attention")}
                    </h2>
                    {attention.bounced + attention.failed + attention.unscored + attention.flagged === 0 ? (
                        <p className="text-sm text-sg-muted">{t("nothingToChase")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {attention.bounced + attention.failed > 0 && (
                                <li className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                    <MailX className="size-[18px] shrink-0" aria-hidden="true" />
                                    <span className="flex-[1_1_180px] font-semibold">{t("emailProblems", { bounced: attention.bounced, failed: attention.failed })}</span>
                                    <a href="#dr-emails" className={cn("inline-flex items-center gap-1 rounded-md text-sm font-bold", focusRing)}>
                                        {t("seeWho")}
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </a>
                                </li>
                            )}
                            {attention.unscored > 0 && (
                                <li className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                    <AlertTriangle className="size-[18px] shrink-0" aria-hidden="true" />
                                    <span className="flex-[1_1_180px] font-semibold">{t("unscored", { count: attention.unscored })}</span>
                                    <Link href={`/dashboard/jobs/${drive.job.id}?drive=${drive.id}`} className={cn("inline-flex items-center gap-1 rounded-md text-sm font-bold", focusRing)}>
                                        {t("seeWhich")}
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                </li>
                            )}
                            {attention.flagged > 0 && (
                                <li className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                    <Flag className="size-[18px] shrink-0" aria-hidden="true" />
                                    <span className="flex-[1_1_180px] font-semibold">{t("flagged", { count: attention.flagged })}</span>
                                    <Link href={`/dashboard/jobs/${drive.job.id}?drive=${drive.id}&i=STRONG_CONCERNS`} className={cn("inline-flex items-center gap-1 rounded-md text-sm font-bold", focusRing)}>
                                        {t("review")}
                                        <ArrowRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                </li>
                            )}
                        </ul>
                    )}
                    <p className="text-[13px] text-sg-muted">{t("flagsNote")}</p>
                    {drive.aptitudeEnabled && drive.aptitudeTest && (
                        <p className="text-sm text-sg-muted">{t("aptitudeSummary", { test: drive.aptitudeTest.name, cutoff: drive.aptitudeCutoff ?? 0 })}</p>
                    )}
                    {drive.autoShortlist && drive.interviewCutoff !== null && (
                        <>
                            <p className="text-sm text-sg-muted">
                                {t("autoShortlist")} · {t("interviewCutoff")} {drive.interviewCutoff}
                            </p>
                            <ApplyCutoff id={drive.id} cutoff={drive.interviewCutoff} />
                        </>
                    )}
                    <p className="text-[13px] text-sg-muted">{t("linksNote")}</p>
                </section>
                <section aria-labelledby="dr-colleges" className={cn(panel, "gap-3 lg:col-span-2")}>
                    <h2 id="dr-colleges" className={panelTitle}>
                        {t("byCollege")}
                    </h2>
                    {collegeRows.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noColleges")}</p>
                    ) : (
                        <div role="region" aria-labelledby="dr-colleges" tabIndex={0} className={cn("overflow-x-auto rounded-[18px] bg-sg-row", focusRing)}>
                            <table className="w-full min-w-[760px] border-collapse text-[15px]">
                                <thead>
                                    <tr>
                                        <th scope="col" className="px-3 py-2.5 text-left text-[13px] font-bold text-sg-muted">
                                            {t("collegeName")}
                                        </th>
                                        {stages.map((x) => (
                                            <th key={x.key} scope="col" className="px-3 py-2.5 text-right text-[13px] font-bold whitespace-nowrap text-sg-muted">
                                                {t(`funnelStages.${x.key}`)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {collegeRows.map((r) => (
                                        <tr key={r.id ?? "none"} className="border-t border-sg-rule">
                                            <th scope="row" className="px-3 py-3 text-left font-semibold">
                                                {r.name}
                                            </th>
                                            {stages.map((x) => (
                                                <td key={x.key} className="px-3 py-3 text-right tabular-nums">
                                                    {r.counts[x.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="border-t border-sg-rule">
                                        <th scope="row" className="px-3 py-3 text-left font-normal text-sg-muted">
                                            {t("total")}
                                        </th>
                                        {stages.map((x) => (
                                            <td key={x.key} className="px-3 py-3 text-right font-bold tabular-nums">
                                                {x.count}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                {drive.aptitudeEnabled && (
                    <section aria-labelledby="dr-apt" className={cn(panel, "gap-3 lg:col-span-2")}>
                        <h2 id="dr-apt" className={panelTitle}>
                            {t("aptitudeResults")}
                        </h2>
                        <p className="text-sm">
                            {t("aptitudeCounts", { passed: stageCount("APTITUDE_PASSED"), failed: stageCount("APTITUDE_FAILED"), taking: stageCount("APTITUDE_STARTED") })}
                        </p>
                        {results.length === 0 ? (
                            <p className="text-sm text-sg-muted">{t("noResults")}</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {results.map((r) => {
                                    const p = people.get(r.driveCandidate.userId);
                                    return (
                                        <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[18px] bg-sg-row px-4 py-3">
                                            <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                                                <strong className="break-words">{p?.name || p?.email}</strong>
                                                <span className="text-[13px] break-all text-sg-muted">
                                                    {p?.email}
                                                    {r.driveCandidate.college ? ` · ${r.driveCandidate.college.name}` : ""}
                                                </span>
                                            </span>
                                            {r.tabSwitches > 0 && <span className="text-[13px] text-sg-muted">{t("tabSwitches", { count: r.tabSwitches })}</span>}
                                            <span className="font-display sg-soft text-[22px] font-semibold tabular-nums">{r.percent ?? 0}%</span>
                                            <span
                                                className={cn(
                                                    "inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold",
                                                    r.passed ? "text-sg-success" : "text-sg-muted",
                                                )}
                                            >
                                                {r.passed ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <XCircle className="size-3.5" aria-hidden="true" />}
                                                {r.passed ? t("passedAptitude") : t("didntPass")}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                )}
                <section aria-labelledby="dr-emails" className={cn(panel, "gap-3 lg:col-span-2")}>
                    <h2 id="dr-emails" className={panelTitle}>
                        {t("emails")}
                    </h2>
                    {byEmail.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noEmails")}</p>
                    ) : (
                        <>
                            <dl className="flex flex-wrap gap-x-6 gap-y-2">
                                {(["SENT", "QUEUED", "SENDING", "FAILED", "BOUNCED"] as const).map((s) =>
                                    emailCount(s) || s === "SENT" ? (
                                        <div key={s} className="flex min-w-[96px] flex-col">
                                            <dd className="font-display sg-soft order-1 text-[26px] leading-8 font-semibold">{emailCount(s)}</dd>
                                            <dt className="order-2 text-[13px] text-sg-muted">{t(`emailStatus.${s}`)}</dt>
                                        </div>
                                    ) : null,
                                )}
                            </dl>
                            {problems.length > 0 && (
                                <EmailProblems driveId={drive.id} rows={problems.map((p) => ({ driveCandidateId: p.driveCandidateId, to: p.to, bounced: p.status === "BOUNCED" }))} />
                            )}
                            <p className="text-[13px] text-sg-muted">{t("emailsNote")}</p>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
