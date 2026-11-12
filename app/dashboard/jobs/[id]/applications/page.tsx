import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Briefcase, Search } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PIPELINE, STAGES, type Stage } from "@/lib/applications";
import { PageHeading, displayName, field, formatShortDate, outlineButton, panel } from "@/components/jobs/employer-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { HoldChip, StageChip } from "@/components/applications/stage-chip";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Applications");
    return { title: t("title") };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** A job's applications by stage (AIIN-195), from the approved "Applications for a job" artboards. */
export default async function JobApplicationsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ id }, sp] = await Promise.all([params, searchParams]);
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Applications");

    const job = await db.job.findFirst({ where: { id, employerId: userId }, select: { id: true, title: true } });
    if (!job) notFound();

    const stageParam = one(sp.stage);
    const stage = (STAGES as readonly string[]).includes(stageParam) ? (stageParam as Stage) : null;
    const q = one(sp.q).trim().slice(0, 100);
    // Invited candidates stay anonymous: a name search never looks at them (AC3)
    const where = {
        jobId: job.id,
        employerId: userId,
        ...(stage ? { stage } : {}),
        ...(q
            ? { stage: stage && stage !== "INVITED" ? stage : { not: "INVITED" as const }, candidate: { name: { contains: q, mode: "insensitive" as const } } }
            : {}),
    };

    const [counts, apps] = await Promise.all([
        db.application.groupBy({ by: ["stage"], where: { jobId: job.id, employerId: userId }, _count: { _all: true } }),
        db.application.findMany({
            where,
            orderBy: [{ stageChangedAt: "desc" }, { id: "asc" }],
            take: 200,
            select: { id: true, stage: true, onHold: true, source: true, stageChangedAt: true, candidateId: true },
        }),
    ]);
    // Names and scores only for people who are in the pipeline, never for an invitation not yet accepted (AC3)
    const known = apps.filter((a) => a.stage !== "INVITED").map((a) => a.candidateId);
    const [people, interviews] = await Promise.all([
        known.length ? db.user.findMany({ where: { id: { in: known } }, select: { id: true, name: true, email: true } }) : [],
        known.length
            ? db.interview.findMany({
                  where: { jobId: job.id, candidateId: { in: known }, status: "COMPLETED" },
                  orderBy: { completedAt: "desc" },
                  select: { candidateId: true, score: true },
              })
            : [],
    ]);
    const personOf = new Map(people.map((p) => [p.id, p]));
    const scoreOf = new Map<string, number | null>();
    for (const i of interviews) if (!scoreOf.has(i.candidateId)) scoreOf.set(i.candidateId, i.score);

    const countOf = (s: Stage) => counts.find((c) => c.stage === s)?._count._all ?? 0;
    const total = counts.reduce((n, c) => n + c._count._all, 0);
    const tabs: (Stage | null)[] = [null, ...PIPELINE, ...(["INVITED", "WITHDRAWN", "DECLINED"] as Stage[]).filter((s) => countOf(s) > 0)];
    const href = (s: Stage | null) => {
        const p = new URLSearchParams();
        if (s) p.set("stage", s);
        if (q) p.set("q", q);
        const qs = p.toString();
        return `/dashboard/jobs/${job.id}/applications${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={{ href: `/dashboard/jobs/${job.id}`, label: job.title }}
                title={t("title")}
                subtitle={job.title}
                actions={
                    <>
                        <Link href={`/dashboard/jobs/${job.id}`} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                            {t("candidates")}
                        </Link>
                        <Link href={`/dashboard/jobs/${job.id}/requirements`} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                            {t("requirements")}
                        </Link>
                    </>
                }
            />
            <section aria-label={t("title")} className={cn(panel, "gap-4 sm:p-6")}>
                <nav aria-label={t("stageLabel")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {tabs.map((s) => {
                        const on = s === stage;
                        return (
                            <Link
                                key={s ?? "all"}
                                href={href(s)}
                                aria-current={on ? "page" : undefined}
                                className={cn(
                                    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold whitespace-nowrap",
                                    on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
                                    focusRing,
                                )}
                            >
                                {s ? t(`stages.${s}`) : t("all")}
                                <span className="opacity-70">{s ? countOf(s) : total}</span>
                            </Link>
                        );
                    })}
                </nav>
                <form className="flex max-w-[420px] gap-2" role="search">
                    {stage && <input type="hidden" name="stage" value={stage} />}
                    <label htmlFor="ap-q" className="sr-only">
                        {t("searchLabel")}
                    </label>
                    <span className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute top-[15px] left-4 size-4 text-sg-muted" aria-hidden="true" />
                        <input id="ap-q" name="q" type="search" defaultValue={q} placeholder={t("searchLabel")} className={cn(field, "h-12 w-full pl-11")} />
                    </span>
                    <button type="submit" className={cn(outlineButton, "h-12 px-4 text-[15px]")}>
                        {t("search")}
                    </button>
                </form>
                {apps.length > 0 && <p className="text-[13px] font-bold text-sg-muted">{t("count", { count: apps.length })}</p>}

                {apps.length === 0 ? (
                    <EmptyState
                        icon={<Briefcase className="size-7" aria-hidden="true" />}
                        title={q ? t("noMatchTitle") : stage ? t("emptyTitle", { stage: t(`stages.${stage}`) }) : t("noneTitle")}
                    >
                        {q ? t("noMatchBody") : stage ? t("emptyBody") : t("noneBody")}
                    </EmptyState>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {apps.map((a) => {
                            const person = personOf.get(a.candidateId);
                            const name = a.stage === "INVITED" || !person ? t("invitedName") : displayName(person);
                            const score = scoreOf.get(a.candidateId);
                            const when = formatShortDate(a.stageChangedAt);
                            const since = a.stage === "INVITED" || a.stage === "APPLIED" ? t(`since.${a.stage}`, { when }) : t("since.other", { when });
                            return (
                                <li key={a.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[18px] bg-sg-row px-4 py-3.5">
                                    <span
                                        aria-hidden="true"
                                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sg-chip font-bold"
                                    >
                                        {a.stage === "INVITED" ? "?" : name.charAt(0).toUpperCase()}
                                    </span>
                                    <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                                        <Link
                                            href={`/dashboard/jobs/${job.id}/applications/${a.id}`}
                                            className={cn("rounded-md font-bold break-words", focusRing)}
                                        >
                                            {name}
                                        </Link>
                                        <span className="text-[13px] text-sg-muted">
                                            {a.stage === "INVITED" ? t("invitedNote") : `${since} · ${t(`source.${a.source}`)}`}
                                        </span>
                                    </span>
                                    {a.stage !== "INVITED" && (
                                        <span className="flex flex-col items-end">
                                            <span className="font-display sg-soft text-xl font-semibold">{score != null ? score.toFixed(1) : "–"}</span>
                                            <span className="text-xs text-sg-muted">{score != null ? t("aiScore") : t("noScore")}</span>
                                        </span>
                                    )}
                                    <span className="flex flex-wrap gap-1.5">
                                        {a.onHold && <HoldChip label={t("onHold")} />}
                                        <StageChip stage={a.stage as Stage} label={t(`stages.${a.stage}`)} />
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
