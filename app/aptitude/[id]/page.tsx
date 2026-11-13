import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CalendarClock, CheckCircle2, Eye, Flag, List, Lock, LockKeyhole, MessageCircle, Timer, TimerOff } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { driveStatus } from "@/lib/drives";
import { canAnswer, readAnswers } from "@/lib/aptitude";
import { finishAttempt } from "@/lib/aptitude-attempts";
import { StatusScreen } from "@/components/layout/status-screen";
import { FocusCard, FocusRoot, SessionHeader } from "@/components/interview/session-shell";
import { AptitudeRound } from "@/components/aptitude/aptitude-round";
import { StartAptitude } from "@/components/aptitude/start-aptitude";
import { coralButton } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Aptitude");
    return { title: t("title"), robots: { index: false } };
}

const ist = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** A drive's aptitude round for one candidate (AIIN-169), in focus mode. Only that candidate, signed in, can take it. */
export default async function AptitudePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const t = await getTranslations("Aptitude");
    const dc = await db.driveCandidate.findUnique({
        where: { id },
        select: {
            id: true,
            userId: true,
            stage: true,
            interviewId: true,
            drive: {
                select: {
                    draft: true,
                    opensAt: true,
                    closesAt: true,
                    closedAt: true,
                    aptitudeEnabled: true,
                    aptitudeTestId: true,
                    aptitudeCutoff: true,
                    aptitudeTest: { select: { durationMinutes: true, sections: { select: { askCount: true } } } },
                    job: { select: { title: true, employer: { select: { name: true } } } },
                },
            },
            attempt: { select: { id: true, deadline: true, submittedAt: true, questionIds: true, optionOrders: true, answers: true, score: true, total: true, percent: true, passed: true } },
        },
    });
    if (!dc || !dc.drive.aptitudeEnabled || !dc.drive.aptitudeTest) return <StatusScreen icon={Lock} tone="error" title={t("invalidLink")} />;

    const job = dc.drive.job.title;
    const company = dc.drive.job.employer.name?.trim() || t("theEmployer");
    const session = await auth();
    const callback = new URLSearchParams({ callbackUrl: `/aptitude/${dc.id}` }).toString();
    if (!session?.user) {
        // Same as an interview link: invited accounts without a password create one first (AIIN-117)
        const account = await db.user.findUnique({ where: { id: dc.userId }, select: { password: true } });
        const hasPassword = !!account && account.password !== null;
        return (
            <StatusScreen
                title={hasPassword ? t("welcomeBack") : t("invited")}
                action={{ label: hasPassword ? t("signIn") : t("createAccount"), href: `${hasPassword ? "/auth/login" : "/auth/register"}?${callback}` }}
            >
                <p>{t("invitedBody", { job, company })}</p>
            </StatusScreen>
        );
    }
    if (session.user.id !== dc.userId) return <StatusScreen icon={LockKeyhole} tone="error" title={t("wrongAccount")}><p>{t("wrongAccountBody")}</p></StatusScreen>;

    const now = new Date();
    let attempt = dc.attempt;
    // The deadline passed with nobody here: score it now from the saved answers (AC4)
    if (attempt && !attempt.submittedAt && !canAnswer(attempt.deadline, now)) {
        await finishAttempt(attempt.id);
        attempt = await db.aptitudeAttempt.findUnique({
            where: { id: attempt.id },
            select: { id: true, deadline: true, submittedAt: true, questionIds: true, optionOrders: true, answers: true, score: true, total: true, percent: true, passed: true },
        });
    }

    // Done: the result, and no second try (AC7)
    if (attempt?.submittedAt) {
        const interview = attempt.passed && dc.interviewId ? await db.interview.findUnique({ where: { id: dc.interviewId }, select: { id: true, token: true } }) : null;
        return (
            <FocusRoot>
                <SessionHeader title={t("title")} subtitle={`${job} · ${company}`} current={0} total={0} />
                <FocusCard>
                    <div className="flex flex-col gap-4">
                        <span className="inline-flex size-14 items-center justify-center rounded-full bg-sg-chip">
                            {attempt.passed ? <CheckCircle2 className="size-7" aria-hidden="true" /> : <MessageCircle className="size-7" aria-hidden="true" />}
                        </span>
                        <h1 className="font-display sg-soft text-[30px] leading-[1.2] font-semibold">{attempt.passed ? t("passedTitle") : t("thanksTitle")}</h1>
                        <p>{t("score", { score: attempt.score ?? 0, total: attempt.total ?? 0, percent: attempt.percent ?? 0, cutoff: dc.drive.aptitudeCutoff ?? 0 })}</p>
                        <p className="text-sg-muted">{attempt.passed ? t("passedBody") : t("thanksBody")}</p>
                        {interview && (
                            <a href={`/interview/${interview.id}?token=${interview.token}`} className={cn(coralButton, "h-12 self-start px-6 text-base")}>
                                {t("startInterview")}
                            </a>
                        )}
                    </div>
                </FocusCard>
            </FocusRoot>
        );
    }

    const status = driveStatus(dc.drive, now);
    if (!attempt && status === "SCHEDULED" && dc.drive.opensAt)
        return <StatusScreen icon={CalendarClock} title={t("opensTitle", { when: ist.format(dc.drive.opensAt) })}><p>{t("opensBody", { job, company })}</p></StatusScreen>;
    if (!attempt && status !== "LIVE") return <StatusScreen icon={TimerOff} tone="error" title={t("closedTitle")}><p>{t("closedBody", { company })}</p></StatusScreen>;

    // Opened the link: the employer's funnel counts it
    if (dc.stage === "INVITED") await db.driveCandidate.update({ where: { id: dc.id }, data: { stage: "OPENED" } });

    if (!attempt) {
        const questions = dc.drive.aptitudeTest.sections.reduce((n, s) => n + s.askCount, 0);
        const minutes = dc.drive.aptitudeTest.durationMinutes;
        const rules: [typeof Timer, string][] = [
            [Timer, t("ruleTime", { minutes, questions })],
            [List, t("ruleMove")],
            [CheckCircle2, t("ruleSaved")],
            [TimerOff, t("ruleAuto")],
            [Flag, t("rulePass", { cutoff: dc.drive.aptitudeCutoff ?? 0 })],
            [Eye, t("ruleTab")],
        ];
        return (
            <FocusRoot>
                <SessionHeader title={t("title")} subtitle={`${job} · ${company}`} current={0} total={0}>
                    <span className="rounded-full bg-sg-chip px-3 py-1.5 text-[13px] font-bold">{t("minutes", { minutes })}</span>
                    <span className="rounded-full bg-sg-chip px-3 py-1.5 text-[13px] font-bold">{t("questionCount", { count: questions })}</span>
                </SessionHeader>
                <FocusCard>
                    <div className="flex flex-col gap-5">
                        <h1 className="font-display sg-soft text-[length:clamp(30px,7vw,40px)] leading-[1.15] font-semibold">{t("beforeTitle")}</h1>
                        <ul className="flex flex-col gap-3">
                            {rules.map(([Icon, text]) => (
                                <li key={text} className="flex items-start gap-2.5">
                                    <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                        <StartAptitude driveCandidateId={dc.id} />
                    </div>
                </FocusCard>
            </FocusRoot>
        );
    }

    // In progress: questions with options in this candidate's order, and never the answers (AC6)
    const qs = await db.aptitudeQuestion.findMany({ where: { id: { in: attempt.questionIds } }, select: { id: true, text: true, options: true, section: { select: { name: true } } } });
    const byId = new Map(qs.map((q) => [q.id, q]));
    const orders = (Array.isArray(attempt.optionOrders) ? attempt.optionOrders : []) as number[][];
    const answers = readAnswers(attempt.answers, attempt.questionIds);
    const questions = attempt.questionIds.flatMap((qid, i) => {
        const q = byId.get(qid);
        if (!q) return [];
        const order = orders[i] ?? q.options.map((_, k) => k);
        return [{ id: q.id, section: q.section.name, text: q.text, options: order.map((k) => q.options[k]) }];
    });
    const saved = Object.fromEntries(
        Object.entries(answers).flatMap(([qid, original]) => {
            const i = attempt!.questionIds.indexOf(qid);
            const shown = (orders[i] ?? []).indexOf(original);
            return shown >= 0 ? [[qid, shown]] : [];
        }),
    );
    return (
        <FocusRoot>
            <AptitudeRound
                attemptId={attempt.id}
                title={t("title")}
                subtitle={`${job} · ${company}`}
                deadline={attempt.deadline.toISOString()}
                serverNow={now.toISOString()}
                questions={questions}
                saved={saved}
            />
        </FocusRoot>
    );
}
