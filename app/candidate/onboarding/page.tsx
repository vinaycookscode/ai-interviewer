import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { roleFromName } from "@/lib/career-path";
import { CareerWizard } from "@/components/candidate/career-wizard";
import { FocusRoot, outlineButton } from "@/components/interview/session-shell";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/**
 * Career path set-up. New candidates land here after registering (AIIN-52); the profile's
 * "Set up my path" and "Change my path" open it too, and send them back there.
 */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("Onboarding");
    const { from } = await searchParams;
    const doneHref = from === "profile" ? "/candidate/profile" : "/candidate/dashboard";

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { resumeName: true, resumeUrl: true, candidateProfile: { select: { primaryRole: true, skills: true, careerGoals: true } } },
    });
    if (!user) redirect("/auth/login");
    const profile = user.candidateProfile;

    return (
        <FocusRoot>
            <header className="flex items-center justify-between gap-3 p-1">
                <Link href="/candidate/dashboard" aria-label={t("home")} className={cn("flex min-w-0 items-center gap-2.5 rounded-full", focusRing)}>
                    <UMark />
                    <span aria-hidden="true" className="font-display sg-soft text-lg font-semibold whitespace-nowrap">
                        {t("brand")}
                    </span>
                </Link>
                <div className="flex items-center gap-1.5">
                    <Link href={doneHref} className={outlineButton}>
                        {t("finishLater")}
                    </Link>
                    <ThemeSwitch className="hidden sm:inline-flex" />
                </div>
            </header>
            <main className="flex flex-1 flex-col">
                <CareerWizard
                    role={roleFromName(profile?.primaryRole)}
                    skills={profile?.skills ?? []}
                    goal={profile?.careerGoals ?? ""}
                    resumeName={user.resumeUrl ? (user.resumeName ?? "resume.pdf") : null}
                    doneHref={doneHref}
                />
            </main>
        </FocusRoot>
    );
}
