import Link from "next/link";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
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
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        redirect("/sign-in");
    }

    // Check user role in database
    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    // If user is an employer, redirect to employer dashboard
    if (dbUser?.role === "EMPLOYER") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={user} userRole={dbUser?.role} />

            <div className="flex flex-1">
                <CandidateSidebar />

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
