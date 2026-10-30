import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PlanTier } from "@prisma/client";
import { getFeatureFlags } from "@/actions/feature-flags";
import { FeedbackButton } from "@/components/feedback-button";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { AppShell } from "@/components/soft-glass/app-shell";
import { BadgeToast } from "@/components/candidate/badge-toast";

export default async function CandidateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    if (session.user.role === "EMPLOYER") {
        redirect("/dashboard");
    }

    const [flags, subscription] = await Promise.all([
        getFeatureFlags(),
        // Only the tier, to decide whether to show Go Pro. No subscription row means the free plan.
        session.user.id
            ? db.subscription.findUnique({ where: { userId: session.user.id }, select: { plan: { select: { tier: true } } } })
            : null,
    ]);
    const flagMap = flags.reduce<Record<string, boolean>>((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});
    const isFree = !subscription || subscription.plan.tier === PlanTier.FREE;

    return (
        // overflow-x-clip, not overflow-hidden: hidden makes a scroll container and breaks the sticky tab bar.
        <div className={cn(softGlassFonts, "soft-glass relative flex min-h-screen flex-col overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <AppShell
                role="candidate"
                user={{ name: session.user.name, email: session.user.email }}
                showGoPro={isFree}
                isAdmin={session.user.role === "ADMIN"}
                featureFlags={flagMap}
            >
                {children}
            </AppShell>

            <BadgeToast />

            {/* Floating Feedback Button */}
            <FeedbackButton />
        </div>
    );
}
