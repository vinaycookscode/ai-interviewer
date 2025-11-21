import Link from "next/link";
import { LayoutDashboard, PlusCircle, Users, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

import { ModeToggle } from "@/components/mode-toggle";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

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
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={user} userRole={dbUser?.role} />

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
