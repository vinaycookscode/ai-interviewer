import Link from "next/link";
import { LayoutDashboard, PlusCircle, Users, Settings, Shield } from "lucide-react";

export function DashboardSidebar({ userRole }: { userRole?: "CANDIDATE" | "EMPLOYER" | "ADMIN" }) {
    return (
        <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
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

                {userRole === "ADMIN" && (
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all font-medium group mt-8"
                    >
                        <Shield size={20} className="group-hover:scale-110 transition-transform" />
                        <span>Admin Panel</span>
                    </Link>
                )}
            </nav>
        </aside>
    );
}
