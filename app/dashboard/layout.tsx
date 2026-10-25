import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFeatureFlags } from "@/actions/feature-flags";
import { FeedbackButton } from "@/components/feedback-button";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { AppShell } from "@/components/soft-glass/app-shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    if (session.user.role !== "EMPLOYER" && session.user.role !== "ADMIN") {
        redirect("/candidate/dashboard");
    }

    const flags = await getFeatureFlags();
    const flagMap = flags.reduce<Record<string, boolean>>((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});

    return (
        // overflow-x-clip, not overflow-hidden: hidden makes a scroll container and breaks the sticky tab bar.
        <div className={cn(softGlassFonts, "soft-glass relative flex min-h-screen flex-col overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <AppShell
                role="employer"
                user={{ name: session.user.name, email: session.user.email }}
                isAdmin={session.user.role === "ADMIN"}
                featureFlags={flagMap}
            >
                {children}
            </AppShell>

            {/* Floating Feedback Button */}
            <FeedbackButton />
        </div>
    );
}
