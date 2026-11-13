import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarClock, GraduationCap, Lock, LockKeyhole, Mail, TimerOff, Users } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { driveStatus } from "@/lib/drives";
import { SLUG, joinState } from "@/lib/open-link";
import { StatusScreen } from "@/components/layout/status-screen";
import { FocusCard, FocusRoot } from "@/components/interview/session-shell";
import { JoinForm } from "@/components/drives/join-form";
import { coralButton } from "@/components/soft-glass/classes";
import { outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("DriveJoin");
    return { title: t("title"), robots: { index: false } };
}

const ist = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** A drive's open link (AIIN-168): the landing, then the college picker, from the approved artboards. */
export default async function DriveLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const t = await getTranslations("DriveJoin");
    const drive = SLUG.test(slug)
        ? await db.drive.findUnique({
              where: { openLinkSlug: slug },
              select: {
                  id: true,
                  name: true,
                  draft: true,
                  opensAt: true,
                  closesAt: true,
                  closedAt: true,
                  openLinkOn: true,
                  allowedDomains: true,
                  joinCap: true,
                  aptitudeEnabled: true,
                  aptitudeCutoff: true,
                  aptitudeTest: { select: { durationMinutes: true } },
                  colleges: { orderBy: { name: "asc" }, select: { id: true, name: true, city: true } },
                  job: { select: { title: true, employer: { select: { name: true } }, _count: { select: { questions: { where: { archived: false } } } } } },
                  _count: { select: { candidates: { where: { source: "OPEN_LINK" } } } },
              },
          })
        : null;
    // A rotated or unknown link shows not-found, with nothing about any drive (AC6)
    if (!drive) return <StatusScreen icon={Lock} tone="error" title={t("offTitle")} action={{ label: t("signIn"), href: "/auth/login" }}><p>{t("offBody")}</p></StatusScreen>;

    const session = await auth();
    const user = session?.user ?? null;
    const me = user?.id ? await db.user.findUnique({ where: { id: user.id }, select: { email: true, role: true } }) : null;
    const inDrive = user?.id ? !!(await db.driveCandidate.findUnique({ where: { driveId_userId: { driveId: drive.id, userId: user.id } }, select: { id: true } })) : false;
    const status = driveStatus(drive, new Date());
    const state = joinState({ on: drive.openLinkOn, status, inDrive, role: me?.role ?? null, email: me?.email ?? null, domains: drive.allowedDomains, cap: drive.joinCap, joined: drive._count.candidates });
    const company = drive.job.employer.name?.trim() || "The employer";
    const domains = drive.allowedDomains.join(", ");
    const callback = new URLSearchParams({ callbackUrl: `/drive/${slug}` }).toString();

    if (state === "OFF") return <StatusScreen icon={Lock} tone="error" title={t("offTitle")}><p>{t("offBody")}</p></StatusScreen>;
    if (state === "SCHEDULED" && drive.opensAt)
        return (
            <StatusScreen icon={CalendarClock} title={t("scheduledTitle", { when: ist.format(drive.opensAt) })} action={user ? undefined : { label: t("signUp"), href: `/auth/register?${callback}` }}>
                <p>{t("scheduledBody", { drive: drive.name })}</p>
            </StatusScreen>
        );
    if (state === "CLOSED") return <StatusScreen icon={TimerOff} tone="error" title={t("closedTitle")}><p>{t("closedBody", { company })}</p></StatusScreen>;
    if (state === "STAFF") return <StatusScreen icon={LockKeyhole} tone="error" title={t("staffTitle")}><p>{t("staffBody")}</p></StatusScreen>;
    if (state === "DOMAIN")
        return (
            <StatusScreen icon={Mail} tone="error" title={t("domainTitle", { domains })} action={{ label: t("otherAccount"), href: `/api/auth/signout?${callback}` }}>
                <p>{t("domainBody", { email: me?.email ?? "" })}</p>
            </StatusScreen>
        );
    if (state === "FULL") return <StatusScreen icon={Users} title={t("fullTitle")}><p>{t("fullBody")}</p></StatusScreen>;

    const minutes = Math.max(10, Math.ceil(drive.job._count.questions * 2.5));
    const steps: [string, string][] = [
        [t("step1"), domains ? t("step1Domains", { domains }) : t("step1Any")],
        [t("step2"), t("step2Body")],
        ...(drive.aptitudeEnabled && drive.aptitudeTest
            ? ([[t("step3Apt", { minutes: drive.aptitudeTest.durationMinutes }), t("step3AptBody", { cutoff: drive.aptitudeCutoff ?? 0 })]] as [string, string][])
            : []),
        [t("step4", { minutes }), t("step4Body")],
    ];

    return (
        <FocusRoot>
            <FocusCard>
                <div className="flex flex-col gap-5">
                    {user && me ? (
                        <>
                            <span className="text-[13px] font-bold text-sg-muted">{t("signedInAs", { email: me.email })}</span>
                            <h1 className="font-display sg-soft text-[length:clamp(30px,7vw,40px)] leading-[1.15] font-semibold">
                                {state === "CONTINUE" ? t("continueBack") : t("whichCollege")}
                            </h1>
                            {state === "CONTINUE" && <p className="text-sg-muted">{t("continueBody")}</p>}
                            <JoinForm slug={slug} colleges={drive.colleges} cont={state === "CONTINUE"} />
                        </>
                    ) : (
                        <>
                            <span className="text-[13px] font-bold text-sg-muted">{t("hiring", { company })}</span>
                            <h1 className="font-display sg-soft text-[length:clamp(30px,7vw,40px)] leading-[1.15] font-semibold break-words">{drive.job.title}</h1>
                            <span className="flex flex-wrap gap-2">
                                <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                                    <GraduationCap className="size-3.5" aria-hidden="true" />
                                    {drive.name}
                                </span>
                                {drive.closesAt && (
                                    <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold">
                                        <CalendarClock className="size-3.5" aria-hidden="true" />
                                        {t("openUntil", { when: ist.format(drive.closesAt) })}
                                    </span>
                                )}
                            </span>
                            <ol className="flex flex-col gap-3.5">
                                {steps.map(([title, body], i) => (
                                    <li key={title} className="flex items-start gap-3">
                                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-sg-chip font-bold">{i + 1}</span>
                                        <span className="flex flex-col">
                                            <strong>{title}</strong>
                                            <span className="text-sm text-sg-muted">{body}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                            <span className="flex flex-col gap-2.5">
                                <Link href={`/auth/register?${callback}`} className={cn(coralButton, "h-12 justify-center text-base")}>
                                    {t("signUp")}
                                </Link>
                                <Link href={`/auth/login?${callback}`} className={cn(outlineButton, "h-12 justify-center")}>
                                    {t("signIn")}
                                </Link>
                            </span>
                        </>
                    )}
                    <p className="text-[13px] text-sg-muted">{t("sharing")}</p>
                </div>
            </FocusCard>
        </FocusRoot>
    );
}
