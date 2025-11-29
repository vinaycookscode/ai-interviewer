import Link from "next/link";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { DashboardHeader } from "@/components/dashboard/header";
import { CandidateSidebar } from "@/components/candidate/sidebar";

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

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={session.user} userRole={session.user.role} />

            <div className="flex flex-1">
                <CandidateSidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
