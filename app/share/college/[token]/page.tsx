import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, CircleDot, Clock, Flag, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/geolocation";
import { SHARE_TRIES_PER_MINUTE, hashShareToken, looksLikeShareToken, shareState } from "@/lib/share-link";
import { OFFICER_FILTERS, inFilter, officerStage, type OfficerFilter, type OfficerStage } from "@/lib/college-share";
import { FocusRoot } from "@/components/interview/session-shell";
import { Mascot, UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { istShort } from "@/components/drives/drive-status";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("CollegeShare");
    // Never indexed; next.config also sends X-Robots-Tag, no-store and no-referrer for /share/*
    return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const LOOK: Record<OfficerStage, { icon: typeof Clock; tone: string }> = {
    NOT_STARTED: { icon: Clock, tone: "bg-sg-chip text-sg-text" },
    STARTED: { icon: CircleDot, tone: "bg-sg-lavender-soft text-sg-lavender-ink" },
    APTITUDE_FAILED: { icon: XCircle, tone: "bg-sg-chip text-sg-text" },
    FINISHED: { icon: CheckCircle2, tone: "bg-sg-chip text-sg-success" },
};
const chip = "inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap";

/**
 * One college's students in a drive, for its placement officer, without an account (AIIN-173), from the approved
 * placement officer artboards. Only name, roll number and how far each got, plus Shortlisted when the employer allows
 * it. Never scores, answers, feedback, other decisions, documents or integrity details: they aren't selected.
 */
export default async function CollegeSharePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ status?: string }> }) {
    const t = await getTranslations("CollegeShare");
    const { token } = await params;
    const { status } = await searchParams;

    // Every try counts, right token or wrong, shared with the shortlist links (AC5)
    const ip = getClientIP(await headers());
    const allowed = await checkRateLimit(`share:${ip}`, SHARE_TRIES_PER_MINUTE, 1);

    const shell = (children: React.ReactNode) => (
        <FocusRoot>
            <header className="sg-bar mx-auto flex w-full max-w-[1160px] items-center justify-between gap-3 rounded-full py-2 pr-2 pl-3.5">
                <span className="flex items-center gap-2.5">
                    <UMark />
                    <span className="font-display sg-soft text-lg font-semibold whitespace-nowrap">Get Back To U</span>
                </span>
                <ThemeSwitch />
            </header>
            <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-6">{children}</main>
        </FocusRoot>
    );
    const notice = (title: string, body: string) =>
        shell(
            <section className="sg-glass sg-shadow-lg mx-auto mt-12 flex w-full max-w-[560px] flex-col items-center gap-3 rounded-[28px] px-6 py-10 text-center">
                <Mascot className="size-[60px]" />
                <h1 className="font-display sg-soft text-[26px] leading-[33px] font-semibold">{title}</h1>
                <p className="text-sg-muted">{body}</p>
            </section>,
        );

    if (!allowed.success) return notice(t("tooManyTitle"), t("tooManyBody"));
    if (!looksLikeShareToken(token)) notFound();

    const share = await db.collegeShare.findUnique({
        where: { tokenHash: hashShareToken(token) },
        select: {
            id: true,
            showShortlisted: true,
            expiresAt: true,
            revokedAt: true,
            driveCollege: {
                select: {
                    id: true,
                    name: true,
                    drive: { select: { name: true, closesAt: true, closedAt: true, job: { select: { title: true, employer: { select: { name: true } } } } } },
                },
            },
        },
    });
    if (!share) notFound();

    const college = share.driveCollege;
    const employer = college.drive.job.employer.name?.trim() || t("theEmployer");
    const state = shareState(share, new Date());
    if (state === "revoked") return notice(t("revokedTitle"), t("revokedBody", { employer }));
    if (state === "expired") return notice(t("expiredTitle"), t("expiredBody", { employer }));

    await db.collegeShare.update({ where: { id: share.id }, data: { lastOpenedAt: new Date(), openCount: { increment: 1 } } });

    // Only this college's students (AC1)
    const rows = await db.driveCandidate.findMany({
        where: { driveCollegeId: college.id },
        select: { userId: true, rollNumber: true, stage: true, interviewId: true },
    });
    const names = new Map(
        (await db.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, name: true } })).map((u) => [u.id, u.name?.trim() || null]),
    );
    // Shortlisted yes or no, and only when the employer allowed it (AC2, AC3)
    const shortlisted = share.showShortlisted
        ? new Set(
              (
                  await db.interview.findMany({
                      where: { id: { in: rows.flatMap((r) => (r.interviewId ? [r.interviewId] : [])) }, decision: "SHORTLISTED" },
                      select: { id: true },
                  })
              ).map((i) => i.id),
          )
        : null;

    const students = rows
        .map((r) => ({
            name: names.get(r.userId) ?? null,
            roll: r.rollNumber,
            stage: officerStage(r.stage),
            shortlisted: !!(shortlisted && r.interviewId && shortlisted.has(r.interviewId)),
        }))
        .sort((a, b) => (a.roll ?? "￿").localeCompare(b.roll ?? "￿", "en", { numeric: true }) || (a.name ?? "").localeCompare(b.name ?? ""));

    const filter = OFFICER_FILTERS.includes(status as OfficerFilter) ? (status as OfficerFilter) : null;
    const count = (f: OfficerFilter | null) => students.filter((s) => inFilter(s.stage, f)).length;
    const list = students.filter((s) => inFilter(s.stage, filter));
    const stats: [number, string][] = [
        [students.length, t("invited")],
        [students.length - count("NOT_STARTED"), t("started")],
        [count("FINISHED"), t("finished")],
        ...(shortlisted ? ([[students.filter((s) => s.shortlisted).length, t("shortlisted")]] as [number, string][]) : []),
    ];
    const tab = (on: boolean) =>
        cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm font-semibold",
            on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
            focusRing,
        );
    const closes = college.drive.closedAt ?? college.drive.closesAt;

    return shell(
        <section className="sg-glass flex flex-col gap-4 rounded-[28px] p-5 sm:p-7">
            <span className="text-[13px] font-bold text-sg-muted">{t("sharedBy", { employer })}</span>
            <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] break-words text-balance sm:text-[44px]">
                {college.name}
            </h1>
            <p className="text-sg-muted">
                {college.drive.name} · {college.drive.job.title}
                {closes ? ` · ${t(college.drive.closedAt || closes < new Date() ? "closed" : "closes", { when: istShort.format(closes) })}` : ""}
            </p>
            <dl className="flex flex-wrap gap-[18px]">
                {stats.map(([n, label]) => (
                    <div key={label} className="flex min-w-[84px] flex-col">
                        <dd className="font-display sg-soft order-1 text-[26px] leading-8 font-semibold">{n}</dd>
                        <dt className="order-2 text-[13px] text-sg-muted">{label}</dt>
                    </div>
                ))}
            </dl>
            <nav aria-label={t("filter")} className="flex flex-wrap gap-2">
                <Link href={`/share/college/${token}`} aria-current={!filter ? "page" : undefined} className={tab(!filter)} replace>
                    <strong>{students.length}</strong>
                    {t("all")}
                </Link>
                {OFFICER_FILTERS.map((f) => (
                    <Link key={f} href={`/share/college/${token}?status=${f}`} aria-current={filter === f ? "page" : undefined} className={tab(filter === f)} replace>
                        <strong>{count(f)}</strong>
                        {t(`filters.${f}`)}
                    </Link>
                ))}
            </nav>
            {list.length === 0 ? (
                <p className="rounded-[18px] bg-sg-row px-4 py-3.5 text-sg-muted">{students.length ? t("noneInFilter") : t("none")}</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {list.map((s, i) => {
                        const { icon: Icon, tone } = LOOK[s.stage];
                        return (
                            <li key={i} className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[18px] bg-sg-row px-4 py-3.5">
                                <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                                    <strong className="break-words">{s.name ?? t("noName")}</strong>
                                    {s.roll && <span className="text-[13px] break-all text-sg-muted">{s.roll}</span>}
                                </span>
                                <span className="flex flex-wrap gap-2">
                                    <span className={cn(chip, tone)}>
                                        <Icon className="size-3.5" aria-hidden="true" />
                                        {t(`stages.${s.stage}`)}
                                    </span>
                                    {s.shortlisted && (
                                        <span className={cn(chip, "bg-sg-chip text-sg-success")}>
                                            <Flag className="size-3.5" aria-hidden="true" />
                                            {t("shortlistedChip")}
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
            <span className="text-[13px] text-sg-muted">{t("never", { date: day.format(share.expiresAt) })}</span>
        </section>,
    );
}
