"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, PlusCircle, Users, Settings, Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { FEATURES } from "@/lib/features";

interface DashboardSidebarProps {
    userRole?: "CANDIDATE" | "EMPLOYER" | "ADMIN";
    featureFlags?: Record<string, boolean>;
}

const NavLinks = ({ userRole, onLinkClick, featureFlags = {} }: { userRole?: string; onLinkClick?: () => void, featureFlags?: Record<string, boolean> }) => {
    const isEnabled = (key: string) => featureFlags[key] !== false;

    return (
        <>
            <Link
                href="/dashboard"
                onClick={onLinkClick}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
            >
                <Image src="/logo.png" alt="Get Back To U Logo" width={32} height={32} />
                <span>Overview</span>
            </Link>

            {isEnabled(FEATURES.JOB_MANAGEMENT) && (
                <Link
                    href="/dashboard/jobs/new"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                    <span>New Job</span>
                </Link>
            )}

            {isEnabled(FEATURES.CANDIDATE_SEARCH) && (
                <Link
                    href="/dashboard/candidates"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
                >
                    <Users size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Candidates</span>
                </Link>
            )}

            <Link
                href="/dashboard/settings"
                onClick={onLinkClick}
                className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
            >
                <Settings size={20} className="group-hover:scale-110 transition-transform" />
                <span>Settings</span>
            </Link>

            {userRole === "ADMIN" && (
                <Link
                    href="/admin"
                    onClick={onLinkClick}
                    className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all font-medium group mt-8"
                >
                    <Shield size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Admin Panel</span>
                </Link>
            )}
        </>
    );
};

export function DashboardSidebar({ userRole, featureFlags }: DashboardSidebarProps) {
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
                            <NavLinks userRole={userRole} onLinkClick={() => setOpen(false)} featureFlags={featureFlags} />
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    <NavLinks userRole={userRole} featureFlags={featureFlags} />
                </nav>
            </aside>
        </>
    );
}
