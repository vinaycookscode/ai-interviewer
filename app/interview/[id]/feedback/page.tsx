import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { softGlassFonts } from "@/lib/fonts";
import { getInterviewFeedback } from "@/actions/feedback";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { AppShell } from "@/components/soft-glass/app-shell";
import { getFeatureFlags } from "@/actions/feature-flags";
import { FeedbackReport } from "@/components/feedback/feedback-report";
import { DecisionPanel } from "@/components/feedback/decision-panel";
import { IntegritySection, type IntegrityConsent, type IntegrityGroup, type IntegrityProps, type IntegrityReviewState } from "@/components/feedback/integrity-section";
import { loadIntegrity, storeIntegrity } from "@/lib/integrity/compute";
import { RULES_VERSION } from "@/lib/integrity/verdict";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronRight, Hourglass, ShieldCheck } from "lucide-react";
import { focusRing } from "@/components/soft-glass/classes";
import { StatusScreen } from "@/components/layout/status-screen";

const istTime = (d: Date) =>
    `${d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })} IST`;

export default async function FeedbackPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ from?: string }>;
}) {
    const { id } = await params;
    const { from } = await searchParams;
    const session = await auth();
    const user = session?.user;
    if (!user?.id) notFound();

    // The action only returns the report to its candidate, the job's employer or an admin.
    const result = await getInterviewFeedback(id);
    if (!result.success) notFound();
    const { interview, averageScore, viewer } = result;

    const t = await getTranslations("FeedbackReport");
    // Still being scored (AIIN-170): the candidate waits for the whole result, never a partial one
    if (viewer === "candidate" && (await db.answer.count({ where: { interviewId: id, gradingStatus: { in: ["PENDING", "GRADING"] } } })) > 0) {
        return (
            <StatusScreen icon={Hourglass} title={t("scoringTitle")} action={{ label: t("backCandidate"), href: "/candidate/dashboard" }}>
                <p>{t("scoringBody")}</p>
            </StatusScreen>
        );
    }
    const isAdmin = user.role === "ADMIN";
    const back = viewer === "candidate"
        ? { href: "/candidate/dashboard", label: t("backCandidate") }
        : {
              // Back to the ranked list with the same filters, but only ever to this job's page (AIIN-158)
              href: from && (from === `/dashboard/jobs/${interview.job.id}` || from.startsWith(`/dashboard/jobs/${interview.job.id}?`)) ? from : `/dashboard/jobs/${interview.job.id}`,
              label: interview.job.title,
          };

    // The decision and its history: only for the employer who owns the job, never the candidate (AIIN-157)
    const decision =
        viewer === "employer" && user.role === "EMPLOYER"
            ? await db.interview.findFirst({
                  where: { id, job: { employerId: user.id } },
                  select: {
                      status: true,
                      integrityRulesVersion: true,
                      consentDeclinedAt: true,
                      // The candidate's side of what was flagged (AIIN-185)
                      candidateContext: true,
                      candidateContextAt: true,
                      // That and when, for the employer: never the IP or user agent (AIIN-176)
                      consents: { select: { acceptedAt: true }, orderBy: { acceptedAt: "desc" }, take: 1 },
                      // The employer's reviews of the verdict, newest first (AIIN-179)
                      integrityReviews: {
                          orderBy: { createdAt: "desc" },
                          select: { id: true, outcome: true, note: true, createdAt: true, byUser: { select: { name: true, email: true } } },
                      },
                      decision: true,
                      decisionEvents: {
                          orderBy: { createdAt: "desc" },
                          select: { id: true, to: true, note: true, createdAt: true, confirmedConcerns: true, byUser: { select: { name: true, email: true } } },
                      },
                  },
              })
            : null;

    // Integrity: the same owning employer only (AIIN-177). A verdict from older rules is recomputed and stored.
    let integrity: IntegrityProps | null = null;
    if (decision) {
        if (decision.status !== "COMPLETED") {
            integrity = { state: "notFinished" };
        } else {
            const report = decision.integrityRulesVersion === RULES_VERSION ? await loadIntegrity(id) : await storeIntegrity(id);
            if (report && report.events.length === 0) integrity = { state: "noEvents" };
            else if (report) {
                const groups: IntegrityGroup[] = [];
                for (const e of report.events) {
                    let group = groups.find((g) => g.n === e.question);
                    if (!group) {
                        group = { n: e.question, text: report.questions.find((q) => q.n === e.question)?.text ?? null, events: [] };
                        groups.push(group);
                    }
                    group.events.push({ offset: e.offset, kind: e.kind, seconds: e.seconds });
                }
                integrity = { state: "ready", verdict: report.verdict, reasons: report.reasons, summary: report.summary, groups };
            }
        }
    }

    const consent: IntegrityConsent | null = decision
        ? {
              agreedAt: decision.consents[0] ? istTime(decision.consents[0].acceptedAt) : null,
              declinedAt: decision.consentDeclinedAt ? istTime(decision.consentDeclinedAt) : null,
          }
        : null;

    const review: IntegrityReviewState | null = decision
        ? {
              interviewId: id,
              history: decision.integrityReviews.map((r) => ({
                  id: r.id,
                  outcome: r.outcome,
                  note: r.note,
                  by: r.byUser ? r.byUser.name || r.byUser.email : null,
                  when: istTime(r.createdAt),
              })),
          }
        : null;

    // The candidate's own way to what was flagged (AIIN-185): how many moments, never the verdict
    const ownFlags =
        viewer === "candidate" && (await db.interview.count({ where: { id, candidateId: user.id, status: "COMPLETED" } }))
            ? ((await loadIntegrity(id))?.events.length ?? 0)
            : null;
    const tf = await getTranslations("CandidateFlags");
    const candidateRow = ownFlags !== null && (
        <Link
            href={`/interview/${id}/flags`}
            className={cn("sg-glass flex items-center gap-3.5 rounded-[22px] px-5 py-4", focusRing)}
        >
            <ShieldCheck className="size-5 shrink-0 text-sg-muted" aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-bold">{tf("rowTitle")}</span>
                <span className="text-sm text-sg-muted">{ownFlags ? tf("rowSome", { count: ownFlags }) : tf("rowNone")}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-sg-muted" aria-hidden="true" />
        </Link>
    );

    const flags = await getFeatureFlags();
    const flagMap = flags.reduce<Record<string, boolean>>((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});

    // This route sits outside /dashboard, so it brings the same Soft Glass shell itself.
    return (
        <div className={cn(softGlassFonts, "soft-glass relative flex min-h-screen flex-col overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <AppShell
                role={user.role === "CANDIDATE" ? "candidate" : "employer"}
                user={{ name: user.name, email: user.email }}
                isAdmin={isAdmin}
                featureFlags={flagMap}
            >
                <FeedbackReport
                    interview={interview}
                    averageScore={averageScore ?? null}
                    viewer={viewer}
                    back={back}
                    integrity={
                        (integrity && consent && (
                            <IntegritySection
                                {...integrity}
                                consent={consent}
                                review={review}
                                candidateContext={
                                    decision?.candidateContext && decision.candidateContextAt
                                        ? { text: decision.candidateContext, when: istTime(decision.candidateContextAt) }
                                        : null
                                }
                            />
                        )) ||
                        candidateRow ||
                        null
                    }
                    aside={
                        decision && (
                            <DecisionPanel
                                interviewId={id}
                                current={decision.decision}
                                finished={decision.status === "COMPLETED"}
                                history={decision.decisionEvents.map((e) => ({
                                    id: e.id,
                                    to: e.to,
                                    note: e.note,
                                    by: e.byUser ? e.byUser.name || e.byUser.email : null,
                                    when: istTime(e.createdAt),
                                    confirmedConcerns: e.confirmedConcerns,
                                }))}
                            />
                        )
                    }
                />
            </AppShell>
        </div>
    );
}
