import Link from "next/link";
import { LayoutDashboard, Users, Settings, Shield, MapPin } from "lucide-react";

export function AdminSidebar() {
    return (
        <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <nav className="px-4 py-6 space-y-2">
                <div className="px-4 py-2 mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h2>
                </div>
                <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Overview</span>
                </Link>
                <Link
                    href="/admin/users"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <Users size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Users</span>
                </Link>
                <Link
                    href="/admin/locations"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <MapPin size={20} className="group-hover:scale-110 transition-transform" />
                    <span>User Locations</span>
                </Link>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all font-medium group mt-8"
                >
                    <Shield size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Exit Admin</span>
                </Link>
            </nav>
        </aside>
    );
}
