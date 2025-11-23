import Link from "next/link";
import { LayoutDashboard, PlusCircle, Users, Settings } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    if (session.user.role !== "EMPLOYER") {
        redirect("/candidate/dashboard");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={session.user} userRole={session.user.role} />

            <div className="flex flex-1">
                <DashboardSidebar />

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
