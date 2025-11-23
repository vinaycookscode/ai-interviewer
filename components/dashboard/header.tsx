import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@/components/auth/user-button";
import { LayoutDashboard } from "lucide-react";

interface DashboardHeaderProps {
    user: any;
    userRole?: string;
}

export function DashboardHeader({ user, userRole }: DashboardHeaderProps) {
    return (
        <header className="h-16 bg-card border-b shadow-sm flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        AI Interviewer
                    </h1>
                    <p className="text-muted-foreground text-[10px] leading-none">Intelligent Hiring Platform</p>
                </div>
            </div>

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
