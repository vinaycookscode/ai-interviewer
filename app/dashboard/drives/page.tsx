import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarClock, GraduationCap, Plus } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { DRIVE_STATUSES, driveStatus, type DriveStatus } from "@/lib/drives";
import { PageHeading } from "@/components/jobs/employer-ui";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { DriveStatusChip, istShort } from "@/components/drives/drive-status";
import { DrivesTabs } from "@/components/drives/drives-tabs";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Drives");
    return { title: t("title") };
}

/** Every drive of the signed-in employer (AIIN-165), from the approved "Hiring drives" artboards. */
export default async function DrivesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status } = await searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Drives");
    const tTests = await getTranslations("AptitudeTests");

    const drives = await db.drive.findMany({
        where: { employerId: userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            draft: true,
            opensAt: true,
            closesAt: true,
            closedAt: true,
            job: { select: { title: true } },
            _count: { select: { colleges: true, candidates: true } },
        },
    });
    const ids = drives.map((d) => d.id);
    const [finished, shortlisted] = ids.length
        ? await Promise.all([
              db.driveCandidate.groupBy({ by: ["driveId"], where: { driveId: { in: ids }, stage: "INTERVIEW_FINISHED" }, _count: { _all: true } }),
              db.interview.groupBy({ by: ["driveId"], where: { driveId: { in: ids }, decision: "SHORTLISTED" }, _count: { _all: true } }),
          ])
        : [[], []];
    const count = (rows: { driveId: string | null; _count: { _all: number } }[], id: string) => rows.find((r) => r.driveId === id)?._count._all ?? 0;

    const now = new Date();
    const rows = drives.map((d) => ({ ...d, status: driveStatus(d, now) }));
    const filter = DRIVE_STATUSES.includes(status as DriveStatus) ? (status as DriveStatus) : null;
    const list = filter ? rows.filter((r) => r.status === filter) : rows;
    const tab = (on: boolean) =>
        cn(
            "inline-flex h-10 items-center rounded-full border-2 px-4 text-sm font-semibold",
            on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
            focusRing,
        );
    const when = (d: (typeof rows)[number]) =>
        d.status === "DRAFT" || !d.opensAt || !d.closesAt
            ? t("notScheduled")
            : d.status === "SCHEDULED"
              ? t("opens", { when: istShort.format(d.opensAt) })
              : d.status === "CLOSED"
                ? t("closedOn", { when: istShort.format(d.closedAt ?? d.closesAt) })
                : t("range", { from: istShort.format(d.opensAt), to: istShort.format(d.closesAt) });

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                title={t("title")}
                subtitle={t("subtitle")}
                actions={
                    <Link href="/dashboard/drives/new" className={cn(coralButton, "h-12 px-6 text-base")}>
                        <Plus className="size-4" aria-hidden="true" />
                        {t("new")}
                    </Link>
                }
            />
            <DrivesTabs current="drives" label={t("tabsLabel")} drives={tTests("drivesTab")} tests={tTests("testsTab")} />
            {rows.length === 0 ? (
                <EmptyState icon={<GraduationCap className="size-7" aria-hidden="true" />} title={t("noneTitle")}>
                    {t("noneBody")}
                </EmptyState>
            ) : (
                <>
                    <nav aria-label={t("filter")} className="flex flex-wrap gap-2">
                        <Link href="/dashboard/drives" aria-current={!filter ? "page" : undefined} className={tab(!filter)}>
                            {t("all", { count: rows.length })}
                        </Link>
                        {DRIVE_STATUSES.map((s) => {
                            const n = rows.filter((r) => r.status === s).length;
                            return n === 0 && filter !== s ? null : (
                                <Link key={s} href={`/dashboard/drives?status=${s}`} aria-current={filter === s ? "page" : undefined} className={tab(filter === s)}>
                                    {t("statusCount", { status: t(`status.${s}`), count: n })}
                                </Link>
                            );
                        })}
                    </nav>
                    {list.length === 0 ? (
                        <p className="text-sg-muted">{t("noneInFilter")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2.5">
                            {list.map((d) => (
                                <li key={d.id} className="sg-glass flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[22px] px-5 py-4">
                                    <span className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                                        <Link href={`/dashboard/drives/${d.id}`} className={cn("self-start rounded-md text-[17px] font-bold break-words", focusRing)}>
                                            {d.name}
                                        </Link>
                                        <span className="text-sm text-sg-muted">
                                            {d.job.title} · {t("colleges", { count: d._count.colleges })}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[13px]">
                                            <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
                                            {when(d)}
                                        </span>
                                    </span>
                                    <dl className="flex flex-wrap gap-5">
                                        {[
                                            [d._count.candidates, t("invited")],
                                            [count(finished, d.id), t("finished")],
                                            [count(shortlisted, d.id), t("shortlisted")],
                                        ].map(([n, label]) => (
                                            <div key={label} className="flex min-w-[72px] flex-col">
                                                <dd className="font-display sg-soft order-1 text-[26px] leading-8 font-semibold">{n}</dd>
                                                <dt className="order-2 text-[13px] text-sg-muted">{label}</dt>
                                            </div>
                                        ))}
                                    </dl>
                                    <DriveStatusChip status={d.status} label={t(`status.${d.status}`)} />
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}
