import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader user={session.user} userRole={session.user.role} />

            <div className="flex flex-1">
                <AdminSidebar />

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
