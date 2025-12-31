"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Sparkles, Menu, User, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { FEATURES } from "@/lib/features";

interface SidebarProps {
    featureFlags?: Record<string, boolean>;
}

const NavLinks = ({ onLinkClick, featureFlags = {} }: { onLinkClick?: () => void, featureFlags?: Record<string, boolean> }) => {
    // Helper to check if enabled (default true if missing, per fail-open/safe preference, but here we assume passed map is complete or we default to true/false)
    // Actually, plan said default ENABLED.
    const isEnabled = (key: string) => featureFlags[key] !== false;

    return (
        <>
            <Link
                href="/candidate/dashboard"
                onClick={onLinkClick}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
            >
                <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                <span>My Interviews</span>
            </Link>

            {isEnabled(FEATURES.ANALYTICS) && (
                <Link
                    href="/candidate/dashboard/analytics"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <TrendingUp size={20} className="group-hover:scale-110 transition-transform text-green-500" />
                    <span>Analytics</span>
                </Link>
            )}

            {isEnabled(FEATURES.PRACTICE_INTERVIEWS) && (
                <Link
                    href="/candidate/practice"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <Sparkles size={20} className="group-hover:scale-110 transition-transform text-purple-500" />
                    <span>AI Practice</span>
                </Link>
            )}

            <Link
                href="/candidate/profile"
                onClick={onLinkClick}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
            >
                <User size={20} className="group-hover:scale-110 transition-transform" />
                <span>Profile</span>
            </Link>

            {isEnabled(FEATURES.RESUME_SCREENER) && (
                <Link
                    href="/candidate/resume-screener"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <FileText size={20} className="group-hover:scale-110 transition-transform text-blue-500" />
                    <span>Resume Screener</span>
                </Link>
            )}
        </>
    );
};

export function CandidateSidebar({ featureFlags }: SidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden fixed bottom-6 right-6 z-50">
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                    <div className="py-6">
                        <h2 className="px-4 mb-4 text-lg font-semibold">Navigation</h2>
                        <nav className="space-y-1">
                            <NavLinks onLinkClick={() => setOpen(false)} featureFlags={featureFlags} />
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    <NavLinks featureFlags={featureFlags} />
                </nav>
            </aside>
        </>
    );
}
