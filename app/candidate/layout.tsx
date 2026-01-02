import Link from "next/link";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { DashboardHeader } from "@/components/dashboard/header";
import { CandidateSidebar } from "@/components/candidate/sidebar";
import { getFeatureFlags } from "@/actions/feature-flags";

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

    const flags = await getFeatureFlags();
    const flagMap = flags.reduce((acc: Record<string, boolean>, f: any) => ({ ...acc, [f.key]: f.enabled }), {});

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={session.user} userRole={session.user.role} />

            <div className="flex flex-1">
                <CandidateSidebar featureFlags={flagMap} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
