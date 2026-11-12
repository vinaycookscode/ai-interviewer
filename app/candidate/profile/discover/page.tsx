import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Eye, Lock, Pencil } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { anonymousCard } from "@/lib/anonymous-card";
import { checkFacts, EMPTY_FACTS } from "@/lib/resume-facts";
import { focusRing } from "@/components/soft-glass/classes";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { AnonymousCardView } from "@/components/talent-match/anonymous-card-view";
import { BlockedEmployers, DiscoverableSwitch } from "@/components/talent-match/discovery-controls";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Discover");
    return { title: t("title") };
}

/** "Let employers find me" (AIIN-198), from the approved artboards: the switch, what's never shown, and the card. */
export default async function DiscoverPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Discover");

    const [profile, mocks, blocks] = await Promise.all([
        db.candidateProfile.findUnique({ where: { userId }, select: { discoverable: true, factsConfirmedAt: true, resumeFacts: true, primaryRole: true, noticePeriodDays: true } }),
        db.mockInterview.findMany({ where: { userId, score: { not: null } }, orderBy: { createdAt: "desc" }, take: 5, select: { score: true } }),
        db.candidateBlock.findMany({ where: { candidateId: userId }, orderBy: { createdAt: "desc" }, select: { employer: { select: { id: true, name: true } } } }),
    ]);
    // The same function builds employers' cards (AC3)
    const card = anonymousCard({
        userId,
        facts: checkFacts(profile?.resumeFacts ?? EMPTY_FACTS),
        primaryRole: profile?.primaryRole ?? null,
        noticeDays: profile?.noticePeriodDays ?? null,
        practiceScores: mocks.map((m) => m.score),
    });
    const hasFacts = !!profile?.factsConfirmedAt;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-sg-muted">{t("eyebrow")}</span>
                <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="max-w-[640px] text-lg text-sg-muted">{t("subtitle")}</p>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <section aria-labelledby="fm-title" className={cn(panel, "gap-4")}>
                        <DiscoverableSwitch on={!!profile?.discoverable} canTurnOn={hasFacts} />
                        {!hasFacts && (
                            <p className="flex flex-wrap items-center gap-2 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                                <span className="flex-[1_1_200px]">{t("needFacts")}</span>
                                <Link href="/candidate/profile/facts" className={cn("rounded-md font-bold underline", focusRing)}>
                                    {t("checkFacts")}
                                </Link>
                            </p>
                        )}
                        <h2 className={panelTitle}>{t("neverTitle")}</h2>
                        <ul className="flex flex-col gap-2">
                            {(["never1", "never2", "never3", "never4"] as const).map((k) => (
                                <li key={k} className="flex items-center gap-2.5">
                                    <Lock className="size-4 shrink-0" aria-hidden="true" />
                                    {t(k)}
                                </li>
                            ))}
                        </ul>
                        <p className="flex items-start gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                            <Eye className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {t("nameAfter")}
                        </p>
                    </section>
                    <section aria-labelledby="fm-blocks" className={cn(panel, "gap-3")}>
                        <h2 id="fm-blocks" className={panelTitle}>
                            {t("blocksTitle")}
                        </h2>
                        <p className="text-sm text-sg-muted">{t("blocksBody")}</p>
                        <BlockedEmployers blocked={blocks.map((b) => ({ id: b.employer.id, name: b.employer.name ?? t("anEmployer") }))} />
                    </section>
                </div>
                <section aria-labelledby="fm-card" className={cn(panel, "gap-4")}>
                    <h2 id="fm-card" className={panelTitle}>
                        {t("cardTitle")}
                    </h2>
                    <AnonymousCardView
                        card={card}
                        labels={{
                            anonymous: t("card.anonymous"),
                            years: (n) => t("card.years", { count: n }),
                            practice: t("card.practice"),
                            location: t("card.location"),
                            notice: t("card.notice"),
                            noticeDays: (n) => t("card.noticeDays", { count: n }),
                            education: t("card.education"),
                            none: t("card.none"),
                        }}
                    />
                    <Link href="/candidate/profile/facts" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-bold", focusRing)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        {t("change")}
                    </Link>
                </section>
            </div>
        </div>
    );
}
