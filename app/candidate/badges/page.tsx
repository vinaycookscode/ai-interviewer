import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Award, Check, Lock } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { istDay } from "@/lib/daily-challenge/logic";
import { CERTIFICATE_MIN_DAYS } from "@/lib/achievements/rules";
import { loadBadges, type BadgeView } from "@/lib/achievements/server";
import { BadgeIcon } from "@/components/candidate/badge-icon";
import { focusRing } from "@/components/soft-glass/classes";
import { label, outlineButton, panel, row, sectionTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Badges");
    return { title: t("metaTitle") };
}

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** Every badge, earned and still to earn, and the 90-day certificate (AIIN-102). */
export default async function BadgesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");
    const userId = session.user.id;
    const t = await getTranslations("Badges");

    const [badges, certificate, plan] = await Promise.all([
        loadBadges(userId),
        db.certificate.findFirst({ where: { userId }, orderBy: { issuedAt: "desc" }, select: { id: true, planName: true, issuedAt: true } }),
        db.programEnrollment.findFirst({
            where: { userId, status: { in: ["ACTIVE", "PAUSED"] }, program: { durationDays: { gte: CERTIFICATE_MIN_DAYS } } },
            orderBy: { lastActiveAt: "desc" },
            select: { currentDay: true, program: { select: { slug: true, durationDays: true } } },
        }),
    ]);

    const today = istDay(new Date());
    const when = (b: BadgeView) => (istDay(b.earnedAt!) === today ? t("earnedToday") : t("earnedOn", { date: shortDate.format(b.earnedAt!) }));
    const how = (b: BadgeView) =>
        b.progress === null
            ? t(`items.${b.key}.how`)
            : t(`items.${b.key}.progress`, { count: b.progress, target: b.target, left: b.target - b.progress });

    const list = "grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-2.5";
    const tile = "flex size-12 shrink-0 items-center justify-center rounded-2xl";

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <Link href="/candidate/profile" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t("back")}
                </Link>
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            <section aria-labelledby="earned-title" className={panel}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="earned-title" className={sectionTitle}>
                        {t("earned")}
                    </h2>
                    <span className={label}>{t("count", { earned: badges.earned.length, total: badges.total })}</span>
                </div>
                {badges.earned.length ? (
                    <ul className={list}>
                        {badges.earned.map((b) => (
                            <li key={b.key} className={cn(row, "flex items-center gap-3")}>
                                <span className={cn(tile, "bg-sg-coral text-sg-coral-ink")}>
                                    <BadgeIcon badge={b.key} className="size-[22px]" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="font-bold">{t(`items.${b.key}.name`)}</span>
                                    <span className="inline-flex items-center gap-1 text-[13px] text-sg-muted">
                                        <Check className="size-[13px] shrink-0" aria-hidden="true" />
                                        {when(b)}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sg-muted">{t("noneEarned")}</p>
                )}
            </section>

            <section aria-labelledby="locked-title" className={panel}>
                <h2 id="locked-title" className={sectionTitle}>
                    {t("locked")}
                </h2>
                {badges.locked.length ? (
                    <ul className={list}>
                        {badges.locked.map((b) => (
                            <li key={b.key} className={cn(row, "flex items-center gap-3")}>
                                <span className={cn(tile, "border-2 border-dashed border-sg-field-border text-sg-muted")}>
                                    <Lock className="size-5" aria-hidden="true" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="font-bold">{t(`items.${b.key}.name`)}</span>
                                    <span className="text-[13px] text-sg-muted">{t("lockedHow", { how: how(b) })}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sg-muted">{t("allEarned")}</p>
                )}
            </section>

            <section aria-labelledby="cert-title" className={cn(panel, "flex-row flex-wrap items-center gap-3.5")}>
                <span className={cn(tile, "bg-sg-lavender-soft text-sg-lavender-ink")} aria-hidden="true">
                    <Award className="size-[22px]" />
                </span>
                <span className="flex min-w-0 flex-[1_1_260px] flex-col">
                    <h2 id="cert-title" className={sectionTitle}>
                        {t("certTitle")}
                    </h2>
                    <span className="text-sg-muted">
                        {certificate
                            ? t("certDone", { plan: certificate.planName, date: longDate.format(certificate.issuedAt) })
                            : plan
                              ? t("certDay", { day: plan.currentDay, total: plan.program.durationDays })
                              : t("certNone")}
                    </span>
                </span>
                {certificate ? (
                    <Link href={`/certificate/${certificate.id}`} className={cn(outlineButton, "h-11 px-5")}>
                        {t("certOpen")}
                    </Link>
                ) : (
                    <Link href={plan ? `/candidate/placement-program/${plan.program.slug}` : "/candidate/placement-program"} className={cn(outlineButton, "h-11 px-5")}>
                        {t("certPlan")}
                    </Link>
                )}
            </section>
        </div>
    );
}
