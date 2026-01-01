"use client";

import { LayoutDashboard, Users, Settings, PlusCircle } from "lucide-react";
import { AppSidebar, NavItem } from "@/components/layout/app-sidebar";
import { FEATURES } from "@/lib/features";

interface SidebarProps {
    userRole?: "CANDIDATE" | "EMPLOYER" | "ADMIN";
    featureFlags?: Record<string, boolean>;
}

const DASHBOARD_NAV_ITEMS: NavItem[] = [
    {
        icon: LayoutDashboard,
        labelKey: "myInterviews",
        href: "/dashboard",
    },
    {
        icon: PlusCircle,
        labelKey: "jobManagement",
        href: "/dashboard/jobs/new",
        featureKey: FEATURES.JOB_MANAGEMENT,
        colorClass: "text-green-500",
    },
    {
        icon: Users,
        labelKey: "candidateSearch",
        href: "/dashboard/candidates",
        featureKey: FEATURES.CANDIDATE_SEARCH,
        colorClass: "text-purple-500",
    },
    {
        icon: Settings,
        labelKey: "settings", // We need to add this key to en.json
        href: "/admin/features",
        requiredRole: "ADMIN",
        colorClass: "text-orange-500",
        isDivider: true,
    },
];

export function DashboardSidebar({ userRole, featureFlags }: SidebarProps) {
    return (
        <AppSidebar
            items={DASHBOARD_NAV_ITEMS}
            featureFlags={featureFlags}
            userRole={userRole}
        />
    );
}
