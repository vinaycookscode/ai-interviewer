"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Settings, Shield, MapPin, Menu, ToggleLeft, MessageSquare, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
        <div className="px-4 py-2 mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h2>
        </div>
        <Link
            href="/admin"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
        >
            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
            <span>Overview</span>
        </Link>
        <Link
            href="/admin/users"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
        >
            <Users size={20} className="group-hover:scale-110 transition-transform" />
            <span>Users</span>
        </Link>
        <Link
            href="/admin/subscriptions"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
        >
            <Crown size={20} className="group-hover:scale-110 transition-transform text-yellow-500" />
            <span>Subscriptions</span>
        </Link>
        <Link
            href="/admin/locations"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
        >
            <MapPin size={20} className="group-hover:scale-110 transition-transform" />
            <span>User Locations</span>
        </Link>
        <Link
            href="/admin/features"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
        >
            <ToggleLeft size={20} className="group-hover:scale-110 transition-transform" />
            <span>Feature Management</span>
        </Link>
        <Link
            href="/admin/feedback"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all font-medium group"
        >
            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            <span>User Feedback</span>
        </Link>

        <Link
            href="/dashboard"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all font-medium group mt-8"
        >
            <Shield size={20} className="group-hover:scale-110 transition-transform" />
            <span>Exit Admin</span>
        </Link>
    </>
);


export function AdminSidebar() {
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
                        <nav className="space-y-1">
                            <NavLinks onLinkClick={() => setOpen(false)} />
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    <NavLinks />
                </nav>
            </aside>
        </>
    );
}
