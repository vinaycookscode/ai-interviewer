import Link from "next/link";
import { LayoutDashboard, PlusCircle, Users, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r shadow-sm hidden md:block">
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
                <header className="h-16 bg-white border-b shadow-sm flex items-center justify-end px-8">
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
