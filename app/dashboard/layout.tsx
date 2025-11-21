import Link from "next/link";
import { LayoutDashboard, PlusCircle, Users, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";

export default async function DashboardLayout({
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
    let dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    // If user not found by clerkId, try to find by email (for invited candidates)
    if (!dbUser) {
        const email = user.emailAddresses[0]?.emailAddress;
        if (email) {
            dbUser = await db.user.findUnique({
                where: { email },
            });

            // If found by email, update the clerkId
            if (dbUser) {
                await db.user.update({
                    where: { id: dbUser.id },
                    data: { clerkId: userId },
                });
            } else {
                // Create new user if doesn't exist (default to CANDIDATE for safety)
                // Unless it's the very first user? No, let's assume new signups are candidates
                // or we can let them be employers if they go to /dashboard?
                // For now, let's create them as CANDIDATE to be safe.
                // Actually, if they are accessing /dashboard, they might want to be an employer.
                // But the requirement is "Candidate should not be able to see employer options".
                // Let's default to CANDIDATE.
                dbUser = await db.user.create({
                    data: {
                        clerkId: userId,
                        email: email,
                        role: "CANDIDATE", // Default role
                    },
                });
            }
        }
    }

    // If user is a candidate, redirect to candidate dashboard
    if (dbUser?.role === "CANDIDATE") {
        redirect("/candidate/dashboard");
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r shadow-sm hidden md:block">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        AI Interviewer
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">Intelligent Hiring Platform</p>
                </div>
                <nav className="px-4 py-6 space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                    >
                        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                        <span>Overview</span>
                    </Link>
                    <Link
                        href="/dashboard/jobs/new"
                        className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                    >
                        <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                        <span>New Job</span>
                    </Link>
                    <Link
                        href="/dashboard/candidates"
                        className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                    >
                        <Users size={20} className="group-hover:scale-110 transition-transform" />
                        <span>Candidates</span>
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                    >
                        <Settings size={20} className="group-hover:scale-110 transition-transform" />
                        <span>Settings</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-card border-b shadow-sm flex items-center justify-end px-8 gap-4">
                    <ModeToggle />
                    <UserButton afterSignOutUrl="/" />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
