import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, FileText, Pencil, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documentHref } from "@/lib/document-url";
import { AccountForm } from "@/components/candidate/profile-form";
import { IdentityDocuments } from "@/components/candidate/identity-documents";
import { WeeklyEmailSwitch } from "@/components/candidate/weekly-email-switch";
import { BadgeIcon } from "@/components/candidate/badge-icon";
import { ACHIEVEMENTS, isAchievementKey } from "@/lib/achievements/rules";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { inkButton, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

const label = "text-[13px] leading-[18px] font-bold text-sg-muted";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("Profile");
    const tBadges = await getTranslations("Badges");

    // Only what the page shows: never the whole user row (it holds the password hash).
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            email: true,
            resumeUrl: true,
            resumeName: true,
            panUrl: true,
            panName: true,
            aadhaarUrl: true,
            aadhaarName: true,
            weeklyReportEmails: true,
            candidateProfile: { select: { primaryRole: true, skills: true, careerGoals: true, onboardingComplete: true } },
            achievements: { orderBy: { earnedAt: "desc" }, select: { key: true } },
        },
    });
    if (!user) redirect("/auth/login");

    const profile = user.candidateProfile;
    const complete = !!profile?.onboardingComplete;

    const resumeHref = documentHref(user.resumeUrl);
    const badges = user.achievements.map((a) => a.key).filter(isAchievementKey);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[640px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            {!complete && (
                <section aria-label={t("finishTitle")} className="sg-glass sg-shadow-lg flex flex-wrap items-center gap-4 rounded-[28px] p-5 sm:p-6">
                    <Sparkles className="size-6 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                    <div className="flex min-w-0 flex-[1_1_260px] flex-col">
                        <span className="text-lg font-bold">{t("finishTitle")}</span>
                        <span className="text-sg-muted">{t("finishBody")}</span>
                    </div>
                    <Link href="/candidate/onboarding?from=profile" className={cn(coralButton, "h-12 px-6 text-base")}>
                        {t("finish")}
                    </Link>
                </section>
            )}

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
                    <section aria-label={t("account")} className={panel}>
                        <h2 className={panelTitle}>{t("account")}</h2>
                        <AccountForm name={user.name ?? ""} email={user.email} />
                        <WeeklyEmailSwitch on={user.weeklyReportEmails} />
                    </section>
                    <section aria-label={t("docs")} className={panel}>
                        <h2 className={panelTitle}>{t("docs")}</h2>
                        <p className="text-[15px] text-sg-muted">{t("docsBody")}</p>
                        <IdentityDocuments
                            pan={user.panUrl ? { href: documentHref(user.panUrl) ?? null, name: user.panName } : null}
                            aadhaar={user.aadhaarUrl ? { href: documentHref(user.aadhaarUrl) ?? null, name: user.aadhaarName } : null}
                        />
                    </section>
                </div>

                <div className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-6 lg:max-w-[420px]">
                    <section aria-label={t("path")} className={panel}>
                        <h2 className={panelTitle}>{t("path")}</h2>
                        {complete && profile ? (
                            <>
                                <dl className="flex flex-col gap-4">
                                    {profile.primaryRole && (
                                        <div className="flex flex-col gap-1">
                                            <dt className={label}>{t("preparingFor")}</dt>
                                            <dd className="font-bold">{profile.primaryRole}</dd>
                                        </div>
                                    )}
                                    {profile.skills.length > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <dt className={label}>{t("skills")}</dt>
                                            <dd className="flex flex-wrap gap-1.5">
                                                {profile.skills.map((skill) => (
                                                    <span key={skill} className="inline-flex h-7 items-center rounded-full bg-sg-chip px-2.5 text-sm font-semibold">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </dd>
                                        </div>
                                    )}
                                    {profile.careerGoals && (
                                        <div className="flex flex-col gap-1">
                                            <dt className={label}>{t("goal")}</dt>
                                            <dd className="text-[15px]">{profile.careerGoals}</dd>
                                        </div>
                                    )}
                                    {user.resumeUrl && (
                                        <div className="flex flex-col gap-1.5">
                                            <dt className={label}>{t("resume")}</dt>
                                            <dd className="flex items-center gap-2.5 rounded-2xl bg-sg-row px-3.5 py-2.5">
                                                <FileText className="size-4 shrink-0 text-sg-muted" aria-hidden="true" />
                                                <span className="min-w-0 flex-1 truncate font-semibold">{user.resumeName ?? t("resume")}</span>
                                                {resumeHref && (
                                                    <a href={resumeHref} target="_blank" rel="noreferrer" aria-label={t("resumeViewLabel")} className={cn("rounded-md text-sm font-bold", focusRing)}>
                                                        {t("resumeView")}
                                                    </a>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                                <Link href="/candidate/onboarding?from=profile" className={cn(outlineButton, "h-10 self-start text-sm")}>
                                    <Pencil className="size-4" aria-hidden="true" />
                                    {t("changePath")}
                                </Link>
                            </>
                        ) : (
                            <>
                                <p className="text-sg-muted">{t("pathEmpty")}</p>
                                <Link href="/candidate/onboarding?from=profile" className={cn(inkButton, "h-10 self-start px-4 text-sm")}>
                                    {t("setupPath")}
                                </Link>
                            </>
                        )}
                    </section>

                    {/* Badges (AIIN-102) */}
                    <section aria-labelledby="badges-title" className={panel}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="badges-title" className={panelTitle}>
                                {t("badges")}
                            </h2>
                            <span className={label}>{t("badgesCount", { earned: badges.length, total: ACHIEVEMENTS.length })}</span>
                        </div>
                        {badges.length ? (
                            <ul aria-label={t("badges")} className="flex flex-wrap gap-2">
                                {badges.slice(0, 6).map((key) => (
                                    <li key={key} className="flex size-11 items-center justify-center rounded-[14px] bg-sg-coral text-sg-coral-ink">
                                        <BadgeIcon badge={key} className="size-5" />
                                        <span className="sr-only">{tBadges(`items.${key}.name`)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[15px] text-sg-muted">{t("badgesNone")}</p>
                        )}
                        <Link href="/candidate/badges" className={cn(outlineButton, "h-10 self-start text-sm")}>
                            {t("badgesSee")}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}
