import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Lock, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { anonymousCard } from "@/lib/anonymous-card";
import { checkFacts, EMPTY_FACTS } from "@/lib/resume-facts";
import type { MatchParts } from "@/lib/match-score";
import { PageHeading, formatShortDate, outlineButton } from "@/components/jobs/employer-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { MatchCard } from "@/components/talent-match/match-card";
import { InviteButton } from "@/components/talent-match/invite-button";
import { StageChip } from "@/components/applications/stage-chip";
import { inviteAllowance } from "@/lib/invite-allowance";
import { candidateCode } from "@/lib/anonymous-card";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Matches");
    return { title: t("title") };
}

const PAGE = 12;
const MINS = [80, 70, 60, 50] as const;
const YEARS = { "0-2": [0, 2], "3-5": [3, 5], "6+": [6, 99] } as const;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const parts = (v: unknown): MatchParts => {
    const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
    const n = (k: string) => (typeof o[k] === "number" ? (o[k] as number) : 0);
    return { mustHave: n("mustHave"), relevance: n("relevance"), experience: n("experience"), niceToHave: n("niceToHave") };
};

/**
 * A job's matched candidates (AIIN-200), from the approved artboards: anonymous cards by %, with sub-scores and
 * reasons. Filters never touch name, gender, age or college: there are none to filter on.
 */
export default async function JobMatchesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const [{ id }, sp] = await Promise.all([params, searchParams]);
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Matches");

    // AC3: only the employer's own job
    const job = await db.job.findFirst({ where: { id, employerId: userId, archivedAt: null }, select: { id: true, title: true, status: true, requirementsConfirmedAt: true } });
    if (!job) notFound();

    const minParam = Number(one(sp.min));
    const min = (MINS as readonly number[]).includes(minParam) ? minParam : null;
    const all = one(sp.all) === "1";
    const yearsKey = one(sp.years) as keyof typeof YEARS;
    const years = YEARS[yearsKey] ?? null;
    const city = one(sp.city).trim().slice(0, 60);
    const page = Math.max(1, Math.floor(Number(one(sp.page)) || 1));

    // Default view: 60% and above. "Show all" lifts that, so the ranking never hides anyone who passed the filters.
    const floor = all ? null : (min ?? 60);
    const where = {
        jobId: job.id,
        employerId: userId,
        ...(floor !== null ? { score: { gte: floor } } : {}),
        ...(years || city
            ? {
                  candidateProfile: {
                      ...(years ? { totalYears: { gte: years[0], lte: years[1] + 0.99 } } : {}),
                      ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}),
                  },
              }
            : {}),
    };

    const [total, everyone, cities, matches] = await Promise.all([
        db.jobMatch.count({ where }),
        db.jobMatch.count({ where: { jobId: job.id, employerId: userId } }),
        db.candidateProfile.findMany({ where: { matches: { some: { jobId: job.id } }, city: { not: null } }, distinct: ["city"], select: { city: true }, orderBy: { city: "asc" }, take: 50 }),
        db.jobMatch.findMany({
            where,
            orderBy: [{ score: "desc" }, { id: "asc" }],
            skip: (page - 1) * PAGE,
            take: PAGE,
            // AC2: facts and scores only, never a name, email, phone or file
            select: { id: true, score: true, parts: true, reasons: true, candidateProfileId: true, candidateProfile: { select: { userId: true, resumeFacts: true, primaryRole: true, noticePeriodDays: true } } },
        }),
    ]);
    const mocks = matches.length
        ? await db.mockInterview.findMany({ where: { userId: { in: matches.map((m) => m.candidateProfile.userId) }, score: { not: null } }, orderBy: { createdAt: "desc" }, select: { userId: true, score: true } })
        : [];
    const scoresOf = (u: string) => mocks.filter((m) => m.userId === u).map((m) => m.score);
    // Who already has an application here, and the month's invitation allowance (AIIN-201)
    const [existing, allowance] = await Promise.all([
        matches.length
            ? db.application.findMany({ where: { jobId: job.id, candidateId: { in: matches.map((m) => m.candidateProfile.userId) } }, select: { candidateId: true, stage: true, invitedAt: true } })
            : [],
        inviteAllowance(userId),
    ]);
    const appOf = new Map(existing.map((a) => [a.candidateId, a]));

    const labels = {
        anonymous: t("anonymous"),
        match: t("match"),
        years: (n: number) => t("years", { count: n }),
        parts: { mustHave: t("parts.mustHave"), relevance: t("parts.relevance"), experience: t("parts.experience"), niceToHave: t("parts.niceToHave") },
        city: t("city"),
        notice: t("notice"),
        noticeDays: (n: number) => t("noticeDays", { count: n }),
        practice: t("practice"),
        none: t("none"),
    };
    const pages = Math.max(1, Math.ceil(total / PAGE));
    const href = (patch: Record<string, string | null>) => {
        const p = new URLSearchParams();
        const cur: Record<string, string | null> = { min: min ? String(min) : null, all: all ? "1" : null, years: years ? yearsKey : null, city: city || null, page: null, ...patch };
        for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
        const qs = p.toString();
        return `/dashboard/jobs/${job.id}/matches${qs ? `?${qs}` : ""}`;
    };
    const pill = (on: boolean) =>
        cn("inline-flex h-10 items-center rounded-full border-2 px-4 text-sm font-semibold whitespace-nowrap", on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text", focusRing);
    const ready = job.status === "OPEN" && !!job.requirementsConfirmedAt;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={{ href: `/dashboard/jobs/${job.id}`, label: job.title }}
                title={t("title")}
                subtitle={t("subtitle")}
                actions={
                    <span className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-sg-muted">{allowance.left === null ? t("unlimited") : t("allowance", { left: allowance.left, limit: allowance.limit })}</span>
                        <Link href={`/dashboard/jobs/${job.id}/applications`} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                            {t("applications")}
                        </Link>
                    </span>
                }
            />

            {!ready ? (
                <EmptyState
                    icon={<Sparkles className="size-7" aria-hidden="true" />}
                    title={t("notReadyTitle")}
                    action={
                        <Link href={`/dashboard/jobs/${job.id}/requirements`} className={cn(outlineButton, "h-12 text-[15px]")}>
                            {t("addRequirements")}
                        </Link>
                    }
                >
                    {t("notReadyBody")}
                </EmptyState>
            ) : (
                <>
                    <form className="flex flex-col gap-3" aria-label={t("filters")}>
                        <nav aria-label={t("minLabel")} className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{t("show")}</span>
                            {MINS.map((m) => (
                                <Link key={m} href={href({ min: String(m), all: null })} aria-current={!all && (min ?? 60) === m ? "page" : undefined} className={pill(!all && (min ?? 60) === m)}>
                                    {t("minPill", { min: m })}
                                </Link>
                            ))}
                            <Link href={href({ min: null, all: "1" })} aria-current={all ? "page" : undefined} className={pill(all)}>
                                {t("all", { count: everyone })}
                            </Link>
                        </nav>
                        <div className="flex flex-wrap items-end gap-3">
                            {min && <input type="hidden" name="min" value={min} />}
                            {all && <input type="hidden" name="all" value="1" />}
                            <span className="flex min-w-0 flex-[1_1_150px] flex-col gap-1.5 sm:max-w-[220px]">
                                <label htmlFor="mt-years" className="text-sm font-semibold">
                                    {t("yearsLabel")}
                                </label>
                                <select id="mt-years" name="years" defaultValue={years ? yearsKey : ""} className="h-12 rounded-2xl border border-sg-field-border bg-sg-row px-3.5 text-base">
                                    <option value="">{t("anyYears")}</option>
                                    {Object.keys(YEARS).map((k) => (
                                        <option key={k} value={k}>
                                            {t(`yearsOption.${k}`)}
                                        </option>
                                    ))}
                                </select>
                            </span>
                            <span className="flex min-w-0 flex-[1_1_150px] flex-col gap-1.5 sm:max-w-[220px]">
                                <label htmlFor="mt-city" className="text-sm font-semibold">
                                    {t("cityLabel")}
                                </label>
                                <select id="mt-city" name="city" defaultValue={city} className="h-12 rounded-2xl border border-sg-field-border bg-sg-row px-3.5 text-base">
                                    <option value="">{t("anyCity")}</option>
                                    {cities.map((c) => (
                                        <option key={c.city} value={c.city ?? ""}>
                                            {c.city}
                                        </option>
                                    ))}
                                </select>
                            </span>
                            <button type="submit" className={cn(outlineButton, "h-12 text-[15px]")}>
                                {t("apply")}
                            </button>
                        </div>
                    </form>

                    <p className="text-[13px] font-bold text-sg-muted">{t("count", { count: total })}</p>
                    {matches.length === 0 ? (
                        <EmptyState icon={<Sparkles className="size-7" aria-hidden="true" />} title={everyone ? t("noMatchTitle") : t("noneTitle")}>
                            {everyone ? t("noMatchBody") : t("noneBody")}
                        </EmptyState>
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-2">
                            {matches.map((m) => (
                                <MatchCard
                                    key={m.id}
                                    card={anonymousCard({
                                        userId: m.candidateProfile.userId,
                                        facts: checkFacts(m.candidateProfile.resumeFacts ?? EMPTY_FACTS),
                                        primaryRole: m.candidateProfile.primaryRole,
                                        noticeDays: m.candidateProfile.noticePeriodDays,
                                        practiceScores: scoresOf(m.candidateProfile.userId),
                                    })}
                                    score={m.score}
                                    parts={parts(m.parts)}
                                    reasons={m.reasons}
                                    labels={labels}
                                    action={(() => {
                                        const a = appOf.get(m.candidateProfile.userId);
                                        if (a?.invitedAt && a.stage === "INVITED") return <StageChip stage="INVITED" label={t("invitedOn", { date: formatShortDate(a.invitedAt) })} />;
                                        if (a) return <StageChip stage={a.stage} label={t(`appStage.${a.stage}`)} />;
                                        const code = candidateCode(m.candidateProfile.userId);
                                        return <InviteButton jobId={job.id} candidateProfileId={m.candidateProfileId} code={code} left={allowance.left} />;
                                    })()}
                                />
                            ))}
                        </div>
                    )}
                    {pages > 1 && (
                        <nav aria-label={t("pages")} className="flex flex-wrap items-center justify-between gap-3">
                            {page > 1 ? (
                                <Link href={href({ page: String(page - 1) })} className={cn(outlineButton, "h-11 text-sm")}>
                                    {t("previous")}
                                </Link>
                            ) : (
                                <span />
                            )}
                            <span className="text-sm text-sg-muted">{t("pageOf", { page, pages })}</span>
                            {page < pages ? (
                                <Link href={href({ page: String(page + 1) })} className={cn(outlineButton, "h-11 text-sm")}>
                                    {t("next")}
                                </Link>
                            ) : (
                                <span />
                            )}
                        </nav>
                    )}
                    <p className="flex items-start gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {t("fairness")}
                    </p>
                </>
            )}
        </div>
    );
}
