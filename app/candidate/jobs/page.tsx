import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Lock, Search, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { parseSearch, searchWhere } from "@/lib/job-search";
import { myMatches } from "@/lib/my-matches";
import { field, outlineButton } from "@/components/jobs/employer-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { StageChip } from "@/components/applications/stage-chip";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Jobs");
    return { title: t("title") };
}

const lakh = (n: number) => `${Math.round(n / 10_000) / 10}`;

/** Search open jobs, sorted by the candidate's own match % (AIIN-202), from the approved "Find jobs" artboards. */
export default async function FindJobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Jobs");
    const f = parseSearch(sp);

    const profile = await db.candidateProfile.findUnique({ where: { userId }, select: { totalYears: true } });
    const jobs = await db.job.findMany({
        where: searchWhere(f, profile?.totalYears ?? null),
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
            id: true, title: true, location: true, workMode: true, salaryMin: true, salaryMax: true,
            mustHaveSkills: true, niceToHaveSkills: true, minYears: true, maxYears: true,
            employer: { select: { name: true } },
        },
    });
    const [matches, applied] = await Promise.all([
        myMatches(userId, jobs),
        db.application.findMany({ where: { candidateId: userId, jobId: { in: jobs.map((j) => j.id) } }, select: { jobId: true, stage: true } }),
    ]);
    const appliedOf = new Map(applied.map((a) => [a.jobId, a.stage]));
    // Best match first; without facts, newest first
    const sorted = matches ? [...jobs].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0)) : jobs;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                    <p className="max-w-[640px] text-lg text-sg-muted">{matches ? t("subtitle") : t("subtitleNoFacts")}</p>
                </div>
                <Link href="/candidate/applications" className={cn("rounded-md font-bold", focusRing)}>
                    {t("myApplications")}
                </Link>
            </div>

            {!matches && (
                <p className="flex flex-wrap items-center gap-2 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                    <span className="flex-[1_1_220px]">{t("needFacts")}</span>
                    <Link href="/candidate/profile/facts" className={cn("rounded-md font-bold underline", focusRing)}>
                        {t("checkFacts")}
                    </Link>
                </p>
            )}

            <form role="search" className="flex flex-wrap items-end gap-3">
                <span className="flex min-w-0 flex-[2_1_220px] flex-col gap-1.5">
                    <label htmlFor="js-q" className="text-sm font-semibold">
                        {t("q")}
                    </label>
                    <span className="relative">
                        <Search className="pointer-events-none absolute top-[15px] left-4 size-4 text-sg-muted" aria-hidden="true" />
                        <input id="js-q" name="q" type="search" defaultValue={f.q} placeholder={t("qPlaceholder")} className={cn(field, "h-12 w-full pl-11")} />
                    </span>
                </span>
                <span className="flex min-w-0 flex-[1_1_150px] flex-col gap-1.5">
                    <label htmlFor="js-loc" className="text-sm font-semibold">
                        {t("location")}
                    </label>
                    <input id="js-loc" name="loc" defaultValue={f.location} placeholder={t("locationPlaceholder")} className={cn(field, "h-12")} />
                </span>
                <span className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
                    <label htmlFor="js-mode" className="text-sm font-semibold">
                        {t("mode")}
                    </label>
                    <select id="js-mode" name="mode" defaultValue={f.mode ?? ""} className={cn(field, "h-12")}>
                        <option value="">{t("anyMode")}</option>
                        {(["ONSITE", "HYBRID", "REMOTE"] as const).map((m) => (
                            <option key={m} value={m}>
                                {t(`modes.${m}`)}
                            </option>
                        ))}
                    </select>
                </span>
                <span className="flex min-w-0 flex-[1_1_120px] flex-col gap-1.5">
                    <label htmlFor="js-pay" className="text-sm font-semibold">
                        {t("pay")}
                    </label>
                    <input id="js-pay" name="pay" inputMode="numeric" defaultValue={f.minPay ?? ""} className={cn(field, "h-12")} />
                </span>
                <label className="flex h-12 items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" name="fits" value="1" defaultChecked={f.fitsYears} className="size-4 accent-sg-ink" />
                    {t("fits")}
                </label>
                <button type="submit" className={cn(outlineButton, "h-12 text-[15px]")}>
                    {t("search")}
                </button>
            </form>

            <p className="text-[13px] font-bold text-sg-muted">{t(matches ? "countMatch" : "countNew", { count: sorted.length })}</p>
            {sorted.length === 0 ? (
                <EmptyState icon={<Search className="size-7" aria-hidden="true" />} title={t("noneTitle")}>
                    {t("noneBody")}
                </EmptyState>
            ) : (
                <ul className="flex flex-col gap-2.5">
                    {sorted.map((j) => {
                        const m = matches?.get(j.id);
                        const stage = appliedOf.get(j.id);
                        const place = [j.location, j.workMode ? t(`modes.${j.workMode}`) : null].filter(Boolean).join(" · ");
                        const pay = j.salaryMin || j.salaryMax ? t("payRange", { min: j.salaryMin ? lakh(j.salaryMin) : "?", max: j.salaryMax ? lakh(j.salaryMax) : "?" }) : null;
                        return (
                            <li key={j.id} className="sg-glass flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] px-5 py-4">
                                <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                                    <Link href={`/candidate/jobs/${j.id}`} className={cn("rounded-md text-[17px] font-bold break-words", focusRing)}>
                                        {j.title}
                                    </Link>
                                    <span className="text-sm text-sg-muted">{[j.employer.name?.trim() || t("anEmployer"), place, pay].filter(Boolean).join(" · ")}</span>
                                    {m && (
                                        <span className="mt-1 inline-flex items-center gap-1.5 text-[13px]">
                                            {m.missing.length ? (
                                                <>
                                                    <XCircle className="size-3.5 shrink-0 text-sg-danger" aria-hidden="true" />
                                                    {t("missing", { skills: m.missing.join(", ") })}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="size-3.5 shrink-0 text-sg-success" aria-hidden="true" />
                                                    {t("everyMustHave")}
                                                </>
                                            )}
                                        </span>
                                    )}
                                </span>
                                {m && (
                                    <span className="flex flex-col items-end">
                                        <span className="font-display sg-soft text-2xl font-semibold">{m.score}%</span>
                                        <span className="text-xs text-sg-muted">{t("match")}</span>
                                    </span>
                                )}
                                {stage ? (
                                    <StageChip stage={stage} label={t("applied")} />
                                ) : (
                                    <Link href={`/candidate/jobs/${j.id}`} className={cn(outlineButton, "h-10 text-sm")}>
                                        {t("view")}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
            <p className="flex items-start gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("privacy")}
            </p>
        </div>
    );
}
