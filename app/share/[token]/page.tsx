import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Eye } from "lucide-react";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIP } from "@/lib/geolocation";
import { SHARE_TRIES_PER_MINUTE, hashShareToken, looksLikeShareToken, shareState } from "@/lib/share-link";
import { FocusRoot } from "@/components/interview/session-shell";
import { Mascot, UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { SharedShortlistView, type SharedCandidate } from "@/components/jobs/shared-shortlist";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("SharedShortlist");
    // Never indexed (AIIN-161); next.config also sends X-Robots-Tag and no-store
    return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/**
 * A job's shortlist for a hiring manager without an account (AIIN-161), from the approved hiring-manager artboards.
 * Shows only what the table below selects: never emails, phones, documents, integrity evidence or decision notes (AC3).
 */
export default async function SharedShortlistPage({ params }: { params: Promise<{ token: string }> }) {
    const t = await getTranslations("SharedShortlist");
    const { token } = await params;

    // Every try counts, right token or wrong (AC7)
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

    const share = await db.shortlistShare.findUnique({
        where: { tokenHash: hashShareToken(token) },
        select: {
            id: true,
            jobId: true,
            includeOnHold: true,
            expiresAt: true,
            revokedAt: true,
            job: { select: { title: true, employer: { select: { name: true } } } },
        },
    });
    if (!share) notFound();

    const employer = share.job.employer.name?.trim() || "The employer";
    const state = shareState(share, new Date());
    if (state === "revoked") return notice(t("revokedTitle"), t("revokedBody", { employer }));
    if (state === "expired") return notice(t("expiredTitle"), t("expiredBody"));

    await db.shortlistShare.update({ where: { id: share.id }, data: { lastOpenedAt: new Date(), openCount: { increment: 1 } } });

    // Who's on the shortlist now, not when the link was made (AC6), ranked as on the job page
    const interviews = await db.interview.findMany({
        where: { jobId: share.jobId, status: "COMPLETED", decision: { in: share.includeOnHold ? ["SHORTLISTED", "ON_HOLD"] : ["SHORTLISTED"] } },
        orderBy: [{ score: { sort: "desc", nulls: "last" } }, { completedAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
        select: {
            id: true,
            score: true,
            feedback: true,
            candidate: { select: { name: true } },
            personalityProfile: { select: { confidenceScore: true, cultureFitScore: true, strengths: true, weaknesses: true } },
            answers: { orderBy: { createdAt: "asc" }, select: { score: true, feedback: true, transcript: true, question: { select: { text: true } } } },
        },
    });
    const candidates: SharedCandidate[] = interviews.map((i, n) => ({
        key: String(n),
        rank: n + 1,
        name: i.candidate.name?.trim() || `Candidate ${n + 1}`,
        score: i.score,
        summary: i.feedback,
        confidence: i.personalityProfile?.confidenceScore ?? null,
        cultureFit: i.personalityProfile ? i.personalityProfile.cultureFitScore / 10 : null,
        strengths: i.personalityProfile?.strengths.slice(0, 2) ?? [],
        weaknesses: i.personalityProfile?.weaknesses.slice(0, 2) ?? [],
        answers: i.answers.map((a) => ({ question: a.question.text, score: a.score, feedback: a.feedback, transcript: a.transcript })),
    }));

    return shell(
        <>
            <p role="note" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[18px] bg-sg-chip px-4 py-3 text-[15px]">
                <Eye className="size-4 shrink-0" aria-hidden="true" />
                <span>
                    <strong>{t("readOnly")}</strong> {t("sharedBy", { employer, date: date.format(share.expiresAt) })}
                </span>
            </p>
            <div className="flex flex-col gap-1.5">
                <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("count", { count: candidates.length })}</span>
                <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">
                    {share.job.title}
                </h1>
            </div>
            {candidates.length ? <SharedShortlistView candidates={candidates} /> : <p className="sg-glass rounded-[22px] p-6 text-sg-muted">{t("empty")}</p>}
            <p className="text-sm text-sg-muted">{t("notShared", { employer })}</p>
        </>,
    );
}
