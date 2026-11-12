import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { SEARCHABLE } from "@/lib/job-search";
import { myMatches } from "@/lib/my-matches";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { StageChip } from "@/components/applications/stage-chip";
import { ApplyForm } from "@/components/talent-match/apply-form";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Jobs");
    return { title: t("jobTitle") };
}

const lakh = (n: number) => `${Math.round(n / 10_000) / 10}`;

/** One open job for a candidate, with their match and Apply (AIIN-202). Closed, paused and draft jobs are not found. */
export default async function CandidateJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Jobs");

    const job = await db.job.findFirst({
        where: { id, ...SEARCHABLE },
        select: {
            id: true, title: true, description: true, location: true, workMode: true, salaryMin: true, salaryMax: true,
            mustHaveSkills: true, niceToHaveSkills: true, minYears: true, maxYears: true, maxNoticeDays: true,
            employer: { select: { name: true } },
        },
    });
    if (!job) notFound();
    const [matches, app, profile] = await Promise.all([
        myMatches(userId, [job]),
        db.application.findUnique({ where: { jobId_candidateId: { jobId: job.id, candidateId: userId } }, select: { stage: true } }),
        db.candidateProfile.findUnique({ where: { userId }, select: { phone: true } }),
    ]);
    const m = matches?.get(job.id);
    const company = job.employer.name?.trim() || t("anEmployer");
    const facts = [
        job.location || job.workMode ? [job.location, job.workMode ? t(`modes.${job.workMode}`) : null].filter(Boolean).join(" · ") : null,
        job.minYears !== null || job.maxYears !== null ? t("yearsRange", { min: job.minYears ?? 0, max: job.maxYears ?? "+" }) : null,
        job.salaryMin || job.salaryMax ? t("payRange", { min: job.salaryMin ? lakh(job.salaryMin) : "?", max: job.salaryMax ? lakh(job.salaryMax) : "?" }) : null,
        job.maxNoticeDays !== null ? t("noticeMax", { days: job.maxNoticeDays }) : null,
    ].filter(Boolean);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-2">
                <Link href="/candidate/jobs" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted", focusRing)}>
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    {t("back")}
                </Link>
                <span className="text-[13px] font-bold text-sg-muted">{company}</span>
                <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{job.title}</h1>
                <p className="text-sg-muted">{facts.join(" · ")}</p>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
                <section aria-labelledby="jb-about" className={cn(panel, "gap-4")}>
                    <h2 id="jb-about" className={panelTitle}>
                        {t("about")}
                    </h2>
                    <p className="text-[15px] whitespace-pre-line break-words">{job.description}</p>
                    <h2 className={panelTitle}>{t("needs")}</h2>
                    <ul className="flex flex-wrap gap-1.5">
                        {job.mustHaveSkills.map((s) => (
                            <li key={s} className="inline-flex h-[30px] items-center rounded-full bg-sg-chip px-3 text-[13px] font-bold">
                                {s}
                            </li>
                        ))}
                        {job.niceToHaveSkills.map((s) => (
                            <li key={s} className="inline-flex h-[30px] items-center rounded-full border border-sg-field-border px-3 text-[13px] font-semibold">
                                {t("nice", { skill: s })}
                            </li>
                        ))}
                    </ul>
                </section>
                <section aria-labelledby="jb-apply" className={cn(panel, "gap-4")}>
                    {m && (
                        <div className="flex flex-col gap-2">
                            <span className="flex items-baseline gap-1">
                                <span className="font-display sg-soft text-[34px] leading-none font-semibold">{m.score}%</span>
                                <span className="font-bold text-sg-muted">{t("yourMatch")}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-sm">
                                {m.missing.length ? (
                                    <>
                                        <XCircle className="size-4 shrink-0 text-sg-danger" aria-hidden="true" />
                                        {t("missing", { skills: m.missing.join(", ") })}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="size-4 shrink-0 text-sg-success" aria-hidden="true" />
                                        {t("everyMustHave")}
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                    <h2 id="jb-apply" className={panelTitle}>
                        {app ? t("appliedTitle") : t("applyTitle")}
                    </h2>
                    {app ? (
                        <div className="flex flex-col items-start gap-3">
                            <StageChip stage={app.stage} label={t("applied")} />
                            <Link href="/candidate/applications" className={cn("rounded-md font-bold", focusRing)}>
                                {t("myApplications")}
                            </Link>
                        </div>
                    ) : (
                        <ApplyForm jobId={job.id} company={company} phone={profile?.phone ?? ""} />
                    )}
                </section>
            </div>
        </div>
    );
}
