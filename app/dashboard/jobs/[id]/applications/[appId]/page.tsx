import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Ban, Bot, CheckCircle2, CircleDashed, StickyNote, UserX, Users, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CLOSED, EMPLOYER_MOVES, nextStage, type Stage } from "@/lib/applications";
import { revealsCandidate } from "@/lib/invitations";
import { documentHref } from "@/lib/document-url";
import { PageHeading, displayName, formatShortDate, panel, panelTitle } from "@/components/jobs/employer-ui";
import { focusRing } from "@/components/soft-glass/classes";
import { HoldChip, StageChip } from "@/components/applications/stage-chip";
import { ApplicationMove, ApplicationNote } from "@/components/applications/application-actions";
import { AddRound, HumanRoundActions } from "@/components/applications/rounds";

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
    const tR = await getTranslations("Rounds");

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
    // Invited and declined candidates stay anonymous (AIIN-201): only applying or accepting reveals them
    const invited = !revealsCandidate(stage);

    // An invitation not yet accepted stays anonymous: no name, email or interviews are loaded (AC3)
    const [person, interviews, humanRounds] = invited
        ? [null, [], []]
        : await Promise.all([
              db.user.findUnique({ where: { id: app.candidateId }, select: { name: true, email: true, resumeUrl: true, resumeName: true, candidateProfile: { select: { phone: true } } } }),
              db.interview.findMany({
                  where: { jobId: app.job.id, candidateId: app.candidateId },
                  orderBy: { createdAt: "desc" },
                  select: { id: true, status: true, score: true, completedAt: true, scheduledTime: true, createdAt: true, decision: true },
              }),
              db.humanRound.findMany({
                  where: { applicationId: app.id },
                  select: { id: true, roundName: true, startsAt: true, durationMins: true, interviewer: true, meetingLink: true, outcome: true, cancelledAt: true },
              }),
          ]);
    // AI and human rounds together, in time order (AIIN-196 AC3). An AI round's outcome is its hiring decision.
    const rounds = [
        ...interviews.map((i) => ({
            kind: "AI" as const,
            at: i.scheduledTime ?? i.createdAt,
            i,
            outcome: i.decision === "SHORTLISTED" ? ("PASSED" as const) : i.decision === "REJECTED" ? ("FAILED" as const) : null,
        })),
        ...humanRounds.map((h) => ({ kind: "HUMAN" as const, at: h.startsAt, h, outcome: h.cancelledAt ? null : h.outcome })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());
    const canBook = !invited && !CLOSED.includes(stage);
    const name = person ? displayName(person) : t(stage === "DECLINED" ? "declinedName" : "invitedName");
    const resumeHref = documentHref(person?.resumeUrl);
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
                    {person && (
                        <>
                            <h2 className={panelTitle}>{t("contact")}</h2>
                            <dl className="flex flex-col gap-1.5 rounded-[18px] bg-sg-row px-4 py-3 text-[15px]">
                                <div className="flex flex-wrap gap-x-2">
                                    <dt className="text-sg-muted">{t("email")}</dt>
                                    <dd className="min-w-0 break-all">
                                        <a href={`mailto:${person.email}`} className={cn("rounded-md font-semibold", focusRing)}>
                                            {person.email}
                                        </a>
                                    </dd>
                                </div>
                                {person.candidateProfile?.phone && (
                                    <div className="flex flex-wrap gap-x-2">
                                        <dt className="text-sg-muted">{t("phone")}</dt>
                                        <dd>
                                            <a href={`tel:${person.candidateProfile.phone}`} className={cn("rounded-md font-semibold", focusRing)}>
                                                {person.candidateProfile.phone}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                                {resumeHref && (
                                    <div className="flex flex-wrap gap-x-2">
                                        <dt className="text-sg-muted">{t("resume")}</dt>
                                        <dd className="min-w-0 break-all">
                                            <a href={resumeHref} target="_blank" rel="noreferrer" className={cn("rounded-md font-semibold", focusRing)}>
                                                {person.resumeName ?? t("resume")}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </>
                    )}
                    {app.coverNote && !invited && (
                        <>
                            <h2 className={panelTitle}>{t("theirNote")}</h2>
                            <p className="rounded-[18px] bg-sg-row px-4 py-3 break-words whitespace-pre-line">{app.coverNote}</p>
                        </>
                    )}
                    <h2 id="ap-rounds" className={panelTitle}>
                        {t("rounds")}
                    </h2>
                    {rounds.length === 0 ? (
                        <p className="text-sm text-sg-muted">{t("noRounds")}</p>
                    ) : (
                        <ol className="flex flex-col gap-2">
                            {rounds.map((r, n) => (
                                <li key={r.kind === "AI" ? r.i.id : r.h.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[18px] bg-sg-row px-4 py-3">
                                    {r.kind === "AI" ? <Bot className="size-[18px] shrink-0" aria-hidden="true" /> : <Users className="size-[18px] shrink-0" aria-hidden="true" />}
                                    <span className="flex min-w-0 flex-[1_1_160px] flex-col">
                                        <strong className={cn("break-words", r.kind === "HUMAN" && r.h.cancelledAt && "line-through")}>
                                            {tR("numbered", { n: n + 1, name: r.kind === "AI" ? t("aiInterview") : r.h.roundName })}
                                        </strong>
                                        <span className="text-[13px] break-words text-sg-muted">
                                            {r.kind === "AI"
                                                ? r.i.completedAt
                                                    ? tR("done", { when: time.format(r.i.completedAt) })
                                                    : r.i.scheduledTime
                                                      ? tR("from", { when: time.format(r.i.scheduledTime) })
                                                      : t("notStarted")
                                                : [time.format(r.h.startsAt), tR("minutes", { count: r.h.durationMins }), r.h.interviewer].filter(Boolean).join(" · ")}
                                        </span>
                                        {r.kind === "HUMAN" && !r.h.cancelledAt && (
                                            <a
                                                href={r.h.meetingLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={cn("self-start rounded-md text-[13px] font-semibold break-all", focusRing)}
                                            >
                                                {r.h.meetingLink}
                                            </a>
                                        )}
                                    </span>
                                    {r.kind === "HUMAN" && r.h.cancelledAt ? (
                                        <RoundOutcome outcome="CANCELLED" label={tR("cancelled")} />
                                    ) : (
                                        // An open human round shows its outcome in its own picker below
                                        (r.kind === "AI" || !canBook) && <RoundOutcome outcome={r.outcome ?? "NONE"} label={tR(`outcomes.${r.outcome ?? "NONE"}`)} />
                                    )}
                                    {r.kind === "AI" && r.i.status === "COMPLETED" && (
                                        <>
                                            <span className="font-display sg-soft text-[22px] font-semibold">{r.i.score?.toFixed(1) ?? "–"}</span>
                                            <Link
                                                href={`/interview/${r.i.id}/feedback?from=${encodeURIComponent(`/dashboard/jobs/${app.job.id}/applications/${app.id}`)}`}
                                                className={cn("rounded-md font-bold", focusRing)}
                                            >
                                                {t("report")}
                                            </Link>
                                        </>
                                    )}
                                    {r.kind === "HUMAN" && !r.h.cancelledAt && canBook && (
                                        <HumanRoundActions
                                            round={{
                                                id: r.h.id,
                                                roundName: r.h.roundName,
                                                startsAt: r.h.startsAt.toISOString(),
                                                durationMins: r.h.durationMins,
                                                interviewer: r.h.interviewer,
                                                meetingLink: r.h.meetingLink,
                                                outcome: r.h.outcome,
                                            }}
                                        />
                                    )}
                                </li>
                            ))}
                        </ol>
                    )}
                    {canBook && <AddRound id={app.id} />}
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

const OUTCOME_ICON = { PASSED: CheckCircle2, FAILED: XCircle, NO_SHOW: UserX, NONE: CircleDashed, CANCELLED: Ban } as const;

/** A round's outcome, told by icon and word. */
function RoundOutcome({ outcome, label }: { outcome: keyof typeof OUTCOME_ICON; label: string }) {
    const Icon = OUTCOME_ICON[outcome];
    const tone = outcome === "PASSED" ? "text-sg-success" : outcome === "FAILED" || outcome === "NO_SHOW" ? "text-sg-danger" : "text-sg-muted";
    return (
        <span className={cn("inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold", tone)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}
