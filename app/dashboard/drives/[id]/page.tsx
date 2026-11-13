import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { PencilLine, Upload } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { REOPEN_DAYS, canReopen, driveStatus } from "@/lib/drives";
import { PageHeading, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { DriveStatusChip, istShort } from "@/components/drives/drive-status";
import { DriveActions } from "@/components/drives/drive-actions";
import { EmailProblems } from "@/components/drives/email-problems";
import { processOutbox } from "@/lib/outbox";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Drives");
    return { title: t("title") };
}

const STAGES = ["INVITED", "OPENED", "APTITUDE_STARTED", "APTITUDE_PASSED", "APTITUDE_FAILED", "INTERVIEW_STARTED", "INTERVIEW_FINISHED"] as const;

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
            job: { select: { id: true, title: true } },
            colleges: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, city: true } },
            _count: { select: { candidates: true } },
        },
    });
    if (!drive) notFound();

    const [byStage, byCollege, byEmail, problems] = await Promise.all([
        db.driveCandidate.groupBy({ by: ["stage"], where: { driveId: drive.id }, _count: { _all: true } }),
        db.driveCandidate.groupBy({ by: ["driveCollegeId"], where: { driveId: drive.id }, _count: { _all: true } }),
        db.outboundEmail.groupBy({ by: ["status"], where: { driveId: drive.id }, _count: { _all: true } }),
        db.outboundEmail.findMany({
            where: { driveId: drive.id, status: { in: ["FAILED", "BOUNCED"] } },
            orderBy: { updatedAt: "desc" },
            take: 50,
            select: { driveCandidateId: true, to: true, status: true },
        }),
    ]);
    const emailCount = (s: string) => byEmail.find((r) => r.status === s)?._count._all ?? 0;
    // Emails waiting to go out are sent after this page is served (no per-minute cron on this plan, AIIN-167)
    if (emailCount("QUEUED") > 0) after(() => processOutbox());
    const now = new Date();
    const status = driveStatus(drive, now);
    const reopen = canReopen(drive, now);
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
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section aria-labelledby="dr-progress" className={cn(panel, "gap-3")}>
                    <h2 id="dr-progress" className={panelTitle}>
                        {t("progress")}
                    </h2>
                    {drive._count.candidates === 0 ? (
                        <p className="text-sm text-sg-muted">{t("nobodyYet")}</p>
                    ) : (
                        <dl className="flex flex-col gap-2">
                            {STAGES.map((s) => (
                                <div key={s} className="flex items-center justify-between gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                    <dt className="font-semibold">{t(`stages.${s}`)}</dt>
                                    <dd className="font-bold tabular-nums">{stageCount(s)}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </section>
                <section aria-labelledby="dr-colleges" className={cn(panel, "gap-3")}>
                    <h2 id="dr-colleges" className={panelTitle}>
                        {t("byCollege")}
                    </h2>
                    {drive.colleges.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noColleges")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {drive.colleges.map((c) => (
                                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                    <span className="flex min-w-0 flex-col">
                                        <strong className="break-words">{c.name}</strong>
                                        {c.city && <span className="text-sm text-sg-muted">{c.city}</span>}
                                    </span>
                                    <span className="text-sm">
                                        <strong className="tabular-nums">{byCollege.find((r) => r.driveCollegeId === c.id)?._count._all ?? 0}</strong> {t("invited")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {drive.autoShortlist && drive.interviewCutoff !== null && (
                        <p className="text-sm text-sg-muted">
                            {t("autoShortlist")} · {t("interviewCutoff")} {drive.interviewCutoff}
                        </p>
                    )}
                    <p className="text-[13px] text-sg-muted">{t("linksNote")}</p>
                </section>
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
