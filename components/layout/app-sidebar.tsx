"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
    isDivider: true;
};

interface AppSidebarProps {
    items: NavItem[];
    featureFlags?: Record<string, boolean>;
    userRole?: string;
    translationNamespace?: string;
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
                    return <div key={`divider-${index}`} className="border-t border-border my-3" />;
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
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium group",
                            active
                                ? "bg-primary/15 text-primary border-l-4 border-primary"
                                : "text-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                    >
                        <Icon
                            size={20}
                            className={cn(
                                "transition-transform",
                                active ? "scale-110" : "group-hover:scale-110",
                                active ? "text-primary" : item.colorClass
                            )}
                        />
                        <span className={cn(active && "font-semibold")}>{t(item.labelKey)}</span>
                    </Link>
                );
            })}
        </>
    );
};


export function AppSidebar({ items, featureFlags = {}, userRole, translationNamespace = 'Sidebar' }: AppSidebarProps) {
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
                <SheetContent side="left" className="w-72">
                    <div className="py-6">
                        <h2 className="px-4 mb-4 text-lg font-semibold">{t('navigation')}</h2>
                        <nav className="space-y-1">
                            <NavLinks
                                items={items}
                                featureFlags={featureFlags}
                                userRole={userRole}
                                onLinkClick={() => setOpen(false)}
                                t={t}
                                pathname={pathname}
                            />
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-card border-r shadow-sm hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    <NavLinks
                        items={items}
                        featureFlags={featureFlags}
                        userRole={userRole}
                        t={t}
                        pathname={pathname}
                    />
                </nav>
            </aside>
        </>
    );
}

