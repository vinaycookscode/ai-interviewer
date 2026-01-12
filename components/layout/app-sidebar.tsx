"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";

// Discriminated union for NavItem - either a regular nav link or a divider
export type NavItem = {
    icon: React.ElementType;
    labelKey: string;
    href: string;
    featureKey?: string;
    colorClass?: string;
    requiredRole?: string;
    isDivider?: false;
} | {
    isDivider: true,
    labelKey?: string;
};

interface AppSidebarProps {
    items: NavItem[];
    featureFlags?: Record<string, boolean>;
    userRole?: string;
    translationNamespace?: string;
    footer?: React.ReactNode;
}

const NavLinks = ({
    items,
    featureFlags = {},
    userRole,
    onLinkClick,
    t,
    pathname
}: {
    items: NavItem[];
    featureFlags: Record<string, boolean>;
    userRole?: string;
    onLinkClick?: () => void;
    t: (key: string) => string;
    pathname: string;
}) => {
    const isEnabled = (key?: string) => !key || featureFlags[key] !== false;
    const hasRole = (role?: string) => !role || userRole === role;

    // Check if a link is active (matches current path or is a parent route)
    const isActive = (href: string) => {
        if (pathname === href) return true;
        // For nested routes, check if current path starts with the href
        // But exclude exact matches to avoid parent routes being highlighted
        if (href !== '/candidate/dashboard' && pathname.startsWith(href + '/')) return true;
        // Special case for dashboard - only highlight if exact match
        if (href === '/candidate/dashboard' && pathname === '/candidate/dashboard') return true;
        return false;
    };

    return (
        <>
            {items.map((item, index) => {
                // Handle divider
                if (item.isDivider) {
                    return (
                        <div key={`divider-${index}`} className="mt-8 mb-4 px-4">
                            {item.labelKey ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 whitespace-nowrap">
                                        {t(item.labelKey)}
                                    </span>
                                </div>
                            ) : (
                                <div className="h-[1px] w-full bg-white/20" />
                            )}
                        </div>
                    );
                }

                // Check feature flag and role
                if (!isEnabled(item.featureKey) || !hasRole(item.requiredRole)) {
                    return null;
                }

                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onLinkClick}
                        className={cn(
                            "group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-500 font-bold tracking-tight relative",
                            active
                                ? "bg-primary/5 text-primary shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)] border border-primary/10"
                                : "text-muted-foreground/70 hover:bg-primary/[0.03] hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg transition-all duration-500 group-hover:scale-110",
                            active ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]" : item.colorClass
                        )}>
                            <Icon
                                size={18}
                                className="transition-transform"
                            />
                        </div>
                        <span className="text-sm">{t(item.labelKey)}</span>
                        {active && (
                            <motion.div
                                layoutId="sidebar-active"
                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </Link>
                );
            })}
        </>
    );
};


export function AppSidebar({ items, featureFlags = {}, userRole, translationNamespace = 'Sidebar', footer }: AppSidebarProps) {
    const [open, setOpen] = useState(false);
    const t = useTranslations(translationNamespace);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Menu Button */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden fixed bottom-6 right-6 z-50">
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-background/60 backdrop-blur-3xl border-r border-white/5 p-0">
                    <div className="flex flex-col h-full pt-8 pb-2">
                        <div className="px-6 mb-8">
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic">{t('navigation')}</h2>
                        </div>
                        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
                            <NavLinks
                                items={items}
                                featureFlags={featureFlags}
                                userRole={userRole}
                                onLinkClick={() => setOpen(false)}
                                t={t}
                                pathname={pathname}
                            />
                        </nav>
                        {footer && (
                            <div className="mt-auto p-4 mb-0">
                                {footer}
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-black/40 backdrop-blur-4xl border-r border-white/5 hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-hidden flex flex-col no-scrollbar relative">
                {/* Visual Ambient Glows */}
                <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-primary/5 blur-[80px] pointer-events-none" />

                <nav className="relative z-10 px-4 pt-8 pb-32 space-y-2 flex-1 overflow-y-auto no-scrollbar">
                    <NavLinks
                        items={items}
                        featureFlags={featureFlags}
                        userRole={userRole}
                        t={t}
                        pathname={pathname}
                    />
                </nav>
                {footer && (
                    <div className="absolute bottom-6 left-0 w-full px-6 z-20">
                        {footer}
                    </div>
                )}
            </aside>
        </>
    );
}

