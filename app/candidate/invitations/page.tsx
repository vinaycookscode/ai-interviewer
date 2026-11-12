import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Lock, Send, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { myMatches } from "@/lib/my-matches";
import { focusRing } from "@/components/soft-glass/classes";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { InvitationActions } from "@/components/talent-match/invitation-actions";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Invitations");
    return { title: t("title") };
}

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const lakh = (n: number) => `${Math.round(n / 10_000) / 10}`;

/** Invitations to apply (AIIN-201), from the approved "Invitations" artboards. Only open, unexpired ones. */
export default async function InvitationsPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Invitations");
    const now = new Date();

    const [invites, profile] = await Promise.all([
        db.application.findMany({
            where: { candidateId: userId, stage: "INVITED", inviteExpiresAt: { gt: now } },
            orderBy: { invitedAt: "desc" },
            select: {
                id: true,
                inviteMessage: true,
                invitedAt: true,
                inviteExpiresAt: true,
                candidateSeenAt: true,
                job: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        workMode: true,
                        salaryMin: true,
                        salaryMax: true,
                        mustHaveSkills: true,
                        niceToHaveSkills: true,
                        minYears: true,
                        maxYears: true,
                        employer: { select: { name: true } },
                    },
                },
            },
        }),
        db.candidateProfile.findUnique({ where: { userId }, select: { phone: true, discoverable: true } }),
    ]);
    const matches = await myMatches(
        userId,
        invites.map((i) => i.job),
    );
    if (invites.some((i) => !i.candidateSeenAt || (i.invitedAt && i.candidateSeenAt < i.invitedAt))) {
        after(() =>
            db.application.updateMany({ where: { candidateId: userId, stage: "INVITED" }, data: { candidateSeenAt: new Date() } }).catch(() => undefined),
        );
    }

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="max-w-[640px] text-lg text-sg-muted">{t("subtitle")}</p>
            </div>
            {invites.length === 0 ? (
                <EmptyState
                    icon={<Send className="size-7" aria-hidden="true" />}
                    title={t("noneTitle")}
                    action={
                        profile?.discoverable ? undefined : (
                            <Link href="/candidate/profile/discover" className={cn("rounded-md font-bold", focusRing)}>
                                {t("privacyLink")}
                            </Link>
                        )
                    }
                >
                    {profile?.discoverable ? t("noneBodyFindable") : t("noneBody")}
                </EmptyState>
            ) : (
                <ul className="flex flex-col gap-4">
                    {invites.map((i, n) => {
                        const company = i.job.employer.name?.trim() || t("anEmployer");
                        const isNew = !i.candidateSeenAt || (!!i.invitedAt && i.candidateSeenAt < i.invitedAt);
                        const m = matches?.get(i.job.id);
                        const daysLeft = Math.max(1, Math.ceil(((i.inviteExpiresAt?.getTime() ?? 0) - now.getTime()) / 86_400_000));
                        const place = [i.job.location, i.job.workMode ? t(`modes.${i.job.workMode}`) : null].filter(Boolean).join(" · ");
                        const pay =
                            i.job.salaryMin || i.job.salaryMax
                                ? `₹${i.job.salaryMin ? lakh(i.job.salaryMin) : "?"}–${i.job.salaryMax ? lakh(i.job.salaryMax) : "?"} L`
                                : null;
                        return (
                            <li key={i.id} className="sg-glass flex flex-col gap-3 rounded-[24px] p-5 sm:rounded-[28px] sm:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                                        <strong className="text-lg break-words">{i.job.title}</strong>
                                        <span className="text-sg-muted">{[company, place, pay].filter(Boolean).join(" · ")}</span>
                                    </span>
                                    <span className="flex flex-wrap gap-2">
                                        {isNew && (
                                            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                                                <Sparkles className="size-3.5" aria-hidden="true" />
                                                {t("new")}
                                            </span>
                                        )}
                                        {m && (
                                            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold text-sg-success">
                                                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                {t("match", { score: m.score })}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {i.inviteMessage && <p className="text-[15px] break-words">“{i.inviteMessage}”</p>}
                                <span className="text-[13px] text-sg-muted">
                                    {t("when", { date: i.invitedAt ? day.format(i.invitedAt) : "", count: daysLeft })}
                                </span>
                                <InvitationActions id={i.id} jobId={i.job.id} company={company} phone={profile?.phone ?? ""} primary={n === 0} />
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
