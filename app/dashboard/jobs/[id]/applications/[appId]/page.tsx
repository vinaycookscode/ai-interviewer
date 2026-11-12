import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2, Mic, StickyNote } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CLOSED, EMPLOYER_MOVES, nextStage, type Stage } from "@/lib/applications";
import { PageHeading, displayName, formatShortDate, panel, panelTitle } from "@/components/jobs/employer-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { HoldChip, StageChip } from "@/components/applications/stage-chip";
import { ApplicationMove, ApplicationNote } from "@/components/applications/application-actions";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Applications");
    return { title: t("title") };
}

const time = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** One application (AIIN-195), from the approved "One application" artboards. Only the job's employer sees it. */
export default async function ApplicationPage({ params }: { params: Promise<{ id: string; appId: string }> }) {
    const { id, appId } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Applications");

    const app = await db.application.findFirst({
        where: { id: appId, jobId: id, employerId: userId },
        select: {
            id: true,
            stage: true,
            onHold: true,
            source: true,
            createdAt: true,
            candidateId: true,
            coverNote: true,
            job: { select: { id: true, title: true } },
            events: {
                orderBy: { createdAt: "desc" },
                take: 100,
                select: { id: true, fromStage: true, toStage: true, note: true, createdAt: true, actorId: true, actor: { select: { name: true } } },
            },
        },
    });
    if (!app) notFound();
    const stage = app.stage as Stage;
    const invited = stage === "INVITED";

    // An invitation not yet accepted stays anonymous: no name, email or interviews are loaded (AC3)
    const [person, interviews] = invited
        ? [null, []]
        : await Promise.all([
              db.user.findUnique({ where: { id: app.candidateId }, select: { name: true, email: true } }),
              db.interview.findMany({
                  where: { jobId: app.job.id, candidateId: app.candidateId },
                  orderBy: { createdAt: "desc" },
                  select: { id: true, status: true, score: true, completedAt: true, _count: { select: { answers: true } } },
              }),
          ]);
    const name = person ? displayName(person) : t("invitedName");
    const notes = app.events.filter((e) => e.note && !e.toStage);
    const who = (e: { actorId: string | null; actor: { name: string | null } | null }) => (e.actorId === userId ? t("you") : (e.actor?.name ?? ""));
    const next = nextStage(stage);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={{ href: `/dashboard/jobs/${app.job.id}/applications`, label: t("back") }}
                title={name}
                subtitle={`${app.job.title} · ${t("applied", { date: formatShortDate(app.createdAt) })}`}
                actions={
                    <span className="flex flex-wrap gap-1.5">
                        {app.onHold && <HoldChip label={t("onHold")} />}
                        <StageChip stage={stage} label={t(`stages.${stage}`)} />
                    </span>
                }
            />
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section aria-labelledby="ap-rounds" className={cn(panel, "gap-3")}>
                    {app.coverNote && !invited && (
                        <>
                            <h2 className={panelTitle}>{t("theirNote")}</h2>
                            <p className="rounded-[18px] bg-sg-row px-4 py-3 break-words whitespace-pre-line">{app.coverNote}</p>
                        </>
                    )}
                    <h2 id="ap-rounds" className={panelTitle}>
                        {t("rounds")}
                    </h2>
                    {interviews.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noRounds")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {interviews.map((i) => (
                                <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                                    <Mic className="size-[18px] shrink-0" aria-hidden="true" />
                                    <span className="flex min-w-0 flex-[1_1_160px] flex-col">
                                        <strong>{t("aiInterview")}</strong>
                                        <span className="text-[13px] text-sg-muted">{i.completedAt ? formatShortDate(i.completedAt) : t("notStarted")}</span>
                                    </span>
                                    {i.status === "COMPLETED" && (
                                        <>
                                            <span className="font-display sg-soft text-[22px] font-semibold">{i.score?.toFixed(1) ?? "–"}</span>
                                            <Link
                                                href={`/interview/${i.id}/feedback?from=${encodeURIComponent(`/dashboard/jobs/${app.job.id}/applications/${app.id}`)}`}
                                                className={cn("rounded-md font-bold", focusRing)}
                                            >
                                                {t("report")}
                                            </Link>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    <h2 className={cn(panelTitle, "mt-2")}>{t("notes")}</h2>
                    {!invited && <ApplicationNote id={app.id} />}
                    {notes.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noNotes")}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {notes.map((n) => (
                                <li key={n.id} className="flex flex-col gap-1 rounded-[18px] bg-sg-row px-4 py-3">
                                    <span className="text-[13px] text-sg-muted">
                                        {who(n)} · {time.format(n.createdAt)}
                                    </span>
                                    <span className="whitespace-pre-line break-words">{n.note}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section aria-labelledby="ap-move" className={cn(panel, "gap-3")}>
                    <h2 id="ap-move" className={panelTitle}>
                        {t("moveTo")}
                    </h2>
                    {!invited && (
                        <ApplicationMove
                            id={app.id}
                            next={next ? { stage: next, label: t("moveNext", { stage: t(`stages.${next}`) }) } : null}
                            onHold={app.onHold}
                            closed={CLOSED.includes(stage)}
                            others={EMPLOYER_MOVES.filter((s) => s !== stage && s !== next && s !== "REJECTED").map((s) => ({
                                stage: s,
                                label: t(`stages.${s}`),
                            }))}
                        />
                    )}
                    <h2 className={cn(panelTitle, "mt-2")}>{t("history")}</h2>
                    <ol className="flex flex-col gap-3">
                        {app.events.map((e) => (
                            <li key={e.id} className="flex items-start gap-2.5">
                                {e.toStage ? (
                                    <ArrowRight className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                                ) : (
                                    <StickyNote className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                                )}
                                <span className="flex min-w-0 flex-col">
                                    <strong>{e.toStage ? t("fromTo", { to: t(`stages.${e.toStage}`) }) : t("noteOnly")}</strong>
                                    {e.toStage && e.note && <span className="text-sm break-words">{e.note}</span>}
                                    <span className="text-[13px] text-sg-muted">
                                        {who(e) ? `${t("by", { name: who(e) })} · ` : ""}
                                        {time.format(e.createdAt)}
                                    </span>
                                </span>
                            </li>
                        ))}
                        <li className="flex items-start gap-2.5">
                            <CheckCircle2 className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                            <span className="flex flex-col">
                                <strong>{t("created")}</strong>
                                <span className="text-[13px] text-sg-muted">
                                    {time.format(app.createdAt)} · {t(`source.${app.source}`)}
                                </span>
                            </span>
                        </li>
                    </ol>
                </section>
            </div>
        </div>
    );
}
