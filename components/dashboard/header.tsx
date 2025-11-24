import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@/components/auth/user-button";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
    user: any;
    userRole?: string;
}

export function DashboardHeader({ user, userRole }: DashboardHeaderProps) {
    return (
        <header className="h-16 bg-card border-b shadow-sm flex items-center justify-between px-6 sticky top-0 z-50">
            <Link href="/dashboard" className="flex items-center gap-2"> {/* Wrapped the logo area with Link */}
                <div className="bg-primary/10 p-2 rounded-lg">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">
                        <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Get Back To U</span> {/* Applied gradient to span */}
                    </h1>
                    <p className="text-muted-foreground text-[10px] leading-none">Intelligent Hiring Platform</p>
                </div>
            </Link>

            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-2 hidden md:flex">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase()}</span>
                </div>
                <ModeToggle />
                <UserButton />
            </div>
        </header>
    );
}
