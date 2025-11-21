import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function CandidateSidebar() {
    return (
        <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <nav className="px-4 py-6 space-y-2">
                <Link
                    href="/candidate/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                    <span>My Interviews</span>
                </Link>
            </nav>
        </aside>
    );
}
