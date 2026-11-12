import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFacts, EMPTY_FACTS } from "@/lib/resume-facts";
import { FactsEditor } from "@/components/candidate/facts-editor";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Facts");
    return { title: t("title") };
}

/** Facts from the candidate's resume, to confirm (AIIN-193), from the approved "Resume facts" artboards. */
export default async function ProfileFactsPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Facts");

    // Only the facts and when the resume was read: the resume text never leaves the server
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            resumeUrl: true,
            resumeName: true,
            candidateProfile: {
                select: { resumeFacts: true, proposedFacts: true, resumeReadAt: true, resumeText: true, noticePeriodDays: true, factsConfirmedAt: true },
            },
        },
    });
    const profile = user?.candidateProfile;
    const hasResume = !!user?.resumeUrl;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-2">
                {user?.resumeName && <span className="text-[13px] font-bold text-sg-muted">{t("from", { name: user.resumeName })}</span>}
                <h1 className="font-display sg-soft text-[32px] leading-[1.14] font-semibold tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="max-w-[640px] text-lg text-sg-muted">{t("subtitle")}</p>
            </div>
            <FactsEditor
                confirmed={checkFacts(profile?.resumeFacts ?? EMPTY_FACTS)}
                pending={checkFacts(profile?.proposedFacts ?? EMPTY_FACTS)}
                noticePeriodDays={profile?.noticePeriodDays ?? null}
                hasResume={hasResume}
                // Read the resume now if this one hasn't been read yet (AC1)
                read={hasResume && !profile?.resumeReadAt}
                // Read before and no text came out: a scan (AC3). Only this yes/no leaves the server, never the text.
                unreadable={hasResume && !!profile?.resumeReadAt && !profile.resumeText}
            />
        </div>
    );
}
