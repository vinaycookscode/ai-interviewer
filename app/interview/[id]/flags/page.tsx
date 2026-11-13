import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { softGlassFonts } from "@/lib/fonts";
import { getFeatureFlags } from "@/actions/feature-flags";
import { loadIntegrity } from "@/lib/integrity/compute";
import type { EventKind } from "@/lib/integrity/verdict";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { AppShell } from "@/components/soft-glass/app-shell";
import { Mascot } from "@/components/soft-glass/mascot";
import { focusRing } from "@/components/soft-glass/classes";
import { CandidateContextForm } from "@/components/feedback/candidate-context-form";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("CandidateFlags");
    return { title: t("title") };
}

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * What was flagged in the candidate's own interview, and their side of it (AIIN-185), from the approved "Candidate view
 * of flags" artboards. Only the interview's candidate sees it (AC5). The same facts the employer sees, never the
 * employer's verdict, review or notes (AC1).
 */
export default async function CandidateFlagsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const user = session?.user;
    if (!user?.id) notFound();

    const interview = await db.interview.findFirst({
        where: { id, candidateId: user.id, status: "COMPLETED" },
        select: {
            id: true,
            createdAt: true,
            candidateContext: true,
            candidateContextAt: true,
            job: { select: { title: true, employer: { select: { name: true } } } },
        },
    });
    if (!interview) notFound();

    const t = await getTranslations("CandidateFlags");
    const ti = await getTranslations("Integrity");
    const company = interview.job.employer.name?.trim() || t("theEmployer");
    const report = await loadIntegrity(interview.id);
    const events = report?.events ?? [];

    const duration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m === 0 ? ti("duration.sec", { s }) : s === 0 ? ti("duration.min", { m }) : ti("duration.minSec", { m, s });
    };
    const text = (kind: EventKind, seconds: number | null) =>
        kind === "away" && seconds !== null
            ? ti("events.awayFor", { duration: duration(seconds) })
            : kind === "fullscreen" && seconds !== null
              ? ti("events.fullscreenFor", { duration: duration(seconds) })
              : ti(`events.${kind}`);

    const flags = await getFeatureFlags();
    const flagMap = flags.reduce<Record<string, boolean>>((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});
    const back = `/interview/${interview.id}/feedback`;
    const h2 = "font-display sg-soft text-[22px] font-semibold leading-7";

    return (
        <div className={cn(softGlassFonts, "soft-glass relative flex min-h-screen flex-col overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <AppShell role="candidate" user={{ name: user.name, email: user.email }} isAdmin={false} featureFlags={flagMap}>
                <div className="flex flex-col gap-6 sm:gap-9">
                    <div className="flex max-w-[720px] flex-col gap-2">
                        <Link href={back} className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted", focusRing)}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            {t("back")}
                        </Link>
                        <span className="text-[13px] leading-[18px] font-bold text-sg-muted">
                            {interview.job.title} · {company} · {day.format(interview.createdAt)}
                        </span>
                        <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                    </div>

                    {events.length === 0 ? (
                        // AC6
                        <section className="sg-glass flex max-w-[720px] flex-col items-center gap-3 rounded-[28px] p-6 text-center sm:p-8">
                            <Mascot className="size-16" />
                            <h2 className="font-display sg-soft mt-2 text-[26px] leading-8 font-semibold">{t("noneTitle")}</h2>
                            <p className="max-w-[380px] text-sg-muted">{t("noneBody")}</p>
                            <Link href={back} className={cn("sg-glass inline-flex h-12 items-center rounded-full px-[22px] font-bold", focusRing)}>
                                {t("backToReport")}
                            </Link>
                        </section>
                    ) : (
                        <div className="flex flex-wrap items-start gap-6">
                            <section aria-labelledby="cf-list" className="sg-glass flex min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7">
                                <h2 id="cf-list" className={h2}>
                                    {t("listTitle")}
                                </h2>
                                <p className="text-sg-muted">{t("listBody", { company })}</p>
                                <ol className="flex flex-col gap-2">
                                    {events.map((e, i) => (
                                        <li key={i} className="flex flex-col gap-0.5 rounded-2xl bg-sg-row px-3.5 py-3">
                                            <span className="text-[13px] leading-[18px] font-bold text-sg-muted">
                                                {e.question === null ? t("beforeQuestions") : t("question", { n: e.question })} · {mmss(e.offset)}
                                            </span>
                                            <span className="font-semibold">{text(e.kind, e.seconds)}</span>
                                            {e.question !== null && report?.questions.find((q) => q.n === e.question) && (
                                                <span className="text-sm [overflow-wrap:anywhere] text-sg-muted">{report.questions.find((q) => q.n === e.question)!.text}</span>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </section>
                            <section
                                aria-labelledby="cf-add"
                                className="sg-glass sg-shadow-lg flex max-w-[420px] min-w-[min(280px,100%)] flex-[1_1_320px] flex-col gap-4 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7"
                            >
                                <h2 id="cf-add" className={h2}>
                                    {t("addTitle")}
                                </h2>
                                <CandidateContextForm
                                    interviewId={interview.id}
                                    company={company}
                                    sent={
                                        interview.candidateContext && interview.candidateContextAt
                                            ? { text: interview.candidateContext, on: day.format(interview.candidateContextAt) }
                                            : null
                                    }
                                />
                            </section>
                        </div>
                    )}
                </div>
            </AppShell>
        </div>
    );
}
